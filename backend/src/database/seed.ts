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
interface UnitSeed {
  titleCyrillic: string;
  titleLatin: string;
  titleTranslation: string;
  lessons: LessonSeed[];
  words: {
    cyrillic: string;
    latin: string;
    translation: string;
    exampleCyrillic: string;
    exampleTranslation: string;
  }[];
}

// Content mirrors the exhibits in the earlier РЕЧ/REČ design mockup
// (same units, and the "хвала"/"Добро јутро!" examples) so design and API stay in sync.
const UNITS: UnitSeed[] = [
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
    ],
    words: [
      {
        cyrillic: 'хвала',
        latin: 'hvala',
        translation: 'thank you',
        exampleCyrillic: 'Хвала на помоћи.',
        exampleTranslation: 'Thanks for the help.',
      },
      {
        cyrillic: 'здраво',
        latin: 'zdravo',
        translation: 'hello',
        exampleCyrillic: 'Здраво, како си?',
        exampleTranslation: 'Hello, how are you?',
      },
      {
        cyrillic: 'молим',
        latin: 'molim',
        translation: "please / you're welcome",
        exampleCyrillic: 'Молим, изволите.',
        exampleTranslation: 'Please, here you go.',
      },
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
    ],
    words: [
      {
        cyrillic: 'мајка',
        latin: 'majka',
        translation: 'mother',
        exampleCyrillic: 'Моја мајка кува ручак.',
        exampleTranslation: 'My mother is cooking lunch.',
      },
      {
        cyrillic: 'отац',
        latin: 'otac',
        translation: 'father',
        exampleCyrillic: 'Мој отац ради у граду.',
        exampleTranslation: 'My father works in the city.',
      },
      {
        cyrillic: 'сестра',
        latin: 'sestra',
        translation: 'sister',
        exampleCyrillic: 'Моја сестра студира.',
        exampleTranslation: 'My sister is a student.',
      },
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
    ],
    words: [
      {
        cyrillic: 'хлеб',
        latin: 'hleb',
        translation: 'bread',
        exampleCyrillic: 'Купио сам свеж хлеб.',
        exampleTranslation: 'I bought fresh bread.',
      },
      {
        cyrillic: 'вода',
        latin: 'voda',
        translation: 'water',
        exampleCyrillic: 'Дај ми чашу воде.',
        exampleTranslation: 'Give me a glass of water.',
      },
      {
        cyrillic: 'ручак',
        latin: 'ručak',
        translation: 'lunch',
        exampleCyrillic: 'Ручак је готов.',
        exampleTranslation: 'Lunch is ready.',
      },
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
    ],
    words: [
      {
        cyrillic: 'један',
        latin: 'jedan',
        translation: 'one',
        exampleCyrillic: 'Имам један брат.',
        exampleTranslation: 'I have one brother.',
      },
      {
        cyrillic: 'два',
        latin: 'dva',
        translation: 'two',
        exampleCyrillic: 'Два пута дневно.',
        exampleTranslation: 'Twice a day.',
      },
      {
        cyrillic: 'пет',
        latin: 'pet',
        translation: 'five',
        exampleCyrillic: 'Пет минута пешке.',
        exampleTranslation: 'Five minutes on foot.',
      },
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
    ],
    words: [
      {
        cyrillic: 'станица',
        latin: 'stanica',
        translation: 'station',
        exampleCyrillic: 'Станица је близу.',
        exampleTranslation: 'The station is close.',
      },
      {
        cyrillic: 'аеродром',
        latin: 'aerodrom',
        translation: 'airport',
        exampleCyrillic: 'Идемо на аеродром.',
        exampleTranslation: "We're going to the airport.",
      },
      {
        cyrillic: 'путовање',
        latin: 'putovanje',
        translation: 'journey / trip',
        exampleCyrillic: 'Пријатно путовање!',
        exampleTranslation: 'Have a nice trip!',
      },
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

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const dataSource = app.get(DataSource);

  const unitRepo = dataSource.getRepository(Unit);
  const wordRepo = dataSource.getRepository(Word);
  const badgeRepo = dataSource.getRepository(Badge);

  if ((await unitRepo.count()) > 0) {
    console.log('Units already seeded — skipping course content.');
  } else {
    let unitOrder = 1;
    let lessonOrder = 1;
    for (const unitSeed of UNITS) {
      const unit = unitRepo.create({
        titleCyrillic: unitSeed.titleCyrillic,
        titleLatin: unitSeed.titleLatin,
        titleTranslation: unitSeed.titleTranslation,
        order: unitOrder++,
        lessons: unitSeed.lessons.map((lessonSeed) => {
          const lesson = new Lesson();
          lesson.title = lessonSeed.title;
          lesson.titleLatin = lessonSeed.titleLatin;
          lesson.titleTranslation = lessonSeed.titleTranslation;
          lesson.order = lessonOrder++;
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
          return lesson;
        }),
      });
      await unitRepo.save(unit);
    }
    console.log(`Seeded ${UNITS.length} units.`);
  }

  if ((await wordRepo.count()) > 0) {
    console.log('Words already seeded — skipping vocabulary.');
  } else {
    const units = await unitRepo.find();
    const unitByCyrillic = new Map(units.map((u) => [u.titleCyrillic, u]));
    const words: Word[] = [];
    for (const unitSeed of UNITS) {
      const unit = unitByCyrillic.get(unitSeed.titleCyrillic) ?? null;
      for (const wordSeed of unitSeed.words) {
        const word = new Word();
        word.unit = unit;
        word.cyrillic = wordSeed.cyrillic;
        word.latin = wordSeed.latin;
        word.translation = wordSeed.translation;
        word.exampleCyrillic = wordSeed.exampleCyrillic;
        word.exampleTranslation = wordSeed.exampleTranslation;
        word.audioUrl = null;
        words.push(word);
      }
    }
    await wordRepo.save(words);
    console.log(`Seeded ${words.length} words.`);
  }

  for (const badgeSeed of BADGES) {
    const existing = await badgeRepo.findOne({ where: { code: badgeSeed.code } });
    if (!existing) {
      await badgeRepo.save(badgeRepo.create(badgeSeed));
      console.log(`Seeded badge: ${badgeSeed.code}`);
    }
  }

  await app.close();
  console.log('Done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
