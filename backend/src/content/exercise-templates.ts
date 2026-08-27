import { ExerciseType } from './entities/exercise.entity';

export type ExerciseChoiceField = 'text' | 'textRu';

export type ExercisePromptFieldName =
  | 'promptCyrillic'
  | 'promptLatin'
  | 'promptTranslationRu'
  | 'promptTranslationEn';

export interface ExerciseTemplatePromptField {
  name: ExercisePromptFieldName;
  label: string;
  required: boolean;
}

export interface ExerciseTemplate {
  type: ExerciseType;
  label: string;
  description: string;
  promptFields: ExerciseTemplatePromptField[];
  choiceFields: ExerciseChoiceField[];
  choiceTextLabel: string;
  choiceTextRuLabel?: string;
  choicesMin?: number;
}

const COMMON_PROMPT_FIELDS: ExerciseTemplatePromptField[] = [
  { name: 'promptCyrillic', label: 'Cyrillic', required: true },
  { name: 'promptLatin', label: 'Latin', required: true },
  { name: 'promptTranslationRu', label: 'Translation RU', required: true },
  { name: 'promptTranslationEn', label: 'Translation EN', required: true },
];

export const EXERCISE_TEMPLATES: Record<ExerciseType, ExerciseTemplate> = {
  [ExerciseType.TRANSLATE_CHOICE]: {
    type: ExerciseType.TRANSLATE_CHOICE,
    label: 'Translate word choice',
    description:
      'Shows a Serbian word — the learner picks the correct translation.',
    promptFields: COMMON_PROMPT_FIELDS,
    choiceFields: ['text', 'textRu'],
    choiceTextLabel: 'Answer (EN)',
    choiceTextRuLabel: 'Answer (RU)',
    choicesMin: 2,
  },
  [ExerciseType.FILL_BLANK]: {
    type: ExerciseType.FILL_BLANK,
    label: 'Complete the sentence',
    description:
      'Shows a sentence with a blank — the learner picks the Serbian word that fits.',
    promptFields: COMMON_PROMPT_FIELDS,
    choiceFields: ['text'],
    choiceTextLabel: 'Serbian word',
    choicesMin: 2,
  },
};

export function getExerciseTemplates(): ExerciseTemplate[] {
  return Object.values(EXERCISE_TEMPLATES);
}

export function getExerciseTemplate(type: ExerciseType): ExerciseTemplate {
  return EXERCISE_TEMPLATES[type];
}
