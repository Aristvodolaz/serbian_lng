#!/usr/bin/env node
// One-off generator for the A1 theory package: merges the 11 existing topics
// from src/database/theory-a1.json with the 14 newly authored topics below
// and emits theory.csv at the repo root for scripts/load-theory.mjs.
// New topics are authored in Cyrillic; latin is derived with the same
// transliteration as build-content-csvs.js. Run: node backend/scripts/build-theory-csv.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const EXISTING_PATH = path.join(__dirname, '..', 'src', 'database', 'theory-a1.json');
const OUT_PATH = path.join(ROOT, 'theory.csv');

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

// Fill latin fields wherever cyrillic is set but latin is not. Existing JSON
// topics already carry latin, so they pass through untouched.
function deriveLatin(v) {
  if (Array.isArray(v)) return v.map(deriveLatin);
  if (v && typeof v === 'object') {
    const out = {};
    for (const [k, x] of Object.entries(v)) out[k] = deriveLatin(x);
    for (const [cyr, lat] of [
      ['textCyrillic', 'textLatin'],
      ['captionCyrillic', 'captionLatin'],
      ['cyrillic', 'latin'],
    ]) {
      if (out[cyr] != null && !out[lat]) out[lat] = toLatin(out[cyr]);
    }
    return out;
  }
  return v;
}

// Block shortcuts for authoring the new topics (Cyrillic + RU/EN translations).
const h = (textCyrillic, translationRu, translationEn) => ({ type: 'heading', textCyrillic, translationRu, translationEn });
const p = (textCyrillic, translationRu, translationEn) => ({ type: 'paragraph', textCyrillic, translationRu, translationEn });
const t = (captionCyrillic, captionRu, captionEn, headers, headersRu, headersEn, rows) => ({
  type: 'table',
  captionCyrillic,
  captionTranslationRu: captionRu,
  captionTranslationEn: captionEn,
  headers: headers.map((cyrillic) => ({ cyrillic })),
  headersTranslationRu: headersRu,
  headersTranslationEn: headersEn,
  rows: rows.map((r) => r.map((cyrillic) => ({ cyrillic }))),
});
const e = (cyrillic, translationRu, translationEn) => ({ type: 'example', cyrillic, translationRu, translationEn });

const NEW_TOPICS = [
  // ── Основе ────────────────────────────────────────────────────────────
  {
    sectionTitle: 'Основе',
    titleCyrillic: 'Вокатив',
    titleTranslationRu: 'Звательный падеж',
    titleTranslationEn: 'The vocative',
    payload: {
      version: 1,
      blocks: [
        h('Обраћање: мамо, професоре!', 'Обращение: «мамо», «професоре»', 'Addressing people: “mamo”, “profesore”'),
        p('Вокатив је облик именице за обраћање некоме: кад некога зовемо или му се обраћамо, име добија другачији облик. Ово је једини падеж без предлога и без питања.', 'Вокатив — форма существительного для обращения: когда мы зовём или обращаемся к кому-то, слово получает особую форму. Это единственный падеж без предлога и без вопроса.', 'The vocative is the noun form used for addressing somebody: when we call or address a person, the word takes a special form. It is the only case without a preposition and without a question.'),
        p('Облици су углавном редовни: именице женског рода на -а добијају -о, именице на -ица добијају -ице, а мушки род најчешће -е. Средњи род се не мења, као ни мушка имена на -о.', 'Формы в основном регулярные: существительные женского рода на -а получают -о, слова на -ица — -ице, мужской род чаще всего -е. Средний род не меняется, как и мужские имена на -о.', 'The forms are mostly regular: feminine nouns in -а take -о, nouns in -ица take -ице, masculine nouns most often -е. Neuter nouns do not change, nor do masculine names in -o.'),
        t('Образовање вокатива', 'Образование вокатива', 'Forming the vocative', ['Номинатив', 'Вокатив', 'Род'], ['Именительный', 'Звательный', 'Род'], ['Nominative', 'Vocative', 'Gender'], [
          ['мама', 'мамо!', 'женски'],
          ['учитељица', 'учитељице!', 'женски: -ица → -ице'],
          ['професор', 'професоре!', 'мушки'],
          ['Милош', 'Милоше!', 'мушки'],
          ['Марко', 'Марко!', 'мушки, без измене'],
          ['дете', 'дете!', 'средњи, без измене'],
        ]),
        e('Мамо, где си?', 'Мама, где ты?', 'Mom, where are you?'),
        e('Професоре, добро јутро!', 'Профессор, доброе утро!', 'Professor, good morning!'),
      ],
    },
  },
  {
    sectionTitle: 'Основе',
    titleCyrillic: 'Питање и одрицање',
    titleTranslationRu: 'Вопрос и отрицание',
    titleTranslationEn: 'Questions and negation',
    payload: {
      version: 1,
      blocks: [
        h('Да ли? Немам.', 'Частица «да ли»; отрицание «немам»', 'The question particle “da li”; the negation “nemam”'),
        p('Питање се најчешће гради речицом да ли испред глагола: Да ли говориш српски? Питање може бити и само интонацијом: Говориш српски?', 'Вопрос чаще всего строится с частицей да ли перед глаголом: Да ли говориш српски? Вопрос возможен и одной интонацией: Говориш српски?', 'A question is most often built with the particle “da li” before the verb: Da li govorish srpski? A question can also be made by intonation alone: Govorish srpski?'),
        p('Питање речи стоје на почетку реченице. Одрицање је речица не испред глагола: не разумем, не знам. Глагол имати има своје одричне облике: немам, немаш, нема.', 'Вопросительные слова стоят в начале предложения. Отрицание — частица не перед глаголом: не разумем, не знам. Глагол имати имеет свои отрицательные формы: немам, немаш, нема.', 'Question words stand at the beginning of the sentence. Negation is the particle “ne” before the verb: ne razumem, ne znam. The verb imati has its own negative forms: nemam, nemaš, nema.'),
        t('Питање речи', 'Вопросительные слова', 'Question words', ['Реч', 'Пример', 'Значение'], ['Слово', 'Пример', 'Значение'], ['Word', 'Example', 'Meaning'], [
          ['шта', 'Шта је ово?', 'что'],
          ['ко', 'Ко је то?', 'кто'],
          ['где', 'Где живиш?', 'где'],
          ['када', 'Када учиш?', 'когда'],
          ['како', 'Како се каже?', 'как'],
          ['колико', 'Колико кошта?', 'сколько'],
        ]),
        e('Да ли говориш српски?', 'Ты говоришь по-сербски?', 'Do you speak Serbian?'),
        e('Не разумем, понови молим те.', 'Я не понимаю, повтори, пожалуйста.', "I don't understand, please repeat."),
      ],
    },
  },
  {
    sectionTitle: 'Основе',
    titleCyrillic: 'Личне заменице — падежи',
    titleTranslationRu: 'Личные местоимения — падежи',
    titleTranslationEn: 'Personal pronouns — cases',
    payload: {
      version: 1,
      blocks: [
        h('Мене, мени, ме', 'Мене, мени, ме: формы местоимений', 'Mene, meni, me: pronoun forms'),
        p('Личне заменице се мењају по падежима као именице. Постоје дуге форме — за наглашавање и после предлога (за мене, са тобом) — и кратке, које стоје одмах после прве речи у реченици, обично уз глагол.', 'Личные местоимения изменяются по падежам, как существительные. Есть длинные формы — для выделения и после предлогов (за мене, са тобом) — и краткие, которые стоят сразу после первого слова в предложении, обычно при глаголе.', 'Personal pronouns change by case like nouns. There are long forms — for emphasis and after prepositions (za mene, sa tobom) — and short forms, which stand right after the first word of the sentence, usually with the verb.'),
        p('Кратке облике ћеш најчешће чувати у речима као Видим те. и Реци ми. Оне су ненаглашене, па иду уз глагол у истој фрази.', 'Краткие формы чаще всего встречаются в фразах «Видим те» и «Реци ми». Они безударные и примыкают к глаголу той же фразы.', 'You will most often hear the short forms in phrases like “Vidim te” and “Reći mi”. They are unstressed and attach to the verb of the same phrase.'),
        t('Личне заменице по падежима', 'Личные местоимения по падежам', 'Personal pronouns by case', ['Номинатив', 'Дуга: акузатив', 'Кратка: акузатив', 'Датив'], ['Именительный', 'Длинная: винительный', 'Краткая: винительный', 'Дательный'], ['Nominative', 'Long: accusative', 'Short: accusative', 'Dative'], [
          ['ја', 'мене', 'ме', 'ми'],
          ['ти', 'тебе', 'те', 'ти'],
          ['он', 'њега', 'га', 'му'],
          ['она', 'њу', 'је', 'јој'],
          ['ми', 'нас', 'нас', 'нама'],
          ['ви', 'вас', 'вас', 'вама'],
          ['они / оне', 'њих', 'их', 'њима'],
        ]),
        e('Видим те!', 'Вижу тебя!', 'I see you!'),
        e('Реци ми, молим те.', 'Скажи мне, пожалуйста.', 'Tell me, please.'),
      ],
    },
  },

  // ── Свакодневица ──────────────────────────────────────────────────────
  {
    sectionTitle: 'Свакодневица',
    titleCyrillic: 'Кратка и дуга форма придева',
    titleTranslationRu: 'Краткая и длинная форма прилагательных',
    titleTranslationEn: 'Short and long adjective forms',
    payload: {
      version: 1,
      blocks: [
        h('нови град — град је нов', 'novi grad («новый город») — grad je nov («город новый»)', 'novi grad — grad je nov (“a new city” — “the city is new”)'),
        p('Приде испред именице стоји у дугој (одређеној) форми: нови град. После глагола бити користимо кратку форму: град је нов.', 'Прилагательное перед существительным стоит в длинной (определённой) форме: novi grad. После глагола бити используется краткая форма: grad je nov.', 'An adjective before a noun takes the long (definite) form: novi grad. After the verb biti we use the short form: grad je nov.'),
        p('Разлика је видљива само у мушком роду једнине: нов / нови. У женском и средњем роду облик је исти: нова кућа — кућа је нова; ново село — село је ново.', 'Различие видно только в мужском роде единственного числа: nov / novi. В женском и среднем роде форма одна: nova kuća — kuća je nova; novo selo — selo je novo.', 'The difference is visible only in the masculine singular: nov / novi. In the feminine and neuter the form is the same: nova kuća — kuća je nova; novo selo — selo je novo.'),
        t('Дуга и кратка форма', 'Длинная и краткая форма', 'Long and short forms', ['Пред именом (дуга форма)', 'После глагола бити (кратка форма)'], ['Перед существительным (длинная форма)', 'После глагола бити (краткая форма)'], ['Before the noun (long form)', 'After the verb biti (short form)'], [
          ['нови град', 'град је нов'],
          ['нова школа', 'школа је нова'],
          ['ново село', 'село је ново'],
        ]),
        e('Мој стан је нов.', 'Моя квартира новая.', 'My apartment is new.'),
        e('Живим у новој кући.', 'Я живу в новом доме.', 'I live in a new house.'),
      ],
    },
  },
  {
    sectionTitle: 'Свакодневица',
    titleCyrillic: 'Присвојне речи: мој, твој, наш',
    titleTranslationRu: 'Притяжательные слова: мой, твой, наш',
    titleTranslationEn: 'Possessive words: my, your, our',
    payload: {
      version: 1,
      blocks: [
        h('Моја сестра, његов брат', 'Моя сестра, его брат', 'My sister, his brother'),
        p('Присвојне речи се слажу са именицом по роду и броју: мој брат, моја сестра, моје дете, моји пријатељи. За треће лице постоје присвојни прилози: његов, њен, њихов.', 'Притяжательные слова согласуются с существительным по роду и числу: мој брат, моја сестра, моје дете, моји пријатељи. Для третьего лица есть притяжательные слова његов, њен, њихов.', 'Possessive words agree with the noun in gender and number: moj brat, moja sestra, moje dete, moji prijatelji. For the third person there are the possessives његов, њен, њихов.'),
        t('Слагање по роду', 'Согласование по роду', 'Agreement in gender', ['Именица', 'мој', 'његов / њен'], ['Существительное', 'мој', 'его / её'], ['Noun', 'moj', 'his / her'], [
          ['брат (мушки)', 'мој брат', 'његов брат'],
          ['сестра (женски)', 'моја сестра', 'њена сестра'],
          ['дете (средњи)', 'моје дете', 'његово дете'],
        ]),
        e('Моја породица је мала.', 'Моя семья маленькая.', 'My family is small.'),
        e('Где је твој пасош?', 'Где твой паспорт?', "Where is your passport?"),
      ],
    },
  },
  {
    sectionTitle: 'Свакодневица',
    titleCyrillic: 'Бројеви',
    titleTranslationRu: 'Числительные',
    titleTranslationEn: 'Numbers',
    payload: {
      version: 1,
      blocks: [
        h('Од нуле до сто', 'От нуля до ста', 'From zero to one hundred'),
        p('Бројеви се не мењају. После бројева 2, 3, 4 именица стоји у генитиву једнине (два брата), а после 5 и више — у генитиву множине (пет дана). Више о томе у теми Генитив.', 'Числительные не изменяются. После чисел 2, 3, 4 существительное стоит в родительном падеже единственного числа (dva brata), а после 5 и больше — в родительном множественного числа (pet dana). Подробности в теме «Генитив».', 'Numbers do not change. After the numbers 2, 3, 4 the noun stands in the genitive singular (dva brata), and after 5 and more — in the genitive plural (pet dana). See the topic “The genitive”.'),
        t('Главни бројеви', 'Количественные числительные', 'Cardinal numbers', ['Бројка', 'Словима'], ['Цифра', 'Словами'], ['Numeral', 'In words'], [
          ['0', 'нула'],
          ['1', 'један'],
          ['2', 'два'],
          ['3', 'три'],
          ['4', 'четири'],
          ['5', 'пет'],
          ['6', 'шест'],
          ['7', 'седам'],
          ['8', 'осам'],
          ['9', 'девет'],
          ['10', 'десет'],
          ['20', 'двадесет'],
          ['100', 'сто'],
        ]),
        e('Имам два брата и једну сестру.', 'У меня два брата и одна сестра.', 'I have two brothers and one sister.'),
        e('Ово кошта двадесет динара.', 'Это стоит двадцать динаров.', 'This costs twenty dinars.'),
      ],
    },
  },
  {
    sectionTitle: 'Свакодневица',
    titleCyrillic: 'Глаголи могу, морам, треба',
    titleTranslationRu: 'Глаголы могу, должен, надо',
    titleTranslationEn: 'Verbs mogu, moram, treba',
    payload: {
      version: 1,
      blocks: [
        h('Могу говорити, морам учити', '«Могу говорить», «должен учиться»', '“I can speak”, “I have to study”'),
        p('Ови глаголи стоје испред инфинитива оног глагола који описује радњу: могу говорити, морам учити. Глагол треба је неличан: користи се без особе, у облику треба.', 'Эти глаголы стоят перед инфинитивом глагола, описывающего действие: могу говорити, морам учити. Глагол treba безличный: используется без лица, в форме treba.', 'These verbs stand before the infinitive of the action verb: mogu govoriti, moram učiti. The verb treba is impersonal: it is used without a person, in the form treba.'),
        t('Облици', 'Формы', 'Forms', ['Глагол', 'Одрицање'], ['Глагол', 'Отрицание'], ['Verb', 'Negation'], [
          ['могу, можеш, може, можемо, можете, могу', 'не могу'],
          ['морам, мораш, мора, морамо, морате, морају', 'не морам'],
          ['треба (безличан)', 'не треба'],
        ]),
        e('Морам учити данас.', 'Надо учиться сегодня.', 'I have to study today.'),
        e('Можеш ми помоћи?', 'Можешь мне помочь?', 'Can you help me?'),
      ],
    },
  },
  {
    sectionTitle: 'Свакодневица',
    titleCyrillic: 'Повратни глаголи са „се“',
    titleTranslationRu: 'Возвратные глаголы с «се»',
    titleTranslationEn: 'Reflexive verbs with „se“',
    payload: {
      version: 1,
      blocks: [
        h('Зовем се, будим се', '«Зовем се», «будим се» (меня зовут, я просыпаюсь)', '“Zovem se, budim se” (my name is, I wake up)'),
        p('Многи српски глаголи имају везу са речицом се: зовем се, будим се. Кратка речица се стоји одмах после прве речи у реченици, обично после глагола.', 'Многие сербские глаголы связаны с частицей се: zovem se, budim se. Краткая частица се стоит сразу после первого слова в предложении, обычно после глагола.', 'Many Serbian verbs are linked with the particle “se”: zovem se, budim se. The short particle “se” stands right after the first word of the sentence, usually after the verb.'),
        t('Повратни глаголи', 'Возвратные глаголы', 'Reflexive verbs', ['Инфинитив', '1. лице', 'Значение'], ['Инфинитив', '1-е лицо', 'Значение'], ['Infinitive', '1st person', 'Meaning'], [
          ['зовати се', 'зовем се', 'зваться'],
          ['будити се', 'будим се', 'просыпаться'],
          ['дизати се', 'дижем се', 'подниматься (вставать)'],
        ]),
        e('Како се зовеш?', 'Как тебя зовут?', "What's your name?"),
        e('Сутра се будим рано.', 'Завтра я встаю рано.', 'Tomorrow I wake up early.'),
      ],
    },
  },
  {
    sectionTitle: 'Свакодневица',
    titleCyrillic: 'Императив',
    titleTranslationRu: 'Повелительное наклонение',
    titleTranslationEn: 'The imperative',
    payload: {
      version: 1,
      blocks: [
        h('Дај! Чекај! Узми!', 'Дай! Жди! Возьми!', 'Give! Wait! Take!'),
        p('Императив служи за наредбу или молбу. Користе се друго лице једнине (говори!) и друго лице множине (говорите!). Чести глаголи узети, дати и рећи имају неправилне облике: узми, дај, реци.', 'Императив выражает приказ или просьбу. Используются второе лицо единственного числа (говори!) и второе лицо множественного (говорите!). Частые глаголы узети, дати и рећи имеют неправильные формы: узми, дај, реци.', 'The imperative serves for a command or request. The 2nd person singular (govori!) and the 2nd person plural (govorite!) are used. The common verbs uzeti, dati and reći have irregular forms: uzmi, daj, reci.'),
        t('Образовање императива', 'Образование императива', 'Forming the imperative', ['Инфинитив', 'ти', 'ви'], ['Инфинитив', 'ты', 'вы'], ['Infinitive', 'ti (you sing.)', 'vi (you pl.)'], [
          ['говорити', 'говори!', 'говорите!'],
          ['чекати', 'чекај!', 'чекајте!'],
          ['писати', 'пиши!', 'пишите!'],
          ['узети', 'узми!', 'узмите!'],
          ['рећи', 'реци!', 'реците!'],
        ]),
        e('Чекај ме на станици.', 'Жди меня на станции.', 'Wait for me at the station.'),
        e('Реци то поново, молим те.', 'Скажи это ещё раз, пожалуйста.', 'Please say that again.'),
      ],
    },
  },

  // ── Људи и путовање ───────────────────────────────────────────────────
  {
    sectionTitle: 'Људи и путовање',
    titleCyrillic: 'Датив',
    titleTranslationRu: 'Дательный падеж',
    titleTranslationEn: 'The dative',
    payload: {
      version: 1,
      blocks: [
        h('Коме? — пријатељу', 'Кому? — пријатељу («другу»)', 'To whom? — prijatelju (“to a friend”)'),
        p('Датив одговара на питање коме? и означава особу којој нешто дајемо или кажемо. Уз именице чешће се користе кратке заменице: реци ми, покажи му, понеси јој.', 'Дательный падеж отвечает на вопрос коме? и обозначает лицо, которому мы что-то даём или говорим. С существительными чаще используются краткие местоимения: реци ми, покажи му, понеси јој.', 'The dative answers the question “to whom?” and marks the person we give or say something to. With nouns, the short pronouns are more common: reci mi, pokaži mu, ponesi joj.'),
        t('Датив једнине', 'Дательный падеж единственного числа', 'The dative singular', ['Именица', 'Датив'], ['Существительное', 'Дательный'], ['Noun', 'Dative'], [
          ['брат', 'брату'],
          ['пријатељ', 'пријатељу'],
          ['жена', 'жени'],
          ['дете', 'детету'],
        ]),
        e('Реци ми, молим те.', 'Скажи мне, пожалуйста.', 'Tell me, please.'),
        e('Донеси брату воду.', 'Принеси брату воды.', 'Bring your brother some water.'),
      ],
    },
  },
  {
    sectionTitle: 'Људи и путовање',
    titleCyrillic: 'Генитив',
    titleTranslationRu: 'Родительный падеж',
    titleTranslationEn: 'The genitive',
    payload: {
      version: 1,
      blocks: [
        h('Без воде; два сата', 'Без воды; два часа', 'Without water; two hours'),
        p('Генитив стоји после одричних израза нема и немам (нема воде), после предлога без, из, од, код, до и после бројева 2 и више. После 2, 3, 4 именица је у генитиву једнине, после 5 и више — у генитиву множине.', 'Родительный падеж стоит после отрицательных выражений нема и немам (нема воде), после предлогов bez, iz, od, kod, do и после чисел 2 и больше. После 2, 3, 4 существительное в родительном единственного числа, после 5 и больше — в родительном множественного.', 'The genitive follows the negative expressions nema and nemam (nema vode), the prepositions bez, iz, od, kod, do, and the numbers 2 and up. After 2, 3, 4 the noun is in the genitive singular, after 5 and more — in the genitive plural.'),
        t('Генитив једнине', 'Родительный падеж единственного числа', 'The genitive singular', ['Именица', 'Генитив', 'Пример'], ['Существительное', 'Родительный', 'Пример'], ['Noun', 'Genitive', 'Example'], [
          ['вода', 'воде', 'шоља воде'],
          ['кафа', 'кафе', 'шоља кафе'],
          ['карта', 'карте', 'без карте'],
          ['град', 'града', 'из града'],
        ]),
        e('Шоља воде, молим.', 'Чашку воды, пожалуйста.', 'A glass of water, please.'),
        e('Пет дана у Србији.', 'Пять дней в Сербии.', 'Five days in Serbia.'),
      ],
    },
  },
  {
    sectionTitle: 'Људи и путовање',
    titleCyrillic: 'Предлози и падежи',
    titleTranslationRu: 'Предлоги и падежи',
    titleTranslationEn: 'Prepositions and cases',
    payload: {
      version: 1,
      blocks: [
        h('у граду — у град', 'у граду — у град («в городе» — «в город»)', 'u gradu — u grad (“in the city” — “to the city”)'),
        p('Исти предлог може захтевати различите падеже. Најважнија разлика: у и на са локативом значе место (где?), а са акузативом кретање (куда?).', 'Один и тот же предлог может требовать разных падежей. Самое важное различие: у и на с локативом означают место (где?), а с винительным падежом — движение (куда?).', 'The same preposition can require different cases. The most important difference: u and na with the locative mean location (where?), and with the accusative — movement (where to?).'),
        t('Предлози и падежи', 'Предлоги и падежи', 'Prepositions and cases', ['Предлог', 'Падеж', 'Пример'], ['Предлог', 'Падеж', 'Пример'], ['Preposition', 'Case', 'Example'], [
          ['у, на', 'локатив (где?)', 'живим у Београду, књига на столу'],
          ['у, на', 'акузатив (куда?)', 'идем у Београд, идем на посао'],
          ['за', 'акузатив', 'карта за Ниш'],
          ['са', 'инструментал', 'са пријатељем'],
          ['без, из, од, код, до', 'генитив', 'без воде, из града'],
        ]),
        e('Идем у Београд сутра.', 'Завтра еду в Белград.', "I'm going to Belgrade tomorrow."),
        e('Долазим са пријатељем.', 'Приезжаю с другом.', "I'm coming with a friend."),
      ],
    },
  },
  {
    sectionTitle: 'Људи и путовање',
    titleCyrillic: 'Глагол ићи',
    titleTranslationRu: 'Глагол «идти»',
    titleTranslationEn: "The verb 'ići'",
    payload: {
      version: 1,
      blocks: [
        h('Идем у град', 'Я иду в город', "I'm going to the city"),
        p('Глагол ићи је неправилан и веома чест. Значи кретање негде, па уз њега иде у или на са акузативом: идем у град, идем на путовање. За место стоји локатив: живим у граду.', 'Глагол ићи неправильный и очень частый. Он означает движение куда-то, поэтому с ним употребляются у или на с винительным падежом: идем у град, идем на путовање. Для места используется локатив: живим у граду.', 'The verb ići is irregular and very common. It means movement somewhere, so it takes u or na with the accusative: idem u grad, idem na putovanje. For location the locative is used: živim u gradu.'),
        t('Презент глагола ићи', 'Настоящее время глагола ићи', 'Present tense of “ići”', ['Особа', 'Форма'], ['Лицо', 'Форма'], ['Person', 'Form'], [
          ['ја', 'идем'],
          ['ти', 'идеш'],
          ['он / она', 'иде'],
          ['ми', 'идемо'],
          ['ви', 'идете'],
          ['они', 'иду'],
        ]),
        e('Идем у град.', 'Я иду в город.', "I'm going to the city."),
        e('Они иду на аеродром.', 'Они едут в аэропорт.', "They're going to the airport."),
      ],
    },
  },
  {
    sectionTitle: 'Људи и путовање',
    titleCyrillic: 'Будуће време',
    titleTranslationRu: 'Будущее время',
    titleTranslationEn: 'The future tense',
    payload: {
      version: 1,
      blocks: [
        h('Радићу сутра', 'Буду работать завтра', 'I will work tomorrow'),
        p('Будуће време се гради са речицом ћу и инфинитивом: ја ћу радити, ти ћеш радити. Постоје и спојени облици: радићу, радићеш, радиће. Одрицање има свој облик: нећу.', 'Будущее время строится из частицы ћу и инфинитива: ја ћу радити, ти ћеш радити. Есть и слитные формы: radiću, radićeš, radiće. Отрицание имеет свою форму: нећу.', 'The future is built with the particle “ću” and the infinitive: ja ću raditi, ti ćeš raditi. There are also fused forms: radiću, radićeš, radiće. Negation has its own form: neću.'),
        t('Будуће време', 'Будущее время', 'The future tense', ['Особа', 'Речица + инфинитив', 'Спојени облик'], ['Лицо', 'Частица + инфинитив', 'Слитная форма'], ['Person', 'Particle + infinitive', 'Fused form'], [
          ['ја', 'ја ћу радити', 'радићу'],
          ['ти', 'ти ћеш радити', 'радићеш'],
          ['он / она', 'он ће радити', 'радиће'],
          ['ми', 'ми ћемо радити', 'радићемо'],
          ['ви', 'ви ћете радити', 'радићете'],
          ['они', 'они ће радити', 'радиће'],
        ]),
        e('Сутра ћемо ићи у Нови Сад.', 'Завтра поедем в Нови-Сад.', "Tomorrow we'll go to Novi Sad."),
        e('Нећу каснити.', 'Не опоздаю.', "I won't be late."),
      ],
    },
  },
];

const q = (tc) => tc;
// Merge: existing topics first, then the new ones, preserving file order.
const existing = JSON.parse(fs.readFileSync(EXISTING_PATH, 'utf8'));
const all = [...existing, ...NEW_TOPICS.map((n) => ({ ...n, payload: deriveLatin(n.payload), titleLatin: toLatin(n.titleCyrillic) }))];

// Validation: payload shape, block types, table widths, example fields.
const allowed = new Set(['heading', 'paragraph', 'table', 'example']);
let errors = 0;
for (const topic of all) {
  const { payload, titleCyrillic, sectionTitle } = topic;
  if (payload?.version !== 1) throw new Error(`${titleCyrillic}: payload.version != 1`);
  for (const b of payload.blocks ?? []) {
    if (!allowed.has(b.type)) {
      console.error(`${titleCyrillic}: bad block type ${b.type}`);
      errors++;
      continue;
    }
    if ((b.type === 'heading' || b.type === 'paragraph') && (!b.translationRu || !b.translationEn)) {
      console.error(`${titleCyrillic}: ${b.type} missing translationRu/En`);
      errors++;
    }
    if (b.type === 'table') {
      if (b.rows.some((r) => r.length !== b.headers.length)) {
        console.error(`${titleCyrillic}: table row width mismatch`);
        errors++;
      }
      if (!b.captionTranslationRu || !b.captionTranslationEn) {
        console.error(`${titleCyrillic}: table missing captionTranslationRu/En`);
        errors++;
      }
      if (
        !Array.isArray(b.headersTranslationRu) || b.headersTranslationRu.length !== b.headers.length ||
        !Array.isArray(b.headersTranslationEn) || b.headersTranslationEn.length !== b.headers.length
      ) {
        console.error(`${titleCyrillic}: table headersTranslationRu/En length mismatch`);
        errors++;
      }
    }
    if (b.type === 'example' && (!b.translationRu || !b.translationEn)) {
      console.error(`${titleCyrillic}: example missing translation`);
      errors++;
    }
  }
  if (!sectionTitle || !titleCyrillic || !topic.titleLatin) throw new Error(`${titleCyrillic}: missing titles`);
}
if (errors) throw new Error(`${errors} payload problems, see log above`);

// Emit CSV: payload as minified JSON in an RFC-4180 quoted cell.
const csvField = (s) => (/[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s);
const lines = all.map((t) =>
  [t.titleCyrillic, t.titleLatin, t.titleTranslationRu ?? '', t.titleTranslationEn ?? '', t.sectionTitle, JSON.stringify(t.payload)]
    .map(csvField)
    .join(','),
);
fs.writeFileSync(OUT_PATH, `titleCyrillic,titleLatin,titleTranslationRu,titleTranslationEn,sectionTitle,payload\n${lines.join('\n')}\n`);
void q;

// Round-trip check: parse the emitted file back and validate payload JSON.
const raw = fs.readFileSync(OUT_PATH, 'utf8').split('\n').filter(Boolean);
const cells = [];
const headerCells = raw[0].split(',');
if (headerCells.join(',') !== 'titleCyrillic,titleLatin,titleTranslationRu,titleTranslationEn,sectionTitle,payload') {
  throw new Error('header mismatch');
}
let i = 1;
while (i < raw.length) {
  // minimal CSV line parser supporting quoted cells with embedded commas
  const line = raw[i];
  const out = [];
  let cur = '';
  let inQ = false;
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    if (inQ) {
      if (c === '"' && line[j + 1] === '"') { cur += '"'; j++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  if (out.length !== 6) throw new Error(`row ${i}: ${out.length} cells`);
  JSON.parse(out[5]);
  cells.push(out[0]);
  i++;
}
if (cells.length !== all.length) throw new Error(`row count ${cells.length} != topics ${all.length}`);

const counts = {};
for (const row of all) counts[row.sectionTitle] = (counts[row.sectionTitle] ?? 0) + 1;
console.log(`theory.csv: ${all.length} topics`);
for (const [s, n] of Object.entries(counts)) console.log(`  ${s}: ${n}`);
