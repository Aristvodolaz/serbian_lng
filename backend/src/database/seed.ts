import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { Unit } from '../content/entities/unit.entity';
import { Lesson } from '../content/entities/lesson.entity';
import { Exercise, ExerciseType } from '../content/entities/exercise.entity';
import { ExerciseChoice } from '../content/entities/exercise-choice.entity';
import { Word } from '../vocabulary/entities/word.entity';
import { Badge } from '../badges/entities/badge.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

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
  translationRu?: string;
  translationEn: string;
  exampleCyrillic: string;
  exampleTranslationRu?: string;
  exampleTranslationEn: string;
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
      {
        // The other half of the alphabet problem: letters that are Latin
        // lookalikes but sound completely different (С looks like C but
        // says S, Р looks like P but says R...) — arguably harder than the
        // digraphs above, since the shape actively lies to you.
        title: 'Лажни пријатељи',
        titleLatin: 'Lažni prijatelji',
        titleTranslation: 'False friends',
        exercises: [
          {
            promptCyrillic: 'Пас',
            promptLatin: 'Pas',
            choices: [
              { text: 'dog', isCorrect: true },
              { text: 'cat', isCorrect: false },
              { text: 'bird', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Рука',
            promptLatin: 'Ruka',
            choices: [
              { text: 'hand / arm', isCorrect: true },
              { text: 'leg', isCorrect: false },
              { text: 'head', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Нос',
            promptLatin: 'Nos',
            choices: [
              { text: 'nose', isCorrect: true },
              { text: 'mouth', isCorrect: false },
              { text: 'ear', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Уста',
            promptLatin: 'Usta',
            choices: [
              { text: 'mouth', isCorrect: true },
              { text: 'nose', isCorrect: false },
              { text: 'eye', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Хлад',
            promptLatin: 'Hlad',
            choices: [
              { text: 'coolness / shade', isCorrect: true },
              { text: 'heat', isCorrect: false },
              { text: 'wind', isCorrect: false },
            ],
          },
        ],
      },
    ],
    words: [
      { cyrillic: 'ђак', latin: 'đak', translationRu: 'ученик', translationEn: 'pupil / student', exampleCyrillic: 'Ђак учи лекцију.', exampleTranslationRu: 'Ученик учит урок.', exampleTranslationEn: 'The pupil studies the lesson.' },
      { cyrillic: 'жена', latin: 'žena', translationRu: 'женщина', translationEn: 'woman', exampleCyrillic: 'Жена чита књигу.', exampleTranslationRu: 'Женщина читает книгу.', exampleTranslationEn: 'The woman is reading a book.' },
      { cyrillic: 'љубав', latin: 'ljubav', translationRu: 'любов', translationEn: 'love', exampleCyrillic: 'Љубав је лепо осећање.', exampleTranslationRu: 'Любовь — прекрасное чувство.', exampleTranslationEn: 'Love is a beautiful feeling.' },
      { cyrillic: 'њива', latin: 'njiva', translationRu: 'поле', translationEn: 'field', exampleCyrillic: 'Њива је пуна пшенице.', exampleTranslationRu: 'Поле полно пшеницы.', exampleTranslationEn: 'The field is full of wheat.' },
      { cyrillic: 'ћирилица', latin: 'ćirilica', translationRu: 'кириллица', translationEn: 'Cyrillic script', exampleCyrillic: 'Ћирилица је старо писмо.', exampleTranslationRu: 'Кириллица — древняя письменность.', exampleTranslationEn: 'Cyrillic is an old script.' },
      { cyrillic: 'чај', latin: 'čaj', translationRu: 'чай', translationEn: 'tea', exampleCyrillic: 'Пијем топли чај.', exampleTranslationRu: 'Я пью горячий чай.', exampleTranslationEn: "I'm drinking hot tea." },
      { cyrillic: 'џем', latin: 'džem', translationRu: 'джем', translationEn: 'jam', exampleCyrillic: 'Мажем џем на хлеб.', exampleTranslationRu: 'Я намазываю джем на хлеб.', exampleTranslationEn: 'I spread jam on bread.' },
      { cyrillic: 'шума', latin: 'šuma', translationRu: 'лес', translationEn: 'forest', exampleCyrillic: 'Шетамо кроз шуму.', exampleTranslationRu: 'Мы гуляем по лесу.', exampleTranslationEn: "We're walking through the forest." },
      { cyrillic: 'пас', latin: 'pas', translationRu: 'собака', translationEn: 'dog', exampleCyrillic: 'Пас трчи у парку.', exampleTranslationRu: 'Собака бежит в парке.', exampleTranslationEn: 'The dog runs in the park.' },
      { cyrillic: 'рука', latin: 'ruka', translationRu: 'рука', translationEn: 'hand / arm', exampleCyrillic: 'Опери руке пре јела.', exampleTranslationRu: 'Вымой руки перед едой.', exampleTranslationEn: 'Wash your hands before eating.' },
      { cyrillic: 'нос', latin: 'nos', translationRu: 'нос', translationEn: 'nose', exampleCyrillic: 'Има мали нос.', exampleTranslationRu: 'У него маленький нос.', exampleTranslationEn: 'He has a small nose.' },
      { cyrillic: 'уста', latin: 'usta', translationRu: 'рот', translationEn: 'mouth', exampleCyrillic: 'Отвори уста, молим те.', exampleTranslationRu: 'Открой рот, пожалуйста.', exampleTranslationEn: 'Open your mouth, please.' },
      { cyrillic: 'хлад', latin: 'hlad', translationRu: 'прохлада; тень', translationEn: 'coolness / shade', exampleCyrillic: 'Седимо у хладу дрвета.', exampleTranslationRu: 'Мы сидим в тени дерева.', exampleTranslationEn: 'We sit in the shade of the tree.' },
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
      {
        title: 'Представљање',
        titleLatin: 'Predstavljanje',
        titleTranslation: 'Introductions',
        exercises: [
          {
            promptCyrillic: 'Ја сам Милица.',
            promptLatin: 'Ja sam Milica.',
            choices: [
              { text: 'I am Milica.', isCorrect: true },
              { text: 'I have Milica.', isCorrect: false },
              { text: 'I like Milica.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Драго ми је.',
            promptLatin: 'Drago mi je.',
            choices: [
              { text: 'Nice to meet you.', isCorrect: true },
              { text: 'Thank you very much.', isCorrect: false },
              { text: 'See you soon.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Одакле си?',
            promptLatin: 'Odakle si?',
            choices: [
              { text: 'Where are you from?', isCorrect: true },
              { text: 'How old are you?', isCorrect: false },
              { text: 'What do you do?', isCorrect: false },
            ],
          },
        ],
      },
    ],
    words: [
      { cyrillic: 'хвала', latin: 'hvala', translationRu: 'спасибо', translationEn: 'thank you', exampleCyrillic: 'Хвала на помоћи.', exampleTranslationRu: 'Спасибо за помощь.', exampleTranslationEn: 'Thanks for the help.' },
      { cyrillic: 'здраво', latin: 'zdravo', translationRu: 'привет', translationEn: 'hello', exampleCyrillic: 'Здраво, како си?', exampleTranslationRu: 'Привет, как дела?', exampleTranslationEn: 'Hello, how are you?' },
      { cyrillic: 'молим', latin: 'molim', translationRu: 'пожалуйста', translationEn: "please / you're welcome", exampleCyrillic: 'Молим, изволите.', exampleTranslationRu: 'Пожалуйста, извольте.', exampleTranslationEn: 'Please, here you go.' },
      { cyrillic: 'довиђења', latin: 'doviđenja', translationRu: 'до свидания', translationEn: 'goodbye', exampleCyrillic: 'Довиђења, видимо се сутра.', exampleTranslationRu: 'До свидания, увидимся завтра.', exampleTranslationEn: 'Goodbye, see you tomorrow.' },
      { cyrillic: 'изволите', latin: 'izvolite', translationRu: 'прошу', translationEn: 'here you go / please', exampleCyrillic: 'Изволите, седите.', exampleTranslationRu: 'Пожалуйста, садитесь.', exampleTranslationEn: 'Here you go, have a seat.' },
      { cyrillic: 'пријатно', latin: 'prijatno', translationRu: 'приятного', translationEn: 'have a nice time', exampleCyrillic: 'Пријатно вече!', exampleTranslationRu: 'Приятного вечера!', exampleTranslationEn: 'Have a nice evening!' },
      { cyrillic: 'име', latin: 'ime', translationRu: 'имя', translationEn: 'name', exampleCyrillic: 'Како ти је име?', exampleTranslationRu: 'Как тебя зовут?', exampleTranslationEn: 'What is your name?' },
      { cyrillic: 'одакле', latin: 'odakle', translationRu: 'откуда', translationEn: 'from where', exampleCyrillic: 'Одакле си ти?', exampleTranslationRu: 'Откуда ты?', exampleTranslationEn: 'Where are you from?' },
      { cyrillic: 'пријатељ', latin: 'prijatelj', translationRu: 'друг', translationEn: 'friend', exampleCyrillic: 'Он је мој пријатељ.', exampleTranslationRu: 'Он мой друг.', exampleTranslationEn: 'He is my friend.' },
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
      {
        title: 'Кућа',
        titleLatin: 'Kuća',
        titleTranslation: 'Home',
        exercises: [
          {
            promptCyrillic: 'Кућа',
            promptLatin: 'Kuća',
            choices: [
              { text: 'house', isCorrect: true },
              { text: 'apartment', isCorrect: false },
              { text: 'yard', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Соба',
            promptLatin: 'Soba',
            choices: [
              { text: 'room', isCorrect: true },
              { text: 'kitchen', isCorrect: false },
              { text: 'bathroom', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Врата',
            promptLatin: 'Vrata',
            choices: [
              { text: 'door', isCorrect: true },
              { text: 'window', isCorrect: false },
              { text: 'wall', isCorrect: false },
            ],
          },
        ],
      },
    ],
    words: [
      { cyrillic: 'мајка', latin: 'majka', translationRu: 'мать', translationEn: 'mother', exampleCyrillic: 'Моја мајка кува ручак.', exampleTranslationRu: 'Моя мама готовит обед.', exampleTranslationEn: 'My mother is cooking lunch.' },
      { cyrillic: 'отац', latin: 'otac', translationRu: 'отец', translationEn: 'father', exampleCyrillic: 'Мој отац ради у граду.', exampleTranslationRu: 'Мой отец работает в городе.', exampleTranslationEn: 'My father works in the city.' },
      { cyrillic: 'сестра', latin: 'sestra', translationRu: 'сестра', translationEn: 'sister', exampleCyrillic: 'Моја сестра студира.', exampleTranslationRu: 'Моя сестра учится.', exampleTranslationEn: 'My sister is a student.' },
      { cyrillic: 'брат', latin: 'brat', translationRu: 'брат', translationEn: 'brother', exampleCyrillic: 'Мој брат игра фудбал.', exampleTranslationRu: 'Мой брат играет в футбол.', exampleTranslationEn: 'My brother plays football.' },
      { cyrillic: 'деда', latin: 'deda', translationRu: 'дедушка', translationEn: 'grandfather', exampleCyrillic: 'Деда прича приче.', exampleTranslationRu: 'Дедушка рассказывает сказки.', exampleTranslationEn: 'Grandfather tells stories.' },
      { cyrillic: 'баба', latin: 'baba', translationRu: 'бабушка', translationEn: 'grandmother', exampleCyrillic: 'Баба пече колаче.', exampleTranslationRu: 'Бабушка печёт печенье.', exampleTranslationEn: 'Grandmother bakes cookies.' },
      { cyrillic: 'кућа', latin: 'kuća', translationRu: 'дом', translationEn: 'house', exampleCyrillic: 'Наша кућа је велика.', exampleTranslationRu: 'Наш дом большой.', exampleTranslationEn: 'Our house is big.' },
      { cyrillic: 'соба', latin: 'soba', translationRu: 'комната', translationEn: 'room', exampleCyrillic: 'Моја соба је чиста.', exampleTranslationRu: 'В комнате светло.', exampleTranslationEn: 'My room is clean.' },
      { cyrillic: 'врата', latin: 'vrata', translationRu: 'дверь', translationEn: 'door', exampleCyrillic: 'Затвори врата, молим те.', exampleTranslationRu: 'Закрой дверь.', exampleTranslationEn: 'Close the door, please.' },
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
      {
        title: 'У ресторану',
        titleLatin: 'U restoranu',
        titleTranslation: 'At the restaurant',
        exercises: [
          {
            promptCyrillic: 'Рачун, молим.',
            promptLatin: 'Račun, molim.',
            choices: [
              { text: 'The bill, please.', isCorrect: true },
              { text: 'The menu, please.', isCorrect: false },
              { text: 'Water, please.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Укусно!',
            promptLatin: 'Ukusno!',
            choices: [
              { text: 'Delicious!', isCorrect: true },
              { text: 'Disgusting!', isCorrect: false },
              { text: 'Spicy!', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Со',
            promptLatin: 'So',
            choices: [
              { text: 'salt', isCorrect: true },
              { text: 'sugar', isCorrect: false },
              { text: 'pepper', isCorrect: false },
            ],
          },
        ],
      },
    ],
    words: [
      { cyrillic: 'хлеб', latin: 'hleb', translationRu: 'хлеб', translationEn: 'bread', exampleCyrillic: 'Купио сам свеж хлеб.', exampleTranslationRu: 'Я ем хлеб с маслом.', exampleTranslationEn: 'I bought fresh bread.' },
      { cyrillic: 'вода', latin: 'voda', translationRu: 'вода', translationEn: 'water', exampleCyrillic: 'Дај ми чашу воде.', exampleTranslationRu: 'Я пью холодную воду.', exampleTranslationEn: 'Give me a glass of water.' },
      { cyrillic: 'ручак', latin: 'ručak', translationRu: 'обед', translationEn: 'lunch', exampleCyrillic: 'Ручак је готов.', exampleTranslationRu: 'Обед готов.', exampleTranslationEn: 'Lunch is ready.' },
      { cyrillic: 'јабука', latin: 'jabuka', translationRu: 'яблоко', translationEn: 'apple', exampleCyrillic: 'Једем јабуку сваки дан.', exampleTranslationRu: 'Яблоко красное и сладкое.', exampleTranslationEn: 'I eat an apple every day.' },
      { cyrillic: 'месо', latin: 'meso', translationRu: 'мясо', translationEn: 'meat', exampleCyrillic: 'Волим печено месо.', exampleTranslationRu: 'Мы едим мясо с овощами.', exampleTranslationEn: 'I like roasted meat.' },
      { cyrillic: 'кафа', latin: 'kafa', translationRu: 'кофе', translationEn: 'coffee', exampleCyrillic: 'Пијем кафу ујутру.', exampleTranslationRu: 'Я пью кофе по утрам.', exampleTranslationEn: 'I drink coffee in the morning.' },
      { cyrillic: 'рачун', latin: 'račun', translationRu: 'счёт', translationEn: 'bill', exampleCyrillic: 'Молим вас, рачун.', exampleTranslationRu: 'Принесите счёт, пожалуйста.', exampleTranslationEn: 'The bill, please.' },
      { cyrillic: 'укусно', latin: 'ukusno', translationRu: 'вкусно', translationEn: 'delicious', exampleCyrillic: 'Ово је веома укусно.', exampleTranslationRu: 'Еда очень вкусная.', exampleTranslationEn: 'This is very delicious.' },
      { cyrillic: 'со', latin: 'so', translationRu: 'соль', translationEn: 'salt', exampleCyrillic: 'Додај мало соли.', exampleTranslationRu: 'Посолите суп.', exampleTranslationEn: 'Add a bit of salt.' },
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
      {
        title: 'Време и датуми',
        titleLatin: 'Vreme i datumi',
        titleTranslation: 'Time and dates',
        exercises: [
          {
            promptCyrillic: 'Данас',
            promptLatin: 'Danas',
            choices: [
              { text: 'today', isCorrect: true },
              { text: 'tomorrow', isCorrect: false },
              { text: 'yesterday', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Сутра',
            promptLatin: 'Sutra',
            choices: [
              { text: 'tomorrow', isCorrect: true },
              { text: 'today', isCorrect: false },
              { text: 'yesterday', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Сат',
            promptLatin: 'Sat',
            choices: [
              { text: 'hour / clock', isCorrect: true },
              { text: 'minute', isCorrect: false },
              { text: 'day', isCorrect: false },
            ],
          },
        ],
      },
    ],
    words: [
      { cyrillic: 'један', latin: 'jedan', translationRu: 'один', translationEn: 'one', exampleCyrillic: 'Имам један брат.', exampleTranslationRu: 'У меня одна кошка.', exampleTranslationEn: 'I have one brother.' },
      { cyrillic: 'два', latin: 'dva', translationRu: 'два', translationEn: 'two', exampleCyrillic: 'Два пута дневно.', exampleTranslationRu: 'Два стула стоят у стола.', exampleTranslationEn: 'Twice a day.' },
      { cyrillic: 'пет', latin: 'pet', translationRu: 'пять', translationEn: 'five', exampleCyrillic: 'Пет минута пешке.', exampleTranslationRu: 'Пять минут — это мало.', exampleTranslationEn: 'Five minutes on foot.' },
      { cyrillic: 'шест', latin: 'šest', translationRu: 'шесть', translationEn: 'six', exampleCyrillic: 'Имам шест књига.', exampleTranslationRu: 'Шесть книг на полке.', exampleTranslationEn: 'I have six books.' },
      { cyrillic: 'десет', latin: 'deset', translationRu: 'десять', translationEn: 'ten', exampleCyrillic: 'Десет прстију на рукама.', exampleTranslationRu: 'Десять учеников в классе.', exampleTranslationEn: 'Ten fingers on the hands.' },
      { cyrillic: 'сто', latin: 'sto', translationRu: 'сто', translationEn: 'hundred', exampleCyrillic: 'Сто динара.', exampleTranslationRu: 'Сто динаров — это мало.', exampleTranslationEn: 'A hundred dinars.' },
      { cyrillic: 'данас', latin: 'danas', translationRu: 'сегодня', translationEn: 'today', exampleCyrillic: 'Данас је леп дан.', exampleTranslationRu: 'Сегодня хороший день.', exampleTranslationEn: 'Today is a nice day.' },
      { cyrillic: 'сутра', latin: 'sutra', translationRu: 'завтра', translationEn: 'tomorrow', exampleCyrillic: 'Видимо се сутра.', exampleTranslationRu: 'Завтра мы поедем в Белград.', exampleTranslationEn: 'See you tomorrow.' },
      { cyrillic: 'сат', latin: 'sat', translationRu: 'час', translationEn: 'hour / clock', exampleCyrillic: 'Колико је сати?', exampleTranslationRu: 'Сколько часов?', exampleTranslationEn: 'What time is it?' },
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
      {
        title: 'На граници',
        titleLatin: 'Na granici',
        titleTranslation: 'At the border',
        exercises: [
          {
            promptCyrillic: 'Виза',
            promptLatin: 'Viza',
            choices: [
              { text: 'visa', isCorrect: true },
              { text: 'ticket', isCorrect: false },
              { text: 'passport', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Кофер',
            promptLatin: 'Kofer',
            choices: [
              { text: 'suitcase', isCorrect: true },
              { text: 'bag', isCorrect: false },
              { text: 'backpack', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Излаз',
            promptLatin: 'Izlaz',
            choices: [
              { text: 'exit', isCorrect: true },
              { text: 'entrance', isCorrect: false },
              { text: 'gate', isCorrect: false },
            ],
          },
        ],
      },
    ],
    words: [
      { cyrillic: 'станица', latin: 'stanica', translationRu: 'станция', translationEn: 'station', exampleCyrillic: 'Станица је близу.', exampleTranslationRu: 'Железнодорожная станция далеко.', exampleTranslationEn: 'The station is close.' },
      { cyrillic: 'аеродром', latin: 'aerodrom', translationRu: 'аэропорт', translationEn: 'airport', exampleCyrillic: 'Идемо на аеродром.', exampleTranslationRu: 'Мы летим из аэропорта.', exampleTranslationEn: "We're going to the airport." },
      { cyrillic: 'путовање', latin: 'putovanje', translationRu: 'путешествие', translationEn: 'journey / trip', exampleCyrillic: 'Пријатно путовање!', exampleTranslationRu: 'Путешествие было интересным.', exampleTranslationEn: 'Have a nice trip!' },
      { cyrillic: 'хотел', latin: 'hotel', translationRu: 'отель', translationEn: 'hotel', exampleCyrillic: 'Резервисао сам хотел.', exampleTranslationRu: 'Отель стоит у моря.', exampleTranslationEn: 'I booked a hotel.' },
      { cyrillic: 'карта', latin: 'karta', translationRu: 'билет', translationEn: 'ticket', exampleCyrillic: 'Купио сам карту за воз.', exampleTranslationRu: 'Я купил билет на поезд.', exampleTranslationEn: 'I bought a train ticket.' },
      { cyrillic: 'пасош', latin: 'pasoš', translationRu: 'паспорт', translationEn: 'passport', exampleCyrillic: 'Понесите пасош.', exampleTranslationRu: 'Не забудь паспорт.', exampleTranslationEn: 'Bring your passport.' },
      { cyrillic: 'виза', latin: 'viza', translationRu: 'виза', translationEn: 'visa', exampleCyrillic: 'Треба ми виза за путовање.', exampleTranslationRu: 'Виза нужна для поездки.', exampleTranslationEn: 'I need a visa to travel.' },
      { cyrillic: 'кофер', latin: 'kofer', translationRu: 'чемодан', translationEn: 'suitcase', exampleCyrillic: 'Спаковао сам кофер.', exampleTranslationRu: 'Чемодан тяжёлый.', exampleTranslationEn: 'I packed my suitcase.' },
      { cyrillic: 'излаз', latin: 'izlaz', translationRu: 'выход', translationEn: 'exit', exampleCyrillic: 'Излаз је лево.', exampleTranslationRu: 'Выход находится справа.', exampleTranslationEn: 'The exit is on the left.' },
    ],
  },
  {
    titleCyrillic: 'Људи',
    titleLatin: 'Ljudi',
    titleTranslation: 'Люди',
    lessons: [
      {
        title: 'Придеви',
        titleLatin: 'Pridevi',
        titleTranslation: 'Прилагательные',
        exercises: [
          {
            promptCyrillic: 'Он је стар.',
            promptLatin: 'On je star.',
            choices: [
              { text: 'Он старый.', isCorrect: true },
              { text: 'Он молодой.', isCorrect: false },
              { text: 'Он новый.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Она је добра.',
            promptLatin: 'Ona je dobra.',
            choices: [
              { text: 'Она добрая.', isCorrect: true },
              { text: 'Она молодая.', isCorrect: false },
              { text: 'Она высокого роста.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'То је лош филм.',
            promptLatin: 'To je loš film.',
            choices: [
              { text: 'Это плохой фильм.', isCorrect: true },
              { text: 'Это хороший фильм.', isCorrect: false },
              { text: 'Это новый фильм.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Ово је нова књига.',
            promptLatin: 'Ovo je nova knjiga.',
            choices: [
              { text: 'Это новая книга.', isCorrect: true },
              { text: 'Это старая книга.', isCorrect: false },
              { text: 'Это дорогая книга.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Ово је велики град.',
            promptLatin: 'Ovo je veliki grad.',
            choices: [
              { text: 'Это большой город.', isCorrect: true },
              { text: 'Это маленький город.', isCorrect: false },
              { text: 'Это старый город.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Данас је леп дан.',
            promptLatin: 'Danas je lep dan.',
            choices: [
              { text: 'Сегодня красивый день.', isCorrect: true },
              { text: 'Сегодня холодный день.', isCorrect: false },
              { text: 'Сегодня плохой день.', isCorrect: false },
            ],
          },
        ],
      },
    ],
    words: [
      { cyrillic: 'име', latin: 'ime', translationRu: 'имя', translationEn: 'name', exampleCyrillic: 'Моје име је Марта.', exampleTranslationRu: 'Как тебя зовут?', exampleTranslationEn: 'Моё имя Марта.' },
      { cyrillic: 'зовати се', latin: 'zovati se', translationRu: 'зоваться', translationEn: 'to be called', exampleCyrillic: 'Зовем се Ана.', exampleTranslationRu: 'Как тебя зовут?', exampleTranslationEn: 'Меня зовут Ана.' },
      { cyrillic: 'мој', latin: 'moj', translationRu: 'мой', translationEn: 'my', exampleCyrillic: 'Ово је мој стан.', exampleTranslationRu: 'Это мой дом.', exampleTranslationEn: 'Это моя квартира.' },
      { cyrillic: 'твој', latin: 'tvoj', translationRu: 'твой', translationEn: 'your', exampleCyrillic: 'Где је твоја књига?', exampleTranslationRu: 'Где твой брат?', exampleTranslationEn: 'Где твоя книга?' },
      { cyrillic: 'ја', latin: 'ja', translationRu: 'я', translationEn: 'I', exampleCyrillic: 'Ја сам из Русије.', exampleTranslationRu: 'Я учу сербский.', exampleTranslationEn: 'Я из России.' },
      { cyrillic: 'ти', latin: 'ti', translationRu: 'ты', translationEn: 'you', exampleCyrillic: 'Ти си мој пријатељ.', exampleTranslationRu: 'Ты говоришь по-сербски?', exampleTranslationEn: 'Ты мой друг.' },
      { cyrillic: 'он', latin: 'on', translationRu: 'он', translationEn: 'he', exampleCyrillic: 'Он је висок.', exampleTranslationRu: 'Он работает в школе.', exampleTranslationEn: 'Он высокий.' },
      { cyrillic: 'она', latin: 'ona', translationRu: 'она', translationEn: 'she', exampleCyrillic: 'Она је млада.', exampleTranslationRu: 'Она читает книгу.', exampleTranslationEn: 'Она молодая.' },
      { cyrillic: 'ми', latin: 'mi', translationRu: 'мы', translationEn: 'we', exampleCyrillic: 'Ми живимо у Београду.', exampleTranslationRu: 'Мы живём в Белграде.', exampleTranslationEn: 'Мы живём в Белграде.' },
      { cyrillic: 'српски', latin: 'srpski', translationRu: 'сербский', translationEn: 'Serbian', exampleCyrillic: 'Српски је леп језик.', exampleTranslationRu: 'Сербский — красивый язык.', exampleTranslationEn: 'Сербский — красивый язык.' },
      { cyrillic: 'језик', latin: 'jezik', translationRu: 'язык', translationEn: 'language', exampleCyrillic: 'Учиш ли српски језик?', exampleTranslationRu: 'Я учу новый язык.', exampleTranslationEn: 'Ты учишь сербский язык?' },
      { cyrillic: 'говорити', latin: 'govoriti', translationRu: 'говорить', translationEn: 'to speak', exampleCyrillic: 'Она добро говори српски.', exampleTranslationRu: 'Я хочу говорить по-сербски.', exampleTranslationEn: 'Она хорошо говорит по-сербски.' },
      { cyrillic: 'град', latin: 'grad', translationRu: 'город', translationEn: 'city', exampleCyrillic: 'Београд је велики град.', exampleTranslationRu: 'Белград — большой город.', exampleTranslationEn: 'Белград — большой город.' },
      { cyrillic: 'земља', latin: 'zemlja', translationRu: 'страна', translationEn: 'country', exampleCyrillic: 'Србија је мала земља.', exampleTranslationRu: 'Сербия — красивая страна.', exampleTranslationEn: 'Сербия — маленькая страна.' },
      { cyrillic: 'главни', latin: 'glavni', translationRu: 'главный', translationEn: 'main', exampleCyrillic: 'Главни град је Београд.', exampleTranslationRu: 'Белград — главный город.', exampleTranslationEn: 'Столица — Белград.' },
      { cyrillic: 'пријатељ', latin: 'prijatelj', translationRu: 'друг', translationEn: '', exampleCyrillic: 'Мој пријатељ живи у Новом Саду.', exampleTranslationRu: 'Он мой друг.', exampleTranslationEn: 'Мой друг живёт в Нови-Саде.' },
      { cyrillic: 'хвала', latin: 'hvala', translationRu: 'спасибо', translationEn: 'thanks', exampleCyrillic: 'Хвала на помоћи.', exampleTranslationRu: 'Спасибо за помощь.', exampleTranslationEn: 'Спасибо за помощь.' },
      { cyrillic: 'живети', latin: 'živeti', translationRu: 'жить', translationEn: 'to live', exampleCyrillic: 'Ја живим у Београду.', exampleTranslationRu: 'Я живу в Белграде.', exampleTranslationEn: 'Я живу в Белграде.' },
      { cyrillic: 'стан', latin: 'stan', translationRu: 'квартира', translationEn: 'apartment', exampleCyrillic: 'Наш стан је мали.', exampleTranslationRu: 'Квартира небольшая.', exampleTranslationEn: 'Наша квартира маленькая.' },
      { cyrillic: 'улица', latin: 'ulica', translationRu: 'улица', translationEn: 'street', exampleCyrillic: 'Улица је дуга.', exampleTranslationRu: 'Улица длинная.', exampleTranslationEn: 'Улица длинная.' },
      { cyrillic: 'зграда', latin: 'zgrada', translationRu: 'здание', translationEn: 'building', exampleCyrillic: 'Зграда има пет спратова.', exampleTranslationRu: 'Здание старое.', exampleTranslationEn: 'В здании пять этажей.' },
      { cyrillic: 'радити', latin: 'raditi', translationRu: 'работать', translationEn: 'to work', exampleCyrillic: 'Ја радим од јутра до вечери.', exampleTranslationRu: 'Он работает в больнице.', exampleTranslationEn: 'Я работаю с утра до вечера.' },
      { cyrillic: 'посао', latin: 'posao', translationRu: 'работа', translationEn: 'job', exampleCyrillic: 'Имам добар посао.', exampleTranslationRu: 'У неё хорошая работа.', exampleTranslationEn: 'У меня хорошая работа.' },
      { cyrillic: 'школа', latin: 'škola', translationRu: 'школа', translationEn: 'school', exampleCyrillic: 'Школа је близу дома.', exampleTranslationRu: 'Школа рядом с домом.', exampleTranslationEn: 'Школа рядом с домом.' },
      { cyrillic: 'ученик', latin: 'učenik', translationRu: 'ученик', translationEn: 'school student', exampleCyrillic: 'Он је ученик осмог разреда.', exampleTranslationRu: 'Ученик отвечает на вопрос.', exampleTranslationEn: 'Он ученик восьмого класса.' },
      { cyrillic: 'студент', latin: 'student', translationRu: 'студент', translationEn: 'university student', exampleCyrillic: 'Она је студентка права.', exampleTranslationRu: 'Студент читает книгу.', exampleTranslationEn: 'Она студентка юридического факультета.' },
      { cyrillic: 'наставник', latin: 'nastavnik', translationRu: 'учитель', translationEn: 'teacher', exampleCyrillic: 'Наш наставник је млад.', exampleTranslationRu: 'Учитель пишет на доске.', exampleTranslationEn: 'Наш преподаватель молодой.' },
      { cyrillic: 'лекар', latin: 'lekar', translationRu: 'врач', translationEn: 'doctor', exampleCyrillic: 'Лектор је у болници.', exampleTranslationRu: 'Врач осмотрел пациента.', exampleTranslationEn: 'Врач в больнице.' },
      { cyrillic: 'болница', latin: 'bolnica', translationRu: 'больница', translationEn: 'hospital', exampleCyrillic: 'Болница је далеко.', exampleTranslationRu: 'Больница в центре города.', exampleTranslationEn: 'Больница далеко.' },
      { cyrillic: 'инжењер', latin: 'inženjer', translationRu: 'инженер', translationEn: 'engineer', exampleCyrillic: 'Мој отац је инжењер.', exampleTranslationRu: 'Инженер строит мост.', exampleTranslationEn: 'Мой отец инженер.' },
      { cyrillic: 'сусед', latin: 'susjed', translationRu: 'сосед', translationEn: 'neighbor', exampleCyrillic: 'Наш сусед је добар човек.', exampleTranslationRu: 'Сосед пришёл в гости.', exampleTranslationEn: 'Наш сосед — хороший человек.' },
      { cyrillic: 'дом', latin: 'dom', translationRu: 'дом', translationEn: 'home', exampleCyrillic: 'Наш дом је нов.', exampleTranslationRu: 'Дом стоит на холме.', exampleTranslationEn: 'Наш дом новый.' },
      { cyrillic: 'широк', latin: 'širok', translationRu: 'широкий', translationEn: 'wide', exampleCyrillic: 'Река је широка.', exampleTranslationRu: 'Река широкая.', exampleTranslationEn: 'Река широкая.' },
      { cyrillic: 'дуг', latin: 'dug', translationRu: 'долгий', translationEn: 'long', exampleCyrillic: 'Он има велики дуг.', exampleTranslationRu: 'Дорога длинная.', exampleTranslationEn: 'У него большой долг.' },
      { cyrillic: 'млад', latin: 'mlad', translationRu: 'молодой', translationEn: 'young', exampleCyrillic: 'Млади човек је висок.', exampleTranslationRu: 'Молодой человек читает.', exampleTranslationEn: 'Молодой человек высокий.' },
      { cyrillic: 'стар', latin: 'star', translationRu: 'старый', translationEn: 'old', exampleCyrillic: 'Стар човек спава.', exampleTranslationRu: 'Старый человек сидит на скамье.', exampleTranslationEn: 'Старик спит.' },
      { cyrillic: 'висок', latin: 'visok', translationRu: 'высокий', translationEn: 'tall', exampleCyrillic: 'Она је висока.', exampleTranslationRu: 'Дерево высокое.', exampleTranslationEn: 'Она высокая.' },
      { cyrillic: 'низак', latin: 'nizak', translationRu: 'низкий', translationEn: 'short', exampleCyrillic: 'Он је низак.', exampleTranslationRu: 'Столик низкий.', exampleTranslationEn: 'Он невысокий.' },
      { cyrillic: 'добар', latin: 'dobar', translationRu: 'хороший', translationEn: 'good', exampleCyrillic: 'Ово је добар дан.', exampleTranslationRu: 'Он хороший человек.', exampleTranslationEn: 'Сегодня хороший день.' },
      { cyrillic: 'лош', latin: 'loš', translationRu: 'плохой', translationEn: 'bad', exampleCyrillic: 'Ово је лош дан.', exampleTranslationRu: 'Погода плохая.', exampleTranslationEn: 'Сегодня плохой день.' },
      { cyrillic: 'нов', latin: 'nov', translationRu: 'новый', translationEn: 'new', exampleCyrillic: 'Нов ауто је скуп.', exampleTranslationRu: 'Новый дом красивый.', exampleTranslationEn: 'Новая машина дорогая.' },
      { cyrillic: 'велики', latin: 'veliki', translationRu: 'большой', translationEn: 'big', exampleCyrillic: 'Велики град има много људи.', exampleTranslationRu: 'Большой город шумный.', exampleTranslationEn: 'В большом городе много людей.' },
      { cyrillic: 'мали', latin: 'mali', translationRu: 'маленький', translationEn: 'small', exampleCyrillic: 'Мали стан је јефтин.', exampleTranslationRu: 'Маленький ребёнок спит.', exampleTranslationEn: 'Маленькая квартира дешёвая.' },
      { cyrillic: 'леп', latin: 'lep', translationRu: 'красивый', translationEn: 'beautiful', exampleCyrillic: 'Леп дан за шетњу.', exampleTranslationRu: 'Красивый закат.', exampleTranslationEn: 'Красивый день для прогулки.' },
      { cyrillic: 'човек', latin: 'čovek', translationRu: 'человек', translationEn: 'person', exampleCyrillic: 'Он је добар човек.', exampleTranslationRu: 'Человек идёт по улице.', exampleTranslationEn: 'Он хороший человек.' },
      { cyrillic: 'дан', latin: 'dan', translationRu: 'день', translationEn: 'day', exampleCyrillic: 'Овај дан је слободан.', exampleTranslationRu: 'Сегодня хороший день.', exampleTranslationEn: 'Сегодня выходной.' },
      { cyrillic: 'боја', latin: 'boja', translationRu: 'цвет', translationEn: 'color', exampleCyrillic: 'Плава је моја омилјена боја.', exampleTranslationRu: 'Какой твой любимый цвет?', exampleTranslationEn: 'Синий — мой любимый цвет.' },
      { cyrillic: 'црвен', latin: 'crven', translationRu: 'красный', translationEn: 'red', exampleCyrillic: 'Црвена боја ми се свиђа.', exampleTranslationRu: 'Красный цвет — мой любимый.', exampleTranslationEn: 'Мне нравится красный цвет.' },
      { cyrillic: 'плав', latin: 'plav', translationRu: 'синий', translationEn: 'blue', exampleCyrillic: 'Плаво небо је лепо.', exampleTranslationRu: 'Небо синее.', exampleTranslationEn: 'Синее небо — красивое.' },
      { cyrillic: 'зелен', latin: 'zelen', translationRu: 'зелёный', translationEn: 'green', exampleCyrillic: 'Зелено воће је кисело.', exampleTranslationRu: 'Трава зелёная.', exampleTranslationEn: 'Зелёные фрукты кислые.' },
      { cyrillic: 'тешко', latin: 'teško', translationRu: 'трудно', translationEn: 'difficult', exampleCyrillic: 'Ово је тешко питање.', exampleTranslationRu: 'Экзамен был трудным.', exampleTranslationEn: 'Это трудный вопрос.' },
    ],
  },
  {
    titleCyrillic: 'Моя породица',
    titleLatin: 'Moja porodica',
    titleTranslation: 'Моя семья',
    lessons: [
      {
        title: 'Род',
        titleLatin: 'Rod',
        titleTranslation: 'Родные',
        exercises: [
          {
            promptCyrillic: 'Моја мајка кува.',
            promptLatin: 'Moja majka kuva.',
            choices: [
              { text: 'Мама готовит.', isCorrect: true },
              { text: 'Папа готовит.', isCorrect: false },
              { text: 'Мама спит.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Он је мој брат.',
            promptLatin: 'On je moj brat.',
            choices: [
              { text: 'Он мой брат.', isCorrect: true },
              { text: 'Она моя сестра.', isCorrect: false },
              { text: 'Он мой сын.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Моја породица је велика.',
            promptLatin: 'Moja porodica je velika.',
            choices: [
              { text: 'Моя семья большая.', isCorrect: true },
              { text: 'Моя семья маленькая.', isCorrect: false },
              { text: 'Мой дом большой.', isCorrect: false },
            ],
          },
        ],
      },
      {
        title: 'Шта волим',
        titleLatin: 'Šta volim',
        titleTranslation: 'Что я люблю',
        exercises: [
          {
            promptCyrillic: 'Ја волим кафу и чај.',
            promptLatin: 'Ja volim kafu i čaj.',
            choices: [
              { text: 'Я люблю кофе и чай.', isCorrect: true },
              { text: 'Я люблю чай и сок.', isCorrect: false },
              { text: 'Мне не нравится кофе.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Не волим месо.',
            promptLatin: 'Ne volim meso.',
            choices: [
              { text: 'Я не люблю мясо.', isCorrect: true },
              { text: 'Я люблю рыбу.', isCorrect: false },
              { text: 'Я не пью кофе.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Моја омилјена храна је пиле.',
            promptLatin: 'Moja omiljena hrana je pile.',
            choices: [
              { text: 'Моя любимая еда — курица.', isCorrect: true },
              { text: 'Моя любимая еда — рыба.', isCorrect: false },
              { text: 'Мой любимый напиток — чай.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Ја сам гладан.',
            promptLatin: 'Ja sam gladan.',
            choices: [
              { text: 'Я голодный.', isCorrect: true },
              { text: 'Я сытый.', isCorrect: false },
              { text: 'Я больной.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Сада сам сит.',
            promptLatin: 'Sada sam sit.',
            choices: [
              { text: 'Сейчас я сыт.', isCorrect: true },
              { text: 'Сейчас я голоден.', isCorrect: false },
              { text: 'Сейчас я хочу пить.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Жедан сам.',
            promptLatin: 'Žedan sam.',
            choices: [
              { text: 'Я хочу пить.', isCorrect: true },
              { text: 'Я проголодался.', isCorrect: false },
              { text: 'Я устал.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Воће је свежо.',
            promptLatin: 'Voće je sveže.',
            choices: [
              { text: 'Фрукты свежие.', isCorrect: true },
              { text: 'Фрукты кислые.', isCorrect: false },
              { text: 'Овощи свежие.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Ово ми се свиђа.',
            promptLatin: 'Ovo mi se sviđa.',
            choices: [
              { text: 'Мне это нравится.', isCorrect: true },
              { text: 'Мне это не нравится.', isCorrect: false },
              { text: 'Я это покупаю.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Не свиђа ми се.',
            promptLatin: 'Ne sviđa mi se.',
            choices: [
              { text: 'Мне это не нравится.', isCorrect: true },
              { text: 'Мне это нравится.', isCorrect: false },
              { text: 'Я это ем.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Шта волиш да једеш?',
            promptLatin: 'Šta voliš da jedeš?',
            choices: [
              { text: 'Что ты любишь есть?', isCorrect: true },
              { text: 'Что ты покупаешь?', isCorrect: false },
              { text: 'Где ты ешь?', isCorrect: false },
            ],
          },
        ],
      },
    ],
    words: [],
  },
  {
    titleCyrillic: 'Време',
    titleLatin: 'Vreme',
    titleTranslation: 'Время',
    lessons: [
      {
        title: 'Годишња доба',
        titleLatin: 'Godišnja doba',
        titleTranslation: 'Времена года',
        exercises: [
          {
            promptCyrillic: 'Зима',
            promptLatin: 'Zima',
            choices: [
              { text: 'зима', isCorrect: true },
              { text: 'лето', isCorrect: false },
              { text: 'осень', isCorrect: false },
            ],
          },
        ],
      },
    ],
    words: [
      { cyrillic: 'понедељак', latin: 'ponedeljak', translationRu: 'понедельник', translationEn: 'Monday', exampleCyrillic: 'Данас је понедељак.', exampleTranslationRu: 'Понедельник — первый день.', exampleTranslationEn: 'Сегодня понедельник.' },
      { cyrillic: 'уторак', latin: 'utorak', translationRu: 'вторник', translationEn: 'Tuesday', exampleCyrillic: 'Сутра је уторак.', exampleTranslationRu: 'Во вторник у меня встреча.', exampleTranslationEn: 'Завтра вторник.' },
      { cyrillic: 'среда', latin: 'sreda', translationRu: 'среда', translationEn: 'Wednesday', exampleCyrillic: 'Среда је мој омиљени дан.', exampleTranslationRu: 'В среду я иду в школу.', exampleTranslationEn: 'Среда — мой любимый день.' },
      { cyrillic: 'четвртак', latin: 'četvrtak', translationRu: 'четверг', translationEn: 'Thursday', exampleCyrillic: 'Четвртак је дан за куповину.', exampleTranslationRu: 'В четверг мы едем в гости.', exampleTranslationEn: 'Четверг — день для покупок.' },
      { cyrillic: 'петак', latin: 'petak', translationRu: 'пятница', translationEn: 'Friday', exampleCyrillic: 'Петак је крај недели.', exampleTranslationRu: 'Пятница — последний рабочий день.', exampleTranslationEn: 'Пятница — конец недели.' },
      { cyrillic: 'субота', latin: 'subota', translationRu: 'суббота', translationEn: 'Saturday', exampleCyrillic: 'Субота је слободан дан.', exampleTranslationRu: 'В субботу я отдыхаю.', exampleTranslationEn: 'Суббота — выходной.' },
      { cyrillic: 'недеља', latin: 'nedelja', translationRu: 'воскресенье', translationEn: 'Sunday', exampleCyrillic: 'Недеља је слободан дан.', exampleTranslationRu: 'В воскресенье я сплю допоздна.', exampleTranslationEn: 'Воскресенье — выходной.' },
      { cyrillic: 'јутро', latin: 'jutro', translationRu: 'утро', translationEn: 'morning', exampleCyrillic: 'Јутро је хладно.', exampleTranslationRu: 'Утро — лучшее время.', exampleTranslationEn: 'Утро холодное.' },
      { cyrillic: 'подне', latin: 'podne', translationRu: 'полдень', translationEn: 'noon', exampleCyrillic: 'Сад је подне.', exampleTranslationRu: 'В полдень жарко.', exampleTranslationEn: 'Сейчас полдень.' },
      { cyrillic: 'попладне', latin: 'popodne', translationRu: 'день', translationEn: 'afternoon', exampleCyrillic: 'У попладне идем у парк.', exampleTranslationRu: 'Днём мы гуляли в парке.', exampleTranslationEn: 'Днём я иду в парк.' },
      { cyrillic: 'сат', latin: 'sat', translationRu: 'час', translationEn: '', exampleCyrillic: 'Сат је на зиду.', exampleTranslationRu: 'Сколько часов?', exampleTranslationEn: 'Часы на стене.' },
      { cyrillic: 'минута', latin: 'minuta', translationRu: 'минута', translationEn: 'minute', exampleCyrillic: 'Чекajте пет минута.', exampleTranslationRu: 'Подожди одну минуту.', exampleTranslationEn: 'Подождите пять минут.' },
      { cyrillic: 'данас', latin: 'danas', translationRu: 'сегодня', translationEn: '', exampleCyrillic: 'Данас је леп дан.', exampleTranslationRu: 'Сегодня хороший день.', exampleTranslationEn: 'Сегодня красивый день.' },
      { cyrillic: 'сутра', latin: 'sutra', translationRu: 'завтра', translationEn: '', exampleCyrillic: 'Сутра идем на посао.', exampleTranslationRu: 'Завтра мы поедем в Белград.', exampleTranslationEn: 'Завтра я иду на работу.' },
      { cyrillic: 'јуче', latin: 'juče', translationRu: 'вчера', translationEn: 'yesterday', exampleCyrillic: 'Јуче је био петак.', exampleTranslationRu: 'Вчера я был в школе.', exampleTranslationEn: 'Вчера была пятница.' },
      { cyrillic: 'месец', latin: 'mesec', translationRu: 'месяц', translationEn: 'month', exampleCyrillic: 'Овај месец је март.', exampleTranslationRu: 'Месяц пролетел быстро.', exampleTranslationEn: 'Этот месяц — март.' },
      { cyrillic: 'годинa', latin: 'godina', translationRu: 'год', translationEn: 'year', exampleCyrillic: 'Она има двадесет година.', exampleTranslationRu: 'Год длится двенадцать месяцев.', exampleTranslationEn: 'Ей двадцать лет.' },
      { cyrillic: 'увек', latin: 'uvek', translationRu: 'всегда', translationEn: 'always', exampleCyrillic: 'Ја увек пијem кафу.', exampleTranslationRu: 'Я всегда учу слова.', exampleTranslationEn: 'Я всегда пью кофе.' },
      { cyrillic: 'понекад', latin: 'ponekad', translationRu: 'иногда', translationEn: 'sometimes', exampleCyrillic: 'Понекад читам књигу.', exampleTranslationRu: 'Иногда я хожу в кино.', exampleTranslationEn: 'Иногда я читаю книгу.' },
      { cyrillic: 'нула', latin: 'nula', translationRu: 'ноль', translationEn: 'zero', exampleCyrillic: 'Вани је нула степени.', exampleTranslationRu: 'Ноль градусов по Цельсию.', exampleTranslationEn: 'Сейчас ноль градусов.' },
      { cyrillic: 'једan', latin: 'jedan', translationRu: 'один', translationEn: '', exampleCyrillic: 'Једan сат је довољно.', exampleTranslationRu: 'Одного часа достаточно.', exampleTranslationEn: '' },
      { cyrillic: 'два', latin: 'dva', translationRu: 'два', translationEn: '', exampleCyrillic: 'Два сата су дуги.', exampleTranslationRu: 'Два стула стоят у стола.', exampleTranslationEn: 'Два часа — это долго.' },
      { cyrillic: 'три', latin: 'tri', translationRu: 'три', translationEn: '', exampleCyrillic: 'Имам три дана слободно.', exampleTranslationRu: 'У меня три дня выходных.', exampleTranslationEn: '' },
      { cyrillic: 'четири', latin: 'cetiri', translationRu: 'четыре', translationEn: 'four', exampleCyrillic: 'Четири дана до викенда.', exampleTranslationRu: 'Четыре сезона в году.', exampleTranslationEn: 'До выходных четыре дня.' },
      { cyrillic: 'пет', latin: 'pet', translationRu: 'пять', translationEn: '', exampleCyrillic: 'Пет минута, молим.', exampleTranslationRu: 'Пять минут — это мало.', exampleTranslationEn: 'Пять минут, пожалуйста.' },
      { cyrillic: 'шест', latin: 'šest', translationRu: 'шесть', translationEn: '', exampleCyrillic: 'Шест сати ујутру.', exampleTranslationRu: 'Шесть книг на полке.', exampleTranslationEn: 'Шесть утра.' },
      { cyrillic: 'седам', latin: 'sedam', translationRu: 'семь', translationEn: 'seven', exampleCyrillic: 'Седам ујутру је рано.', exampleTranslationRu: 'Семь дней в неделе.', exampleTranslationEn: 'Семь утра — рано.' },
      { cyrillic: 'осам', latin: 'osam', translationRu: 'восемь', translationEn: 'eight', exampleCyrillic: 'Осам сати ујутру идем на посао.', exampleTranslationRu: 'Восемь часов — время подъёма.', exampleTranslationEn: 'В восемь утра иду на работу.' },
      { cyrillic: 'девет', latin: 'devet', translationRu: 'девять', translationEn: 'nine', exampleCyrillic: 'У девет идем у кинo.', exampleTranslationRu: 'Девять месяцев — это долго.', exampleTranslationEn: 'В девять иду в кино.' },
      { cyrillic: 'десет', latin: 'deset', translationRu: 'десять', translationEn: '', exampleCyrillic: 'Десет минута чекања.', exampleTranslationRu: 'Десять учеников в классе.', exampleTranslationEn: 'Десять минут ожидания.' },
      { cyrillic: 'будити се', latin: 'buditi se', translationRu: 'просыпаться', translationEn: 'to wake up', exampleCyrillic: 'Будим се у седам.', exampleTranslationRu: 'Я просыпаюсь рано.', exampleTranslationEn: 'Я просыпаюсь в семь.' },
      { cyrillic: 'рано', latin: 'rano', translationRu: 'рано', translationEn: 'early', exampleCyrillic: 'Устајем рано.', exampleTranslationRu: 'Рано утром я пью кофе.', exampleTranslationEn: 'Я просыпаюсь рано.' },
      { cyrillic: 'касно', latin: 'kasno', translationRu: 'поздно', translationEn: 'late', exampleCyrillic: 'Она је дошла касно.', exampleTranslationRu: 'Я лёг поздно.', exampleTranslationEn: 'Она пришла поздно.' },
      { cyrillic: 'брзо', latin: 'brzo', translationRu: 'быстро', translationEn: 'fast', exampleCyrillic: 'Он говори брзо.', exampleTranslationRu: 'Он бежит быстро.', exampleTranslationEn: 'Он говорит быстро.' },
      { cyrillic: 'споро', latin: 'sporo', translationRu: 'медленно', translationEn: 'slowly', exampleCyrillic: 'Воз иде споро.', exampleTranslationRu: 'Черепашка движется медленно.', exampleTranslationEn: 'Поезд идёт медленно.' },
      { cyrillic: 'ноћас', latin: 'noćas', translationRu: 'сегодня ночью', translationEn: 'tonight', exampleCyrillic: 'Ноћас је хладно.', exampleTranslationRu: 'Сегодня ночью будет дождь.', exampleTranslationEn: 'Сегодня ночью холодно.' },
      { cyrillic: 'време', latin: 'vreme', translationRu: 'время; погода', translationEn: 'time; weather', exampleCyrillic: 'Време је лепo.', exampleTranslationRu: 'Какое сегодня время?', exampleTranslationEn: 'Погода хорошая.' },
      { cyrillic: 'сада', latin: 'sada', translationRu: 'сейчас', translationEn: 'now', exampleCyrillic: 'Сад сам слободан.', exampleTranslationRu: 'Сейчас я учу сербский.', exampleTranslationEn: 'Сейчас я свободен.' },
      { cyrillic: 'јануар', latin: 'januar', translationRu: 'январь', translationEn: 'January', exampleCyrillic: 'Јануар је хладан.', exampleTranslationRu: 'Январь — первый месяц.', exampleTranslationEn: 'Январь холодный.' },
      { cyrillic: 'фебруар', latin: 'februar', translationRu: 'февраль', translationEn: 'February', exampleCyrillic: 'У фебруару је хладно.', exampleTranslationRu: 'Февраль — самый короткий месяц.', exampleTranslationEn: 'В феврале холодно.' },
      { cyrillic: 'март', latin: 'mart', translationRu: 'март', translationEn: 'March', exampleCyrillic: 'Март је први проleћни месец.', exampleTranslationRu: 'В марте начинается весна.', exampleTranslationEn: 'Март — первый месяц весны.' },
      { cyrillic: 'април', latin: 'april', translationRu: 'апрель', translationEn: 'April', exampleCyrillic: 'Април је леп месец.', exampleTranslationRu: 'Апрель — тёплый месяц.', exampleTranslationEn: 'Апрель — красивый месяц.' },
      { cyrillic: 'мај', latin: 'maj', translationRu: 'май', translationEn: 'May', exampleCyrillic: 'У мају је топло.', exampleTranslationRu: 'В мае всё цветёт.', exampleTranslationEn: 'В мае тепло.' },
      { cyrillic: 'јун', latin: 'jun', translationRu: 'июнь', translationEn: 'June', exampleCyrillic: 'У јуну је вруће.', exampleTranslationRu: 'Июнь — начало лета.', exampleTranslationEn: 'В июне жарко.' },
      { cyrillic: 'јул', latin: 'jul', translationRu: 'июль', translationEn: 'July', exampleCyrillic: 'Јул је најтоплији месец.', exampleTranslationRu: 'Июль — жаркий месяц.', exampleTranslationEn: 'Июль — самый жаркий месяц.' },
      { cyrillic: 'август', latin: 'avgust', translationRu: 'август', translationEn: 'August', exampleCyrillic: 'Август је месец одмора.', exampleTranslationRu: 'В августе мы отдыхаем.', exampleTranslationEn: 'Август — месяц отдыха.' },
      { cyrillic: 'септембар', latin: 'septembar', translationRu: 'сентябрь', translationEn: 'September', exampleCyrillic: 'У септембру почиње школа.', exampleTranslationRu: 'В сентябре начинается школа.', exampleTranslationEn: 'В сентябре начинается школа.' },
      { cyrillic: 'октобар', latin: 'oktobar', translationRu: 'октябрь', translationEn: 'October', exampleCyrillic: 'У октобру је хладно.', exampleTranslationRu: 'Октябрь — золотая осень.', exampleTranslationEn: 'В октябре холодно.' },
      { cyrillic: 'новембар', latin: 'novembar', translationRu: 'ноябрь', translationEn: 'November', exampleCyrillic: 'Новембар је хладан.', exampleTranslationRu: 'Ноябрь — холодный месяц.', exampleTranslationEn: 'Ноябрь холодный.' },
      { cyrillic: 'децембар', latin: 'decembar', translationRu: 'декабрь', translationEn: 'December', exampleCyrillic: 'У децембру је мој рођендан.', exampleTranslationRu: 'Декабрь — праздничный месяц.', exampleTranslationEn: 'В декабре мой день рождения.' },
      { cyrillic: 'рођендан', latin: 'rođendan', translationRu: 'день рождения', translationEn: 'birthday', exampleCyrillic: 'Мој рођендан је у мају.', exampleTranslationRu: 'День рождения — весёлый праздник.', exampleTranslationEn: 'Мой день рождения в мае.' },
      { cyrillic: 'зима', latin: 'zima', translationRu: 'зима', translationEn: 'winter', exampleCyrillic: 'Зима је хладна.', exampleTranslationRu: 'Зима — холодное время года.', exampleTranslationEn: 'Зима холодная.' },
      { cyrillic: 'лето', latin: 'leto', translationRu: 'лето', translationEn: 'summer', exampleCyrillic: 'Лето је топло.', exampleTranslationRu: 'Лето — время отпусков.', exampleTranslationEn: 'Лето тёплое.' },
      { cyrillic: 'проleће', latin: 'proleće', translationRu: 'весна', translationEn: 'spring', exampleCyrillic: 'Проleће је лепo.', exampleTranslationRu: 'Весна — время цветов.', exampleTranslationEn: 'Весна прекрасна.' },
      { cyrillic: 'јесен', latin: 'jesen', translationRu: 'осень', translationEn: 'autumn', exampleCyrillic: 'Јесен је хладна.', exampleTranslationRu: 'Осень — листья желтеют.', exampleTranslationEn: 'Осень холодная.' },
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
  let wordsUpdated = 0;
  for (const unitSeed of UNITS) {
    const unit = await unitRepo.findOne({ where: { titleCyrillic: unitSeed.titleCyrillic } });
    for (const wordSeed of unitSeed.words) {
      let word = await wordRepo.findOne({ where: { cyrillic: wordSeed.cyrillic } });
      if (word) {
        // Update existing word
        word.translationRu = wordSeed.translationRu ?? '';
        word.translationEn = wordSeed.translationEn;
        word.exampleCyrillic = wordSeed.exampleCyrillic;
        word.exampleTranslationRu = wordSeed.exampleTranslationRu ?? null;
        word.exampleTranslationEn = wordSeed.exampleTranslationEn;
        await wordRepo.save(word);
        wordsUpdated++;
      } else {
        word = new Word();
        word.unit = unit ?? null;
        word.cyrillic = wordSeed.cyrillic;
        word.latin = wordSeed.latin;
        word.translationRu = wordSeed.translationRu ?? '';
        word.translationEn = wordSeed.translationEn;
        word.exampleCyrillic = wordSeed.exampleCyrillic;
        word.exampleTranslationRu = wordSeed.exampleTranslationRu ?? null;
        word.exampleTranslationEn = wordSeed.exampleTranslationEn;
        word.audioUrl = null;
        await wordRepo.save(word);
        wordsCreated++;
      }
    }
  }
  console.log(`Words: +${wordsCreated} new, ~${wordsUpdated} updated.`);

  let badgesCreated = 0;
  for (const badgeSeed of BADGES) {
    const existing = await badgeRepo.findOne({ where: { code: badgeSeed.code } });
    if (!existing) {
      await badgeRepo.save(badgeRepo.create(badgeSeed));
      badgesCreated++;
    }
  }
  console.log(`Badges: +${badgesCreated} new.`);

  // Seed admin user
  const userRepo = dataSource.getRepository(User);
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@rec.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin-password-change-me';

  let adminUser = await userRepo.findOne({ where: { email: adminEmail } });
  if (!adminUser) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    adminUser = userRepo.create({
      email: adminEmail,
      passwordHash,
      displayName: 'Administrator',
      role: UserRole.ADMIN,
      banned: false,
    });
    await userRepo.save(adminUser);
    console.log(`Admin user created: ${adminEmail}`);
  } else if (adminUser.role !== UserRole.ADMIN) {
    adminUser.role = UserRole.ADMIN;
    await userRepo.save(adminUser);
    console.log(`Existing user ${adminEmail} promoted to admin`);
  }

  await app.close();
  console.log('Done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
