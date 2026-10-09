#!/usr/bin/env node
// Validates words_adjectives.csv against ТЗ-02 acceptance criteria.
const fs = require('fs');

const TO_LATIN = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'đ', е: 'e', ж: 'ž', з: 'z',
  и: 'i', ј: 'j', к: 'k', л: 'l', љ: 'lj', м: 'm', н: 'n', њ: 'nj', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', ћ: 'ć', у: 'u', ф: 'f', х: 'h', ц: 'c',
  ч: 'č', џ: 'dž', ш: 'š',
};
const toLatin = (s) => [...s].map((c) => TO_LATIN[c] ?? c).join('');

const text = fs.readFileSync('words_adjectives.csv', 'utf8');
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

// 3. Required / forbidden-empty / attribute codes
const REQUIRED = ['cyrillic','latin','translationRu','translationEn','partOfSpeech','gender','number','exampleCyrillic','exampleTranslationRu','exampleTranslationEn'];
const FORBIDDEN = ['declension','conjugation'];
rows.forEach((r, i) => {
  REQUIRED.forEach((f) => ok(r[f] && r[f].trim() !== '', `row ${i + 2}: empty required field ${f}`));
  FORBIDDEN.forEach((f) => ok(!r[f] || r[f].trim() === '', `row ${i + 2}: forbidden field ${f} filled (="${r[f]}")`));
  ok(r.partOfSpeech === 'adjective', `row ${i + 2}: partOfSpeech="${r.partOfSpeech}"`);
  ok(r.gender === 'm', `row ${i + 2}: gender="${r.gender}"`);
  ok(r.number === 'singular', `row ${i + 2}: number="${r.number}"`);
});

// 4. No commas/quotes breaking naive CSV
rows.forEach((r, i) => {
  Object.values(r).forEach((v) => {
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

// 6. Duplicate vs existing dictionary words (any part of speech)
for (const file of ['words_with_fields.csv', 'words_new.csv', 'words_verbs.csv']) {
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

// 8. Example: no Latin letters, word count <= 8, ends with terminal punctuation
rows.forEach((r, i) => {
  const ex = r.exampleCyrillic.trim();
  const latinHits = [...ex].filter((c) => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.includes(c));
  if (latinHits.length) errors.push(`row ${i + 2}: latin letters in example: ${latinHits.join('')} in "${ex}"`);
  const words = ex.replace(/[.!?]/g, '').split(/\s+/).filter(Boolean);
  if (words.length > 8) errors.push(`row ${i + 2}: example has ${words.length} words (>8): "${ex}"`);
  if (!/[.!?]$/.test(ex)) errors.push(`row ${i + 2}: example lacks terminal punctuation: "${ex}"`);
});

// 9. Example correspondence: the adjective must appear in the example in an
//    agreed (declined) form. FORMS maps cyrillic -> the token(s) actually in
//    the example. Invariable adjectives (розе, браон) keep their base form.
const FORMS = {
  лак: ['лак'], кратак: ['кратак'], дебео: ['дебела'], мршав: ['мршав'],
  спор: ['спор'], ружан: ['ружна'], тужан: ['тужан'], сиромашан: ['сиромашна'],
  болестан: ['болесна'], уморан: ['уморан'], одморан: ['одморан'],
  диван: ['диван'], занимљив: ['занимљива'], досадан: ['досадан'],
  смешан: ['смешна'], озбиљан: ['озбиљан'], чудан: ['чудно'],
  црн: ['црну'], бео: ['белу'], жут: ['жути'], браон: ['браон'], сив: ['сиво'],
  љубичаст: ['љубичасти'], наранџаст: ['наранџасти'], розе: ['розе'],
  златан: ['златни'], сребрн: ['сребрна'],
  мек: ['мек'], тврд: ['тврд'], свеж: ['свеже'], сладак: ['слатка'],
  слан: ['слана'], кисео: ['кисели'], горак: ['горка'], љут: ['љут'],
  згодан: ['згодан'], глуп: ['глупо'], љубазан: ['љубазан'],
  стрпљив: ['стрпљив'], нервозан: ['нервозан'], срамежљив: ['срамежљива'],
  дружељубив: ['дружељубив'], весео: ['весела'], миран: ['мирно'],
  храбар: ['храбар'], вредан: ['вредна'], лењ: ['лења'], поштен: ['поштен'],
  искрен: ['искрен'], тачан: ['тачан'],
  руски: ['руски'], енглески: ['енглески'], немачки: ['немачки'],
  француски: ['француску'], италијански: ['италијански'], шпански: ['шпански'],
  грчки: ['грчки'], кинески: ['кинески'], амерички: ['амерички'],
  јапански: ['јапански'],
  сунчан: ['сунчан'], облачан: ['облачно'], кишовит: ['кишовит'],
  ветровит: ['ветровит'], снежан: ['снежна'], светао: ['светла'],
  таман: ['тамна'], магловит: ['магловито'],
  први: ['први'], последњи: ['последњи'], следећи: ['следећа'],
  исти: ['истог'], други: ['други'], самосталан: ['самостална'],
  слободан: ['слободан'], заузет: ['заузет'], заједнички: ['заједничке'],
  цео: ['цео'], претходни: ['претходна'], будући: ['будући'],
  довољан: ['довољно'], потребан: ['потребна'],
  важан: ['важан'], користан: ['корисна'], удобан: ['удобна'],
  модеран: ['модеран'], практичан: ['практична'], жедан: ['жедан'],
  сит: ['сит'], округао: ['округао'], чврст: ['чврст'], нежан: ['нежна'],
  задовољан: ['задовољан'], пажљив: ['пажљив'], опасан: ['опасна'],
  пријатан: ['пријатно'], јасан: ['јасан'], далек: ['далек'],
  близак: ['близак'], безбедан: ['безбедан'],
};
const tokenize = (s) => (s.toLowerCase().match(/[\p{Script=Cyrillic}]+/gu) || []);
rows.forEach((r, i) => {
  const forms = FORMS[r.cyrillic];
  if (!forms) { errors.push(`row ${i + 2}: no recognized forms registered for "${r.cyrillic}"`); return; }
  const tokens = new Set(tokenize(r.exampleCyrillic));
  const found = forms.filter((f) => tokens.has(f));
  if (!found.length) errors.push(`row ${i + 2}: example "${r.exampleCyrillic}" lacks a form of "${r.cyrillic}" (expected one of: ${forms.join(', ')})`);
});

// 10. RU/EN example translations non-empty; RU has no latin letters
rows.forEach((r, i) => {
  const exRu = r.exampleTranslationRu.trim();
  const exEn = r.exampleTranslationEn.trim();
  ok(exRu !== '' && exEn !== '', `row ${i + 2}: empty example translation`);
  const latinHits = [...exRu].filter((c) => 'abcdefghijklmnopqrstuvwxyz'.includes(c));
  if (latinHits.length) warn.push(`row ${i + 2}: latin in RU translation "${exRu}"`);
});

// 11. Bulk-import simulation: attribute whitelist of backend validateWordAttributes
const ALLOWED_POS = ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'particle', 'numeral', 'interjection'];
rows.forEach((r, i) => {
  if (!ALLOWED_POS.includes(r.partOfSpeech)) errors.push(`row ${i + 2}: partOfSpeech "${r.partOfSpeech}" not in whitelist`);
  if (!['m', 'f', 'n'].includes(r.gender)) errors.push(`row ${i + 2}: gender "${r.gender}" not in whitelist`);
  if (!['singular', 'plural'].includes(r.number)) errors.push(`row ${i + 2}: number "${r.number}" not in whitelist`);
  if (r.conjugation !== '' && !['I', 'II', 'III'].includes(r.conjugation)) errors.push(`row ${i + 2}: conjugation "${r.conjugation}" invalid`);
});

console.log('\n=== RESULT ===');
console.log('rows:', rows.length);
if (errors.length) {
  console.log(`FAIL (${errors.length}):`);
  errors.forEach((e) => console.log('  ✗ ' + e));
  process.exit(1);
} else {
  console.log('PASS — all checks OK');
  if (warn.length) { console.log('warnings:'); warn.forEach((w) => console.log('  ⚠ ' + w)); }
}
