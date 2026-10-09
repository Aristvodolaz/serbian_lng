#!/usr/bin/env node
// Validates words_adverbs.csv and words_function.csv against ТЗ-03 acceptance criteria.
const fs = require('fs');

const TO_LATIN = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'đ', е: 'e', ж: 'ž', з: 'z',
  и: 'i', ј: 'j', к: 'k', л: 'l', љ: 'lj', м: 'm', н: 'n', њ: 'nj', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', ћ: 'ć', у: 'u', ф: 'f', х: 'h', ц: 'c',
  ч: 'č', џ: 'dž', ш: 'š',
};
const toLatin = (s) => [...s].map((c) => TO_LATIN[c] ?? c).join('');

const expectedHeader = 'cyrillic,latin,translationRu,translationEn,partOfSpeech,gender,number,declension,conjugation,exampleCyrillic,exampleTranslationRu,exampleTranslationEn';

function readCsv(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.replace(/^﻿/, '').split('\n').filter((l) => l.trim() !== '');
  const header = lines[0].split(',');
  const rows = lines.slice(1).map((l) => {
    const parts = l.split(',');
    const r = {};
    header.forEach((h, i) => (r[h] = parts[i] ?? ''));
    return r;
  });
  return { lines, header, rows };
}

const errors = [];
const warn = [];
const ok = (cond, msg) => { if (!cond) errors.push(msg); };

const adverbFile = readCsv('words_adverbs.csv');
const functionFile = readCsv('words_function.csv');

// 1. Counts
ok(adverbFile.rows.length === 100, `words_adverbs.csv: row count = ${adverbFile.rows.length}, expected 100`);
ok(functionFile.rows.length === 61, `words_function.csv: row count = ${functionFile.rows.length}, expected 61`);

// 2. Headers exact
ok(adverbFile.lines[0] === expectedHeader, `words_adverbs.csv header mismatch`);
ok(functionFile.lines[0] === expectedHeader, `words_function.csv header mismatch`);

// 3. Required / forbidden-empty + no commas/quotes
// gender/number are NOT required: for adverbs and most function words they are
// deliberately empty per the ТЗ-03 matrix; per-POS rules are enforced below.
const REQUIRED = ['cyrillic','latin','translationRu','translationEn','partOfSpeech','exampleCyrillic','exampleTranslationRu','exampleTranslationEn'];
function checkRowBasics(file, r, i) {
  const tag = `${file}: row ${i + 2}`;
  REQUIRED.forEach((f) => ok(r[f] && r[f].trim() !== '', `${tag}: empty required field ${f}`));
  ['declension','conjugation'].forEach((f) => ok(!r[f] || r[f].trim() === '', `${tag}: forbidden field ${f} filled (="${r[f]}")`));
  Object.values(r).forEach((v) => {
    if (typeof v !== 'string') return;
    if (v.includes(',')) errors.push(`${tag}: comma inside value "${v}"`);
    if (v.includes('"')) errors.push(`${tag}: quote inside value "${v}"`);
  });
}
adverbFile.rows.forEach((r, i) => checkRowBasics('words_adverbs.csv', r, i));
functionFile.rows.forEach((r, i) => checkRowBasics('words_function.csv', r, i));

// 4. Adverbs: POS + all attributes empty
adverbFile.rows.forEach((r, i) => {
  ok(r.partOfSpeech === 'adverb', `words_adverbs.csv row ${i + 2}: partOfSpeech="${r.partOfSpeech}"`);
  ok(!r.gender && !r.number, `words_adverbs.csv row ${i + 2}: adverb has gender/number ("${r.gender}"/"${r.number}")`);
});

// 5. Function words: POS whitelist + per-POS attribute rules
const ALLOWED_POS = ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'particle', 'numeral', 'interjection'];
// For pronouns the dictionary form may carry gender/number; everything else must be empty.
const PRONOUN_ATTRS = {
  оно: ['n', 'singular'], ви: ['', 'plural'], они: ['m', 'plural'],
  његов: ['m', 'singular'], њен: ['f', 'singular'], наш: ['m', 'singular'],
  ваш: ['m', 'singular'], њихов: ['m', 'singular'], свој: ['m', 'singular'],
  овај: ['m', 'singular'], тај: ['m', 'singular'], онај: ['m', 'singular'],
  ко: ['', ''], шта: ['', ''], чији: ['m', 'singular'], који: ['m', 'singular'],
  неко: ['', ''], нико: ['', ''], све: ['', ''],
};
const NO_ATTR_POS = ['preposition', 'conjunction', 'particle', 'interjection', 'numeral'];
functionFile.rows.forEach((r, i) => {
  const tag = `words_function.csv row ${i + 2}`;
  ok(ALLOWED_POS.includes(r.partOfSpeech), `${tag}: partOfSpeech "${r.partOfSpeech}" not in whitelist`);
  if (r.partOfSpeech === 'pronoun') {
    const exp = PRONOUN_ATTRS[r.cyrillic];
    ok(!!exp, `${tag}: pronoun "${r.cyrillic}" missing from PRONOUN_ATTRS map`);
    if (exp) ok(r.gender === exp[0] && r.number === exp[1], `${tag}: pronoun "${r.cyrillic}" expected gender/number "${exp[0]}"/"${exp[1]}", got "${r.gender}"/"${r.number}"`);
  } else {
    ok(NO_ATTR_POS.includes(r.partOfSpeech), `${tag}: unexpected partOfSpeech "${r.partOfSpeech}"`);
    ok(!r.gender && !r.number, `${tag}: ${r.partOfSpeech} "${r.cyrillic}" has gender/number ("${r.gender}"/"${r.number}")`);
  }
});

// 6. Unique cyrillic within and across files + no collision with existing dictionary
function collectCyr(file, path) {
  const t = fs.readFileSync(path, 'utf8').replace(/^﻿/, '');
  const h = t.split('\n')[0].split(',');
  const ci = h.indexOf('cyrillic');
  return new Set(t.split('\n').slice(1).filter((l) => l.trim()).map((l) => l.split(',')[ci].trim()));
}
const adverbCyr = new Set(adverbFile.rows.map((r) => r.cyrillic));
const functionCyr = new Set(functionFile.rows.map((r) => r.cyrillic));
ok(adverbCyr.size === adverbFile.rows.length, 'words_adverbs.csv: duplicate cyrillic inside file');
ok(functionCyr.size === functionFile.rows.length, 'words_function.csv: duplicate cyrillic inside file');
for (const c of adverbCyr) if (functionCyr.has(c)) errors.push(`cyrillic "${c}" present in both new files`);
for (const file of ['words_with_fields.csv', 'words_new.csv', 'words_verbs.csv', 'words_adjectives.csv']) {
  const existing = collectCyr(file, file);
  for (const c of adverbCyr) if (existing.has(c)) errors.push(`adverb cyrillic "${c}" already exists in ${file}`);
  for (const c of functionCyr) if (existing.has(c)) errors.push(`function cyrillic "${c}" already exists in ${file}`);
}

// 7. Transliteration round-trip
function checkLatin(file, rows) {
  rows.forEach((r, i) => {
    const expected = toLatin(r.cyrillic);
    if (r.latin !== expected) errors.push(`${file} row ${i + 2}: latin "${r.latin}" != transliteration "${expected}" of "${r.cyrillic}"`);
  });
}
checkLatin('words_adverbs.csv', adverbFile.rows);
checkLatin('words_function.csv', functionFile.rows);

// 8. Examples: cyrillic-only, <= 8 words, terminal punctuation
function checkExample(file, r, i) {
  const tag = `${file} row ${i + 2}`;
  const ex = r.exampleCyrillic.trim();
  const latinHits = [...ex].filter((c) => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.includes(c));
  if (latinHits.length) errors.push(`${tag}: latin letters in example: ${latinHits.join('')} in "${ex}"`);
  const words = ex.replace(/[.!?]/g, '').split(/\s+/).filter(Boolean);
  if (words.length > 8) errors.push(`${tag}: example has ${words.length} words (>8): "${ex}"`);
  if (!/[.!?]$/.test(ex)) errors.push(`${tag}: example lacks terminal punctuation: "${ex}"`);
  const exRu = r.exampleTranslationRu.trim();
  const exEn = r.exampleTranslationEn.trim();
  ok(exRu !== '' && exEn !== '', `${tag}: empty example translation`);
  const ruLatin = [...exRu].filter((c) => 'abcdefghijklmnopqrstuvwxyz'.includes(c));
  if (ruLatin.length) warn.push(`${tag}: latin in RU translation "${exRu}"`);
}
adverbFile.rows.forEach((r, i) => checkExample('words_adverbs.csv', r, i));
functionFile.rows.forEach((r, i) => checkExample('words_function.csv', r, i));

// 9. Example correspondence: the target word must appear in the example.
//    Adverbs and function words are invariant, so the exact word must be a
//    token — except a small set of agreed forms (e.g. feminine of a pronoun).
const FORMS = {
  // words whose example uses a declined/agreed form rather than the dictionary form
  њен: ['њена'],
};
const tokenize = (s) => (s.toLowerCase().match(/[\p{Script=Cyrillic}]+/gu) || []);
function checkCorrespondence(file, rows) {
  rows.forEach((r, i) => {
    const tag = `${file} row ${i + 2}`;
    const forms = FORMS[r.cyrillic] || [r.cyrillic.toLowerCase()];
    const tokens = new Set(tokenize(r.exampleCyrillic));
    const found = forms.filter((f) => tokens.has(f));
    if (!found.length) errors.push(`${tag}: example "${r.exampleCyrillic}" lacks a form of "${r.cyrillic}" (expected one of: ${forms.join(', ')})`);
  });
}
checkCorrespondence('words_adverbs.csv', adverbFile.rows);
checkCorrespondence('words_function.csv', functionFile.rows);

// 10. Bulk-import simulation: backend validateWordAttributes whitelist
function checkWhitelist(file, rows) {
  rows.forEach((r, i) => {
    const tag = `${file} row ${i + 2}`;
    if (!ALLOWED_POS.includes(r.partOfSpeech)) errors.push(`${tag}: partOfSpeech "${r.partOfSpeech}" not in whitelist`);
    if (r.gender !== '' && !['m', 'f', 'n'].includes(r.gender)) errors.push(`${tag}: gender "${r.gender}" not in whitelist`);
    if (r.number !== '' && !['singular', 'plural'].includes(r.number)) errors.push(`${tag}: number "${r.number}" not in whitelist`);
    if (r.conjugation !== '' && !['I', 'II', 'III'].includes(r.conjugation)) errors.push(`${tag}: conjugation "${r.conjugation}" invalid`);
  });
}
checkWhitelist('words_adverbs.csv', adverbFile.rows);
checkWhitelist('words_function.csv', functionFile.rows);

console.log('\n=== RESULT ===');
console.log('words_adverbs.csv:', adverbFile.rows.length, 'rows | words_function.csv:', functionFile.rows.length, 'rows');
if (errors.length) {
  console.log(`FAIL (${errors.length}):`);
  errors.forEach((e) => console.log('  ✗ ' + e));
  process.exit(1);
} else {
  console.log('PASS — all checks OK');
  if (warn.length) { console.log('warnings:'); warn.forEach((w) => console.log('  ⚠ ' + w)); }
}
