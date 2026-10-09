#!/usr/bin/env node
// Validates words_verbs.csv against ТЗ-01 acceptance criteria.
const fs = require('fs');

const TO_LATIN = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'đ', е: 'e', ж: 'ž', з: 'z',
  и: 'i', ј: 'j', к: 'k', л: 'l', љ: 'lj', м: 'm', н: 'n', њ: 'nj', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', ћ: 'ć', у: 'u', ф: 'f', х: 'h', ц: 'c',
  ч: 'č', џ: 'dž', ш: 'š',
};
const CYR = new Set(Object.keys(TO_LATIN));
const LAT = new Set(Object.values(TO_LATIN).flat());
const toLatin = (s) => [...s].map((c) => TO_LATIN[c] ?? c).join('');

const text = fs.readFileSync('words_verbs.csv', 'utf8');
const lines = text.replace(/^﻿/, '').split('\n').filter((l) => l.trim() !== '');
const header = lines[0].split(',');
const rows = lines.slice(1).map((l) => {
  const parts = l.split(',');
  const r = {};
  header.forEach((h, i) => (r[h] = parts[i] ?? ''));
  return r;
});

const errors = [];
const warn = [];
const ok = (cond, msg) => { if (!cond) errors.push(msg); };

// 1. Count
ok(rows.length === 100, `row count = ${rows.length}, expected 100`);

// 2. Header exact
const expectedHeader = 'cyrillic,latin,translationRu,translationEn,partOfSpeech,gender,number,declension,conjugation,exampleCyrillic,exampleTranslationRu,exampleTranslationEn';
ok(lines[0] === expectedHeader, `header mismatch: ${lines[0]}`);

// 3. Field counts / required / forbidden-empty
const REQUIRED = ['cyrillic','latin','translationRu','translationEn','partOfSpeech','exampleCyrillic','exampleTranslationRu','exampleTranslationEn'];
const FORBIDDEN = ['gender','number','declension'];
rows.forEach((r, i) => {
  REQUIRED.forEach((f) => ok(r[f] && r[f].trim() !== '', `row ${i + 2}: empty required field ${f}`));
  FORBIDDEN.forEach((f) => ok(!r[f] || r[f].trim() === '', `row ${i + 2}: forbidden field ${f} filled (="${r[f]}")`));
  ok(r.partOfSpeech === 'verb', `row ${i + 2}: partOfSpeech="${r.partOfSpeech}"`);
  ok(['I','II','III',''].includes(r.conjugation), `row ${i + 2}: conjugation="${r.conjugation}"`);
});

// 4. No commas/quotes breaking naive CSV
rows.forEach((r, i) => {
  const vals = Object.values(r);
  vals.forEach((v) => {
    if (typeof v !== 'string') return;
    if (v.includes(',')) errors.push(`row ${i + 2}: comma inside value "${v}"`);
    if (v.includes('"')) errors.push(`row ${i + 2}: quote inside value "${v}"`);
  });
});

// 5. Duplicate cyrillic internally
const seen = new Map();
rows.forEach((r, i) => {
  const c = r.cyrillic;
  if (seen.has(c)) errors.push(`duplicate cyrillic "${c}" (rows ${seen.get(c)} and ${i + 2})`);
  seen.set(c, i + 2);
});

// 6. Duplicate vs existing dictionary words (words_with_fields.csv + words_new.csv)
for (const file of ['words_with_fields.csv', 'words_new.csv']) {
  const t = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  const h = t.split('\n')[0].split(',');
  const ci = h.indexOf('cyrillic');
  const existing = new Set(t.split('\n').slice(1).filter((l) => l.trim()).map((l) => l.split(',')[ci].trim()));
  for (const r of rows) {
    if (existing.has(r.cyrillic)) errors.push(`cyrillic "${r.cyrillic}" already exists in ${file}`);
  }
}

// 7. Transliteration round-trip
rows.forEach((r, i) => {
  const expected = toLatin(r.cyrillic);
  if (r.latin !== expected) errors.push(`row ${i + 2}: latin "${r.latin}" != transliteration "${expected}" of "${r.cyrillic}"`);
});

// 8. Example: no Latin letters in Cyrillic, word count <= 8, ends with terminal punctuation
rows.forEach((r, i) => {
  const ex = r.exampleCyrillic.trim();
  const latinHits = [...ex].filter((c) => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.includes(c));
  if (latinHits.length) errors.push(`row ${i + 2}: latin letters in example: ${latinHits.join('')} in "${ex}"`);
  const words = ex.replace(/[.!?]/g, '').split(/\s+/).filter(Boolean);
  if (words.length > 8) errors.push(`row ${i + 2}: example has ${words.length} words (>8): "${ex}"`);
  if (!/[.!?]$/.test(ex)) errors.push(`row ${i + 2}: example lacks terminal punctuation: "${ex}"`);
});

// 9. Conjugation distribution
const dist = {};
for (const r of rows) dist[r.conjugation || '(empty)'] = (dist[r.conjugation || '(empty)'] || 0) + 1;
const iCount = dist.I || 0, iiCount = dist.II || 0, iiiCount = dist.III || 0;
ok(iCount >= 25, `conj I count = ${iCount}, need >= 25`);
ok(iiCount >= 25, `conj II count = ${iiCount}, need >= 25`);
ok(iiiCount >= 25, `conj III count = ${iiiCount}, need >= 25`);
const empties = rows.filter((r) => r.conjugation === '').map((r) => `${r.cyrillic} (${r.exampleCyrillic.trim()})`);
if (empties.length) console.log('EMPTY conjugation rows (exceptions):');
for (const e of empties) console.log('  ' + e);

// 10. RU/EN example translations non-empty + RU sentence has no latin
rows.forEach((r, i) => {
  const exRu = r.exampleTranslationRu.trim();
  const latinHits = [...exRu].filter((c) => 'abcdefghijklmnopqrstuvwxyz'.includes(c));
  if (latinHits.length) warn.push(`row ${i + 2}: latin in RU translation "${exRu}"`);
});

// 11. Example correspondence: every example must contain a recognized form of
//     its headword (present tense; бити shows "будем", рећи is shown as itself
//     because its present is fully suppletive).
const FORMS = {
  отићи: ['одемо'], 'вратити се': ['вратим'], трчати: ['трчи'],
  ходати: ['ходамо'], возити: ['вози'], летети: ['лети'], стати: ['стане'],
  путовати: ['путујемо'], 'кретати се': ['креће'], силазити: ['силазим'],
  устати: ['устанем'], 'одмарати се': ['одмарам'], оставити: ['оставим'],
  узети: ['узме'], прати: ['перем'], чистити: ['чистим'], лећи: ['легнем'],
  ручати: ['ручамо'], вечерати: ['вечерамо'], припремати: ['припремам'],
  рећи: ['рећи'], питати: ['пита'], одговорити: ['одговорим'],
  причати: ['причам'], звати: ['зовем'], поздравити: ['поздравим'],
  разговарати: ['разговарамо'], ћутати: ['ћути'], викати: ['вичу'],
  разумети: ['разумем'], памтити: ['памтим'], изгледати: ['изгледаш'],
  'осећати се': ['осећам'], размишљати: ['размишљам'], заборавити: ['заборавим'],
  проверити: ['проверим'], схватити: ['схватим'], сањати: ['сањам'],
  хтети: ['хоћу'], моћи: ['могу'], морати: ['морам'], требати: ['треба'],
  желети: ['желим'], успети: ['успе'], сумњати: ['сумњам'],
  'надати се': ['надам'], умети: ['умем'], смети: ['смем'],
  коштати: ['кошта'], продавати: ['продајем'], тражити: ['тражим'],
  наћи: ['нађем'], мењати: ['мењам'], враћати: ['враћам'],
  дуговати: ['дугујеш'], штедети: ['штедим'], бројати: ['бројим'],
  'свидети се': ['свиђа'], 'бојати се': ['бојим'], 'смејати се': ['смејем'],
  плакати: ['плаче'], 'љутити се': ['љутим'], 'радовати се': ['радујем'],
  умрети: ['умре'], 'одморити се': ['одморимо'], 'бринути се': ['бринем'],
  'уморити се': ['уморим'], кувати: ['кувам'], пећи: ['печем'],
  пробати: ['пробам'], сећи: ['сечем'], сипати: ['сипам'],
  наручити: ['наручимо'], послужити: ['послужим'], доручковати: ['доручкујем'],
  'купати се': ['купам'], 'облачити се': ['облачим'], 'догодити се': ['догоди'],
  бити: ['будем'], имати: ['имам'], излазити: ['излазим'], улазити: ['улазим'],
  почињати: ['почињем'], завршавати: ['завршавам'], чекати: ['чекам'],
  шетати: ['шетам'], пливати: ['пливам'], певати: ['певам'],
  седети: ['седим'], стајати: ['стојим'], лежати: ['лежим'],
  носити: ['носим'], давати: ['дајем'], добити: ['добијем'],
  слати: ['шаљем'], славити: ['славимо'], помагати: ['помажем'],
  становати: ['станујем'], спаковати: ['спакујем'], позвати: ['позовем'],
};
const tokenize = (s) => (s.toLowerCase().match(/[\p{Script=Cyrillic}]+/gu) || []);
rows.forEach((r, i) => {
  const forms = FORMS[r.cyrillic];
  if (!forms) { errors.push(`row ${i + 2}: no recognized forms registered for "${r.cyrillic}"`); return; }
  const tokens = new Set(tokenize(r.exampleCyrillic));
  const found = forms.filter((f) => tokens.has(f));
  if (!found.length) errors.push(`row ${i + 2}: example "${r.exampleCyrillic}" lacks a form of "${r.cyrillic}" (expected one of: ${forms.join(', ')})`);
});

console.log('\n=== RESULT ===');
console.log('rows:', rows.length);
console.log('conjugation distribution:', JSON.stringify(dist));
if (errors.length) {
  console.log(`FAIL (${errors.length}):`);
  errors.forEach((e) => console.log('  ✗ ' + e));
  process.exit(1);
} else {
  console.log('PASS — all checks OK');
  if (warn.length) { console.log('warnings:'); warn.forEach((w) => console.log('  ⚠ ' + w)); }
}
