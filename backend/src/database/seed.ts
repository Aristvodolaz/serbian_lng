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
      { cyrillic: 'ђак', latin: 'đak', translationEn: 'pupil / student', exampleCyrillic: 'Ђак учи лекцију.', exampleTranslation: 'The pupil studies the lesson.' },
      { cyrillic: 'жена', latin: 'žena', translationEn: 'woman', exampleCyrillic: 'Жена чита књигу.', exampleTranslation: 'The woman is reading a book.' },
      { cyrillic: 'љубав', latin: 'ljubav', translationEn: 'love', exampleCyrillic: 'Љубав је лепо осећање.', exampleTranslation: 'Love is a beautiful feeling.' },
      { cyrillic: 'њива', latin: 'njiva', translationEn: 'field', exampleCyrillic: 'Њива је пуна пшенице.', exampleTranslation: 'The field is full of wheat.' },
      { cyrillic: 'ћирилица', latin: 'ćirilica', translationEn: 'Cyrillic script', exampleCyrillic: 'Ћирилица је старо писмо.', exampleTranslation: 'Cyrillic is an old script.' },
      { cyrillic: 'чај', latin: 'čaj', translationEn: 'tea', exampleCyrillic: 'Пијем топли чај.', exampleTranslation: "I'm drinking hot tea." },
      { cyrillic: 'џем', latin: 'džem', translationEn: 'jam', exampleCyrillic: 'Мажем џем на хлеб.', exampleTranslation: 'I spread jam on bread.' },
      { cyrillic: 'шума', latin: 'šuma', translationEn: 'forest', exampleCyrillic: 'Шетамо кроз шуму.', exampleTranslation: "We're walking through the forest." },
      { cyrillic: 'пас', latin: 'pas', translationEn: 'dog', exampleCyrillic: 'Пас трчи у парку.', exampleTranslation: 'The dog runs in the park.' },
      { cyrillic: 'рука', latin: 'ruka', translationEn: 'hand / arm', exampleCyrillic: 'Опери руке пре јела.', exampleTranslation: 'Wash your hands before eating.' },
      { cyrillic: 'нос', latin: 'nos', translationEn: 'nose', exampleCyrillic: 'Има мали нос.', exampleTranslation: 'He has a small nose.' },
      { cyrillic: 'уста', latin: 'usta', translationEn: 'mouth', exampleCyrillic: 'Отвори уста, молим те.', exampleTranslation: 'Open your mouth, please.' },
      { cyrillic: 'хлад', latin: 'hlad', translationEn: 'coolness / shade', exampleCyrillic: 'Седимо у хладу дрвета.', exampleTranslation: 'We sit in the shade of the tree.' },
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
      { cyrillic: 'хвала', latin: 'hvala', translationEn: 'thank you', exampleCyrillic: 'Хвала на помоћи.', exampleTranslation: 'Thanks for the help.' },
      { cyrillic: 'здраво', latin: 'zdravo', translationEn: 'hello', exampleCyrillic: 'Здраво, како си?', exampleTranslation: 'Hello, how are you?' },
      { cyrillic: 'молим', latin: 'molim', translationEn: "please / you're welcome", exampleCyrillic: 'Молим, изволите.', exampleTranslation: 'Please, here you go.' },
      { cyrillic: 'довиђења', latin: 'doviđenja', translationEn: 'goodbye', exampleCyrillic: 'Довиђења, видимо се сутра.', exampleTranslation: 'Goodbye, see you tomorrow.' },
      { cyrillic: 'изволите', latin: 'izvolite', translationEn: 'here you go / please', exampleCyrillic: 'Изволите, седите.', exampleTranslation: 'Here you go, have a seat.' },
      { cyrillic: 'пријатно', latin: 'prijatno', translationEn: 'have a nice time', exampleCyrillic: 'Пријатно вече!', exampleTranslation: 'Have a nice evening!' },
      { cyrillic: 'име', latin: 'ime', translationEn: 'name', exampleCyrillic: 'Како ти је име?', exampleTranslation: 'What is your name?' },
      { cyrillic: 'одакле', latin: 'odakle', translationEn: 'from where', exampleCyrillic: 'Одакле си ти?', exampleTranslation: 'Where are you from?' },
      { cyrillic: 'пријатељ', latin: 'prijatelj', translationEn: 'friend', exampleCyrillic: 'Он је мој пријатељ.', exampleTranslation: 'He is my friend.' },
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
      { cyrillic: 'мајка', latin: 'majka', translationEn: 'mother', exampleCyrillic: 'Моја мајка кува ручак.', exampleTranslation: 'My mother is cooking lunch.' },
      { cyrillic: 'отац', latin: 'otac', translationEn: 'father', exampleCyrillic: 'Мој отац ради у граду.', exampleTranslation: 'My father works in the city.' },
      { cyrillic: 'сестра', latin: 'sestra', translationEn: 'sister', exampleCyrillic: 'Моја сестра студира.', exampleTranslation: 'My sister is a student.' },
      { cyrillic: 'брат', latin: 'brat', translationEn: 'brother', exampleCyrillic: 'Мој брат игра фудбал.', exampleTranslation: 'My brother plays football.' },
      { cyrillic: 'деда', latin: 'deda', translationEn: 'grandfather', exampleCyrillic: 'Деда прича приче.', exampleTranslation: 'Grandfather tells stories.' },
      { cyrillic: 'баба', latin: 'baba', translationEn: 'grandmother', exampleCyrillic: 'Баба пече колаче.', exampleTranslation: 'Grandmother bakes cookies.' },
      { cyrillic: 'кућа', latin: 'kuća', translationEn: 'house', exampleCyrillic: 'Наша кућа је велика.', exampleTranslation: 'Our house is big.' },
      { cyrillic: 'соба', latin: 'soba', translationEn: 'room', exampleCyrillic: 'Моја соба је чиста.', exampleTranslation: 'My room is clean.' },
      { cyrillic: 'врата', latin: 'vrata', translationEn: 'door', exampleCyrillic: 'Затвори врата, молим те.', exampleTranslation: 'Close the door, please.' },
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
      { cyrillic: 'хлеб', latin: 'hleb', translationEn: 'bread', exampleCyrillic: 'Купио сам свеж хлеб.', exampleTranslation: 'I bought fresh bread.' },
      { cyrillic: 'вода', latin: 'voda', translationEn: 'water', exampleCyrillic: 'Дај ми чашу воде.', exampleTranslation: 'Give me a glass of water.' },
      { cyrillic: 'ручак', latin: 'ručak', translationEn: 'lunch', exampleCyrillic: 'Ручак је готов.', exampleTranslation: 'Lunch is ready.' },
      { cyrillic: 'јабука', latin: 'jabuka', translationEn: 'apple', exampleCyrillic: 'Једем јабуку сваки дан.', exampleTranslation: 'I eat an apple every day.' },
      { cyrillic: 'месо', latin: 'meso', translationEn: 'meat', exampleCyrillic: 'Волим печено месо.', exampleTranslation: 'I like roasted meat.' },
      { cyrillic: 'кафа', latin: 'kafa', translationEn: 'coffee', exampleCyrillic: 'Пијем кафу ујутру.', exampleTranslation: 'I drink coffee in the morning.' },
      { cyrillic: 'рачун', latin: 'račun', translationEn: 'bill', exampleCyrillic: 'Молим вас, рачун.', exampleTranslation: 'The bill, please.' },
      { cyrillic: 'укусно', latin: 'ukusno', translationEn: 'delicious', exampleCyrillic: 'Ово је веома укусно.', exampleTranslation: 'This is very delicious.' },
      { cyrillic: 'со', latin: 'so', translationEn: 'salt', exampleCyrillic: 'Додај мало соли.', exampleTranslation: 'Add a bit of salt.' },
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
      { cyrillic: 'један', latin: 'jedan', translationEn: 'one', exampleCyrillic: 'Имам један брат.', exampleTranslation: 'I have one brother.' },
      { cyrillic: 'два', latin: 'dva', translationEn: 'two', exampleCyrillic: 'Два пута дневно.', exampleTranslation: 'Twice a day.' },
      { cyrillic: 'пет', latin: 'pet', translationEn: 'five', exampleCyrillic: 'Пет минута пешке.', exampleTranslation: 'Five minutes on foot.' },
      { cyrillic: 'шест', latin: 'šest', translationEn: 'six', exampleCyrillic: 'Имам шест књига.', exampleTranslation: 'I have six books.' },
      { cyrillic: 'десет', latin: 'deset', translationEn: 'ten', exampleCyrillic: 'Десет прстију на рукама.', exampleTranslation: 'Ten fingers on the hands.' },
      { cyrillic: 'сто', latin: 'sto', translationEn: 'hundred', exampleCyrillic: 'Сто динара.', exampleTranslation: 'A hundred dinars.' },
      { cyrillic: 'данас', latin: 'danas', translationEn: 'today', exampleCyrillic: 'Данас је леп дан.', exampleTranslation: 'Today is a nice day.' },
      { cyrillic: 'сутра', latin: 'sutra', translationEn: 'tomorrow', exampleCyrillic: 'Видимо се сутра.', exampleTranslation: 'See you tomorrow.' },
      { cyrillic: 'сат', latin: 'sat', translationEn: 'hour / clock', exampleCyrillic: 'Колико је сати?', exampleTranslation: 'What time is it?' },
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
      { cyrillic: 'станица', latin: 'stanica', translationEn: 'station', exampleCyrillic: 'Станица је близу.', exampleTranslation: 'The station is close.' },
      { cyrillic: 'аеродром', latin: 'aerodrom', translationEn: 'airport', exampleCyrillic: 'Идемо на аеродром.', exampleTranslation: "We're going to the airport." },
      { cyrillic: 'путовање', latin: 'putovanje', translationEn: 'journey / trip', exampleCyrillic: 'Пријатно путовање!', exampleTranslation: 'Have a nice trip!' },
      { cyrillic: 'хотел', latin: 'hotel', translationEn: 'hotel', exampleCyrillic: 'Резервисао сам хотел.', exampleTranslation: 'I booked a hotel.' },
      { cyrillic: 'карта', latin: 'karta', translationEn: 'ticket', exampleCyrillic: 'Купио сам карту за воз.', exampleTranslation: 'I bought a train ticket.' },
      { cyrillic: 'пасош', latin: 'pasoš', translationEn: 'passport', exampleCyrillic: 'Понесите пасош.', exampleTranslation: 'Bring your passport.' },
      { cyrillic: 'виза', latin: 'viza', translationEn: 'visa', exampleCyrillic: 'Треба ми виза за путовање.', exampleTranslation: 'I need a visa to travel.' },
      { cyrillic: 'кофер', latin: 'kofer', translationEn: 'suitcase', exampleCyrillic: 'Спаковао сам кофер.', exampleTranslation: 'I packed my suitcase.' },
      { cyrillic: 'излаз', latin: 'izlaz', translationEn: 'exit', exampleCyrillic: 'Излаз је лево.', exampleTranslation: 'The exit is on the left.' },
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
      { cyrillic: 'име', latin: 'ime', translationEn: 'имя', exampleCyrillic: 'Моје име је Марта.', exampleTranslation: 'Моё имя Марта.' },
      { cyrillic: 'зовати се', latin: 'zovati se', translationEn: 'зоваться', exampleCyrillic: 'Зовем се Ана.', exampleTranslation: 'Меня зовут Ана.' },
      { cyrillic: 'мој', latin: 'moj', translationEn: 'мой', exampleCyrillic: 'Ово је мој стан.', exampleTranslation: 'Это моя квартира.' },
      { cyrillic: 'твој', latin: 'tvoj', translationEn: 'твой', exampleCyrillic: 'Где је твоја књига?', exampleTranslation: 'Где твоя книга?' },
      { cyrillic: 'ја', latin: 'ja', translationEn: 'я', exampleCyrillic: 'Ја сам из Русије.', exampleTranslation: 'Я из России.' },
      { cyrillic: 'ти', latin: 'ti', translationEn: 'ты', exampleCyrillic: 'Ти си мој пријатељ.', exampleTranslation: 'Ты мой друг.' },
      { cyrillic: 'он', latin: 'on', translationEn: 'он', exampleCyrillic: 'Он је висок.', exampleTranslation: 'Он высокий.' },
      { cyrillic: 'она', latin: 'ona', translationEn: 'она', exampleCyrillic: 'Она је млада.', exampleTranslation: 'Она молодая.' },
      { cyrillic: 'ми', latin: 'mi', translationEn: 'мы', exampleCyrillic: 'Ми живимо у Београду.', exampleTranslation: 'Мы живём в Белграде.' },
      { cyrillic: 'српски', latin: 'srpski', translationEn: 'сербский (язык)', exampleCyrillic: 'Српски је леп језик.', exampleTranslation: 'Сербский — красивый язык.' },
      { cyrillic: 'језик', latin: 'jezik', translationEn: 'язык', exampleCyrillic: 'Учиш ли српски језик?', exampleTranslation: 'Ты учишь сербский язык?' },
      { cyrillic: 'говорити', latin: 'govoriti', translationEn: 'говорить', exampleCyrillic: 'Она добро говори српски.', exampleTranslation: 'Она хорошо говорит по-сербски.' },
      { cyrillic: 'град', latin: 'grad', translationEn: 'город', exampleCyrillic: 'Београд је велики град.', exampleTranslation: 'Белград — большой город.' },
      { cyrillic: 'земља', latin: 'zemlja', translationEn: 'страна; земля', exampleCyrillic: 'Србија је мала земља.', exampleTranslation: 'Сербия — маленькая страна.' },
      { cyrillic: 'главни', latin: 'glavni', translationEn: 'главный', exampleCyrillic: 'Главни град је Београд.', exampleTranslation: 'Столица — Белград.' },
      { cyrillic: 'пријатељ', latin: 'prijatelj', translationEn: 'друг', exampleCyrillic: 'Мој пријатељ живи у Новом Саду.', exampleTranslation: 'Мой друг живёт в Нови-Саде.' },
      { cyrillic: 'хвала', latin: 'hvala', translationEn: 'спасибо', exampleCyrillic: 'Хвала на помоћи.', exampleTranslation: 'Спасибо за помощь.' },
      { cyrillic: 'живети', latin: 'živeti', translationEn: 'жить', exampleCyrillic: 'Ја живим у Београду.', exampleTranslation: 'Я живу в Белграде.' },
      { cyrillic: 'стан', latin: 'stan', translationEn: 'квартира', exampleCyrillic: 'Наш стан је мали.', exampleTranslation: 'Наша квартира маленькая.' },
      { cyrillic: 'улица', latin: 'ulica', translationEn: 'улица', exampleCyrillic: 'Улица је дуга.', exampleTranslation: 'Улица длинная.' },
      { cyrillic: 'зграда', latin: 'zgrada', translationEn: 'здание', exampleCyrillic: 'Зграда има пет спратова.', exampleTranslation: 'В здании пять этажей.' },
      { cyrillic: 'радити', latin: 'raditi', translationEn: 'работать', exampleCyrillic: 'Ја радим од јутра до вечери.', exampleTranslation: 'Я работаю с утра до вечера.' },
      { cyrillic: 'посао', latin: 'posao', translationEn: 'работа', exampleCyrillic: 'Имам добар посао.', exampleTranslation: 'У меня хорошая работа.' },
      { cyrillic: 'школа', latin: 'škola', translationEn: 'школа', exampleCyrillic: 'Школа је близу дома.', exampleTranslation: 'Школа рядом с домом.' },
      { cyrillic: 'ученик', latin: 'učenik', translationEn: 'ученик (школьник)', exampleCyrillic: 'Он је ученик осмог разреда.', exampleTranslation: 'Он ученик восьмого класса.' },
      { cyrillic: 'студент', latin: 'student', translationEn: 'студент', exampleCyrillic: 'Она је студентка права.', exampleTranslation: 'Она студентка юридического факультета.' },
      { cyrillic: 'наставник', latin: 'nastavnik', translationEn: 'учитель; преподаватель', exampleCyrillic: 'Наш наставник је млад.', exampleTranslation: 'Наш преподаватель молодой.' },
      { cyrillic: 'лекар', latin: 'lekar', translationEn: 'врач', exampleCyrillic: 'Лектор је у болници.', exampleTranslation: 'Врач в больнице.' },
      { cyrillic: 'болница', latin: 'bolnica', translationEn: 'больница', exampleCyrillic: 'Болница је далеко.', exampleTranslation: 'Больница далеко.' },
      { cyrillic: 'инжењер', latin: 'inženjer', translationEn: 'инженер', exampleCyrillic: 'Мој отац је инжењер.', exampleTranslation: 'Мой отец инженер.' },
      { cyrillic: 'сусед', latin: 'susjed', translationEn: 'сосед', exampleCyrillic: 'Наш сусед је добар човек.', exampleTranslation: 'Наш сосед — хороший человек.' },
      { cyrillic: 'дом', latin: 'dom', translationEn: 'дом; домой', exampleCyrillic: 'Наш дом је нов.', exampleTranslation: 'Наш дом новый.' },
      { cyrillic: 'широк', latin: 'širok', translationEn: 'широкий', exampleCyrillic: 'Река је широка.', exampleTranslation: 'Река широкая.' },
      { cyrillic: 'дуг', latin: 'dug', translationEn: 'долг', exampleCyrillic: 'Он има велики дуг.', exampleTranslation: 'У него большой долг.' },
      { cyrillic: 'млад', latin: 'mlad', translationEn: 'молодой (м.р.)', exampleCyrillic: 'Млади човек је висок.', exampleTranslation: 'Молодой человек высокий.' },
      { cyrillic: 'стар', latin: 'star', translationEn: 'старый (м.р.)', exampleCyrillic: 'Стар човек спава.', exampleTranslation: 'Старик спит.' },
      { cyrillic: 'висок', latin: 'visok', translationEn: 'высокий', exampleCyrillic: 'Она је висока.', exampleTranslation: 'Она высокая.' },
      { cyrillic: 'низак', latin: 'nizak', translationEn: 'низкий (рост)', exampleCyrillic: 'Он је низак.', exampleTranslation: 'Он невысокий.' },
      { cyrillic: 'добар', latin: 'dobar', translationEn: 'хороший (м.р.)', exampleCyrillic: 'Ово је добар дан.', exampleTranslation: 'Сегодня хороший день.' },
      { cyrillic: 'лош', latin: 'loš', translationEn: 'плохой (м.р.)', exampleCyrillic: 'Ово је лош дан.', exampleTranslation: 'Сегодня плохой день.' },
      { cyrillic: 'нов', latin: 'nov', translationEn: 'новый (м.р.)', exampleCyrillic: 'Нов ауто је скуп.', exampleTranslation: 'Новая машина дорогая.' },
      { cyrillic: 'велики', latin: 'veliki', translationEn: 'большой', exampleCyrillic: 'Велики град има много људи.', exampleTranslation: 'В большом городе много людей.' },
      { cyrillic: 'мали', latin: 'mali', translationEn: 'маленький', exampleCyrillic: 'Мали стан је јефтин.', exampleTranslation: 'Маленькая квартира дешёвая.' },
      { cyrillic: 'леп', latin: 'lep', translationEn: 'красивый; хороший', exampleCyrillic: 'Леп дан за шетњу.', exampleTranslation: 'Красивый день для прогулки.' },
      { cyrillic: 'човек', latin: 'čovek', translationEn: 'человек', exampleCyrillic: 'Он је добар човек.', exampleTranslation: 'Он хороший человек.' },
      { cyrillic: 'дан', latin: 'dan', translationEn: 'день', exampleCyrillic: 'Овај дан је слободан.', exampleTranslation: 'Сегодня выходной.' },
      { cyrillic: 'боја', latin: 'boja', translationEn: 'цвет', exampleCyrillic: 'Плава је моја омилјена боја.', exampleTranslation: 'Синий — мой любимый цвет.' },
      { cyrillic: 'црвен', latin: 'crven', translationEn: 'красный', exampleCyrillic: 'Црвена боја ми се свиђа.', exampleTranslation: 'Мне нравится красный цвет.' },
      { cyrillic: 'плав', latin: 'plav', translationEn: 'синий', exampleCyrillic: 'Плаво небо је лепо.', exampleTranslation: 'Синее небо — красивое.' },
      { cyrillic: 'зелен', latin: 'zelen', translationEn: 'зелёный', exampleCyrillic: 'Зелено воће је кисело.', exampleTranslation: 'Зелёные фрукты кислые.' },
      { cyrillic: 'тешко', latin: 'teško', translationEn: 'трудно', exampleCyrillic: 'Ово је тешко питање.', exampleTranslation: 'Это трудный вопрос.' },
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
      { cyrillic: 'понедељак', latin: 'ponedeljak', translationEn: 'понедельник', exampleCyrillic: 'Данас је понедељак.', exampleTranslation: 'Сегодня понедельник.' },
      { cyrillic: 'уторак', latin: 'utorak', translationEn: 'вторник', exampleCyrillic: 'Сутра је уторак.', exampleTranslation: 'Завтра вторник.' },
      { cyrillic: 'среда', latin: 'sreda', translationEn: 'среда', exampleCyrillic: 'Среда је мој омиљени дан.', exampleTranslation: 'Среда — мой любимый день.' },
      { cyrillic: 'четвртак', latin: 'četvrtak', translationEn: 'четверг', exampleCyrillic: 'Четвртак је дан за куповину.', exampleTranslation: 'Четверг — день для покупок.' },
      { cyrillic: 'петак', latin: 'petak', translationEn: 'пятница', exampleCyrillic: 'Петак је крај недели.', exampleTranslation: 'Пятница — конец недели.' },
      { cyrillic: 'субота', latin: 'subota', translationEn: 'суббота', exampleCyrillic: 'Субота је слободан дан.', exampleTranslation: 'Суббота — выходной.' },
      { cyrillic: 'недеља', latin: 'nedelja', translationEn: 'воскресенье; неделя', exampleCyrillic: 'Недеља је слободан дан.', exampleTranslation: 'Воскресенье — выходной.' },
      { cyrillic: 'јутро', latin: 'jutro', translationEn: 'утро', exampleCyrillic: 'Јутро је хладно.', exampleTranslation: 'Утро холодное.' },
      { cyrillic: 'подне', latin: 'podne', translationEn: 'полдень', exampleCyrillic: 'Сад је подне.', exampleTranslation: 'Сейчас полдень.' },
      { cyrillic: 'попладне', latin: 'popodne', translationEn: 'время дня после полудня', exampleCyrillic: 'У попладне идем у парк.', exampleTranslation: 'Днём я иду в парк.' },
      { cyrillic: 'сат', latin: 'sat', translationEn: 'час; часы', exampleCyrillic: 'Сат је на зиду.', exampleTranslation: 'Часы на стене.' },
      { cyrillic: 'минута', latin: 'minuta', translationEn: 'минута', exampleCyrillic: 'Чекajте пет минута.', exampleTranslation: 'Подождите пять минут.' },
      { cyrillic: 'данас', latin: 'danas', translationEn: 'сегодня', exampleCyrillic: 'Данас је леп дан.', exampleTranslation: 'Сегодня красивый день.' },
      { cyrillic: 'сутра', latin: 'sutra', translationEn: 'завтра', exampleCyrillic: 'Сутра идем на посао.', exampleTranslation: 'Завтра я иду на работу.' },
      { cyrillic: 'јуче', latin: 'juče', translationEn: 'вчера', exampleCyrillic: 'Јуче је био петак.', exampleTranslation: 'Вчера была пятница.' },
      { cyrillic: 'месец', latin: 'mesec', translationEn: 'месяц', exampleCyrillic: 'Овај месец је март.', exampleTranslation: 'Этот месяц — март.' },
      { cyrillic: 'годинa', latin: 'godina', translationEn: 'год; год (возраст)', exampleCyrillic: 'Она има двадесет година.', exampleTranslation: 'Ей двадцать лет.' },
      { cyrillic: 'увек', latin: 'uvek', translationEn: 'всегда', exampleCyrillic: 'Ја увек пијem кафу.', exampleTranslation: 'Я всегда пью кофе.' },
      { cyrillic: 'понекад', latin: 'ponekad', translationEn: 'иногда', exampleCyrillic: 'Понекад читам књигу.', exampleTranslation: 'Иногда я читаю книгу.' },
      { cyrillic: 'нула', latin: 'nula', translationEn: 'ноль', exampleCyrillic: 'Вани је нула степени.', exampleTranslation: 'Сейчас ноль градусов.' },
      { cyrillic: 'једan', latin: 'jedan', translationEn: 'один', exampleCyrillic: 'Једan сат је довољно.', exampleTranslation: 'Одного часа достаточно.' },
      { cyrillic: 'два', latin: 'dva', translationEn: 'два', exampleCyrillic: 'Два сата су дуги.', exampleTranslation: 'Два часа — это долго.' },
      { cyrillic: 'три', latin: 'tri', translationEn: 'три', exampleCyrillic: 'Имам три дана слободно.', exampleTranslation: 'У меня три дня выходных.' },
      { cyrillic: 'четири', latin: 'cetiri', translationEn: 'четыре', exampleCyrillic: 'Четири дана до викенда.', exampleTranslation: 'До выходных четыре дня.' },
      { cyrillic: 'пет', latin: 'pet', translationEn: 'пять', exampleCyrillic: 'Пет минута, молим.', exampleTranslation: 'Пять минут, пожалуйста.' },
      { cyrillic: 'шест', latin: 'šest', translationEn: 'шесть', exampleCyrillic: 'Шест сати ујутру.', exampleTranslation: 'Шесть утра.' },
      { cyrillic: 'седам', latin: 'sedam', translationEn: 'семь', exampleCyrillic: 'Седам ујутру је рано.', exampleTranslation: 'Семь утра — рано.' },
      { cyrillic: 'осам', latin: 'osam', translationEn: 'восемь', exampleCyrillic: 'Осам сати ујутру идем на посао.', exampleTranslation: 'В восемь утра иду на работу.' },
      { cyrillic: 'девет', latin: 'devet', translationEn: 'девять', exampleCyrillic: 'У девет идем у кинo.', exampleTranslation: 'В девять иду в кино.' },
      { cyrillic: 'десет', latin: 'deset', translationEn: 'десять', exampleCyrillic: 'Десет минута чекања.', exampleTranslation: 'Десять минут ожидания.' },
      { cyrillic: 'будити се', latin: 'buditi se', translationEn: 'просыпаться', exampleCyrillic: 'Будим се у седам.', exampleTranslation: 'Я просыпаюсь в семь.' },
      { cyrillic: 'рано', latin: 'rano', translationEn: 'рано', exampleCyrillic: 'Устајем рано.', exampleTranslation: 'Я просыпаюсь рано.' },
      { cyrillic: 'касно', latin: 'kasno', translationEn: 'поздно', exampleCyrillic: 'Она је дошла касно.', exampleTranslation: 'Она пришла поздно.' },
      { cyrillic: 'брзо', latin: 'brzo', translationEn: 'быстро', exampleCyrillic: 'Он говори брзо.', exampleTranslation: 'Он говорит быстро.' },
      { cyrillic: 'споро', latin: 'sporo', translationEn: 'медленно', exampleCyrillic: 'Воз иде споро.', exampleTranslation: 'Поезд идёт медленно.' },
      { cyrillic: 'ноћас', latin: 'noćas', translationEn: 'сегодня ночью', exampleCyrillic: 'Ноћас је хладно.', exampleTranslation: 'Сегодня ночью холодно.' },
      { cyrillic: 'време', latin: 'vreme', translationEn: 'время; погода', exampleCyrillic: 'Време је лепo.', exampleTranslation: 'Погода хорошая.' },
      { cyrillic: 'сада', latin: 'sada', translationEn: 'сейчас', exampleCyrillic: 'Сад сам слободан.', exampleTranslation: 'Сейчас я свободен.' },
      { cyrillic: 'јануар', latin: 'januar', translationEn: 'январь', exampleCyrillic: 'Јануар је хладан.', exampleTranslation: 'Январь холодный.' },
      { cyrillic: 'фебруар', latin: 'februar', translationEn: 'февраль', exampleCyrillic: 'У фебруару је хладно.', exampleTranslation: 'В феврале холодно.' },
      { cyrillic: 'март', latin: 'mart', translationEn: 'март', exampleCyrillic: 'Март је први проleћни месец.', exampleTranslation: 'Март — первый месяц весны.' },
      { cyrillic: 'април', latin: 'april', translationEn: 'апрель', exampleCyrillic: 'Април је леп месец.', exampleTranslation: 'Апрель — красивый месяц.' },
      { cyrillic: 'мај', latin: 'maj', translationEn: 'май', exampleCyrillic: 'У мају је топло.', exampleTranslation: 'В мае тепло.' },
      { cyrillic: 'јун', latin: 'jun', translationEn: 'июнь', exampleCyrillic: 'У јуну је вруће.', exampleTranslation: 'В июне жарко.' },
      { cyrillic: 'јул', latin: 'jul', translationEn: 'июль', exampleCyrillic: 'Јул је најтоплији месец.', exampleTranslation: 'Июль — самый жаркий месяц.' },
      { cyrillic: 'август', latin: 'avgust', translationEn: 'август', exampleCyrillic: 'Август је месец одмора.', exampleTranslation: 'Август — месяц отдыха.' },
      { cyrillic: 'септембар', latin: 'septembar', translationEn: 'сентябрь', exampleCyrillic: 'У септембру почиње школа.', exampleTranslation: 'В сентябре начинается школа.' },
      { cyrillic: 'октобар', latin: 'oktobar', translationEn: 'октябрь', exampleCyrillic: 'У октобру је хладно.', exampleTranslation: 'В октябре холодно.' },
      { cyrillic: 'новембар', latin: 'novembar', translationEn: 'ноябрь', exampleCyrillic: 'Новембар је хладан.', exampleTranslation: 'Ноябрь холодный.' },
      { cyrillic: 'децембар', latin: 'decembar', translationEn: 'декабрь', exampleCyrillic: 'У децембру је мој рођендан.', exampleTranslation: 'В декабре мой день рождения.' },
      { cyrillic: 'рођендан', latin: 'rođendan', translationEn: 'день рождения', exampleCyrillic: 'Мој рођендан је у мају.', exampleTranslation: 'Мой день рождения в мае.' },
      { cyrillic: 'зима', latin: 'zima', translationEn: 'зима', exampleCyrillic: 'Зима је хладна.', exampleTranslation: 'Зима холодная.' },
      { cyrillic: 'лето', latin: 'leto', translationEn: 'лето', exampleCyrillic: 'Лето је топло.', exampleTranslation: 'Лето тёплое.' },
      { cyrillic: 'проleће', latin: 'proleće', translationEn: 'весна', exampleCyrillic: 'Проleће је лепo.', exampleTranslation: 'Весна прекрасна.' },
      { cyrillic: 'јесен', latin: 'jesen', translationEn: 'осень', exampleCyrillic: 'Јесен је хладна.', exampleTranslation: 'Осень холодная.' },
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
      word.translationRu = wordSeed.translationRu ?? '';
      word.translationEn = wordSeed.translationEn;
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
