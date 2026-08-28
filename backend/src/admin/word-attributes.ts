// Word attribute dictionary. Each attribute is stored as a stable string code
// (`varchar` column); the dictionary maps every code to bilingual labels and is
// served verbatim by GET /admin/word-attributes so the admin can render localized
// labels without duplicating the data. Validation lives here too: the bulk words
// endpoint uses an inline body type that bypasses the global ValidationPipe.

export const WORD_ATTRIBUTE_FIELDS = [
  'partOfSpeech',
  'gender',
  'number',
  'declension',
  'conjugation',
] as const;

export type WordAttributeField = (typeof WORD_ATTRIBUTE_FIELDS)[number];

export interface WordAttributeOption {
  value: string;
  ru: string;
  en: string;
}

export const WORD_ATTRIBUTES: Record<WordAttributeField, WordAttributeOption[]> = {
  partOfSpeech: [
    { value: 'noun', ru: 'существительное', en: 'noun' },
    { value: 'verb', ru: 'глагол', en: 'verb' },
    { value: 'adjective', ru: 'прилагательное', en: 'adjective' },
    { value: 'adverb', ru: 'наречие', en: 'adverb' },
    { value: 'pronoun', ru: 'местоимение', en: 'pronoun' },
    { value: 'preposition', ru: 'предлог', en: 'preposition' },
    { value: 'conjunction', ru: 'союз', en: 'conjunction' },
    { value: 'particle', ru: 'частица', en: 'particle' },
    { value: 'interjection', ru: 'междометие', en: 'interjection' },
    { value: 'numeral', ru: 'числительное', en: 'numeral' },
  ],
  gender: [
    { value: 'm', ru: 'мужской род', en: 'masculine' },
    { value: 'f', ru: 'женский род', en: 'feminine' },
    { value: 'n', ru: 'средний род', en: 'neuter' },
  ],
  number: [
    { value: 'singular', ru: 'единственное число', en: 'singular' },
    { value: 'plural', ru: 'множественное число', en: 'plural' },
  ],
  // Declension: I = masculine/neuter, II = feminine in -a, III = feminine consonant.
  declension: [
    { value: 'I', ru: 'I склонение', en: '1st declension' },
    { value: 'II', ru: 'II склонение', en: '2nd declension' },
    { value: 'III', ru: 'III склонение', en: '3rd declension' },
  ],
  // Conjugation: I = -ам, II = -ем (incl. -ујем), III = -им.
  conjugation: [
    { value: 'I', ru: 'I спряжение', en: '1st conjugation' },
    { value: 'II', ru: 'II спряжение', en: '2nd conjugation' },
    { value: 'III', ru: 'III спряжение', en: '3rd conjugation' },
  ],
};

export function isWordAttributeField(field: string): field is WordAttributeField {
  return (WORD_ATTRIBUTE_FIELDS as readonly string[]).includes(field);
}

/** True when value is null/undefined/'' (field unset) or a known code for the field. */
export function isWordAttributeValue(
  field: WordAttributeField,
  value: string | null | undefined,
): boolean {
  if (value === null || value === undefined || value === '') return true;
  return WORD_ATTRIBUTES[field].some((option) => option.value === value);
}

/**
 * Returns a human-readable problem for every non-empty attribute code that is
 * not in the dictionary. null / undefined / '' are always allowed (field unset),
 * so the same helper works for CreateWordDto, UpdateWordDto and bulk rows.
 */
export function validateWordAttributes(
  values: Partial<Record<WordAttributeField, string | null | undefined>>,
): string[] {
  const problems: string[] = [];
  for (const field of WORD_ATTRIBUTE_FIELDS) {
    const value = values[field];
    if (!isWordAttributeValue(field, value)) {
      const allowed = WORD_ATTRIBUTES[field].map((option) => option.value).join(', ');
      problems.push(`Invalid ${field} code "${value}" (allowed: ${allowed})`);
    }
  }
  return problems;
}

/** Fresh copy of WORD_ATTRIBUTES so the served object can't mutate the singleton. */
export function getWordAttributesResponse(): Record<
  WordAttributeField,
  WordAttributeOption[]
> {
  const response = {} as Record<WordAttributeField, WordAttributeOption[]>;
  for (const field of WORD_ATTRIBUTE_FIELDS) {
    response[field] = WORD_ATTRIBUTES[field].map((option) => ({ ...option }));
  }
  return response;
}
