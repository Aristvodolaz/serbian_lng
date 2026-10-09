#!/usr/bin/env node
// One-off rebuild generator: parses the deleted seed.ts (read from stdin via
// `git show b5299109:backend/src/database/seed.ts | node build-content-csvs.js`)
// and emits units.csv / lessons.csv / exercises.csv for the admin CSV upload.
//
// Lesson plan + RU/EN unit & lesson titles are authored here; word data comes
// from the seed. exampleTranslationRu/En for the later units (Људи, Време)
// were Russian/nonsense in the seed, so EX_RU / EX_EN override them with
// correct translations of the Serbian example sentence.
const fs = require('fs');

// ── Cyrillic → Latin (Serbian official transliteration) ──────────────────
const TO_LATIN = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'đ', е: 'e', ж: 'ž', з: 'z',
  и: 'i', ј: 'j', к: 'k', л: 'l', љ: 'lj', м: 'm', н: 'n', њ: 'nj', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', ћ: 'ć', у: 'u', ф: 'f', х: 'h', ц: 'c',
  ч: 'č', џ: 'dž', ш: 'š', А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Ђ: 'Đ',
  Е: 'E', Ж: 'Ž', З: 'Z', И: 'I', Ј: 'J', К: 'K', Л: 'L', Љ: 'Lj', М: 'M',
  Н: 'N', Њ: 'Nj', О: 'O', П: 'P', Р: 'R', С: 'S', Т: 'T', Ћ: 'Ć', У: 'U',
  Ф: 'F', Х: 'H', Ц: 'C', Ч: 'Č', Џ: 'Dž', Ш: 'Š',
};
function toLatin(s) {
  return [...s].map((c) => TO_LATIN[c] ?? c).join('');
}

// ── Units (order matters: order column) ────────────────────────────────────
const UNITS = [
  { cy: 'Писмо',      la: 'Pismo',     ru: 'Алфавит',     en: 'Alphabet' },
  { cy: 'Поздрави',   la: 'Pozdravi',  ru: 'Приветствия', en: 'Greetings' },
  { cy: 'Породица',   la: 'Porodica',  ru: 'Семья',       en: 'Family' },
  { cy: 'Храна',      la: 'Hrana',     ru: 'Еда',         en: 'Food' },
  { cy: 'Бројеви',    la: 'Brojevi',   ru: 'Числа',       en: 'Numbers' },
  { cy: 'Путовање',   la: 'Putovanje', ru: 'Путешествие', en: 'Travel' },
  { cy: 'Људи',       la: 'Ljudi',     ru: 'Люди',        en: 'People' },
  { cy: 'Време',      la: 'Vreme',     ru: 'Время',       en: 'Time' },
];

// ── Lesson plan: unit → [{title, ru, en, words[]}] ────────────────────────
// Words are the seed cyrillic keys; each word yields two exercises
// (translation_choice + fill_word).
const LESSONS = [
  {
    unit: 'Писмо', title: 'Писмо', ru: 'Алфавит', en: 'Alphabet',
    words: ['ђак', 'жена', 'љубав', 'њива', 'ћирилица', 'чај', 'џем', 'шума'],
  },
  {
    unit: 'Писмо', title: 'Лажни пријатељи', ru: 'Ложные друзья', en: 'False friends',
    words: ['пас', 'рука', 'нос', 'уста', 'хлад'],
  },
  {
    unit: 'Поздрави', title: 'Поздрави', ru: 'Приветствия', en: 'Greetings',
    words: ['здраво', 'довиђења', 'пријатно'],
  },
  {
    unit: 'Поздрави', title: 'Учтивост', ru: 'Вежливость', en: 'Politeness',
    words: ['хвала', 'молим', 'изволите'],
  },
  {
    unit: 'Поздрави', title: 'Представљање', ru: 'Знакомство', en: 'Introductions',
    words: ['име', 'одакле', 'пријатељ'],
  },
  {
    unit: 'Породица', title: 'Породица', ru: 'Семья', en: 'Family',
    words: ['мајка', 'отац', 'сестра', 'брат', 'деда', 'баба'],
  },
  {
    unit: 'Породица', title: 'Кућа', ru: 'Дом', en: 'Home',
    words: ['кућа', 'соба', 'врата'],
  },
  {
    unit: 'Храна', title: 'Храна', ru: 'Еда', en: 'Food',
    words: ['хлеб', 'вода', 'јабука', 'месо', 'кафа', 'со'],
  },
  {
    unit: 'Храна', title: 'У ресторану', ru: 'В ресторане', en: 'At the restaurant',
    words: ['ручак', 'рачун', 'укусно'],
  },
  {
    unit: 'Бројеви', title: 'Бројеви', ru: 'Числа', en: 'Numbers',
    words: ['један', 'два', 'пет', 'шест', 'десет', 'сто'],
  },
  {
    unit: 'Путовање', title: 'Путовање', ru: 'Путешествие', en: 'Travel',
    words: ['станица', 'аеродром', 'путовање', 'карта'],
  },
  {
    unit: 'Путовање', title: 'На граници', ru: 'На границе', en: 'At the border',
    words: ['хотел', 'пасош', 'виза', 'кофер', 'излаз'],
  },
  {
    unit: 'Људи', title: 'Заменице', ru: 'Местоимения', en: 'Pronouns',
    words: ['ја', 'ти', 'он', 'она', 'ми', 'зовати се', 'мој', 'твој'],
  },
  {
    unit: 'Људи', title: 'Град и посао', ru: 'Город и работа', en: 'City and work',
    words: ['град', 'земља', 'главни', 'живети', 'стан', 'улица', 'зграда', 'радити', 'посао'],
  },
  {
    unit: 'Људи', title: 'Школа и људи', ru: 'Школа и люди', en: 'School and people',
    words: ['српски', 'језик', 'говорити', 'школа', 'ученик', 'студент', 'наставник', 'лекар', 'болница', 'инжењер', 'сусед', 'дом'],
  },
  {
    unit: 'Људи', title: 'Придеви', ru: 'Прилагательные', en: 'Adjectives',
    words: ['широк', 'дуг', 'млад', 'стар', 'висок', 'низак', 'добар', 'лош', 'нов', 'велики', 'мали', 'леп'],
  },
  {
    unit: 'Људи', title: 'Боје', ru: 'Цвета', en: 'Colors',
    words: ['човек', 'дан', 'боја', 'црвен', 'плав', 'зелен', 'тешко'],
  },
  {
    unit: 'Време', title: 'Дани недеље', ru: 'Дни недели', en: 'Days of the week',
    words: ['понедељак', 'уторак', 'среда', 'четвртак', 'петак', 'субота', 'недеља'],
  },
  {
    unit: 'Време', title: 'Месеци', ru: 'Месяцы', en: 'Months',
    words: ['јануар', 'фебруар', 'март', 'април', 'мај', 'јун', 'јул', 'август', 'септембар', 'октобар', 'новембар', 'децембар'],
  },
  {
    unit: 'Време', title: 'Време у дану', ru: 'Время суток', en: 'Times of day',
    words: ['јутро', 'подне', 'попладне', 'сат', 'минута', 'ноћас', 'сада', 'будити се'],
  },
  {
    unit: 'Време', title: 'Прилози за време', ru: 'Наречия времени', en: 'Time adverbs',
    words: ['данас', 'сутра', 'јуче', 'увек', 'понекад', 'рано', 'касно', 'брзо', 'споро'],
  },
  {
    unit: 'Време', title: 'Бројеви', ru: 'Числа', en: 'Numbers',
    words: ['нула', 'три', 'четири', 'седам', 'осам', 'девет'],
  },
  {
    unit: 'Време', title: 'Годишња доба', ru: 'Времена года', en: 'Seasons',
    words: ['зима', 'лето', 'проleће', 'јесен', 'месец', 'годинa', 'рођендан', 'време'],
  },
];

// ── Correct RU/EN example translations for the later units (seed had
//    Russian/nonsense here). EN mirrors fix_example_en.sql; RU is a fresh
//    translation of the Serbian example sentence. Triples: [cyrillic, ru, en].
const EXAMPLE_OVERRIDES = [
  ['име', 'Как тебя зовут?', 'What is your name?'],
  ['зовати се', 'Меня зовут Ана.', 'I am called Ana.'],
  ['мој', 'Это моя квартира.', 'This is my apartment.'],
  ['твој', 'Где твоя книга?', 'Where is your book?'],
  ['ја', 'Я из России.', 'I am from Russia.'],
  ['ти', 'Ты мой друг.', 'You are my friend.'],
  ['он', 'Он высокий.', 'He is tall.'],
  ['она', 'Она молодая.', 'She is young.'],
  ['ми', 'Мы живём в Белграде.', 'We live in Belgrade.'],
  ['српски', 'Сербский — красивый язык.', 'Serbian is a beautiful language.'],
  ['језик', 'Ты учишь сербский язык?', 'Are you learning Serbian?'],
  ['говорити', 'Она хорошо говорит по-сербски.', 'She speaks Serbian well.'],
  ['град', 'Белград — большой город.', 'Belgrade is a big city.'],
  ['земља', 'Сербия — маленькая страна.', 'Serbia is a small country.'],
  ['главни', 'Столица — Белград.', 'The capital is Belgrade.'],
  ['пријатељ', 'Он мой друг.', 'He is my friend.'],
  ['хвала', 'Спасибо за помощь.', 'Thanks for the help.'],
  ['живети', 'Я живу в Белграде.', 'I live in Belgrade.'],
  ['стан', 'Наша квартира маленькая.', 'Our apartment is small.'],
  ['улица', 'Улица длинная.', 'The street is long.'],
  ['зграда', 'В здании пять этажей.', 'The building has five floors.'],
  ['радити', 'Я работаю с утра до вечера.', 'I work from morning to evening.'],
  ['посао', 'У меня хорошая работа.', 'I have a good job.'],
  ['школа', 'Школа рядом с домом.', 'The school is near home.'],
  ['ученик', 'Он ученик восьмого класса.', 'He is an eighth-grade student.'],
  ['студент', 'Она студентка юридического факультета.', 'She is a law student.'],
  ['наставник', 'Наш учитель молодой.', 'Our teacher is young.'],
  ['лекар', 'Врач в больнице.', 'The doctor is in the hospital.'],
  ['болница', 'Больница далеко.', 'The hospital is far away.'],
  ['инжењер', 'Мой отец — инженер.', 'My father is an engineer.'],
  ['сусед', 'Наш сосед — хороший человек.', 'Our neighbor is a good man.'],
  ['дом', 'Наш дом новый.', 'Our home is new.'],
  ['широк', 'Река широкая.', 'The river is wide.'],
  ['дуг', 'У него большой долг.', 'He has a big debt.'],
  ['млад', 'Молодой человек высокий.', 'The young man is tall.'],
  ['стар', 'Старик спит.', 'The old man is sleeping.'],
  ['висок', 'Она высокая.', 'She is tall.'],
  ['низак', 'Он низкий.', 'He is short.'],
  ['добар', 'Это хороший день.', 'This is a good day.'],
  ['лош', 'Это плохой день.', 'This is a bad day.'],
  ['нов', 'Новая машина дорогая.', 'A new car is expensive.'],
  ['велики', 'В большом городе много людей.', 'A big city has many people.'],
  ['мали', 'Маленькая квартира дешёвая.', 'A small apartment is cheap.'],
  ['леп', 'Красивый день для прогулки.', 'A beautiful day for a walk.'],
  ['човек', 'Он хороший человек.', 'He is a good man.'],
  ['дан', 'Этот день — выходной.', 'This day is a day off.'],
  ['боја', 'Синий — мой любимый цвет.', 'Blue is my favorite color.'],
  ['црвен', 'Мне нравится красный цвет.', 'I like the color red.'],
  ['плав', 'Синее небо красивое.', 'The blue sky is beautiful.'],
  ['зелен', 'Зелёные фрукты кислые.', 'Green fruit is sour.'],
  ['тешко', 'Это трудный вопрос.', 'This is a difficult question.'],
  ['понедељак', 'Сегодня понедельник.', 'Today is Monday.'],
  ['уторак', 'Завтра вторник.', 'Tomorrow is Tuesday.'],
  ['среда', 'Среда — мой любимый день.', 'Wednesday is my favorite day.'],
  ['четвртак', 'Четверг — день для покупок.', 'Thursday is a day for shopping.'],
  ['петак', 'Пятница — конец недели.', 'Friday is the end of the week.'],
  ['субота', 'Суббота — выходной день.', 'Saturday is a day off.'],
  ['недеља', 'Воскресенье — выходной день.', 'Sunday is a day off.'],
  ['јутро', 'Утро холодное.', 'The morning is cold.'],
  ['подне', 'Сейчас полдень.', "It's noon now."],
  ['попладне', 'После обеда иду в парк.', "In the afternoon I'm going to the park."],
  ['сат', 'Который час?', 'What time is it?'],
  ['минута', 'Подожди пять минут.', 'Wait five minutes.'],
  ['данас', 'Сегодня красивый день.', 'Today is a beautiful day.'],
  ['сутра', 'Увидимся завтра.', 'See you tomorrow.'],
  ['јуче', 'Вчера была пятница.', 'Yesterday was Friday.'],
  ['месец', 'Этот месяц — март.', 'This month is March.'],
  ['годинa', 'Ей двадцать лет.', 'She is twenty years old.'],
  ['увек', 'Я всегда пью кофе.', 'I always drink coffee.'],
  ['понекад', 'Иногда читаю книгу.', 'Sometimes I read a book.'],
  ['нула', 'На улице ноль градусов.', "It's zero degrees outside."],
  ['два', 'Два раза в день.', 'Twice a day.'],
  ['четири', 'Четыре дня до выходных.', 'Four days until the weekend.'],
  ['пет', 'Пять минут пешком.', 'Five minutes on foot.'],
  ['шест', 'У меня шесть книг.', 'I have six books.'],
  ['седам', 'Семь утра — рано.', 'Seven in the morning is early.'],
  ['осам', 'Иду на работу в восемь утра.', 'I go to work at eight in the morning.'],
  ['девет', 'В девять иду в кино.', "At nine I'm going to the cinema."],
  ['десет', 'Десять пальцев на руках.', 'Ten fingers on the hands.'],
  ['будити се', 'Я просыпаюсь в семь.', 'I wake up at seven.'],
  ['рано', 'Я встаю рано.', 'I get up early.'],
  ['касно', 'Она пришла поздно.', 'She came late.'],
  ['брзо', 'Он говорит быстро.', 'He speaks fast.'],
  ['споро', 'Поезд идёт медленно.', 'The train is going slowly.'],
  ['ноћас', 'Сегодня ночью холодно.', "It's cold tonight."],
  ['време', 'Погода хорошая.', 'The weather is beautiful.'],
  ['сада', 'Сейчас я свободен.', "I'm free now."],
  ['јануар', 'Январь холодный.', 'January is cold.'],
  ['фебруар', 'В феврале холодно.', "It's cold in February."],
  ['март', 'Март — первый месяц весны.', 'March is the first month of spring.'],
  ['април', 'Апрель — красивый месяц.', 'April is a beautiful month.'],
  ['мај', 'В мае тепло.', "It's warm in May."],
  ['јун', 'В июне жарко.', "It's hot in June."],
  ['јул', 'Июль — самый жаркий месяц.', 'July is the hottest month.'],
  ['август', 'Август — месяц отдыха.', 'August is the month of rest.'],
  ['септембар', 'Школа начинается в сентябре.', 'School starts in September.'],
  ['октобар', 'В октябре холодно.', "It's cold in October."],
  ['новембар', 'Ноябрь холодный.', 'November is cold.'],
  ['децембар', 'Мой день рождения в декабре.', 'My birthday is in December.'],
  ['рођендан', 'Мой день рождения в мае.', 'My birthday is in May.'],
  ['зима', 'Зима холодная.', 'Winter is cold.'],
  ['лето', 'Лето тёплое.', 'Summer is warm.'],
  ['проleће', 'Весна красивая.', 'Spring is beautiful.'],
  ['јесен', 'Осень холодная.', 'Autumn is cold.'],
  // RU-only fixes — seed EN was already correct, RU was wrong/mismatched
  ['соба', 'Моя комната чистая.', 'My room is clean.'],
  ['хлеб', 'Я купил свежий хлеб.', 'I bought fresh bread.'],
  ['вода', 'Дай мне стакан воды.', 'Give me a glass of water.'],
  ['јабука', 'Я ем яблоко каждый день.', 'I eat an apple every day.'],
  ['месо', 'Я люблю жареное мясо.', 'I like roasted meat.'],
  ['со', 'Добавь немного соли.', 'Add a bit of salt.'],
  ['један', 'У меня один брат.', 'I have one brother.'],
  ['сто', 'Сто динаров.', 'A hundred dinars.'],
  ['станица', 'Станция рядом.', 'The station is close.'],
  ['аеродром', 'Мы едем в аэропорт.', "We're going to the airport."],
  ['путовање', 'Счастливого пути!', 'Have a nice trip!'],
  ['хотел', 'Я забронировал отель.', 'I booked a hotel.'],
  ['пасош', 'Возьмите паспорт.', 'Bring your passport.'],
  ['кофер', 'Я собрал чемодан.', 'I packed my suitcase.'],
  ['излаз', 'Выход слева.', 'The exit is on the left.'],
  ['три', 'У меня три дня выходных.', 'I have three days off.'],
];
const EX_RU = Object.fromEntries(EXAMPLE_OVERRIDES.map(([k, ru]) => [k, ru]));
const EX_EN = Object.fromEntries(EXAMPLE_OVERRIDES.map(([k, , en]) => [k, en]));

// Serbian sentence fixes — seed had latin letters / a wrong word inside cyrillic
const EX_SENTENCE = {
  лекар: 'Лекар је у болници.',
  март: 'Март је први пролећни месец.',
  девет: 'У девет идем у кино.',
  минута: 'Чекајте пет минута.',
  увек: 'Ја увек пијем кафу.',
  време: 'Време је лепо.',
  'проleће': 'Пролеће је лепо.',
  попладне: 'У поподне идем у парк.',
};

// Seed words whose cyrillic differs from the words dataset → emit the words-table form
// so the uploader can link wordId (поподне is the standard Serbian spelling).
const CY_KEY_ALIAS = { попладне: 'поподне' };

// ── Parse seed.ts from stdin ──────────────────────────────────────────────
const src = fs.readFileSync(0, 'utf8');
const FIELD = (name) => new RegExp(`${name}:\\s*(?:"([^"]*)"|'([^']*)')`);

// keyed by unit cyrillic → [word records]
const units = new Map();
let currentUnit = null;
for (const line of src.split('\n')) {
  const u = line.match(/^    titleCyrillic: '([^']+)'/);
  if (u) {
    currentUnit = u[1];
    units.set(currentUnit, []);
    continue;
  }
  if (!currentUnit || !line.trim().startsWith('{ cyrillic:')) continue;
  const get = (name) => {
    const m = line.match(FIELD(name));
    return m ? (m[1] ?? m[2]) : null;
  };
  const cy = get('cyrillic');
  if (!cy) continue;
  units.get(currentUnit).push({
    cy,
    la: get('latin'),
    ru: get('translationRu'),
    en: get('translationEn'),
    exCyr: get('exampleCyrillic'),
    exRu: get('exampleTranslationRu'),
    exEn: get('exampleTranslationEn'),
  });
}
const byCyr = new Map();
for (const list of units.values()) for (const w of list) if (!byCyr.has(w.cy)) byCyr.set(w.cy, w);

// ── Apply example overrides + transliterate sentences ─────────────────────
for (const [cy, w] of byCyr) {
  if (EX_SENTENCE[cy]) w.exCyr = EX_SENTENCE[cy];
  if (EX_RU[cy] && w.exCyr) w.exRu = EX_RU[cy];
  if (EX_EN[cy] && w.exCyr) w.exEn = EX_EN[cy];
}

// ── Emit CSVs ─────────────────────────────────────────────────────────────
const csv = (rows) => rows.map((r) => r.map((v) => String(v ?? '').replaceAll(',', ' / ').replaceAll('"', '""')).join(',')).join('\n');

const unitRows = UNITS.map((u) => [u.cy, u.la, u.ru, u.en]);
fs.writeFileSync('units.csv', `titleCyrillic,titleLatin,titleTranslationRu,titleTranslationEn\n${csv(unitRows)}\n`);

const lessonRows = [];
const exerciseRows = [];
const missing = new Set();
const seenWords = new Set();
for (const l of LESSONS) {
  lessonRows.push([l.unit, l.title, l.title, l.ru, l.en, 10]);
  for (const cy of l.words) {
    if (seenWords.has(cy)) {
      console.error(`WARN: duplicate word "${cy}" in lesson plan (${l.title})`);
    }
    seenWords.add(cy);
    const w = byCyr.get(cy);
    if (!w) {
      missing.add(cy);
      console.error(`WARN: word "${cy}" (${l.unit}/${l.title}) not found in seed`);
      continue;
    }
    const emitCy = CY_KEY_ALIAS[cy] ?? w.cy;
    const exLat = w.exCyr ? toLatin(w.exCyr) : '';
    exerciseRows.push([
      'translation_choice', l.unit, l.title, emitCy, w.la, w.ru, w.en, '', '',
      '', '', '', '',
    ]);
    exerciseRows.push([
      'fill_word', l.unit, l.title, emitCy, w.la, w.ru, w.en, '', '',
      w.exCyr, exLat, w.exRu, w.exEn,
    ]);
  }
}
fs.writeFileSync('lessons.csv', `unitTitle,title,titleLatin,titleTranslationRu,titleTranslationEn,xpReward\n${csv(lessonRows)}\n`);
fs.writeFileSync(
  'exercises.csv',
  `type,unitTitle,lessonTitle,cyrillic,latin,translationRu,translationEn,audioUrl,imageUrl,sentenceCyrillic,sentenceLatin,sentenceTranslationRu,sentenceTranslationEn\n${csv(exerciseRows)}\n`,
);

const covered = [...seenWords].length;
const allInPlan = new Set(LESSONS.flatMap((l) => l.words));
const uncovered = [];
for (const [unitName, list] of units) {
  if (unitName === 'Моя породица') continue;
  for (const w of list) {
    if (!allInPlan.has(w.cy)) uncovered.push(`${unitName}: ${w.cy}`);
  }
}
console.log(`units: ${unitRows.length}, lessons: ${lessonRows.length}, exercises: ${exerciseRows.length}`);
console.log(`words covered: ${covered}, missing from seed: ${[...missing].length}`);
if (uncovered.length) console.log(`uncovered words:\n  ${uncovered.join('\n  ')}`);
else console.log('uncovered words: none');
