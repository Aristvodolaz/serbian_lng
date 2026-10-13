// Exercise type registry. An exercise is stored as `type: varchar` +
// `payload: jsonb`; adding a new exercise type is just a new entry here
// (plus a renderer on each client and an admin editor). No DB migration, no
// change to lesson/unit structure — this is the whole point of the design.
//
// ── Type contract ─────────────────────────────────────────────
// An exercise type is identified by `type: string` (a key of
// EXERCISE_TYPE_REGISTRY) and carries a type-specific `payload: jsonb`
// (plus per-exercise `order` and `status`, stored as columns). Payloads are
// plain JSON — no DB schema per type.
//
// A payload carries every language (ru/en) and both Serbian scripts
// (srCyr/srLat); the client picks the fields it needs from the user's
// language/script preferences. Answers reference a dictionary Word by id
// (`wordId`) — inline fields are the fallback when no word exists yet.
//
// Every registry entry must provide:
// - `label` / `description` — surfaced in the admin template list;
// - `createPayload()` — an empty-but-well-shaped template for the admin
//   editor, so a structurally invalid payload for a known type cannot even
//   be typed in;
// - `validate(payload) → ValidationIssue[]` — the single source of truth for
//   payload validity. It runs at admin save (create/update/bulk) and at the
//   publish gate, and its rules must cover what `checkAnswer` relies on:
//   unique non-empty `answers[].id` and a `correctAnswerId` matching one of
//   them. Reference: docs/exercise-types.md.

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

/** The visual gap left where the missing word should go in a fill_word sentence. */
export const BLANK_TOKEN = '____';

/** Whole-word, case-insensitive matcher — the single regex shared by the
 * save-time blank check and the serve-time blanking in exercise-resolver. */
export function wholeWordRegExp(word: string): RegExp {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\p{L}])${escaped}(?![\\p{L}])`, 'iu');
}

/** Whole-word, case-insensitive occurrence of `word` in `sentence`. */
function hasWholeWord(sentence: string, word: string): boolean {
  return wholeWordRegExp(word).test(sentence);
}

/**
 * A fill_word payload is playable only if the client can show a gap: either
 * the author baked `____` into the sentence, or the correct answer appears
 * verbatim (in at least one script) so serve-time blanking can put the gap
 * there. Otherwise the exercise degenerates — the sentence shows complete.
 * Word-linked answers (`wordId`, no inline sr text) are not verifiable here —
 * their text is resolved from the dictionary before serve-time blanking — so
 * they pass; the sentence should then contain the word verbatim or bake `____`.
 */
function checkFillWordBlank(payload: Record<string, unknown>): ValidationIssue | undefined {
  const sentence = payload.sentence as Record<string, unknown> | undefined;
  if (typeof sentence !== 'object' || sentence === null) return undefined;
  const srCyr = typeof sentence.srCyr === 'string' ? sentence.srCyr : '';
  const srLat = typeof sentence.srLat === 'string' ? sentence.srLat : '';
  if (!srCyr.trim() || !srLat.trim()) return undefined;
  if (srCyr.includes(BLANK_TOKEN) || srLat.includes(BLANK_TOKEN)) return undefined;

  const answers = Array.isArray(payload.answers) ? payload.answers : [];
  const correct = answers.find(
    (a) =>
      typeof a === 'object' &&
      a !== null &&
      (a as Record<string, unknown>).id === payload.correctAnswerId,
  ) as Record<string, unknown> | undefined;
  if (!correct) return undefined;

  const hasWordRef = hasText(correct.wordId);
  const hasInlineSr = hasText(correct.srCyr) || hasText(correct.srLat);
  if (hasWordRef && !hasInlineSr) {
    // A word-linked answer without inline text cannot be verified statically:
    // at serve time the Word content is resolved into the payload first and
    // blanking runs on the resolved text. Trusting it here is cheaper than
    // threading the dictionary into this pure module.
    return undefined;
  }

  const cyrBlankable =
    hasText(correct.srCyr) && hasWholeWord(srCyr, (correct.srCyr as string).trim());
  const latBlankable =
    hasText(correct.srLat) && hasWholeWord(srLat, (correct.srLat as string).trim());
  if (!cyrBlankable && !latBlankable) {
    return {
      field: 'sentence',
      message:
        'no author-baked ____ and the correct answer is not found verbatim in the sentence — ' +
        'the blank will not be substituted; bake ____ into the sentence or make the answer appear verbatim',
    };
  }
  return undefined;
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
      const blankIssue = checkFillWordBlank(p);
      if (blankIssue) issues.push(blankIssue);
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
