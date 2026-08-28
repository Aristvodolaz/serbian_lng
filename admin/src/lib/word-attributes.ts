// Types + pure helpers for the word-attribute dictionary. The actual dictionary
// data is fetched from GET /admin/word-attributes (backend is the source of
// truth); only the shape is mirrored here.

export type WordAttributeField =
  | 'partOfSpeech'
  | 'gender'
  | 'number'
  | 'declension'
  | 'conjugation';

export interface WordAttributeOption {
  value: string;
  ru: string;
  en: string;
}

export type WordAttributes = Record<WordAttributeField, WordAttributeOption[]>;

export function attributeLabel(
  field: WordAttributeField,
  code: string | null | undefined,
  lang: 'ru' | 'en',
  attributes: WordAttributes,
): string | null {
  if (!code) return null;
  const option = attributes[field]?.find((o) => o.value === code);
  return option ? option[lang] : null;
}
