import AppDataSource from './data-source';
import { TheoryPayload } from '../content/theory-blocks';

// Demo theory topics for the default 'Основе' section, created DRAFT on
// purpose — per the PRD they need a native-speaker review before publishing.
// Idempotent: a topic is inserted only if no topic with the same title exists.
const bitiPayload: TheoryPayload = {
  version: 1,
  blocks: [
    {
      type: 'heading',
      textCyrillic: 'Глагол „бити" у садашњем времену',
      textLatin: 'Glagol „biti" u sadašnjem vremenu',
    },
    {
      type: 'paragraph',
      textCyrillic:
        'Глагол „бити" је нерегуларан и један од најчешћих глагола у српском језику. Служи за исказивање стања и придева.',
      textLatin:
        'Glagol „biti" je neregularan i jedan od najčešćih glagola u srpskom jeziku. Služi za iskazivanje stanja i pridava.',
    },
    {
      type: 'table',
      captionCyrillic: 'Спряжение — презент',
      captionLatin: 'Konjugacija — prezent',
      headers: [
        { cyrillic: 'Особа', latin: 'Osoba' },
        { cyrillic: 'Форма', latin: 'Forma' },
        { cyrillic: 'Пример', latin: 'Primer' },
      ],
      rows: [
        [
          { cyrillic: 'ја', latin: 'ja' },
          { cyrillic: 'сам', latin: 'sam' },
          { cyrillic: 'Ја сам овде.', latin: 'Ja sam ovde.' },
        ],
        [
          { cyrillic: 'ти', latin: 'ti' },
          { cyrillic: 'си', latin: 'si' },
          { cyrillic: 'Ти си болесан.', latin: 'Ti si bolesan.' },
        ],
        [
          { cyrillic: 'он/она', latin: 'on/ona' },
          { cyrillic: 'је', latin: 'je' },
          { cyrillic: 'Она је лектор.', latin: 'Ona je lektor.' },
        ],
        [
          { cyrillic: 'ми', latin: 'mi' },
          { cyrillic: 'смо', latin: 'smo' },
          { cyrillic: 'Ми смо готови.', latin: 'Mi smo gotovi.' },
        ],
        [
          { cyrillic: 'ви', latin: 'vi' },
          { cyrillic: 'сте', latin: 'ste' },
          { cyrillic: 'Ви сте прави.', latin: 'Vi ste pravi.' },
        ],
        [
          { cyrillic: 'они', latin: 'oni' },
          { cyrillic: 'су', latin: 'su' },
          { cyrillic: 'Они су дома.', latin: 'Oni su doma.' },
        ],
      ],
    },
    {
      type: 'example',
      cyrillic: 'Ја сам из Русије.',
      latin: 'Ja sam iz Rusije.',
      translationRu: 'Я из России.',
      translationEn: 'I am from Russia.',
    },
  ],
};

const casesPayload: TheoryPayload = {
  version: 1,
  blocks: [
    {
      type: 'heading',
      textCyrillic: 'Седам падежа српског језика',
      textLatin: 'Sedam padeža srpskog jezika',
    },
    {
      type: 'paragraph',
      textCyrillic:
        'У српском језику постоји седам падежа. Сваки падеж одговара на питање и има своју улогу у реченици.',
      textLatin:
        'U srpskom jeziku postoji sedam padeža. Svaki padež odgovara na pitanje i ima svoju ulogu u rečenici.',
    },
    {
      type: 'table',
      captionCyrillic: 'Падежи и њихова питања',
      captionLatin: 'Padeži i njihova pitanja',
      headers: [
        { cyrillic: 'Падеж', latin: 'Padež' },
        { cyrillic: 'Питање', latin: 'Pitanje' },
      ],
      rows: [
        [
          { cyrillic: '1. Номинатив', latin: '1. Nominativ' },
          { cyrillic: 'Ко? Шта?', latin: 'Ko? Šta?' },
        ],
        [
          { cyrillic: '2. Генитив', latin: '2. Genitiv' },
          { cyrillic: 'Кога? Чега?', latin: 'Koga? Čega?' },
        ],
        [
          { cyrillic: '3. Датив', latin: '3. Dativ' },
          { cyrillic: 'Коме? Чему?', latin: 'Kome? Čemu?' },
        ],
        [
          { cyrillic: '4. Акузатив', latin: '4. Akuzativ' },
          { cyrillic: 'Кога? Шта?', latin: 'Koga? Šta?' },
        ],
        [
          { cyrillic: '5. Вокатив', latin: '5. Vokativ' },
          { cyrillic: '—', latin: '—' },
        ],
        [
          { cyrillic: '6. Инструментал', latin: '6. Instrumental' },
          { cyrillic: 'Са ким? Чим?', latin: 'Sa kim? Čim?' },
        ],
        [
          { cyrillic: '7. Локатив', latin: '7. Lokativ' },
          { cyrillic: 'О коме? О чему?', latin: 'O kome? O čemu?' },
        ],
      ],
    },
    {
      type: 'example',
      cyrillic: 'Идем на посао аутобусом.',
      latin: 'Idem na posao autobusom.',
      translationRu: 'Я еду на работу автобусом.',
      translationEn: 'I go to work by bus.',
    },
  ],
};

const TOPICS: Array<{ titleCyrillic: string; titleLatin: string; payload: TheoryPayload }> = [
  { titleCyrillic: 'Глагол бити', titleLatin: 'Glagol biti', payload: bitiPayload },
  { titleCyrillic: 'Седам падежа', titleLatin: 'Sedam padeža', payload: casesPayload },
];

async function seedTheory(): Promise<void> {
  await AppDataSource.initialize();
  try {
    const sections = await AppDataSource.query(
      `SELECT "id" FROM "sections" WHERE "titleCyrillic" = 'Основе' LIMIT 1`,
    );
    if (sections.length === 0) {
      console.log('seed-theory: section Основе not found, nothing inserted');
      return;
    }
    const sectionId: string = sections[0].id;
    for (const [i, topic] of TOPICS.entries()) {
      const inserted = await AppDataSource.query(
        `INSERT INTO "theory_topics"
           ("sectionId", "titleCyrillic", "titleLatin", "titleTranslationRu", "titleTranslationEn",
            "payload", "status", "order")
         SELECT $1, $2, $3, '', '', $4, 'DRAFT', $5
         WHERE NOT EXISTS (
           SELECT 1 FROM "theory_topics" WHERE "titleCyrillic" = $2 AND "sectionId" = $1
         )
         RETURNING "id"`,
        [sectionId, topic.titleCyrillic, topic.titleLatin, JSON.stringify(topic.payload), i + 1],
      );
      if (inserted.length > 0) {
        console.log(`seed-theory: inserted "${topic.titleCyrillic}" (${inserted[0].id})`);
      } else {
        console.log(`seed-theory: "${topic.titleCyrillic}" already exists, skipped`);
      }
    }
  } finally {
    await AppDataSource.destroy();
  }
}

seedTheory().catch((err) => {
  console.error(err);
  process.exit(1);
});
