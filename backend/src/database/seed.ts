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
  textRu: string;
  isCorrect: boolean;
}
interface ExerciseSeed {
  promptCyrillic: string;
  promptLatin: string;
  promptTranslationRu: string;
  promptTranslationEn: string;
  choices: ChoiceSeed[];
}
interface LessonSeed {
  title: string;
  titleLatin: string;
  titleTranslationRu: string;
  titleTranslationEn: string;
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
  titleTranslationRu: string;
  titleTranslationEn: string;
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
    titleTranslationRu: 'Алфавит',
    titleTranslationEn: 'Alphabet',
    lessons: [
      {
        title: 'Писмо',
        titleLatin: 'Pismo',
        titleTranslationRu: 'Алфавит',
        titleTranslationEn: 'Alphabet',
        exercises: [
          {
            promptCyrillic: 'Ђак',
            promptLatin: 'Đak',
            promptTranslationRu: 'ученик',
            promptTranslationEn: 'pupil / student',
            choices: [
              { text: 'pupil / student',
                textRu: 'ученик', isCorrect: true },
              { text: 'teacher',
                textRu: 'учитель', isCorrect: false },
              { text: 'school',
                textRu: 'школа', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Жена',
            promptLatin: 'Žena',
            promptTranslationRu: 'женщина',
            promptTranslationEn: 'woman',
            choices: [
              { text: 'woman',
                textRu: 'женщина', isCorrect: true },
              { text: 'man',
                textRu: 'мужчина', isCorrect: false },
              { text: 'girl',
                textRu: 'девочка', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Љубав',
            promptLatin: 'Ljubav',
            promptTranslationRu: 'любовь',
            promptTranslationEn: 'love',
            choices: [
              { text: 'love',
                textRu: 'любовь', isCorrect: true },
              { text: 'friendship',
                textRu: 'дружба', isCorrect: false },
              { text: 'family',
                textRu: 'семья', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Њива',
            promptLatin: 'Njiva',
            promptTranslationRu: 'поле',
            promptTranslationEn: 'field',
            choices: [
              { text: 'field',
                textRu: 'поле', isCorrect: true },
              { text: 'forest',
                textRu: 'лес', isCorrect: false },
              { text: 'garden',
                textRu: 'сад', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Ћирилица',
            promptLatin: 'Ćirilica',
            promptTranslationRu: 'кириллица',
            promptTranslationEn: 'Cyrillic script',
            choices: [
              { text: 'Cyrillic script',
                textRu: 'кириллица', isCorrect: true },
              { text: 'Latin script',
                textRu: 'латиница', isCorrect: false },
              { text: 'Serbian language',
                textRu: 'сербский язык', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Чај',
            promptLatin: 'Čaj',
            promptTranslationRu: 'чай',
            promptTranslationEn: 'tea',
            choices: [
              { text: 'tea',
                textRu: 'чай', isCorrect: true },
              { text: 'coffee',
                textRu: 'кофе', isCorrect: false },
              { text: 'juice',
                textRu: 'сок', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Џем',
            promptLatin: 'Džem',
            promptTranslationRu: 'джем',
            promptTranslationEn: 'jam',
            choices: [
              { text: 'jam',
                textRu: 'джем', isCorrect: true },
              { text: 'juice',
                textRu: 'сок', isCorrect: false },
              { text: 'candy',
                textRu: 'конфета', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Шума',
            promptLatin: 'Šuma',
            promptTranslationRu: 'лес',
            promptTranslationEn: 'forest',
            choices: [
              { text: 'forest',
                textRu: 'лес', isCorrect: true },
              { text: 'field',
                textRu: 'поле', isCorrect: false },
              { text: 'mountain',
                textRu: 'гора', isCorrect: false },
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
        titleTranslationRu: 'Ложные друзья',

        titleTranslationEn: 'False friends',
        exercises: [
          {
            promptCyrillic: 'Пас',
            promptLatin: 'Pas',
            promptTranslationRu: 'собака',
            promptTranslationEn: 'dog',
            choices: [
              { text: 'dog',
                textRu: 'собака', isCorrect: true },
              { text: 'cat',
                textRu: 'кошка', isCorrect: false },
              { text: 'bird',
                textRu: 'птица', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Рука',
            promptLatin: 'Ruka',
            promptTranslationRu: 'рука',
            promptTranslationEn: 'hand / arm',
            choices: [
              { text: 'hand / arm',
                textRu: 'рука', isCorrect: true },
              { text: 'leg',
                textRu: 'нога', isCorrect: false },
              { text: 'head',
                textRu: 'голова', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Нос',
            promptLatin: 'Nos',
            promptTranslationRu: 'нос',
            promptTranslationEn: 'nose',
            choices: [
              { text: 'nose',
                textRu: 'нос', isCorrect: true },
              { text: 'mouth',
                textRu: 'рот', isCorrect: false },
              { text: 'ear',
                textRu: 'ухо', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Уста',
            promptLatin: 'Usta',
            promptTranslationRu: 'рот',
            promptTranslationEn: 'mouth',
            choices: [
              { text: 'mouth',
                textRu: 'рот', isCorrect: true },
              { text: 'nose',
                textRu: 'нос', isCorrect: false },
              { text: 'eye',
                textRu: 'глаз', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Хлад',
            promptLatin: 'Hlad',
            promptTranslationRu: 'прохлада',
            promptTranslationEn: 'coolness / shade',
            choices: [
              { text: 'coolness / shade',
                textRu: 'прохлада', isCorrect: true },
              { text: 'heat',
                textRu: 'жара', isCorrect: false },
              { text: 'wind',
                textRu: 'ветер', isCorrect: false },
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
    titleTranslationRu: 'Приветствия',

    titleTranslationEn: 'Greetings',
    lessons: [
      {
        title: 'Поздрави',
        titleLatin: 'Pozdravi',
        titleTranslationRu: 'Приветствия',

        titleTranslationEn: 'Greetings',
        exercises: [
          {
            promptCyrillic: 'Добро јутро!',
            promptLatin: 'Dobro jutro!',
            promptTranslationRu: 'Good morning!',
            promptTranslationEn: 'Good morning!',
            choices: [
              { text: 'Good morning!',
                textRu: 'Good morning!', isCorrect: true },
              { text: 'Good night!',
                textRu: 'Good night!', isCorrect: false },
              { text: 'Good afternoon!',
                textRu: 'Good afternoon!', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Добро вече!',
            promptLatin: 'Dobro veče!',
            promptTranslationRu: 'Good evening!',
            promptTranslationEn: 'Good evening!',
            choices: [
              { text: 'Good evening!',
                textRu: 'Good evening!', isCorrect: true },
              { text: 'Good morning!',
                textRu: 'Good morning!', isCorrect: false },
              { text: 'Goodbye!',
                textRu: 'Goodbye!', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Како си?',
            promptLatin: 'Kako si?',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'How are you?', textRu: 'How are you?', isCorrect: true },
              { text: "What's your name?", textRu: "Как вас зовут?", isCorrect: false },
              { text: 'Where are you?', textRu: 'Where are you?', isCorrect: false },
            ],
          },
        ],
      },
      {
        title: 'Учтивост',
        titleLatin: 'Učtivost',
        titleTranslationRu: 'Вежливость',

        titleTranslationEn: 'Politeness',
        exercises: [
          {
            promptCyrillic: 'Довиђења!',
            promptLatin: 'Doviđenja!',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Goodbye!', textRu: 'Goodbye!', isCorrect: true },
              { text: 'Good night!', textRu: 'Good night!', isCorrect: false },
              { text: 'Good morning!', textRu: 'Good morning!', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Молим!',
            promptLatin: 'Molim!',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: "Please! / You're welcome!", textRu: "Пожалуйста! / Не за что!", isCorrect: true },
              { text: 'Sorry!', textRu: 'Sorry!', isCorrect: false },
              { text: 'Thanks!', textRu: 'Thanks!', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Извините.',
            promptLatin: 'Izvinite.',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Excuse me.', textRu: 'Excuse me.', isCorrect: true },
              { text: 'Thank you.', textRu: 'Thank you.', isCorrect: false },
              { text: 'Goodbye.', textRu: 'Goodbye.', isCorrect: false },
            ],
          },
        ],
      },
      {
        title: 'Представљање',
        titleLatin: 'Predstavljanje',
        titleTranslationRu: 'Знакомство',

        titleTranslationEn: 'Introductions',
        exercises: [
          {
            promptCyrillic: 'Ја сам Милица.',
            promptLatin: 'Ja sam Milica.',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'I am Milica.', textRu: 'I am Milica.', isCorrect: true },
              { text: 'I have Milica.', textRu: 'I have Milica.', isCorrect: false },
              { text: 'I like Milica.', textRu: 'I like Milica.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Драго ми је.',
            promptLatin: 'Drago mi je.',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Nice to meet you.', textRu: 'Nice to meet you.', isCorrect: true },
              { text: 'Thank you very much.', textRu: 'Thank you very much.', isCorrect: false },
              { text: 'See you soon.', textRu: 'See you soon.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Одакле си?',
            promptLatin: 'Odakle si?',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Where are you from?', textRu: 'Where are you from?', isCorrect: true },
              { text: 'How old are you?', textRu: 'How old are you?', isCorrect: false },
              { text: 'What do you do?', textRu: 'What do you do?', isCorrect: false },
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
    titleTranslationRu: 'Семья',

    titleTranslationEn: 'Family',
    lessons: [
      {
        title: 'Породица',
        titleLatin: 'Porodica',
        titleTranslationRu: 'Семья',

        titleTranslationEn: 'Family',
        exercises: [
          {
            promptCyrillic: 'Мајка',
            promptLatin: 'Majka',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'mother', textRu: 'mother', isCorrect: true },
              { text: 'father', textRu: 'father', isCorrect: false },
              { text: 'sister', textRu: 'sister', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Отац',
            promptLatin: 'Otac',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'father', textRu: 'father', isCorrect: true },
              { text: 'brother', textRu: 'brother', isCorrect: false },
              { text: 'mother', textRu: 'mother', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Сестра',
            promptLatin: 'Sestra',
            promptTranslationRu: 'сестра',
            promptTranslationEn: 'sister',
            choices: [
              { text: 'sister',
                textRu: 'сестра', isCorrect: true },
              { text: 'brother',
                textRu: 'брат', isCorrect: false },
              { text: 'mother',
                textRu: 'мать', isCorrect: false },
            ],
          },
        ],
      },
      {
        title: 'Родбина',
        titleLatin: 'Rodbina',
        titleTranslationRu: 'Родственники',

        titleTranslationEn: 'Relatives',
        exercises: [
          {
            promptCyrillic: 'Брат',
            promptLatin: 'Brat',
            promptTranslationRu: 'брат',
            promptTranslationEn: 'brother',
            choices: [
              { text: 'brother',
                textRu: 'брат', isCorrect: true },
              { text: 'sister',
                textRu: 'сестра', isCorrect: false },
              { text: 'cousin',
                textRu: 'cousin', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Деда',
            promptLatin: 'Deda',
            promptTranslationRu: 'grandfather',
            promptTranslationEn: 'grandfather',
            choices: [
              { text: 'grandfather',
                textRu: 'grandfather', isCorrect: true },
              { text: 'grandmother',
                textRu: 'grandmother', isCorrect: false },
              { text: 'uncle',
                textRu: 'дядя', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Баба',
            promptLatin: 'Baba',
            promptTranslationRu: 'grandmother',
            promptTranslationEn: 'grandmother',
            choices: [
              { text: 'grandmother',
                textRu: 'grandmother', isCorrect: true },
              { text: 'grandfather',
                textRu: 'grandfather', isCorrect: false },
              { text: 'aunt',
                textRu: 'тетя', isCorrect: false },
            ],
          },
        ],
      },
      {
        title: 'Кућа',
        titleLatin: 'Kuća',
        titleTranslationRu: 'Дом',

        titleTranslationEn: 'Home',
        exercises: [
          {
            promptCyrillic: 'Кућа',
            promptLatin: 'Kuća',
            promptTranslationRu: 'дом',
            promptTranslationEn: 'house',
            choices: [
              { text: 'house',
                textRu: 'дом', isCorrect: true },
              { text: 'apartment',
                textRu: 'квартира', isCorrect: false },
              { text: 'yard',
                textRu: 'yard', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Соба',
            promptLatin: 'Soba',
            promptTranslationRu: 'комната',
            promptTranslationEn: 'room',
            choices: [
              { text: 'room',
                textRu: 'комната', isCorrect: true },
              { text: 'kitchen',
                textRu: 'кухня', isCorrect: false },
              { text: 'bathroom',
                textRu: 'bathroom', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Врата',
            promptLatin: 'Vrata',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'door', textRu: 'door', isCorrect: true },
              { text: 'window', textRu: 'window', isCorrect: false },
              { text: 'wall', textRu: 'wall', isCorrect: false },
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
    titleTranslationRu: 'Еда',

    titleTranslationEn: 'Food',
    lessons: [
      {
        title: 'Храна',
        titleLatin: 'Hrana',
        titleTranslationRu: 'Еда',

        titleTranslationEn: 'Food',
        exercises: [
          {
            promptCyrillic: 'Хлеб',
            promptLatin: 'Hleb',
            promptTranslationRu: 'хлеб',
            promptTranslationEn: 'bread',
            choices: [
              { text: 'bread',
                textRu: 'хлеб', isCorrect: true },
              { text: 'milk',
                textRu: 'milk', isCorrect: false },
              { text: 'water',
                textRu: 'вода', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Вода',
            promptLatin: 'Voda',
            promptTranslationRu: 'вода',
            promptTranslationEn: 'water',
            choices: [
              { text: 'water',
                textRu: 'вода', isCorrect: true },
              { text: 'wine',
                textRu: 'wine', isCorrect: false },
              { text: 'bread',
                textRu: 'bread', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Хвала на храни.',
            promptLatin: 'Hvala na hrani.',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Thanks for the food.', textRu: 'Thanks for the food.', isCorrect: true },
              { text: 'Thanks for the help.', textRu: 'Thanks for the help.', isCorrect: false },
              { text: 'See you later.', textRu: 'See you later.', isCorrect: false },
            ],
          },
        ],
      },
      {
        title: 'Више хране',
        titleLatin: 'Više hrane',
        titleTranslationRu: 'Больше еды',

        titleTranslationEn: 'More food',
        exercises: [
          {
            promptCyrillic: 'Јабука',
            promptLatin: 'Jabuka',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'apple', textRu: 'apple', isCorrect: true },
              { text: 'orange', textRu: 'orange', isCorrect: false },
              { text: 'banana', textRu: 'banana', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Месо',
            promptLatin: 'Meso',
            promptTranslationRu: 'мясо',
            promptTranslationEn: 'meat',
            choices: [
              { text: 'meat',
                textRu: 'мясо', isCorrect: true },
              { text: 'fish',
                textRu: 'рыба', isCorrect: false },
              { text: 'cheese',
                textRu: 'cheese', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Кафа',
            promptLatin: 'Kafa',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'coffee', textRu: 'coffee', isCorrect: true },
              { text: 'tea', textRu: 'tea', isCorrect: false },
              { text: 'juice', textRu: 'juice', isCorrect: false },
            ],
          },
        ],
      },
      {
        title: 'У ресторану',
        titleLatin: 'U restoranu',
        titleTranslationRu: 'В ресторане',

        titleTranslationEn: 'At the restaurant',
        exercises: [
          {
            promptCyrillic: 'Рачун, молим.',
            promptLatin: 'Račun, molim.',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'The bill, please.', textRu: 'The bill, please.', isCorrect: true },
              { text: 'The menu, please.', textRu: 'The menu, please.', isCorrect: false },
              { text: 'Water, please.', textRu: 'Water, please.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Укусно!',
            promptLatin: 'Ukusno!',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Delicious!', textRu: 'Delicious!', isCorrect: true },
              { text: 'Disgusting!', textRu: 'Disgusting!', isCorrect: false },
              { text: 'Spicy!', textRu: 'Spicy!', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Со',
            promptLatin: 'So',
            promptTranslationRu: 'соль',
            promptTranslationEn: 'salt',
            choices: [
              { text: 'salt',
                textRu: 'соль', isCorrect: true },
              { text: 'sugar',
                textRu: 'сахар', isCorrect: false },
              { text: 'pepper',
                textRu: 'перец', isCorrect: false },
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
    titleTranslationRu: 'Числа',

    titleTranslationEn: 'Numbers',
    lessons: [
      {
        title: 'Бројеви',
        titleLatin: 'Brojevi',
        titleTranslationRu: 'Числа',

        titleTranslationEn: 'Numbers',
        exercises: [
          {
            promptCyrillic: 'Један',
            promptLatin: 'Jedan',
            promptTranslationRu: 'один',
            promptTranslationEn: 'one',
            choices: [
              { text: 'one',
                textRu: 'один', isCorrect: true },
              { text: 'two',
                textRu: 'два', isCorrect: false },
              { text: 'three',
                textRu: 'три', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Два',
            promptLatin: 'Dva',
            promptTranslationRu: 'два',
            promptTranslationEn: 'two',
            choices: [
              { text: 'two',
                textRu: 'два', isCorrect: true },
              { text: 'one',
                textRu: 'one', isCorrect: false },
              { text: 'four',
                textRu: 'четыре', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Пет',
            promptLatin: 'Pet',
            promptTranslationRu: 'пять',
            promptTranslationEn: 'five',
            choices: [
              { text: 'five',
                textRu: 'пять', isCorrect: true },
              { text: 'six',
                textRu: 'шесть', isCorrect: false },
              { text: 'four',
                textRu: 'четыре', isCorrect: false },
            ],
          },
        ],
      },
      {
        title: 'Више бројева',
        titleLatin: 'Više brojeva',
        titleTranslationRu: 'Больше чисел',

        titleTranslationEn: 'More numbers',
        exercises: [
          {
            promptCyrillic: 'Шест',
            promptLatin: 'Šest',
            promptTranslationRu: 'шесть',
            promptTranslationEn: 'six',
            choices: [
              { text: 'six',
                textRu: 'шесть', isCorrect: true },
              { text: 'seven',
                textRu: 'семь', isCorrect: false },
              { text: 'eight',
                textRu: 'eight', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Десет',
            promptLatin: 'Deset',
            promptTranslationRu: 'десять',
            promptTranslationEn: 'ten',
            choices: [
              { text: 'ten',
                textRu: 'десять', isCorrect: true },
              { text: 'nine',
                textRu: 'девять', isCorrect: false },
              { text: 'eleven',
                textRu: 'одиннадцать', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Сто',
            promptLatin: 'Sto',
            promptTranslationRu: 'сто',
            promptTranslationEn: 'hundred',
            choices: [
              { text: 'hundred',
                textRu: 'сто', isCorrect: true },
              { text: 'thousand',
                textRu: 'тысяча', isCorrect: false },
              { text: 'ten',
                textRu: 'десять', isCorrect: false },
            ],
          },
        ],
      },
      {
        title: 'Време и датуми',
        titleLatin: 'Vreme i datumi',
        titleTranslationRu: 'Время и даты',

        titleTranslationEn: 'Time and dates',
        exercises: [
          {
            promptCyrillic: 'Данас',
            promptLatin: 'Danas',
            promptTranslationRu: 'сегодня',
            promptTranslationEn: 'today',
            choices: [
              { text: 'today',
                textRu: 'сегодня', isCorrect: true },
              { text: 'tomorrow',
                textRu: 'завтра', isCorrect: false },
              { text: 'yesterday',
                textRu: 'вчера', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Сутра',
            promptLatin: 'Sutra',
            promptTranslationRu: 'завтра',
            promptTranslationEn: 'tomorrow',
            choices: [
              { text: 'tomorrow',
                textRu: 'завтра', isCorrect: true },
              { text: 'today',
                textRu: 'сегодня', isCorrect: false },
              { text: 'yesterday',
                textRu: 'вчера', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Сат',
            promptLatin: 'Sat',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'hour / clock', textRu: 'hour / clock', isCorrect: true },
              { text: 'minute', textRu: 'minute', isCorrect: false },
              { text: 'day', textRu: 'day', isCorrect: false },
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
    titleTranslationRu: 'Путешествие',

    titleTranslationEn: 'Travel',
    lessons: [
      {
        title: 'Путовање',
        titleLatin: 'Putovanje',
        titleTranslationRu: 'Путешествие',

        titleTranslationEn: 'Travel',
        exercises: [
          {
            promptCyrillic: 'Где је станица?',
            promptLatin: 'Gde je stanica?',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Where is the station?', textRu: 'Where is the station?', isCorrect: true },
              { text: 'Where is the hotel?', textRu: 'Where is the hotel?', isCorrect: false },
              { text: 'How much is it?', textRu: 'How much is it?', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Колико кошта?',
            promptLatin: 'Koliko košta?',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'How much does it cost?', textRu: 'How much does it cost?', isCorrect: true },
              { text: 'Where is it?', textRu: 'Where is it?', isCorrect: false },
              { text: 'What time is it?', textRu: 'What time is it?', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Аеродром',
            promptLatin: 'Aerodrom',
            promptTranslationRu: 'аэропорт',
            promptTranslationEn: 'airport',
            choices: [
              { text: 'airport',
                textRu: 'аэропорт', isCorrect: true },
              { text: 'station',
                textRu: 'вокзал', isCorrect: false },
              { text: 'hotel',
                textRu: 'отель', isCorrect: false },
            ],
          },
        ],
      },
      {
        title: 'Смештај',
        titleLatin: 'Smeštaj',
        titleTranslationRu: 'Проживание',

        titleTranslationEn: 'Accommodation',
        exercises: [
          {
            promptCyrillic: 'Хотел',
            promptLatin: 'Hotel',
            promptTranslationRu: 'отель',
            promptTranslationEn: 'hotel',
            choices: [
              { text: 'hotel',
                textRu: 'отель', isCorrect: true },
              { text: 'airport',
                textRu: 'airport', isCorrect: false },
              { text: 'station',
                textRu: 'station', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Карта',
            promptLatin: 'Karta',
            promptTranslationRu: 'билет',
            promptTranslationEn: 'ticket',
            choices: [
              { text: 'ticket',
                textRu: 'билет', isCorrect: true },
              { text: 'map',
                textRu: 'карта', isCorrect: false },
              { text: 'passport',
                textRu: 'passport', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Пасош',
            promptLatin: 'Pasoš',
            promptTranslationRu: 'паспорт',
            promptTranslationEn: 'passport',
            choices: [
              { text: 'passport',
                textRu: 'паспорт', isCorrect: true },
              { text: 'ticket',
                textRu: 'ticket', isCorrect: false },
              { text: 'map',
                textRu: 'map', isCorrect: false },
            ],
          },
        ],
      },
      {
        title: 'На граници',
        titleLatin: 'Na granici',
        titleTranslationRu: 'На границе',

        titleTranslationEn: 'At the border',
        exercises: [
          {
            promptCyrillic: 'Виза',
            promptLatin: 'Viza',
            promptTranslationRu: 'виза',
            promptTranslationEn: 'visa',
            choices: [
              { text: 'visa',
                textRu: 'виза', isCorrect: true },
              { text: 'ticket',
                textRu: 'билет', isCorrect: false },
              { text: 'passport',
                textRu: 'паспорт', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Кофер',
            promptLatin: 'Kofer',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'suitcase', textRu: 'suitcase', isCorrect: true },
              { text: 'bag', textRu: 'bag', isCorrect: false },
              { text: 'backpack', textRu: 'backpack', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Излаз',
            promptLatin: 'Izlaz',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'exit', textRu: 'exit', isCorrect: true },
              { text: 'entrance', textRu: 'entrance', isCorrect: false },
              { text: 'gate', textRu: 'gate', isCorrect: false },
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
    titleTranslationRu: 'Люди',

    titleTranslationEn: 'People',
    lessons: [
      {
        title: 'Придеви',
        titleLatin: 'Pridevi',
        titleTranslationRu: 'Прилагательные',

        titleTranslationEn: 'Adjectives',
        exercises: [
          {
            promptCyrillic: 'Он је стар.',
            promptLatin: 'On je star.',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Он старый.', textRu: 'Он старый.', isCorrect: true },
              { text: 'Он молодой.', textRu: 'Он молодой.', isCorrect: false },
              { text: 'Он новый.', textRu: 'Он новый.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Она је добра.',
            promptLatin: 'Ona je dobra.',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Она добрая.', textRu: 'Она добрая.', isCorrect: true },
              { text: 'Она молодая.', textRu: 'Она молодая.', isCorrect: false },
              { text: 'Она высокого роста.', textRu: 'Она высокого роста.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'То је лош филм.',
            promptLatin: 'To je loš film.',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Это плохой фильм.', textRu: 'Это плохой фильм.', isCorrect: true },
              { text: 'Это хороший фильм.', textRu: 'Это хороший фильм.', isCorrect: false },
              { text: 'Это новый фильм.', textRu: 'Это новый фильм.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Ово је нова књига.',
            promptLatin: 'Ovo je nova knjiga.',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Это новая книга.', textRu: 'Это новая книга.', isCorrect: true },
              { text: 'Это старая книга.', textRu: 'Это старая книга.', isCorrect: false },
              { text: 'Это дорогая книга.', textRu: 'Это дорогая книга.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Ово је велики град.',
            promptLatin: 'Ovo je veliki grad.',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Это большой город.', textRu: 'Это большой город.', isCorrect: true },
              { text: 'Это маленький город.', textRu: 'Это маленький город.', isCorrect: false },
              { text: 'Это старый город.', textRu: 'Это старый город.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Данас је леп дан.',
            promptLatin: 'Danas je lep dan.',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Сегодня красивый день.', textRu: 'Сегодня красивый день.', isCorrect: true },
              { text: 'Сегодня холодный день.', textRu: 'Сегодня холодный день.', isCorrect: false },
              { text: 'Сегодня плохой день.', textRu: 'Сегодня плохой день.', isCorrect: false },
            ],
          },
        ],
      },
    ],
    words: [
      { cyrillic: 'име', latin: 'ime', translationRu: 'имя', translationEn: 'name', exampleCyrillic: 'Моје име је Марта.', exampleTranslationRu: 'Как тебя зовут?', exampleTranslationEn: 'My name is Marta.' },
      { cyrillic: 'зовати се', latin: 'zovati se', translationRu: 'зоваться', translationEn: 'to be called', exampleCyrillic: 'Зовем се Ана.', exampleTranslationRu: 'Как тебя зовут?', exampleTranslationEn: 'I am called Ana.' },
      { cyrillic: 'мој', latin: 'moj', translationRu: 'мой', translationEn: 'my', exampleCyrillic: 'Ово је мој стан.', exampleTranslationRu: 'Это мой дом.', exampleTranslationEn: 'This is my apartment.' },
      { cyrillic: 'твој', latin: 'tvoj', translationRu: 'твой', translationEn: 'your', exampleCyrillic: 'Где је твоја књига?', exampleTranslationRu: 'Где твой брат?', exampleTranslationEn: 'Where is your book?' },
      { cyrillic: 'ја', latin: 'ja', translationRu: 'я', translationEn: 'I', exampleCyrillic: 'Ја сам из Русије.', exampleTranslationRu: 'Я учу сербский.', exampleTranslationEn: 'I am from Russia.' },
      { cyrillic: 'ти', latin: 'ti', translationRu: 'ты', translationEn: 'you', exampleCyrillic: 'Ти си мој пријатељ.', exampleTranslationRu: 'Ты говоришь по-сербски?', exampleTranslationEn: 'You are my friend.' },
      { cyrillic: 'он', latin: 'on', translationRu: 'он', translationEn: 'he', exampleCyrillic: 'Он је висок.', exampleTranslationRu: 'Он работает в школе.', exampleTranslationEn: 'He is tall.' },
      { cyrillic: 'она', latin: 'ona', translationRu: 'она', translationEn: 'she', exampleCyrillic: 'Она је млада.', exampleTranslationRu: 'Она читает книгу.', exampleTranslationEn: 'She is young.' },
      { cyrillic: 'ми', latin: 'mi', translationRu: 'мы', translationEn: 'we', exampleCyrillic: 'Ми живимо у Београду.', exampleTranslationRu: 'Мы живём в Белграде.', exampleTranslationEn: 'We live in Belgrade.' },
      { cyrillic: 'српски', latin: 'srpski', translationRu: 'сербский', translationEn: 'Serbian', exampleCyrillic: 'Српски је леп језик.', exampleTranslationRu: 'Сербский — красивый язык.', exampleTranslationEn: 'Serbian is a beautiful language.' },
      { cyrillic: 'језик', latin: 'jezik', translationRu: 'язык', translationEn: 'language', exampleCyrillic: 'Учиш ли српски језик?', exampleTranslationRu: 'Я учу новый язык.', exampleTranslationEn: 'Are you learning Serbian?' },
      { cyrillic: 'говорити', latin: 'govoriti', translationRu: 'говорить', translationEn: 'to speak', exampleCyrillic: 'Она добро говори српски.', exampleTranslationRu: 'Я хочу говорить по-сербски.', exampleTranslationEn: 'She speaks Serbian well.' },
      { cyrillic: 'град', latin: 'grad', translationRu: 'город', translationEn: 'city', exampleCyrillic: 'Београд је велики град.', exampleTranslationRu: 'Белград — большой город.', exampleTranslationEn: 'Belgrade is a big city.' },
      { cyrillic: 'земља', latin: 'zemlja', translationRu: 'страна', translationEn: 'country', exampleCyrillic: 'Србија је мала земља.', exampleTranslationRu: 'Сербия — красивая страна.', exampleTranslationEn: 'Serbia is a small country.' },
      { cyrillic: 'главни', latin: 'glavni', translationRu: 'главный', translationEn: 'main', exampleCyrillic: 'Главни град је Београд.', exampleTranslationRu: 'Белград — главный город.', exampleTranslationEn: 'The capital is Belgrade.' },
      { cyrillic: 'пријатељ', latin: 'prijatelj', translationRu: 'друг', translationEn: 'friend', exampleCyrillic: 'Мој пријатељ живи у Новом Саду.', exampleTranslationRu: 'Он мой друг.', exampleTranslationEn: 'My friend lives in Novi Sad.' },
      { cyrillic: 'хвала', latin: 'hvala', translationRu: 'спасибо', translationEn: 'thanks', exampleCyrillic: 'Хвала на помоћи.', exampleTranslationRu: 'Спасибо за помощь.', exampleTranslationEn: 'Thanks for the help.' },
      { cyrillic: 'живети', latin: 'živeti', translationRu: 'жить', translationEn: 'to live', exampleCyrillic: 'Ја живим у Београду.', exampleTranslationRu: 'Я живу в Белграде.', exampleTranslationEn: 'I live in Belgrade.' },
      { cyrillic: 'стан', latin: 'stan', translationRu: 'квартира', translationEn: 'apartment', exampleCyrillic: 'Наш стан је мали.', exampleTranslationRu: 'Квартира небольшая.', exampleTranslationEn: 'Our apartment is small.' },
      { cyrillic: 'улица', latin: 'ulica', translationRu: 'улица', translationEn: 'street', exampleCyrillic: 'Улица је дуга.', exampleTranslationRu: 'Улица длинная.', exampleTranslationEn: 'The street is long.' },
      { cyrillic: 'зграда', latin: 'zgrada', translationRu: 'здание', translationEn: 'building', exampleCyrillic: 'Зграда има пет спратова.', exampleTranslationRu: 'Здание старое.', exampleTranslationEn: 'The building has five floors.' },
      { cyrillic: 'радити', latin: 'raditi', translationRu: 'работать', translationEn: 'to work', exampleCyrillic: 'Ја радим од јутра до вечери.', exampleTranslationRu: 'Он работает в больнице.', exampleTranslationEn: 'I work from morning to evening.' },
      { cyrillic: 'посао', latin: 'posao', translationRu: 'работа', translationEn: 'job', exampleCyrillic: 'Имам добар посао.', exampleTranslationRu: 'У неё хорошая работа.', exampleTranslationEn: 'I have a good job.' },
      { cyrillic: 'школа', latin: 'škola', translationRu: 'школа', translationEn: 'school', exampleCyrillic: 'Школа је близу дома.', exampleTranslationRu: 'Школа рядом с домом.', exampleTranslationEn: 'The school is near home.' },
      { cyrillic: 'ученик', latin: 'učenik', translationRu: 'ученик', translationEn: 'school student', exampleCyrillic: 'Он је ученик осмог разреда.', exampleTranslationRu: 'Ученик отвечает на вопрос.', exampleTranslationEn: 'He is an eighth-grade student.' },
      { cyrillic: 'студент', latin: 'student', translationRu: 'студент', translationEn: 'university student', exampleCyrillic: 'Она је студентка права.', exampleTranslationRu: 'Студент читает книгу.', exampleTranslationEn: 'She is a law student.' },
      { cyrillic: 'наставник', latin: 'nastavnik', translationRu: 'учитель', translationEn: 'teacher', exampleCyrillic: 'Наш наставник је млад.', exampleTranslationRu: 'Учитель пишет на доске.', exampleTranslationEn: 'Our teacher is young.' },
      { cyrillic: 'лекар', latin: 'lekar', translationRu: 'врач', translationEn: 'doctor', exampleCyrillic: 'Лектор је у болници.', exampleTranslationRu: 'Врач осмотрел пациента.', exampleTranslationEn: 'The doctor is in the hospital.' },
      { cyrillic: 'болница', latin: 'bolnica', translationRu: 'больница', translationEn: 'hospital', exampleCyrillic: 'Болница је далеко.', exampleTranslationRu: 'Больница в центре города.', exampleTranslationEn: 'The hospital is far.' },
      { cyrillic: 'инжењер', latin: 'inženjer', translationRu: 'инженер', translationEn: 'engineer', exampleCyrillic: 'Мој отац је инжењер.', exampleTranslationRu: 'Инженер строит мост.', exampleTranslationEn: 'My father is an engineer.' },
      { cyrillic: 'сусед', latin: 'susjed', translationRu: 'сосед', translationEn: 'neighbor', exampleCyrillic: 'Наш сусед је добар човек.', exampleTranslationRu: 'Сосед пришёл в гости.', exampleTranslationEn: 'Our neighbor is a good person.' },
      { cyrillic: 'дом', latin: 'dom', translationRu: 'дом', translationEn: 'home', exampleCyrillic: 'Наш дом је нов.', exampleTranslationRu: 'Дом стоит на холме.', exampleTranslationEn: 'Our house is new.' },
      { cyrillic: 'широк', latin: 'širok', translationRu: 'широкий', translationEn: 'wide', exampleCyrillic: 'Река је широка.', exampleTranslationRu: 'Река широкая.', exampleTranslationEn: 'The river is wide.' },
      { cyrillic: 'дуг', latin: 'dug', translationRu: 'долгий', translationEn: 'long', exampleCyrillic: 'Он има велики дуг.', exampleTranslationRu: 'Дорога длинная.', exampleTranslationEn: 'He has a big debt.' },
      { cyrillic: 'млад', latin: 'mlad', translationRu: 'молодой', translationEn: 'young', exampleCyrillic: 'Млади човек је висок.', exampleTranslationRu: 'Молодой человек читает.', exampleTranslationEn: 'The young man is tall.' },
      { cyrillic: 'стар', latin: 'star', translationRu: 'старый', translationEn: 'old', exampleCyrillic: 'Стар човек спава.', exampleTranslationRu: 'Старый человек сидит на скамье.', exampleTranslationEn: 'The old man is sleeping.' },
      { cyrillic: 'висок', latin: 'visok', translationRu: 'высокий', translationEn: 'tall', exampleCyrillic: 'Она је висока.', exampleTranslationRu: 'Дерево высокое.', exampleTranslationEn: 'She is tall.' },
      { cyrillic: 'низак', latin: 'nizak', translationRu: 'низкий', translationEn: 'short', exampleCyrillic: 'Он је низак.', exampleTranslationRu: 'Столик низкий.', exampleTranslationEn: 'He is short.' },
      { cyrillic: 'добар', latin: 'dobar', translationRu: 'хороший', translationEn: 'good', exampleCyrillic: 'Ово је добар дан.', exampleTranslationRu: 'Он хороший человек.', exampleTranslationEn: 'This is a good day.' },
      { cyrillic: 'лош', latin: 'loš', translationRu: 'плохой', translationEn: 'bad', exampleCyrillic: 'Ово је лош дан.', exampleTranslationRu: 'Погода плохая.', exampleTranslationEn: 'This is a bad day.' },
      { cyrillic: 'нов', latin: 'nov', translationRu: 'новый', translationEn: 'new', exampleCyrillic: 'Нов ауто је скуп.', exampleTranslationRu: 'Новый дом красивый.', exampleTranslationEn: 'The new car is expensive.' },
      { cyrillic: 'велики', latin: 'veliki', translationRu: 'большой', translationEn: 'big', exampleCyrillic: 'Велики град има много људи.', exampleTranslationRu: 'Большой город шумный.', exampleTranslationEn: 'The big city has many people.' },
      { cyrillic: 'мали', latin: 'mali', translationRu: 'маленький', translationEn: 'small', exampleCyrillic: 'Мали стан је јефтин.', exampleTranslationRu: 'Маленький ребёнок спит.', exampleTranslationEn: 'The small apartment is cheap.' },
      { cyrillic: 'леп', latin: 'lep', translationRu: 'красивый', translationEn: 'beautiful', exampleCyrillic: 'Леп дан за шетњу.', exampleTranslationRu: 'Красивый закат.', exampleTranslationEn: 'A beautiful day for a walk.' },
      { cyrillic: 'човек', latin: 'čovek', translationRu: 'человек', translationEn: 'person', exampleCyrillic: 'Он је добар човек.', exampleTranslationRu: 'Человек идёт по улице.', exampleTranslationEn: 'He is a good person.' },
      { cyrillic: 'дан', latin: 'dan', translationRu: 'день', translationEn: 'day', exampleCyrillic: 'Овај дан је слободан.', exampleTranslationRu: 'Сегодня хороший день.', exampleTranslationEn: 'This day is free.' },
      { cyrillic: 'боја', latin: 'boja', translationRu: 'цвет', translationEn: 'color', exampleCyrillic: 'Плава је моја омилјена боја.', exampleTranslationRu: 'Какой твой любимый цвет?', exampleTranslationEn: 'Blue is my favorite color.' },
      { cyrillic: 'црвен', latin: 'crven', translationRu: 'красный', translationEn: 'red', exampleCyrillic: 'Црвена боја ми се свиђа.', exampleTranslationRu: 'Красный цвет — мой любимый.', exampleTranslationEn: 'I like the color red.' },
      { cyrillic: 'плав', latin: 'plav', translationRu: 'синий', translationEn: 'blue', exampleCyrillic: 'Плаво небо је лепо.', exampleTranslationRu: 'Небо синее.', exampleTranslationEn: 'The blue sky is beautiful.' },
      { cyrillic: 'зелен', latin: 'zelen', translationRu: 'зелёный', translationEn: 'green', exampleCyrillic: 'Зелено воће је кисело.', exampleTranslationRu: 'Трава зелёная.', exampleTranslationEn: 'Green fruit is sour.' },
      { cyrillic: 'тешко', latin: 'teško', translationRu: 'трудно', translationEn: 'difficult', exampleCyrillic: 'Ово је тешко питање.', exampleTranslationRu: 'Экзамен был трудным.', exampleTranslationEn: 'This is a difficult question.' },
    ],
  },
  {
    titleCyrillic: 'Моя породица',
    titleLatin: 'Moja porodica',
    titleTranslationRu: 'Моя семья',

    titleTranslationEn: 'My Family',
    lessons: [
      {
        title: 'Род',
        titleLatin: 'Rod',
        titleTranslationRu: 'Родные',

        titleTranslationEn: 'Relatives',
        exercises: [
          {
            promptCyrillic: 'Моја мајка кува.',
            promptLatin: 'Moja majka kuva.',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Мама готовит.', textRu: 'Мама готовит.', isCorrect: true },
              { text: 'Папа готовит.', textRu: 'Папа готовит.', isCorrect: false },
              { text: 'Мама спит.', textRu: 'Мама спит.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Он је мој брат.',
            promptLatin: 'On je moj brat.',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Он мой брат.', textRu: 'Он мой брат.', isCorrect: true },
              { text: 'Она моя сестра.', textRu: 'Она моя сестра.', isCorrect: false },
              { text: 'Он мой сын.', textRu: 'Он мой сын.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Моја породица је велика.',
            promptLatin: 'Moja porodica je velika.',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Моя семья большая.', textRu: 'Моя семья большая.', isCorrect: true },
              { text: 'Моя семья маленькая.', textRu: 'Моя семья маленькая.', isCorrect: false },
              { text: 'Мой дом большой.', textRu: 'Мой дом большой.', isCorrect: false },
            ],
          },
        ],
      },
      {
        title: 'Шта волим',
        titleLatin: 'Šta volim',
        titleTranslationRu: 'Что я люблю',

        titleTranslationEn: 'What I Like',
        exercises: [
          {
            promptCyrillic: 'Ја волим кафу и чај.',
            promptLatin: 'Ja volim kafu i čaj.',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Я люблю кофе и чай.', textRu: 'Я люблю кофе и чай.', isCorrect: true },
              { text: 'Я люблю чай и сок.', textRu: 'Я люблю чай и сок.', isCorrect: false },
              { text: 'Мне не нравится кофе.', textRu: 'Мне не нравится кофе.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Не волим месо.',
            promptLatin: 'Ne volim meso.',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Я не люблю мясо.', textRu: 'Я не люблю мясо.', isCorrect: true },
              { text: 'Я люблю рыбу.', textRu: 'Я люблю рыбу.', isCorrect: false },
              { text: 'Я не пью кофе.', textRu: 'Я не пью кофе.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Моја омилјена храна је пиле.',
            promptLatin: 'Moja omiljena hrana je pile.',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Моя любимая еда — курица.', textRu: 'Моя любимая еда — курица.', isCorrect: true },
              { text: 'Моя любимая еда — рыба.', textRu: 'Моя любимая еда — рыба.', isCorrect: false },
              { text: 'Мой любимый напиток — чай.', textRu: 'Мой любимый напиток — чай.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Ја сам гладан.',
            promptLatin: 'Ja sam gladan.',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Я голодный.', textRu: 'Я голодный.', isCorrect: true },
              { text: 'Я сытый.', textRu: 'Я сытый.', isCorrect: false },
              { text: 'Я больной.', textRu: 'Я больной.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Сада сам сит.',
            promptLatin: 'Sada sam sit.',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Сейчас я сыт.', textRu: 'Сейчас я сыт.', isCorrect: true },
              { text: 'Сейчас я голоден.', textRu: 'Сейчас я голоден.', isCorrect: false },
              { text: 'Сейчас я хочу пить.', textRu: 'Сейчас я хочу пить.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Жедан сам.',
            promptLatin: 'Žedan sam.',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Я хочу пить.', textRu: 'Я хочу пить.', isCorrect: true },
              { text: 'Я проголодался.', textRu: 'Я проголодался.', isCorrect: false },
              { text: 'Я устал.', textRu: 'Я устал.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Воће је свежо.',
            promptLatin: 'Voće je sveže.',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Фрукты свежие.', textRu: 'Фрукты свежие.', isCorrect: true },
              { text: 'Фрукты кислые.', textRu: 'Фрукты кислые.', isCorrect: false },
              { text: 'Овощи свежие.', textRu: 'Овощи свежие.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Ово ми се свиђа.',
            promptLatin: 'Ovo mi se sviđa.',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Мне это нравится.', textRu: 'Мне это нравится.', isCorrect: true },
              { text: 'Мне это не нравится.', textRu: 'Мне это не нравится.', isCorrect: false },
              { text: 'Я это покупаю.', textRu: 'Я это покупаю.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Не свиђа ми се.',
            promptLatin: 'Ne sviđa mi se.',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Мне это не нравится.', textRu: 'Мне это не нравится.', isCorrect: true },
              { text: 'Мне это нравится.', textRu: 'Мне это нравится.', isCorrect: false },
              { text: 'Я это ем.', textRu: 'Я это ем.', isCorrect: false },
            ],
          },
          {
            promptCyrillic: 'Шта волиш да једеш?',
            promptLatin: 'Šta voliš da jedeš?',
            promptTranslationRu: '',
            promptTranslationEn: '',
            choices: [
              { text: 'Что ты любишь есть?', textRu: 'Что ты любишь есть?', isCorrect: true },
              { text: 'Что ты покупаешь?', textRu: 'Что ты покупаешь?', isCorrect: false },
              { text: 'Где ты ешь?', textRu: 'Где ты ешь?', isCorrect: false },
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
    titleTranslationRu: 'Время',

    titleTranslationEn: 'Time',
    lessons: [
      {
        title: 'Годишња доба',
        titleLatin: 'Godišnja doba',
        titleTranslationRu: 'Времена года',

        titleTranslationEn: 'Seasons',
        exercises: [
          {
            promptCyrillic: 'Зима',
            promptLatin: 'Zima',
            promptTranslationRu: 'зима',
            promptTranslationEn: 'зима',
            choices: [
              { text: 'зима',
                textRu: 'зима', isCorrect: true },
              { text: 'лето',
                textRu: 'лето', isCorrect: false },
              { text: 'осень',
                textRu: 'осень', isCorrect: false },
            ],
          },
        ],
      },
    ],
    words: [
      { cyrillic: 'понедељак', latin: 'ponedeljak', translationRu: 'понедельник', translationEn: 'Monday', exampleCyrillic: 'Данас је понедељак.', exampleTranslationRu: 'Понедельник — первый день.', exampleTranslationEn: 'Today is Monday.' },
      { cyrillic: 'уторак', latin: 'utorak', translationRu: 'вторник', translationEn: 'Tuesday', exampleCyrillic: 'Сутра је уторак.', exampleTranslationRu: 'Во вторник у меня встреча.', exampleTranslationEn: 'Tomorrow is Tuesday.' },
      { cyrillic: 'среда', latin: 'sreda', translationRu: 'среда', translationEn: 'Wednesday', exampleCyrillic: 'Среда је мој омиљени дан.', exampleTranslationRu: 'В среду я иду в школу.', exampleTranslationEn: 'Wednesday is my favorite day.' },
      { cyrillic: 'четвртак', latin: 'četvrtak', translationRu: 'четверг', translationEn: 'Thursday', exampleCyrillic: 'Четвртак је дан за куповину.', exampleTranslationRu: 'В четверг мы едем в гости.', exampleTranslationEn: 'Thursday is shopping day.' },
      { cyrillic: 'петак', latin: 'petak', translationRu: 'пятница', translationEn: 'Friday', exampleCyrillic: 'Петак је крај недели.', exampleTranslationRu: 'Пятница — последний рабочий день.', exampleTranslationEn: 'Friday is the end of the week.' },
      { cyrillic: 'субота', latin: 'subota', translationRu: 'суббота', translationEn: 'Saturday', exampleCyrillic: 'Субота је слободан дан.', exampleTranslationRu: 'В субботу я отдыхаю.', exampleTranslationEn: 'Saturday is a free day.' },
      { cyrillic: 'недеља', latin: 'nedelja', translationRu: 'воскресенье', translationEn: 'Sunday', exampleCyrillic: 'Недеља је слободан дан.', exampleTranslationRu: 'В воскресенье я сплю допоздна.', exampleTranslationEn: 'Sunday is a free day.' },
      { cyrillic: 'јутро', latin: 'jutro', translationRu: 'утро', translationEn: 'morning', exampleCyrillic: 'Јутро је хладно.', exampleTranslationRu: 'Утро — лучшее время.', exampleTranslationEn: 'The morning is cold.' },
      { cyrillic: 'подне', latin: 'podne', translationRu: 'полдень', translationEn: 'noon', exampleCyrillic: 'Сад је подне.', exampleTranslationRu: 'В полдень жарко.', exampleTranslationEn: 'It is noon now.' },
      { cyrillic: 'попладне', latin: 'popodne', translationRu: 'день', translationEn: 'afternoon', exampleCyrillic: 'У попладне идем у парк.', exampleTranslationRu: 'Днём мы гуляли в парке.', exampleTranslationEn: 'I go to the park in the afternoon.' },
      { cyrillic: 'сат', latin: 'sat', translationRu: 'час', translationEn: 'hour / clock', exampleCyrillic: 'Сат је на зиду.', exampleTranslationRu: 'Сколько часов?', exampleTranslationEn: 'The clock is on the wall.' },
      { cyrillic: 'минута', latin: 'minuta', translationRu: 'минута', translationEn: 'minute', exampleCyrillic: 'Чекajте пет минута.', exampleTranslationRu: 'Подожди одну минуту.', exampleTranslationEn: 'Wait five minutes.' },
      { cyrillic: 'данас', latin: 'danas', translationRu: 'сегодня', translationEn: 'today', exampleCyrillic: 'Данас је леп дан.', exampleTranslationRu: 'Сегодня хороший день.', exampleTranslationEn: 'Today is a beautiful day.' },
      { cyrillic: 'сутра', latin: 'sutra', translationRu: 'завтра', translationEn: 'tomorrow', exampleCyrillic: 'Сутра идем на посао.', exampleTranslationRu: 'Завтра мы поедем в Белград.', exampleTranslationEn: 'Tomorrow I go to work.' },
      { cyrillic: 'јуче', latin: 'juče', translationRu: 'вчера', translationEn: 'yesterday', exampleCyrillic: 'Јуче је био петак.', exampleTranslationRu: 'Вчера я был в школе.', exampleTranslationEn: 'Yesterday was Friday.' },
      { cyrillic: 'месец', latin: 'mesec', translationRu: 'месяц', translationEn: 'month', exampleCyrillic: 'Овај месец је март.', exampleTranslationRu: 'Месяц пролетел быстро.', exampleTranslationEn: 'This month is March.' },
      { cyrillic: 'годинa', latin: 'godina', translationRu: 'год', translationEn: 'year', exampleCyrillic: 'Она има двадесет година.', exampleTranslationRu: 'Год длится двенадцать месяцев.', exampleTranslationEn: 'She is twenty years old.' },
      { cyrillic: 'увек', latin: 'uvek', translationRu: 'всегда', translationEn: 'always', exampleCyrillic: 'Ја увек пијem кафу.', exampleTranslationRu: 'Я всегда учу слова.', exampleTranslationEn: 'I always drink coffee.' },
      { cyrillic: 'понекад', latin: 'ponekad', translationRu: 'иногда', translationEn: 'sometimes', exampleCyrillic: 'Понекад читам књигу.', exampleTranslationRu: 'Иногда я хожу в кино.', exampleTranslationEn: 'Sometimes I read a book.' },
      { cyrillic: 'нула', latin: 'nula', translationRu: 'ноль', translationEn: 'zero', exampleCyrillic: 'Вани је нула степени.', exampleTranslationRu: 'Ноль градусов по Цельсию.', exampleTranslationEn: 'It is zero degrees outside.' },
      { cyrillic: 'једan', latin: 'jedan', translationRu: 'один', translationEn: 'one', exampleCyrillic: 'Једan сат је довољно.', exampleTranslationRu: 'Одного часа достаточно.', exampleTranslationEn: 'One hour is enough.' },
      { cyrillic: 'два', latin: 'dva', translationRu: 'два', translationEn: 'two', exampleCyrillic: 'Два сата су дуги.', exampleTranslationRu: 'Два стула стоят у стола.', exampleTranslationEn: 'Two hours is a long time.' },
      { cyrillic: 'три', latin: 'tri', translationRu: 'три', translationEn: 'three', exampleCyrillic: 'Имам три дана слободно.', exampleTranslationRu: 'У меня три дня выходных.', exampleTranslationEn: 'I have three days off.' },
      { cyrillic: 'четири', latin: 'cetiri', translationRu: 'четыре', translationEn: 'four', exampleCyrillic: 'Четири дана до викенда.', exampleTranslationRu: 'Четыре сезона в году.', exampleTranslationEn: 'Four days until the weekend.' },
      { cyrillic: 'пет', latin: 'pet', translationRu: 'пять', translationEn: 'five', exampleCyrillic: 'Пет минута, молим.', exampleTranslationRu: 'Пять минут — это мало.', exampleTranslationEn: 'Five minutes, please.' },
      { cyrillic: 'шест', latin: 'šest', translationRu: 'шесть', translationEn: 'six', exampleCyrillic: 'Шест сати ујутру.', exampleTranslationRu: 'Шесть книг на полке.', exampleTranslationEn: 'Six in the morning.' },
      { cyrillic: 'седам', latin: 'sedam', translationRu: 'семь', translationEn: 'seven', exampleCyrillic: 'Седам ујутру је рано.', exampleTranslationRu: 'Семь дней в неделе.', exampleTranslationEn: 'Seven in the morning is early.' },
      { cyrillic: 'осам', latin: 'osam', translationRu: 'восемь', translationEn: 'eight', exampleCyrillic: 'Осам сати ујутру идем на посао.', exampleTranslationRu: 'Восемь часов — время подъёма.', exampleTranslationEn: 'I go to work at eight in the morning.' },
      { cyrillic: 'девет', latin: 'devet', translationRu: 'девять', translationEn: 'nine', exampleCyrillic: 'У девет идем у кинo.', exampleTranslationRu: 'Девять месяцев — это долго.', exampleTranslationEn: 'At nine I go to the cinema.' },
      { cyrillic: 'десет', latin: 'deset', translationRu: 'десять', translationEn: 'ten', exampleCyrillic: 'Десет минута чекања.', exampleTranslationRu: 'Десять учеников в классе.', exampleTranslationEn: 'Ten minutes of waiting.' },
      { cyrillic: 'будити се', latin: 'buditi se', translationRu: 'просыпаться', translationEn: 'to wake up', exampleCyrillic: 'Будим се у седам.', exampleTranslationRu: 'Я просыпаюсь рано.', exampleTranslationEn: 'I wake up at seven.' },
      { cyrillic: 'рано', latin: 'rano', translationRu: 'рано', translationEn: 'early', exampleCyrillic: 'Устајем рано.', exampleTranslationRu: 'Рано утром я пью кофе.', exampleTranslationEn: 'I get up early.' },
      { cyrillic: 'касно', latin: 'kasno', translationRu: 'поздно', translationEn: 'late', exampleCyrillic: 'Она је дошла касно.', exampleTranslationRu: 'Я лёг поздно.', exampleTranslationEn: 'She came late.' },
      { cyrillic: 'брзо', latin: 'brzo', translationRu: 'быстро', translationEn: 'fast', exampleCyrillic: 'Он говори брзо.', exampleTranslationRu: 'Он бежит быстро.', exampleTranslationEn: 'He speaks fast.' },
      { cyrillic: 'споро', latin: 'sporo', translationRu: 'медленно', translationEn: 'slowly', exampleCyrillic: 'Воз иде споро.', exampleTranslationRu: 'Черепашка движется медленно.', exampleTranslationEn: 'The train goes slowly.' },
      { cyrillic: 'ноћас', latin: 'noćas', translationRu: 'сегодня ночью', translationEn: 'tonight', exampleCyrillic: 'Ноћас је хладно.', exampleTranslationRu: 'Сегодня ночью будет дождь.', exampleTranslationEn: 'It is cold tonight.' },
      { cyrillic: 'време', latin: 'vreme', translationRu: 'время; погода', translationEn: 'time; weather', exampleCyrillic: 'Време је лепo.', exampleTranslationRu: 'Какое сегодня время?', exampleTranslationEn: 'The weather is nice.' },
      { cyrillic: 'сада', latin: 'sada', translationRu: 'сейчас', translationEn: 'now', exampleCyrillic: 'Сад сам слободан.', exampleTranslationRu: 'Сейчас я учу сербский.', exampleTranslationEn: 'I am free now.' },
      { cyrillic: 'јануар', latin: 'januar', translationRu: 'январь', translationEn: 'January', exampleCyrillic: 'Јануар је хладан.', exampleTranslationRu: 'Январь — первый месяц.', exampleTranslationEn: 'January is cold.' },
      { cyrillic: 'фебруар', latin: 'februar', translationRu: 'февраль', translationEn: 'February', exampleCyrillic: 'У фебруару је хладно.', exampleTranslationRu: 'Февраль — самый короткий месяц.', exampleTranslationEn: 'It is cold in February.' },
      { cyrillic: 'март', latin: 'mart', translationRu: 'март', translationEn: 'March', exampleCyrillic: 'Март је први проleћни месец.', exampleTranslationRu: 'В марте начинается весна.', exampleTranslationEn: 'March is the first spring month.' },
      { cyrillic: 'април', latin: 'april', translationRu: 'апрель', translationEn: 'April', exampleCyrillic: 'Април је леп месец.', exampleTranslationRu: 'Апрель — тёплый месяц.', exampleTranslationEn: 'April is a beautiful month.' },
      { cyrillic: 'мај', latin: 'maj', translationRu: 'май', translationEn: 'May', exampleCyrillic: 'У мају је топло.', exampleTranslationRu: 'В мае всё цветёт.', exampleTranslationEn: 'It is warm in May.' },
      { cyrillic: 'јун', latin: 'jun', translationRu: 'июнь', translationEn: 'June', exampleCyrillic: 'У јуну је вруће.', exampleTranslationRu: 'Июнь — начало лета.', exampleTranslationEn: 'It is hot in June.' },
      { cyrillic: 'јул', latin: 'jul', translationRu: 'июль', translationEn: 'July', exampleCyrillic: 'Јул је најтоплији месец.', exampleTranslationRu: 'Июль — жаркий месяц.', exampleTranslationEn: 'July is the warmest month.' },
      { cyrillic: 'август', latin: 'avgust', translationRu: 'август', translationEn: 'August', exampleCyrillic: 'Август је месец одмора.', exampleTranslationRu: 'В августе мы отдыхаем.', exampleTranslationEn: 'August is the month of rest.' },
      { cyrillic: 'септембар', latin: 'septembar', translationRu: 'сентябрь', translationEn: 'September', exampleCyrillic: 'У септембру почиње школа.', exampleTranslationRu: 'В сентябре начинается школа.', exampleTranslationEn: 'School starts in September.' },
      { cyrillic: 'октобар', latin: 'oktobar', translationRu: 'октябрь', translationEn: 'October', exampleCyrillic: 'У октобру је хладно.', exampleTranslationRu: 'Октябрь — золотая осень.', exampleTranslationEn: 'It is cold in October.' },
      { cyrillic: 'новембар', latin: 'novembar', translationRu: 'ноябрь', translationEn: 'November', exampleCyrillic: 'Новембар је хладан.', exampleTranslationRu: 'Ноябрь — холодный месяц.', exampleTranslationEn: 'November is cold.' },
      { cyrillic: 'децембар', latin: 'decembar', translationRu: 'декабрь', translationEn: 'December', exampleCyrillic: 'У децембру је мој рођендан.', exampleTranslationRu: 'Декабрь — праздничный месяц.', exampleTranslationEn: 'My birthday is in December.' },
      { cyrillic: 'рођендан', latin: 'rođendan', translationRu: 'день рождения', translationEn: 'birthday', exampleCyrillic: 'Мој рођендан је у мају.', exampleTranslationRu: 'День рождения — весёлый праздник.', exampleTranslationEn: 'My birthday is in May.' },
      { cyrillic: 'зима', latin: 'zima', translationRu: 'зима', translationEn: 'winter', exampleCyrillic: 'Зима је хладна.', exampleTranslationRu: 'Зима — холодное время года.', exampleTranslationEn: 'Winter is cold.' },
      { cyrillic: 'лето', latin: 'leto', translationRu: 'лето', translationEn: 'summer', exampleCyrillic: 'Лето је топло.', exampleTranslationRu: 'Лето — время отпусков.', exampleTranslationEn: 'Summer is warm.' },
      { cyrillic: 'проleће', latin: 'proleće', translationRu: 'весна', translationEn: 'spring', exampleCyrillic: 'Проleће је лепo.', exampleTranslationRu: 'Весна — время цветов.', exampleTranslationEn: 'Spring is beautiful.' },
      { cyrillic: 'јесен', latin: 'jesen', translationRu: 'осень', translationEn: 'autumn', exampleCyrillic: 'Јесен је хладна.', exampleTranslationRu: 'Осень — листья желтеют.', exampleTranslationEn: 'Autumn is cold.' },
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
        titleTranslationRu: unitSeed.titleTranslationRu,
        titleTranslationEn: unitSeed.titleTranslationEn,
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
        lesson.titleTranslationRu = lessonSeed.titleTranslationRu;
        lesson.titleTranslationEn = lessonSeed.titleTranslationEn;
        lesson.order = order;
        lesson.xpReward = 10;
        lesson.exercises = lessonSeed.exercises.map((exerciseSeed, exIndex) => {
          const exercise = new Exercise();
          exercise.type = ExerciseType.TRANSLATE_CHOICE;
          exercise.promptCyrillic = exerciseSeed.promptCyrillic;
          exercise.promptLatin = exerciseSeed.promptLatin;
          exercise.promptTranslationRu = exerciseSeed.promptTranslationRu;
          exercise.promptTranslationEn = exerciseSeed.promptTranslationEn;
          exercise.order = exIndex + 1;
          exercise.choices = exerciseSeed.choices.map((choiceSeed, chIndex) => {
            const choice = new ExerciseChoice();
            choice.text = choiceSeed.text;
            choice.textRu = choiceSeed.textRu;
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
