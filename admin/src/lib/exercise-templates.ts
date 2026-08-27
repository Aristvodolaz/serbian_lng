export interface ExerciseTemplate {
  type: string;
  label: string;
  description: string;
  promptFields: Array<{ name: string; label: string; required: boolean }>;
  choiceFields: Array<'text' | 'textRu'>;
  choiceTextLabel: string;
  choiceTextRuLabel?: string;
  choicesMin?: number;
}

const FALLBACK_TEMPLATE: ExerciseTemplate = {
  type: 'unknown',
  label: 'Unknown',
  description: '',
  promptFields: [
    { name: 'promptCyrillic', label: 'Cyrillic', required: true },
    { name: 'promptLatin', label: 'Latin', required: true },
    { name: 'promptTranslationRu', label: 'Translation RU', required: true },
    { name: 'promptTranslationEn', label: 'Translation EN', required: true },
  ],
  choiceFields: ['text', 'textRu'],
  choiceTextLabel: 'Answer (EN)',
  choiceTextRuLabel: 'Answer (RU)',
  choicesMin: 2,
};

export function getTemplate(
  templates: ExerciseTemplate[] | undefined,
  type: string,
): ExerciseTemplate {
  return templates?.find((t) => t.type === type) ?? FALLBACK_TEMPLATE;
}
