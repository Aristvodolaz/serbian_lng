// Exercise type registry. An exercise is stored as `type: varchar` +
// `payload: jsonb`; adding a new exercise type is just a new entry here
// (plus a renderer on each client and an admin editor). No DB migration, no
// change to lesson/unit structure — this is the whole point of the design.
//
// A payload carries every language (ru/en) and both Serbian scripts
// (srCyr/srLat); the client picks the fields it needs from the user's
// language/script preferences. Answers reference a dictionary Word by id
// (`wordId`) — inline fields are the fallback when no word exists yet.

export const EXERCISE_TYPES = ['translation_choice', 'fill_word'] as const;
export type ExerciseType = (typeof EXERCISE_TYPES)[number];

export interface ExerciseAnswer {
  id: string;
  /** Reference to a dictionary Word; when set, the renderer resolves sr/ru/en/audio/image from it. */
  wordId?: string | null;
  /** Inline fallback fields, used when wordId is not set. */
  srCyr?: string;
  srLat?: string;
  ru?: string;
  en?: string;
  audioUrl?: string | null;
  imageUrl?: string | null;
}

export interface TranslationChoicePayload {
  question: {
    wordId?: string | null;
    srCyr?: string;
    srLat?: string;
    ru?: string;
    en?: string;
    audioUrl?: string | null;
    imageUrl?: string | null;
  };
  answers: ExerciseAnswer[];
  correctAnswerId: string;
  settings?: {
    shuffleOptions?: boolean;
    showImage?: boolean;
    playAudio?: boolean;
  };
}

export interface FillWordPayload {
  sentence: {
    srCyr: string;
    srLat: string;
    ru?: string;
    en?: string;
  };
  answers: ExerciseAnswer[];
  correctAnswerId: string;
  settings?: {
    shuffleOptions?: boolean;
    showSentenceTranslation?: boolean;
    playAudio?: boolean;
  };
}

export type ExercisePayload = TranslationChoicePayload | FillWordPayload;

export interface ValidationIssue {
  /** JSON-path-ish pointer to the offending field, e.g. `answers[2].id`. */
  field: string;
  message: string;
}

export interface ExerciseTypeDefinition {
  type: ExerciseType;
  label: string;
  description: string;
  createPayload(): ExercisePayload;
  validate(payload: unknown): ValidationIssue[];
}

const hasText = (value: unknown): boolean =>
  typeof value === 'string' && value.trim().length > 0;

function validateAnswers(
  answers: unknown,
  minAnswers: number,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!Array.isArray(answers)) {
    return [{ field: 'answers', message: 'answers must be an array' }];
  }
  if (answers.length < minAnswers) {
    issues.push({
      field: 'answers',
      message: `need at least ${minAnswers} answers, got ${answers.length}`,
    });
  }
  const seen = new Set<string>();
  answers.forEach((answer, index) => {
    const base = `answers[${index}]`;
    if (typeof answer !== 'object' || answer === null) {
      issues.push({ field: base, message: 'answer must be an object' });
      return;
    }
    const a = answer as Record<string, unknown>;
    if (!hasText(a.id)) {
      issues.push({ field: `${base}.id`, message: 'answer id is required' });
    } else if (seen.has(a.id as string)) {
      issues.push({ field: `${base}.id`, message: 'duplicate answer id' });
    } else {
      seen.add(a.id as string);
    }
    const hasWord = hasText(a.wordId);
    const hasInline = [a.srCyr, a.srLat, a.ru, a.en].some(hasText);
    if (!hasWord && !hasInline) {
      issues.push({
        field: base,
        message: 'answer must reference a word or have inline text',
      });
    }
  });
  return issues;
}

function validateCorrectAnswerId(
  payload: Record<string, unknown>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const answers = Array.isArray(payload.answers) ? payload.answers : [];
  const ids = new Set(
    answers
      .filter((a): a is Record<string, unknown> => typeof a === 'object' && a !== null)
      .map((a) => a.id as string),
  );
  if (!hasText(payload.correctAnswerId)) {
    issues.push({ field: 'correctAnswerId', message: 'correctAnswerId is required' });
  } else if (!ids.has(payload.correctAnswerId as string)) {
    issues.push({
      field: 'correctAnswerId',
      message: 'correctAnswerId must match one of the answers',
    });
  }
  return issues;
}

export const EXERCISE_TYPE_REGISTRY: Record<ExerciseType, ExerciseTypeDefinition> = {
  translation_choice: {
    type: 'translation_choice',
    label: 'Выбор перевода',
    description:
      'Вопрос на сербском (слово или фраза), варианты — переводы на язык интерфейса.',
    createPayload(): TranslationChoicePayload {
      return {
        question: { srCyr: '', srLat: '', ru: '', en: '' },
        answers: [
          { id: crypto.randomUUID(), srCyr: '', srLat: '', ru: '', en: '' },
          { id: crypto.randomUUID(), srCyr: '', srLat: '', ru: '', en: '' },
          { id: crypto.randomUUID(), srCyr: '', srLat: '', ru: '', en: '' },
          { id: crypto.randomUUID(), srCyr: '', srLat: '', ru: '', en: '' },
        ],
        correctAnswerId: '',
        settings: { shuffleOptions: true, showImage: false, playAudio: true },
      };
    },
    validate(payload: unknown): ValidationIssue[] {
      const p = payload as Record<string, unknown>;
      if (typeof p !== 'object' || p === null) {
        return [{ field: '', message: 'payload must be an object' }];
      }
      const issues: ValidationIssue[] = [];
      const question = p.question as Record<string, unknown> | undefined;
      if (typeof question !== 'object' || question === null) {
        issues.push({ field: 'question', message: 'question is required' });
      } else {
        const hasAny = [question.srCyr, question.srLat, question.ru, question.en].some(hasText);
        if (!hasAny) {
          issues.push({
            field: 'question',
            message: 'question needs Serbian text (srCyr/srLat) or a translation (ru/en)',
          });
        }
      }
      issues.push(...validateAnswers(p.answers, 3));
      issues.push(...validateCorrectAnswerId(p));
      return issues;
    },
  },
  fill_word: {
    type: 'fill_word',
    label: 'Вставка слова',
    description: 'Предложение на сербском с пропуском, варианты — сербские слова.',
    createPayload(): FillWordPayload {
      return {
        sentence: { srCyr: '', srLat: '', ru: '', en: '' },
        answers: [
          { id: crypto.randomUUID(), srCyr: '', srLat: '', ru: '', en: '' },
          { id: crypto.randomUUID(), srCyr: '', srLat: '', ru: '', en: '' },
          { id: crypto.randomUUID(), srCyr: '', srLat: '', ru: '', en: '' },
          { id: crypto.randomUUID(), srCyr: '', srLat: '', ru: '', en: '' },
        ],
        correctAnswerId: '',
        settings: { shuffleOptions: true, showSentenceTranslation: true, playAudio: false },
      };
    },
    validate(payload: unknown): ValidationIssue[] {
      const p = payload as Record<string, unknown>;
      if (typeof p !== 'object' || p === null) {
        return [{ field: '', message: 'payload must be an object' }];
      }
      const issues: ValidationIssue[] = [];
      const sentence = p.sentence as Record<string, unknown> | undefined;
      if (typeof sentence !== 'object' || sentence === null) {
        issues.push({ field: 'sentence', message: 'sentence is required' });
      } else {
        if (!hasText(sentence.srCyr)) {
          issues.push({ field: 'sentence.srCyr', message: 'sentence srCyr is required' });
        }
        if (!hasText(sentence.srLat)) {
          issues.push({ field: 'sentence.srLat', message: 'sentence srLat is required' });
        }
      }
      issues.push(...validateAnswers(p.answers, 3));
      issues.push(...validateCorrectAnswerId(p));
      return issues;
    },
  },
};

export function getExerciseTypeDefinition(type: string): ExerciseTypeDefinition | undefined {
  return EXERCISE_TYPE_REGISTRY[type as ExerciseType];
}

export function validateExercisePayload(type: string, payload: unknown): ValidationIssue[] {
  const definition = getExerciseTypeDefinition(type);
  if (!definition) {
    return [{ field: 'type', message: `unknown exercise type: ${type}` }];
  }
  return definition.validate(payload);
}

export function exercisePayloadIsValid(type: string, payload: unknown): boolean {
  return validateExercisePayload(type, payload).length === 0;
}

/** Resolves the correct answer object of a payload, or undefined when invalid. */
export function getCorrectAnswer(payload: ExercisePayload): ExerciseAnswer | undefined {
  const answers = 'answers' in payload ? payload.answers : [];
  return answers.find((a) => a.id === payload.correctAnswerId);
}
