import { validateTheoryPayload } from './theory-blocks';

const validTableBlock = {
  type: 'table',
  captionCyrillic: 'Падежи',
  captionLatin: 'Padeži',
  captionTranslationRu: 'Падежи',
  captionTranslationEn: 'Cases',
  headers: [
    { cyrillic: 'Ја', latin: 'Ja' },
    { cyrillic: 'Ти', latin: 'Ti' },
  ],
  headersTranslationRu: ['Я', 'Ты'],
  headersTranslationEn: ['I', 'You'],
  rows: [
    [
      { cyrillic: 'јесам', latin: 'jesam' },
      { cyrillic: 'јеси', latin: 'jesi' },
    ],
  ],
};

describe('validateTheoryPayload', () => {
  const validPayload = {
    version: 1,
    blocks: [
      {
        type: 'heading',
        textCyrillic: 'Презент',
        textLatin: 'Prezent',
        translationRu: 'Настоящее время',
        translationEn: 'Present tense',
      },
      {
        type: 'paragraph',
        textCyrillic: 'Текст',
        textLatin: 'Tekst',
        translationRu: 'Текст',
        translationEn: 'Text',
      },
      validTableBlock,
      {
        type: 'example',
        cyrillic: 'Ја радим.',
        latin: 'Ja radim.',
        translationRu: 'Я работаю.',
        translationEn: 'I work.',
      },
    ],
  };

  it('accepts a valid payload', () => {
    expect(validateTheoryPayload(validPayload)).toBeNull();
  });

  it('rejects non-object payload and wrong version', () => {
    expect(validateTheoryPayload(null)).toContain('object');
    expect(validateTheoryPayload({ ...validPayload, version: 2 })).toContain('version');
  });

  it('rejects empty or non-array blocks', () => {
    expect(validateTheoryPayload({ version: 1, blocks: [] })).toContain('empty');
    expect(validateTheoryPayload({ version: 1, blocks: 'x' })).toContain('array');
  });

  it('rejects unknown block type', () => {
    expect(
      validateTheoryPayload({ version: 1, blocks: [{ type: 'video' }] }),
    ).toContain('heading, paragraph, table, example');
  });

  it('rejects heading missing text fields', () => {
    expect(
      validateTheoryPayload({ version: 1, blocks: [{ type: 'heading', textCyrillic: 'x' }] }),
    ).toContain('textCyrillic and textLatin');
  });

  it('rejects paragraph missing translations', () => {
    expect(
      validateTheoryPayload({
        version: 1,
        blocks: [{ type: 'paragraph', textCyrillic: 'x', textLatin: 'y' }],
      }),
    ).toContain('translationRu and translationEn');
  });

  it('rejects table with headers translation length mismatch', () => {
    expect(
      validateTheoryPayload({ version: 1, blocks: [{ ...validTableBlock, headersTranslationRu: ['x'] }] }),
    ).toContain('headersTranslationRu');
  });

  it('rejects table row length mismatch and bad headers', () => {
    expect(
      validateTheoryPayload({
        version: 1,
        blocks: [
          {
            ...validTableBlock,
            rows: [[{ cyrillic: 'јесам', latin: 'jesam' }]],
          },
        ],
      }),
    ).toContain('row 0');
    expect(
      validateTheoryPayload({ version: 1, blocks: [{ ...validTableBlock, headers: [] }] }),
    ).toContain('headers');
  });

  it('rejects example missing translations', () => {
    expect(
      validateTheoryPayload({
        version: 1,
        blocks: [{ type: 'example', cyrillic: 'x', latin: 'y', translationRu: 'z' }],
      }),
    ).toContain('example');
  });
});
