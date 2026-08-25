#!/usr/bin/env node
// Adds translationRu to all word entries in seed.ts
const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '..', 'src', 'database', 'seed.ts');
const content = fs.readFileSync(seedPath, 'utf8');
const lines = content.split('\n');

const ruMap = {
  // Писмо
  'ђак': 'ученик', 'жена': 'женщина', 'љубав': 'любов', 'њива': 'поле',
  'ћирилица': 'кириллица', 'чај': 'чай', 'џем': 'джем', 'шума': 'лес',
  'пас': 'собака', 'рука': 'рука', 'нос': 'нос', 'уста': 'рот',
  'хлад': 'прохлада; тень',
  // Поздрави
  'хвала': 'спасибо', 'здраво': 'привет', 'молим': 'пожалуйста',
  'довиђења': 'до свидания', 'изволите': 'прошу', 'пријатно': 'приятного',
  'име': 'имя', 'одакле': 'откуда', 'пријатељ': 'друг',
  // Породица
  'мајка': 'мать', 'отац': 'отец', 'сестра': 'сестра', 'брат': 'брат',
  'деда': 'дедушка', 'баба': 'бабушка', 'кућа': 'дом', 'соба': 'комната',
  'врата': 'дверь',
  // Храна
  'хлеб': 'хлеб', 'вода': 'вода', 'ручак': 'обед', 'јабука': 'яблоко',
  'месо': 'мясо', 'кафа': 'кофе', 'рачун': 'счёт', 'укусно': 'вкусно',
  'со': 'соль',
  // Бројеви
  'један': 'один', 'два': 'два', 'пет': 'пять', 'шест': 'шесть',
  'десет': 'десять', 'сто': 'сто', 'данас': 'сегодня', 'сутра': 'завтра',
  'сат': 'час',
  // Путовање
  'станица': 'станция', 'аеродром': 'аэропорт', 'путовање': 'путешествие',
  'хотел': 'отель', 'карта': 'билет', 'пасош': 'паспорт', 'виза': 'виза',
  'кофер': 'чемодан', 'излаз': 'выход',
  // Људи
  'зовати се': 'зоваться', 'мој': 'мой', 'твој': 'твой', 'ја': 'я',
  'ти': 'ты', 'он': 'он', 'она': 'она', 'ми': 'мы', 'српски': 'сербский',
  'језик': 'язык', 'говорити': 'говорить', 'град': 'город', 'земља': 'страна',
  'главни': 'главный', 'живети': 'жить', 'стан': 'квартира', 'улица': 'улица',
  'зграда': 'здание', 'радити': 'работать', 'посао': 'работа', 'школа': 'школа',
  'ученик': 'ученик', 'студент': 'студент', 'наставник': 'учитель',
  'лекар': 'врач', 'болница': 'больница', 'инжењер': 'инженер',
  'сусед': 'сосед', 'дом': 'дом', 'широк': 'широкий', 'дуг': 'долгий',
  'млад': 'молодой', 'стар': 'старый', 'висок': 'высокий', 'низак': 'низкий',
  'добар': 'хороший', 'лош': 'плохой', 'нов': 'новый', 'велики': 'большой',
  'мали': 'маленький', 'леп': 'красивый', 'човек': 'человек', 'дан': 'день',
  'боја': 'цвет', 'црвен': 'красный', 'плав': 'синий', 'зелен': 'зелёный',
  'тешко': 'трудно',
  // Време
  'понедељак': 'понедельник', 'уторак': 'вторник', 'среда': 'среда',
  'четвртак': 'четверг', 'петак': 'пятница', 'субота': 'суббота',
  'недеља': 'воскресенье', 'јутро': 'утро', 'подне': 'полдень',
  'попладне': 'день', 'минута': 'минута', 'јуче': 'вчера', 'месец': 'месяц',
  'годинa': 'год', 'увек': 'всегда', 'понекад': 'иногда', 'нула': 'ноль',
  'четири': 'четыре', 'седам': 'семь', 'осам': 'восемь', 'девет': 'девять',
  'будити се': 'просыпаться', 'рано': 'рано', 'касно': 'поздно',
  'брзо': 'быстро', 'споро': 'медленно', 'ноћас': 'сегодня ночью',
  'време': 'время; погода', 'сада': 'сейчас', 'јануар': 'январь',
  'фебруар': 'февраль', 'март': 'март', 'април': 'апрель', 'мај': 'май',
  'јун': 'июнь', 'јул': 'июль', 'август': 'август', 'септембар': 'сентябрь',
  'октобар': 'октябрь', 'новембар': 'ноябрь', 'децембар': 'декабрь',
  'рођендан': 'день рождения', 'зима': 'зима', 'лето': 'лето',
  'проleће': 'весна', 'јесен': 'осень',
};

const enMap = {
  'име': 'name', 'зовати се': 'to be called', 'мој': 'my', 'твој': 'your',
  'ја': 'I', 'ти': 'you', 'он': 'he', 'она': 'she', 'ми': 'we',
  'српски': 'Serbian', 'језик': 'language', 'говорити': 'to speak',
  'град': 'city', 'земља': 'country', 'главни': 'main', 'хвала': 'thanks',
  'живети': 'to live', 'стан': 'apartment', 'улица': 'street',
  'зграда': 'building', 'радити': 'to work', 'посао': 'job', 'школа': 'school',
  'ученик': 'school student', 'студент': 'university student',
  'наставник': 'teacher', 'лекар': 'doctor', 'болница': 'hospital',
  'инжењер': 'engineer', 'сусед': 'neighbor', 'дом': 'home',
  'широк': 'wide', 'дуг': 'long', 'млад': 'young', 'стар': 'old',
  'висок': 'tall', 'низак': 'short', 'добар': 'good', 'лош': 'bad',
  'нов': 'new', 'велики': 'big', 'мали': 'small', 'леп': 'beautiful',
  'човек': 'person', 'дан': 'day', 'боја': 'color', 'црвен': 'red',
  'плав': 'blue', 'зелен': 'green', 'тешко': 'difficult',
  'понедељак': 'Monday', 'уторак': 'Tuesday', 'среда': 'Wednesday',
  'четвртак': 'Thursday', 'петак': 'Friday', 'субота': 'Saturday',
  'недеља': 'Sunday', 'јутро': 'morning', 'подне': 'noon',
  'попладне': 'afternoon', 'минута': 'minute', 'јуче': 'yesterday',
  'месец': 'month', 'годинa': 'year', 'увек': 'always', 'понекад': 'sometimes',
  'нула': 'zero', 'четири': 'four', 'седам': 'seven', 'осам': 'eight',
  'девет': 'nine', 'будити се': 'to wake up', 'рано': 'early',
  'касно': 'late', 'брзо': 'fast', 'споро': 'slowly', 'ноћас': 'tonight',
  'време': 'time; weather', 'сада': 'now', 'јануар': 'January',
  'фебруар': 'February', 'март': 'March', 'април': 'April', 'мај': 'May',
  'јун': 'June', 'јул': 'July', 'август': 'August', 'септембар': 'September',
  'октобар': 'October', 'новембар': 'November', 'децембар': 'December',
  'рођендан': 'birthday', 'зима': 'winter', 'лето': 'summer',
  'проleће': 'spring', 'јесен': 'autumn',
};

function isRussian(text) {
  return /[а-яё]/i.test(text);
}

// Extract cyrillic key from a word line: { cyrillic: '...', ...
function extractCyrillic(line) {
  const m = line.match(/cyrillic:\s*'([^']+)'/);
  return m ? m[1].toLowerCase() : null;
}

// Extract translationEn value
function extractTranslationEn(line) {
  const m = line.match(/translationEn:\s*'([^']*)'/);
  return m ? m[1] : null;
}

let changed = 0;
let skipped = 0;

const out = lines.map(line => {
  // Check if this is a word seed line (has cyrillic + translationEn)
  if (!line.includes('cyrillic:') || !line.includes('translationEn:')) return line;
  // Skip if already has translationRu
  if (line.includes('translationRu:')) return line;

  const key = extractCyrillic(line);
  if (!key) return line;

  const enVal = extractTranslationEn(line);
  if (!enVal) return line;

  const ruInEn = isRussian(enVal);

  if (ruInEn) {
    // Russian is in translationEn - split into both
    const ru = ruMap[key] || enVal;
    const en = enMap[key] || '';
    // Replace "translationEn: 'rus-text'" with "translationRu: 'rus-text', translationEn: 'en-text'"
    const enMatch = line.match(/(translationEn:\s*)'([^']*)'/);
    if (enMatch) {
      line = line.replace(
        enMatch[0],
        `translationRu: '${ru}', translationEn: '${en}'`
      );
      changed++;
    }
  } else {
    // English in translationEn - add translationRu before it
    const ru = ruMap[key] || '';
    if (!ru) {
      skipped++;
      console.log(`WARN: no Russian translation for "${key}" (en: ${enVal})`);
    }
    const enMatch = line.match(/(translationEn:\s*)'([^']*)'/);
    if (enMatch) {
      line = line.replace(
        enMatch[0],
        `translationRu: '${ru}', translationEn: '${enVal}'`
      );
      changed++;
    }
  }

  return line;
});

console.log(`Updated: ${changed}, Skipped: ${skipped}`);
fs.writeFileSync(seedPath, out.join('\n'), 'utf8');
console.log('Done - seed.ts updated successfully');
