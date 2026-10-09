#!/usr/bin/env node
// ТЗ-04 audit: units/lessons/exercises vs dictionary. Checks §2.1–2.5 of the spec.
// Read-only — prints a violation report, does not modify any file.
const fs = require('fs');

const dataDir = '.';
const FILES = {
  units: `${dataDir}/units.csv`,
  lessons: `${dataDir}/lessons.csv`,
  exercises: `${dataDir}/exercises.csv`,
  dictBase: `${dataDir}/words_with_fields.csv`,
  dictAll: [
    'words_with_fields.csv', 'words_new.csv', 'words_verbs.csv',
    'words_adjectives.csv', 'words_adverbs.csv', 'words_function.csv',
  ].map((f) => `${dataDir}/${f}`),
};

function readCsv(path) {
  const text = fs.readFileSync(path, 'utf8').replace(/^﻿/, '');
  const lines = text.split('\n').filter((l) => l.trim() !== '');
  const header = lines[0].split(',');
  return lines.slice(1).map((l) => {
    const parts = l.split(',');
    const r = {};
    header.forEach((h, i) => (r[h] = parts[i] ?? ''));
    return r;
  });
}

const units = readCsv(FILES.units);
const lessons = readCsv(FILES.lessons);
const exercises = readCsv(FILES.exercises);
const dictBaseRows = readCsv(FILES.dictBase);
const dictAllRows = FILES.dictAll.flatMap((f) => readCsv(f));

const err = [];
const warn = [];
const note = [];
const ok = (c, m) => { if (!c) err.push(m); };

// ---------- 2.4 Units ----------
const unitCyr = new Set();
units.forEach((u, i) => {
  const t = `units.csv row ${i + 2} (${u.titleCyrillic})`;
  ['titleCyrillic', 'titleLatin', 'titleTranslationRu', 'titleTranslationEn']
    .forEach((f) => ok(u[f] && u[f].trim() !== '', `${t}: empty ${f}`));
  if (unitCyr.has(u.titleCyrillic)) err.push(`${t}: duplicate titleCyrillic`);
  unitCyr.add(u.titleCyrillic);
});
note.push(`units.csv: ${units.length} units, order is positional (row sequence), no order column in CSV — DB gaps not detectable from file`);

// ---------- 2.4 Lessons ----------
const lessonKey = new Set();
const unitLesson = {}; // unit -> [lesson]
lessons.forEach((l, i) => {
  const t = `lessons.csv row ${i + 2} (${l.unitTitle}/${l.title})`;
  ['title', 'titleLatin', 'titleTranslationRu', 'titleTranslationEn']
    .forEach((f) => ok(l[f] && l[f].trim() !== '', `${t}: empty ${f}`));
  ok(unitCyr.has(l.unitTitle), `${t}: unitTitle "${l.unitTitle}" not in units.csv`);
  ok(l.xpReward === '10', `${t}: xpReward=${l.xpReward}, expected 10`);
  const key = `${l.unitTitle}|${l.title}`;
  if (lessonKey.has(key)) err.push(`${t}: duplicate unit+lesson pair`);
  lessonKey.add(key);
  (unitLesson[l.unitTitle] = unitLesson[l.unitTitle] || []).push(l.title);
});
Object.entries(unitLesson).forEach(([u, ls]) => {
  if (ls.length === 1) warn.push(`unit "${u}" has only 1 lesson — candidate for ТЗ-05 (2.5)`);
});
note.push(`lessons.csv: ${lessons.length} lessons, all xpReward=10`);

// ---------- 2.1/2.2 Word & exercise counts per lesson ----------
const byLesson = {}; // key -> {words:Set, ex:[row]}
exercises.forEach((e) => {
  const key = `${e.unitTitle}|${e.lessonTitle}`;
  (byLesson[key] = byLesson[key] || { words: new Set(), ex: [] }).words.add(e.cyrillic);
  byLesson[key].ex.push(e);
});
// order lessons by units.csv order then lessons.csv order
const lessonOrder = [];
const unitOrder = new Map();
units.forEach((u, i) => unitOrder.set(u.titleCyrillic, i));
lessons.forEach((l) => lessonOrder.push(`${l.unitTitle}|${l.title}`));

console.log('\n=== LESSON SIZE ===');
const lessonSizeRows = [];
for (const key of lessonOrder) {
  const b = byLesson[key];
  if (!b) { err.push(`lesson "${key}" has no exercises at all`); continue; }
  const [u, ls] = key.split('|');
  const nw = b.words.size;
  const nx = b.ex.length;
  const status = nw >= 8 && nw <= 12 ? 'OK' : nw >= 6 && nw <= 15 ? 'WARN' : 'BAD';
  const statLabel = status === 'OK' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
  if (nw < 6) err.push(`EMPTY_LESSON: ${key} — ${nw} words (<6)`);
  if (nw > 15) err.push(`OVERLOAD_LESSON: ${key} — ${nw} words (>15)`);
  if (nx < 10 && nw >= 5) err.push(`LOW_EXERCISES: ${key} — ${nx} exercises with ${nw} words`);
  lessonSizeRows.push({ key, u, ls, nw, nx, status: statLabel });
  console.log(`${statLabel} ${key}: ${nw} words, ${nx} exercises`);
}

// ---------- 2.2 per-word exercise pair ----------
console.log('\n=== PER-WORD PAIRS ===');
const pairViolations = [];
for (const [key, b] of Object.entries(byLesson)) {
  const perWord = {};
  b.ex.forEach((e) => (perWord[e.cyrillic] = perWord[e.cyrillic] || []).push(e.type));
  for (const [w, types] of Object.entries(perWord)) {
    const tc = types.filter((t) => t === 'translation_choice').length;
    const fw = types.filter((t) => t === 'fill_word').length;
    if (tc !== 1 || fw !== 1) {
      pairViolations.push(`${key} / ${w}: translation_choice=${tc}, fill_word=${fw}`);
      err.push(`PAIR_VIOLATION: ${key} / ${w} — translation_choice=${tc}, fill_word=${fw}`);
    }
  }
}
if (!pairViolations.length) console.log('all words have exactly 1 translation_choice + 1 fill_word');

// ---------- 2.3 exercise well-formedness ----------
console.log('\n=== EXERCISE TYPE/FIELDS ===');
const badEx = [];
const dictBaseCyr = new Set(dictBaseRows.map((r) => r.cyrillic));
const dictAllCyr = new Set(dictAllRows.map((r) => r.cyrillic));
const missingFromDict = [];
const typeCounts = {};
exercises.forEach((e, i) => {
  const t = `exercises.csv row ${i + 2} (${e.unitTitle}/${e.lessonTitle}/${e.cyrillic})`;
  typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
  if (e.type !== 'translation_choice' && e.type !== 'fill_word') {
    badEx.push(`${t}: type "${e.type}"`);
    err.push(`BAD_EXERCISE: ${t} — type "${e.type}"`);
  }
  if (e.audioUrl || e.imageUrl) {
    badEx.push(`${t}: audioUrl/imageUrl filled`);
    err.push(`BAD_EXERCISE: ${t} — audioUrl/imageUrl filled`);
  }
  ['translationRu', 'translationEn'].forEach((f) => {
    if (!e[f] || !e[f].trim()) { badEx.push(`${t}: empty ${f}`); err.push(`BAD_EXERCISE: ${t} — empty ${f}`); }
  });
  const sentFields = ['sentenceCyrillic', 'sentenceLatin', 'sentenceTranslationRu', 'sentenceTranslationEn'];
  if (e.type === 'fill_word') {
    sentFields.forEach((f) => {
      if (!e[f] || !e[f].trim()) { badEx.push(`${t}: fill_word empty ${f}`); err.push(`BAD_EXERCISE: ${t} — fill_word empty ${f}`); }
    });
  } else {
    sentFields.forEach((f) => {
      if (e[f] && e[f].trim()) { badEx.push(`${t}: translation_choice has ${f}`); err.push(`BAD_EXERCISE: ${t} — translation_choice has ${f} filled`); }
    });
  }
  if (!dictBaseCyr.has(e.cyrillic)) {
    missingFromDict.push(`${e.unitTitle}/${e.lessonTitle}/${e.cyrillic}`);
    if (!dictAllCyr.has(e.cyrillic)) {
      err.push(`MISSING_WORD: ${t} — cyrillic "${e.cyrillic}" absent from ALL word files`);
    } else {
      note.push(`${t}: word "${e.cyrillic}" not in words_with_fields.csv but present in a newer word file`);
    }
  }
});
console.log('exercise types:', JSON.stringify(typeCounts));
if (missingFromDict.length) {
  console.log('words used in lessons not in words_with_fields.csv:', missingFromDict.length);
  missingFromDict.forEach((m) => console.log('  - ' + m));
} else {
  console.log('all exercise words present in words_with_fields.csv');
}

// ---------- 2.3 dictionary field completeness + POS matrix ----------
console.log('\n=== DICTIONARY FIELD/POS CHECK ===');
const POS_MATRIX = {
  // partOfSpeech: { req: [fields that must be filled], forb: [fields that must be empty] }
  noun: { req: ['gender', 'number', 'declension'], forb: ['conjugation'] },
  verb: { req: ['conjugation'], forb: ['gender', 'number', 'declension'] },
  adjective: { req: [], forb: ['gender', 'number', 'declension', 'conjugation'] },
  adverb: { req: [], forb: ['gender', 'number', 'declension', 'conjugation'] },
  pronoun: { req: [], forb: ['declension', 'conjugation'] },
  preposition: { req: [], forb: ['gender', 'number', 'declension', 'conjugation'] },
  conjunction: { req: [], forb: ['gender', 'number', 'declension', 'conjugation'] },
  particle: { req: [], forb: ['gender', 'number', 'declension', 'conjugation'] },
  interjection: { req: [], forb: ['gender', 'number', 'declension', 'conjugation'] },
  numeral: { req: [], forb: ['gender', 'number', 'declension', 'conjugation'] },
};
const fieldViolations = [];
dictBaseRows.forEach((r, i) => {
  const t = `words_with_fields.csv row ${i + 2} (${r.cyrillic})`;
  ['cyrillic', 'latin', 'translationRu', 'translationEn', 'partOfSpeech']
    .forEach((f) => ok(r[f] && r[f].trim() !== '', `${t}: empty ${f}`));
  const m = POS_MATRIX[r.partOfSpeech];
  if (!m) { fieldViolations.push(`${r.cyrillic}: partOfSpeech "${r.partOfSpeech}"`); err.push(`INCOMPLETE_FIELDS: ${t} — unknown partOfSpeech "${r.partOfSpeech}"`); return; }
  m.req.forEach((f) => { if (!r[f] || !r[f].trim()) { fieldViolations.push(`${r.cyrillic}: empty ${f} (${r.partOfSpeech})`); err.push(`INCOMPLETE_FIELDS: ${t} — ${r.partOfSpeech} requires ${f}`); } });
  m.forb.forEach((f) => { if (r[f] && r[f].trim()) { fieldViolations.push(`${r.cyrillic}: filled ${f} (${r.partOfSpeech})`); err.push(`INCOMPLETE_FIELDS: ${t} — ${r.partOfSpeech} forbids ${f}="${r[f]}"`); } });
  // attribute whitelist values
  if (r.gender && !['m', 'f', 'n'].includes(r.gender)) err.push(`INCOMPLETE_FIELDS: ${t} — gender "${r.gender}" not in whitelist`);
  if (r.number && !['singular', 'plural'].includes(r.number)) err.push(`INCOMPLETE_FIELDS: ${t} — number "${r.number}" not in whitelist`);
  if (r.conjugation && !['I', 'II', 'III'].includes(r.conjugation)) err.push(`INCOMPLETE_FIELDS: ${t} — conjugation "${r.conjugation}" invalid`);
  if (r.declension && !['I', 'II', 'III'].includes(r.declension)) err.push(`INCOMPLETE_FIELDS: ${t} — declension "${r.declension}" invalid`);
  ['exampleCyrillic', 'exampleTranslationRu', 'exampleTranslationEn'].forEach((f) => {
    if (!r[f] || !r[f].trim()) { fieldViolations.push(`${r.cyrillic}: empty ${f}`); err.push(`INCOMPLETE_FIELDS: ${t} — empty ${f}`); }
  });
  // latin letters inside cyrillic (known defects: годинa, проleће)
  const latinHits = [...r.cyrillic].filter((c) => /[a-zA-Z]/.test(c));
  if (latinHits.length) err.push(`LATIN_IN_CYRILLIC: ${t} — cyrillic contains latin "${latinHits.join('')}"`);
});
if (!fieldViolations.length) console.log('no dictionary field/POS violations');
else { console.log('dictionary field/POS violations:', fieldViolations.length); fieldViolations.forEach((v) => console.log('  - ' + v)); }

// ---------- 2.5 Coverage / orphans ----------
console.log('\n=== COVERAGE ===');
const usedWords = new Set();
exercises.forEach((e) => usedWords.add(e.cyrillic));
const usedCorrect = usedWords;
const orphans = dictBaseRows.map((r) => r.cyrillic).filter((c) => !usedCorrect.has(c));
console.log(`dictionary words not used in any lesson: ${orphans.length} of ${dictBaseRows.length}`);
console.log(`lessons use ${usedCorrect.size} distinct dictionary words`);

// ТЗ-04 known defects (годинa, проleће) fixed in ТЗ-05 — assert absence
const exText = fs.readFileSync(FILES.exercises, 'utf8');
for (const k of ['годинa', 'проleће']) {
  ok(!exText.split(',').includes(k), `KNOWN_DEFECT: "${k}" still present in exercises.csv`);
}

console.log('\n=== RESULT ===');
console.log(`units=${units.length} lessons=${lessons.length} exercises=${exercises.length} dictBase=${dictBaseRows.length}`);
if (err.length) {
  console.log(`FAIL (${err.length}):`);
  err.forEach((e) => console.log('  ✗ ' + e));
  process.exit(1);
} else {
  console.log('PASS — no violations');
}
console.log('\n--- WARNINGS ---');
warn.forEach((w) => console.log('  ⚠ ' + w));
console.log('\n--- NOTES ---');
note.forEach((n) => console.log('  · ' + n));
