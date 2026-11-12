// Loads theory topics from backend/src/database/theory-a1.json into the admin
// API. Idempotent: skips topics that already exist (same section + title).
// Usage:
//   BASE_URL=http://host:3000 ADMIN_EMAIL=... ADMIN_PASSWORD=... \
//     node backend/scripts/load-theory.mjs
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
  process.exit(1);
}

const login = await fetch(`${BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
});
if (!login.ok) {
  console.error(`login failed: ${login.status} ${await login.text()}`);
  process.exit(1);
}
const token = (await login.json()).access_token;

const authed = (path) => fetch(`${BASE_URL}${path}`, {
  headers: { Authorization: `Bearer ${token}` },
});

const { data: sections } = await (await authed('/admin/sections?limit=100')).json();
const sectionByTitle = new Map(sections.map((s) => [s.titleCyrillic, s.id]));

const topics = JSON.parse(
  (await import('node:fs')).readFileSync(
    new URL('../src/database/theory-a1.json', import.meta.url),
    'utf8',
  ),
);

let created = 0, skipped = 0;
for (const topic of topics) {
  const sectionId = sectionByTitle.get(topic.sectionTitle);
  if (!sectionId) {
    console.error(`section not found: ${topic.sectionTitle} (skipping ${topic.titleCyrillic})`);
    skipped++;
    continue;
  }
  const { data: existing } = await (await authed(
    `/admin/theory?limit=100&sectionId=${sectionId}`,
  )).json();
  if (existing.some((t) => t.titleCyrillic === topic.titleCyrillic)) {
    console.log(`skip (exists): ${topic.titleCyrillic}`);
    skipped++;
    continue;
  }
  const res = await fetch(`${BASE_URL}/admin/theory`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sectionId,
      titleCyrillic: topic.titleCyrillic,
      titleLatin: topic.titleLatin,
      titleTranslationRu: topic.titleTranslationRu,
      titleTranslationEn: topic.titleTranslationEn,
      payload: topic.payload,
    }),
  });
  if (!res.ok) {
    console.error(`fail ${topic.titleCyrillic}: ${res.status} ${await res.text()}`);
  } else {
    console.log(`created: ${topic.titleCyrillic}`);
    created++;
  }
}
console.log(`done: ${created} created, ${skipped} skipped`);
