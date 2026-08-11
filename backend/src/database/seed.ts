import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { Unit } from '../content/entities/unit.entity';
import { Lesson } from '../content/entities/lesson.entity';
import { Exercise, ExerciseType } from '../content/entities/exercise.entity';
import { ExerciseChoice } from '../content/entities/exercise-choice.entity';
import { Word } from '../vocabulary/entities/word.entity';
import { Badge } from '../badges/entities/badge.entity';

interface ChoiceSeed {
  text: string;
  isCorrect: boolean;
}
interface ExerciseSeed {
  promptCyrillic: string;
  promptLatin: string;
  choices: ChoiceSeed[];
}
interface LessonSeed {
  title: string;
  titleLatin: string;
  titleTranslation: string;
  exercises: ExerciseSeed[];
}
interface WordSeed {
  cyrillic: string;
  latin: string;
  translation: string;
  exampleCyrillic: string;
  exampleTranslation: string;
}
interface UnitSeed {
  titleCyrillic: string;
  titleLatin: string;
  titleTranslation: string;
  lessons: LessonSeed[];
  words: WordSeed[];
}

// Content mirrors the exhibits in the earlier РЕЧ/REČ design mockup (same
// units, and the "хвала"/"Добро јутро!" examples) so design and API stay in
// sync — extended here with a dedicated alphabet unit and a second lesson
// per topic. Order below is authoritative: seed() renumbers unit/lesson
// `order` to match it on every run (see syncOrder), so reordering this array
// is enough to reorder the path — no manual DB surgery needed.
const UNITS: UnitSeed[] = [
  {
    // The 8 Cyrillic letters with no 1:1 Latin lookalike (digraphs Lj/Nj/Dž
    // and the diacritics Đ/Ž/Ć/Č/Š) — the actual friction point for reading
    // both scripts, so this comes before any vocabulary unit rather than
    // being a separate "settings" concern.
    titleCyrillic: 'Писмо',
    titleLatin: 'Pismo',
    titleTranslation: 'Alphabet',
    lessons: [
      {
        title: 'Писмо',
        titleLatin: 'Pismo',
        titleTranslation: 'Alphabet',
        exercises: [
          {
            promptCyrillic: 'Ђак',
            promptLatin: 'Đak',
            choices: [
              { text: 'pupil / student', isCorrect: true },
              { text: 'teacher', isCorrect: false },
              { text: 'school', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Жена',
            promptLatin: 'Žena',
            choices: [
              { text: 'woman', isCorrect: true },
              { text: 'man', isCorrect: false },
              { text: 'girl', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Љубав',
            promptLatin: 'Ljubav',
            choices: [
              { text: 'love', isCorrect: true },
              { text: 'friendship', isCorrect: false },
              { text: 'family', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Њива',
            promptLatin: 'Njiva',
            choices: [
              { text: 'field', isCorrect: true },
              { text: 'forest', isCorrect: false },
              { text: 'garden', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Ћирилица',
            promptLatin: 'Ćirilica',
            choices: [
              { text: 'Cyrillic script', isCorrect: true },
              { text: 'Latin script', isCorrect: false },
              { text: 'Serbian language', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Чај',
            promptLatin: 'Čaj',
            choices: [
              { text: 'tea', isCorrect: true },
              { text: 'coffee', isCorrect: false },
              { text: 'juice', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Џем',
            promptLatin: 'Džem',
            choices: [
              { text: 'jam', isCorrect: true },
              { text: 'juice', isCorrect: false },
              { text: 'candy', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Шума',
            promptLatin: 'Šuma',
            choices: [
              { text: 'forest', isCorrect: true },
              { text: 'field', isCorrect: false },
              { text: 'mountain', isCorrect: false },
            ],
          },
        ],
      },
    ],
    words: [
      { cyrillic: 'ђак', latin: 'đak', translation: 'pupil / student', exampleCyrillic: 'Ђак учи лекцију.', exampleTranslation: 'The pupil studies the lesson.' },
      { cyrillic: 'жена', latin: 'žena', translation: 'woman', exampleCyrillic: 'Жена чита књигу.', exampleTranslation: 'The woman is reading a book.' },
      { cyrillic: 'љубав', latin: 'ljubav', translation: 'love', exampleCyrillic: 'Љубав је лепо осећање.', exampleTranslation: 'Love is a beautiful feeling.' },
      { cyrillic: 'њива', latin: 'njiva', translation: 'field', exampleCyrillic: 'Њива је пуна пшенице.', exampleTranslation: 'The field is full of wheat.' },
      { cyrillic: 'ћирилица', latin: 'ćirilica', translation: 'Cyrillic script', exampleCyrillic: 'Ћирилица је старо писмо.', exampleTranslation: 'Cyrillic is an old script.' },
      { cyrillic: 'чај', latin: 'čaj', translation: 'tea', exampleCyrillic: 'Пијем топли чај.', exampleTranslation: "I'm drinking hot tea." },
      { cyrillic: 'џем', latin: 'džem', translation: 'jam', exampleCyrillic: 'Мажем џем на хлеб.', exampleTranslation: 'I spread jam on bread.' },
      { cyrillic: 'шума', latin: 'šuma', translation: 'forest', exampleCyrillic: 'Шетамо кроз шуму.', exampleTranslation: "We're walking through the forest." },
    ],
  },
  {
    titleCyrillic: 'Поздрави',
    titleLatin: 'Pozdravi',
    titleTranslation: 'Greetings',
    lessons: [
      {
        title: 'Поздрави',
        titleLatin: 'Pozdravi',
        titleTranslation: 'Greetings',
        exercises: [
          {
            promptCyrillic: 'Добро јутро!',
            promptLatin: 'Dobro jutro!',
            choices: [
              { text: 'Good morning!', isCorrect: true },
              { text: 'Good night!', isCorrect: false },
              { text: 'Good afternoon!', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Добро вече!',
            promptLatin: 'Dobro veče!',
            choices: [
              { text: 'Good evening!', isCorrect: true },
              { text: 'Good morning!', isCorrect: false },
              { text: 'Goodbye!', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Како си?',
            promptLatin: 'Kako si?',
            choices: [
              { text: 'How are you?', isCorrect: true },
              { text: "What's your name?", isCorrect: false },
              { text: 'Where are you?', isCorrect: false },
            ],
          },
        ],
      },
      {
        title: 'Учтивост',
        titleLatin: 'Učtivost',
        titleTranslation: 'Politeness',
        exercises: [
          {
            promptCyrillic: 'Довиђења!',
            promptLatin: 'Doviđenja!',
            choices: [
              { text: 'Goodbye!', isCorrect: true },
              { text: 'Good night!', isCorrect: false },
              { text: 'Good morning!', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Молим!',
            promptLatin: 'Molim!',
            choices: [
              { text: "Please! / You're welcome!", isCorrect: true },
              { text: 'Sorry!', isCorrect: false },
              { text: 'Thanks!', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Извините.',
            promptLatin: 'Izvinite.',
            choices: [
              { text: 'Excuse me.', isCorrect: true },
              { text: 'Thank you.', isCorrect: false },
              { text: 'Goodbye.', isCorrect: false },
            ],
          },
        ],
      },
    ],
    words: [
      { cyrillic: 'хвала', latin: 'hvala', translation: 'thank you', exampleCyrillic: 'Хвала на помоћи.', exampleTranslation: 'Thanks for the help.' },
      { cyrillic: 'здраво', latin: 'zdravo', translation: 'hello', exampleCyrillic: 'Здраво, како си?', exampleTranslation: 'Hello, how are you?' },
      { cyrillic: 'молим', latin: 'molim', translation: "please / you're welcome", exampleCyrillic: 'Молим, изволите.', exampleTranslation: 'Please, here you go.' },
      { cyrillic: 'довиђења', latin: 'doviđenja', translation: 'goodbye', exampleCyrillic: 'Довиђења, видимо се сутра.', exampleTranslation: 'Goodbye, see you tomorrow.' },
      { cyrillic: 'изволите', latin: 'izvolite', translation: 'here you go / please', exampleCyrillic: 'Изволите, седите.', exampleTranslation: 'Here you go, have a seat.' },
      { cyrillic: 'пријатно', latin: 'prijatno', translation: 'have a nice time', exampleCyrillic: 'Пријатно вече!', exampleTranslation: 'Have a nice evening!' },
    ],
  },
  {
    titleCyrillic: 'Породица',
    titleLatin: 'Porodica',
    titleTranslation: 'Family',
    lessons: [
      {
        title: 'Породица',
        titleLatin: 'Porodica',
        titleTranslation: 'Family',
        exercises: [
          {
            promptCyrillic: 'Мајка',
            promptLatin: 'Majka',
            choices: [
              { text: 'mother', isCorrect: true },
              { text: 'father', isCorrect: false },
              { text: 'sister', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Отац',
            promptLatin: 'Otac',
            choices: [
              { text: 'father', isCorrect: true },
              { text: 'brother', isCorrect: false },
              { text: 'mother', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Сестра',
            promptLatin: 'Sestra',
            choices: [
              { text: 'sister', isCorrect: true },
              { text: 'brother', isCorrect: false },
              { text: 'mother', isCorrect: false },
            ],
          },
        ],
      },
      {
        title: 'Родбина',
        titleLatin: 'Rodbina',
        titleTranslation: 'Relatives',
        exercises: [
          {
            promptCyrillic: 'Брат',
            promptLatin: 'Brat',
            choices: [
              { text: 'brother', isCorrect: true },
              { text: 'sister', isCorrect: false },
              { text: 'cousin', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Деда',
            promptLatin: 'Deda',
            choices: [
              { text: 'grandfather', isCorrect: true },
              { text: 'grandmother', isCorrect: false },
              { text: 'uncle', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Баба',
            promptLatin: 'Baba',
            choices: [
              { text: 'grandmother', isCorrect: true },
              { text: 'grandfather', isCorrect: false },
              { text: 'aunt', isCorrect: false },
            ],
          },
        ],
      },
    ],
    words: [
      { cyrillic: 'мајка', latin: 'majka', translation: 'mother', exampleCyrillic: 'Моја мајка кува ручак.', exampleTranslation: 'My mother is cooking lunch.' },
      { cyrillic: 'отац', latin: 'otac', translation: 'father', exampleCyrillic: 'Мој отац ради у граду.', exampleTranslation: 'My father works in the city.' },
      { cyrillic: 'сестра', latin: 'sestra', translation: 'sister', exampleCyrillic: 'Моја сестра студира.', exampleTranslation: 'My sister is a student.' },
      { cyrillic: 'брат', latin: 'brat', translation: 'brother', exampleCyrillic: 'Мој брат игра фудбал.', exampleTranslation: 'My brother plays football.' },
      { cyrillic: 'деда', latin: 'deda', translation: 'grandfather', exampleCyrillic: 'Деда прича приче.', exampleTranslation: 'Grandfather tells stories.' },
      { cyrillic: 'баба', latin: 'baba', translation: 'grandmother', exampleCyrillic: 'Баба пече колаче.', exampleTranslation: 'Grandmother bakes cookies.' },
    ],
  },
  {
    titleCyrillic: 'Храна',
    titleLatin: 'Hrana',
    titleTranslation: 'Food',
    lessons: [
      {
        title: 'Храна',
        titleLatin: 'Hrana',
        titleTranslation: 'Food',
        exercises: [
          {
            promptCyrillic: 'Хлеб',
            promptLatin: 'Hleb',
            choices: [
              { text: 'bread', isCorrect: true },
              { text: 'milk', isCorrect: false },
              { text: 'water', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Вода',
            promptLatin: 'Voda',
            choices: [
              { text: 'water', isCorrect: true },
              { text: 'wine', isCorrect: false },
              { text: 'bread', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Хвала на храни.',
            promptLatin: 'Hvala na hrani.',
            choices: [
              { text: 'Thanks for the food.', isCorrect: true },
              { text: 'Thanks for the help.', isCorrect: false },
              { text: 'See you later.', isCorrect: false },
            ],
          },
        ],
      },
      {
        title: 'Више хране',
        titleLatin: 'Više hrane',
        titleTranslation: 'More food',
        exercises: [
          {
            promptCyrillic: 'Јабука',
            promptLatin: 'Jabuka',
            choices: [
              { text: 'apple', isCorrect: true },
              { text: 'orange', isCorrect: false },
              { text: 'banana', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Месо',
            promptLatin: 'Meso',
            choices: [
              { text: 'meat', isCorrect: true },
              { text: 'fish', isCorrect: false },
              { text: 'cheese', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Кафа',
            promptLatin: 'Kafa',
            choices: [
              { text: 'coffee', isCorrect: true },
              { text: 'tea', isCorrect: false },
              { text: 'juice', isCorrect: false },
            ],
          },
        ],
      },
    ],
    words: [
      { cyrillic: 'хлеб', latin: 'hleb', translation: 'bread', exampleCyrillic: 'Купио сам свеж хлеб.', exampleTranslation: 'I bought fresh bread.' },
      { cyrillic: 'вода', latin: 'voda', translation: 'water', exampleCyrillic: 'Дај ми чашу воде.', exampleTranslation: 'Give me a glass of water.' },
      { cyrillic: 'ручак', latin: 'ručak', translation: 'lunch', exampleCyrillic: 'Ручак је готов.', exampleTranslation: 'Lunch is ready.' },
      { cyrillic: 'јабука', latin: 'jabuka', translation: 'apple', exampleCyrillic: 'Једем јабуку сваки дан.', exampleTranslation: 'I eat an apple every day.' },
      { cyrillic: 'месо', latin: 'meso', translation: 'meat', exampleCyrillic: 'Волим печено месо.', exampleTranslation: 'I like roasted meat.' },
      { cyrillic: 'кафа', latin: 'kafa', translation: 'coffee', exampleCyrillic: 'Пијем кафу ујутру.', exampleTranslation: 'I drink coffee in the morning.' },
    ],
  },
  {
    titleCyrillic: 'Бројеви',
    titleLatin: 'Brojevi',
    titleTranslation: 'Numbers',
    lessons: [
      {
        title: 'Бројеви',
        titleLatin: 'Brojevi',
        titleTranslation: 'Numbers',
        exercises: [
          {
            promptCyrillic: 'Један',
            promptLatin: 'Jedan',
            choices: [
              { text: 'one', isCorrect: true },
              { text: 'two', isCorrect: false },
              { text: 'three', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Два',
            promptLatin: 'Dva',
            choices: [
              { text: 'two', isCorrect: true },
              { text: 'one', isCorrect: false },
              { text: 'four', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Пет',
            promptLatin: 'Pet',
            choices: [
              { text: 'five', isCorrect: true },
              { text: 'six', isCorrect: false },
              { text: 'four', isCorrect: false },
            ],
          },
        ],
      },
      {
        title: 'Више бројева',
        titleLatin: 'Više brojeva',
        titleTranslation: 'More numbers',
        exercises: [
          {
            promptCyrillic: 'Шест',
            promptLatin: 'Šest',
            choices: [
              { text: 'six', isCorrect: true },
              { text: 'seven', isCorrect: false },
              { text: 'eight', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Десет',
            promptLatin: 'Deset',
            choices: [
              { text: 'ten', isCorrect: true },
              { text: 'nine', isCorrect: false },
              { text: 'eleven', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Сто',
            promptLatin: 'Sto',
            choices: [
              { text: 'hundred', isCorrect: true },
              { text: 'thousand', isCorrect: false },
              { text: 'ten', isCorrect: false },
            ],
          },
        ],
      },
    ],
    words: [
      { cyrillic: 'један', latin: 'jedan', translation: 'one', exampleCyrillic: 'Имам један брат.', exampleTranslation: 'I have one brother.' },
      { cyrillic: 'два', latin: 'dva', translation: 'two', exampleCyrillic: 'Два пута дневно.', exampleTranslation: 'Twice a day.' },
      { cyrillic: 'пет', latin: 'pet', translation: 'five', exampleCyrillic: 'Пет минута пешке.', exampleTranslation: 'Five minutes on foot.' },
      { cyrillic: 'шест', latin: 'šest', translation: 'six', exampleCyrillic: 'Имам шест књига.', exampleTranslation: 'I have six books.' },
      { cyrillic: 'десет', latin: 'deset', translation: 'ten', exampleCyrillic: 'Десет прстију на рукама.', exampleTranslation: 'Ten fingers on the hands.' },
      { cyrillic: 'сто', latin: 'sto', translation: 'hundred', exampleCyrillic: 'Сто динара.', exampleTranslation: 'A hundred dinars.' },
    ],
  },
  {
    titleCyrillic: 'Путовање',
    titleLatin: 'Putovanje',
    titleTranslation: 'Travel',
    lessons: [
      {
        title: 'Путовање',
        titleLatin: 'Putovanje',
        titleTranslation: 'Travel',
        exercises: [
          {
            promptCyrillic: 'Где је станица?',
            promptLatin: 'Gde je stanica?',
            choices: [
              { text: 'Where is the station?', isCorrect: true },
              { text: 'Where is the hotel?', isCorrect: false },
              { text: 'How much is it?', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Колико кошта?',
            promptLatin: 'Koliko košta?',
            choices: [
              { text: 'How much does it cost?', isCorrect: true },
              { text: 'Where is it?', isCorrect: false },
              { text: 'What time is it?', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Аеродром',
            promptLatin: 'Aerodrom',
            choices: [
              { text: 'airport', isCorrect: true },
              { text: 'station', isCorrect: false },
              { text: 'hotel', isCorrect: false },
            ],
          },
        ],
      },
      {
        title: 'Смештај',
        titleLatin: 'Smeštaj',
        titleTranslation: 'Accommodation',
        exercises: [
          {
            promptCyrillic: 'Хотел',
            promptLatin: 'Hotel',
            choices: [
              { text: 'hotel', isCorrect: true },
              { text: 'airport', isCorrect: false },
              { text: 'station', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Карта',
            promptLatin: 'Karta',
            choices: [
              { text: 'ticket', isCorrect: true },
              { text: 'map', isCorrect: false },
              { text: 'passport', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Пасош',
            promptLatin: 'Pasoš',
            choices: [
              { text: 'passport', isCorrect: true },
              { text: 'ticket', isCorrect: false },
              { text: 'map', isCorrect: false },
            ],
          },
        ],
      },
    ],
    words: [
      { cyrillic: 'станица', latin: 'stanica', translation: 'station', exampleCyrillic: 'Станица је близу.', exampleTranslation: 'The station is close.' },
      { cyrillic: 'аеродром', latin: 'aerodrom', translation: 'airport', exampleCyrillic: 'Идемо на аеродром.', exampleTranslation: "We're going to the airport." },
      { cyrillic: 'путовање', latin: 'putovanje', translation: 'journey / trip', exampleCyrillic: 'Пријатно путовање!', exampleTranslation: 'Have a nice trip!' },
      { cyrillic: 'хотел', latin: 'hotel', translation: 'hotel', exampleCyrillic: 'Резервисао сам хотел.', exampleTranslation: 'I booked a hotel.' },
      { cyrillic: 'карта', latin: 'karta', translation: 'ticket', exampleCyrillic: 'Купио сам карту за воз.', exampleTranslation: 'I bought a train ticket.' },
      { cyrillic: 'пасош', latin: 'pasoš', translation: 'passport', exampleCyrillic: 'Понесите пасош.', exampleTranslation: 'Bring your passport.' },
    ],
  },
];

const BADGES: Pick<Badge, 'code' | 'titleCyrillic' | 'titleLatin' | 'description'>[] = [
  {
    code: 'first_week',
    titleCyrillic: 'Прва недеља',
    titleLatin: 'Prva nedelja',
    description: '7 дана заредом у учењу.',
  },
  {
    code: '100_words',
    titleCyrillic: '100 речи',
    titleLatin: '100 reči',
    description: 'Научили сте 100 речи.',
  },
  {
    code: 'no_mistakes',
    titleCyrillic: 'Без грешке',
    titleLatin: 'Bez greške',
    description: 'Завршили сте лекцију без иједне грешке.',
  },
];

/**
 * Inserts anything from UNITS that's missing (by titleCyrillic / lesson
 * title / word cyrillic — never by numeric id, so this stays correct however
 * many times it runs) and renumbers unit/lesson `order` to match the array
 * above. Never touches an existing lesson's exercises: those may already
 * have UserLessonProgress rows completed against them, and this only needs
 * to *add* content, not edit lessons already shipped.
 */
async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const dataSource = app.get(DataSource);

  const unitRepo = dataSource.getRepository(Unit);
  const lessonRepo = dataSource.getRepository(Lesson);
  const wordRepo = dataSource.getRepository(Word);
  const badgeRepo = dataSource.getRepository(Badge);

  let unitsCreated = 0;
  let lessonsCreated = 0;
  let lessonOrder = 1;

  for (const [unitIndex, unitSeed] of UNITS.entries()) {
    let unit = await unitRepo.findOne({ where: { titleCyrillic: unitSeed.titleCyrillic } });
    if (!unit) {
      unit = unitRepo.create({
        titleCyrillic: unitSeed.titleCyrillic,
        titleLatin: unitSeed.titleLatin,
        titleTranslation: unitSeed.titleTranslation,
        order: unitIndex + 1,
      });
      await unitRepo.save(unit);
      unitsCreated++;
    } else if (unit.order !== unitIndex + 1) {
      unit.order = unitIndex + 1;
      await unitRepo.save(unit);
    }

    for (const lessonSeed of unitSeed.lessons) {
      const order = lessonOrder++;
      let lesson = await lessonRepo.findOne({ where: { unitId: unit.id, title: lessonSeed.title } });
      if (!lesson) {
        lesson = new Lesson();
        lesson.unit = unit;
        lesson.title = lessonSeed.title;
        lesson.titleLatin = lessonSeed.titleLatin;
        lesson.titleTranslation = lessonSeed.titleTranslation;
        lesson.order = order;
        lesson.xpReward = 10;
        lesson.exercises = lessonSeed.exercises.map((exerciseSeed, exIndex) => {
          const exercise = new Exercise();
          exercise.type = ExerciseType.TRANSLATE_CHOICE;
          exercise.promptCyrillic = exerciseSeed.promptCyrillic;
          exercise.promptLatin = exerciseSeed.promptLatin;
          exercise.order = exIndex + 1;
          exercise.choices = exerciseSeed.choices.map((choiceSeed, chIndex) => {
            const choice = new ExerciseChoice();
            choice.text = choiceSeed.text;
            choice.isCorrect = choiceSeed.isCorrect;
            choice.order = chIndex + 1;
            return choice;
          });
          return exercise;
        });
        await lessonRepo.save(lesson);
        lessonsCreated++;
      } else if (lesson.order !== order) {
        lesson.order = order;
        await lessonRepo.save(lesson);
      }
    }
  }
  console.log(`Units: +${unitsCreated} new (${UNITS.length} total). Lessons: +${lessonsCreated} new.`);

  let wordsCreated = 0;
  for (const unitSeed of UNITS) {
    const unit = await unitRepo.findOne({ where: { titleCyrillic: unitSeed.titleCyrillic } });
    for (const wordSeed of unitSeed.words) {
      const existing = await wordRepo.findOne({ where: { cyrillic: wordSeed.cyrillic } });
      if (existing) continue;
      const word = new Word();
      word.unit = unit ?? null;
      word.cyrillic = wordSeed.cyrillic;
      word.latin = wordSeed.latin;
      word.translation = wordSeed.translation;
      word.exampleCyrillic = wordSeed.exampleCyrillic;
      word.exampleTranslation = wordSeed.exampleTranslation;
      word.audioUrl = null;
      await wordRepo.save(word);
      wordsCreated++;
    }
  }
  console.log(`Words: +${wordsCreated} new.`);

  let badgesCreated = 0;
  for (const badgeSeed of BADGES) {
    const existing = await badgeRepo.findOne({ where: { code: badgeSeed.code } });
    if (!existing) {
      await badgeRepo.save(badgeRepo.create(badgeSeed));
      badgesCreated++;
    }
  }
  console.log(`Badges: +${badgesCreated} new.`);

  await app.close();
  console.log('Done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
