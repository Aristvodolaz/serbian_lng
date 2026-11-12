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

const sectionByTitle = new Map();
for (let p = 1; ; p++) {
  const { data, totalPages } = await (await authed(`/admin/sections?page=${p}&limit=100`)).json();
  for (const s of data) sectionByTitle.set(s.titleCyrillic, s.id);
  if (!data.length || p >= totalPages) break;
}

const topics = JSON.parse(
  (await import('node:fs')).readFileSync(
    new URL('../src/database/theory-a1.json', import.meta.url),
    'utf8',
  ),
);

const existingBySection = new Map();
const existingTitles = async (sectionId) => {
  if (!existingBySection.has(sectionId)) {
    const { data } = await (await authed(`/admin/theory?limit=100&sectionId=${sectionId}`)).json();
    existingBySection.set(sectionId, new Set(data.map((t) => t.titleCyrillic)));
  }
  return existingBySection.get(sectionId);
};

let created = 0, skipped = 0, failed = 0;
for (const topic of topics) {
  const sectionId = sectionByTitle.get(topic.sectionTitle);
  if (!sectionId) {
    console.error(`section not found: ${topic.sectionTitle} (skipping ${topic.titleCyrillic})`);
    skipped++;
    continue;
  }
  if ((await existingTitles(sectionId)).has(topic.titleCyrillic)) {
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
    failed++;
    console.error(`fail ${topic.titleCyrillic}: ${res.status} ${await res.text()}`);
  } else {
    console.log(`created: ${topic.titleCyrillic}`);
    created++;
    (await existingTitles(sectionId)).add(topic.titleCyrillic);
  }
}
console.log(`done: ${created} created, ${skipped} skipped, ${failed} failed`);
if (failed) process.exit(1);
