// Payload-driven exercise editor config for the admin panel. Mirrors the
// backend registry (backend/src/content/exercise-types.ts): each exercise is
// `type` + `payload` where the payload is discriminated by type and carries
// correctAnswerId, answers and settings. This file is the client-side editor
// description; the backend registry is the single source of truth for the
// public API shape.

export interface EditorField {
  key: string;
  label: string;
  required?: boolean;
}

export interface EditorSetting {
  key: string;
  label: string;
  default: boolean;
}

export interface ExerciseEditorConfig {
  type: string;
  label: string;
  description: string;
  promptKey: 'question' | 'sentence';
  promptLabel: string;
  promptFields: EditorField[];
  answerFields: EditorField[];
  settings: EditorSetting[];
  minAnswers: number;
}

export const EXERCISE_EDITOR_CONFIGS: Record<string, ExerciseEditorConfig> = {
  translation_choice: {
    type: 'translation_choice',
    label: 'Translation choice',
    description: 'Pick the correct translation of a phrase',
    promptKey: 'question',
    promptLabel: 'Question',
    promptFields: [
      { key: 'srCyr', label: 'Cyrillic', required: true },
      { key: 'srLat', label: 'Latin', required: true },
      { key: 'ru', label: 'Translation RU' },
      { key: 'en', label: 'Translation EN' },
    ],
    answerFields: [
      { key: 'en', label: 'Answer EN', required: true },
      { key: 'ru', label: 'Answer RU' },
    ],
    settings: [
      { key: 'shuffleOptions', label: 'Shuffle options', default: true },
      { key: 'showImage', label: 'Show image', default: false },
      { key: 'playAudio', label: 'Play audio', default: true },
    ],
    minAnswers: 3,
  },
  fill_word: {
    type: 'fill_word',
    label: 'Fill the word',
    description: 'Complete the sentence with the right word',
    promptKey: 'sentence',
    promptLabel: 'Sentence',
    promptFields: [
      { key: 'srCyr', label: 'Cyrillic', required: true },
      { key: 'srLat', label: 'Latin', required: true },
      { key: 'ru', label: 'Translation RU' },
      { key: 'en', label: 'Translation EN' },
    ],
    answerFields: [
      { key: 'srCyr', label: 'Word Cyrillic', required: true },
      { key: 'srLat', label: 'Word Latin' },
      { key: 'ru', label: 'RU' },
      { key: 'en', label: 'EN' },
    ],
    settings: [
      { key: 'shuffleOptions', label: 'Shuffle options', default: true },
      { key: 'showSentenceTranslation', label: 'Show sentence translation', default: true },
      { key: 'playAudio', label: 'Play audio', default: false },
    ],
    minAnswers: 3,
  },
};

export function getEditorConfig(type: string): ExerciseEditorConfig | undefined {
  return EXERCISE_EDITOR_CONFIGS[type];
}

export interface PayloadAnswer {
  id: string;
  wordId?: string | null;
  srCyr?: string;
  srLat?: string;
  ru?: string;
  en?: string;
  audioUrl?: string | null;
  imageUrl?: string | null;
}

export type ExercisePayload = Record<string, unknown>;

export function makeId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `ans-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function emptyAnswer(): PayloadAnswer {
  return { id: makeId(), wordId: null };
}

// Default payload for a new exercise of the given type. Answers start with a
// valid (unique, non-null) id because correctAnswerId references them.
export function createEmptyPayload(type: string): ExercisePayload {
  const config = getEditorConfig(type);
  if (!config) return {};
  const answers = Array.from({ length: Math.max(config.minAnswers, 4) }, emptyAnswer);
  return {
    [config.promptKey]: { srCyr: '', srLat: '', ru: '', en: '' },
    answers,
    correctAnswerId: answers[0].id,
    settings: Object.fromEntries(config.settings.map((s) => [s.key, s.default])),
  };
}

// Make an incoming payload safe to edit: guarantee answer ids, a correctAnswerId
// and merged settings. Used to seed the editor from an existing exercise.
export function normalizePayload(type: string, raw: Record<string, unknown>): ExercisePayload {
  const config = getEditorConfig(type);
  if (!config) return { ...raw };
  const answers = Array.isArray(raw.answers)
    ? (raw.answers as PayloadAnswer[]).map((a) => (a && a.id ? a : { ...a, id: makeId() }))
    : Array.from({ length: Math.max(config.minAnswers, 4) }, emptyAnswer);
  const correctAnswerId =
    (raw.correctAnswerId as string | undefined) ?? answers[0]?.id;
  const rawSettings = (raw.settings as Record<string, boolean>) ?? {};
  const settings = Object.fromEntries(
    config.settings.map((s) => [s.key, rawSettings[s.key] ?? s.default]),
  );
  const prompt: Record<string, string> = { srCyr: '', srLat: '', ru: '', en: '' };
  const rawPrompt = (raw[config.promptKey] as Record<string, unknown>) ?? {};
  for (const f of config.promptFields) {
    if (typeof rawPrompt[f.key] === 'string') prompt[f.key] = rawPrompt[f.key] as string;
  }
  return {
    ...raw,
    [config.promptKey]: prompt,
    answers,
    correctAnswerId,
    settings,
  };
}

// Human-readable preview for a lesson-page exercise card.
export function payloadPreview(payload: ExercisePayload, type: string): { title: string; subtitle: string } {
  const config = getEditorConfig(type);
  if (!config) return { title: type, subtitle: '' };
  const prompt = (payload[config.promptKey] as Record<string, string>) ?? {};
  const answers = Array.isArray(payload.answers) ? (payload.answers as PayloadAnswer[]) : [];
  const correct = answers.find((a) => a.id === payload.correctAnswerId);
  const answerRecord = correct as Record<string, string | undefined> | undefined;
  const correctText = correct
    ? config.answerFields.map((f) => answerRecord?.[f.key]).find((v) => v) ?? '(empty)'
    : '(no correct answer)';
  return {
    title: prompt.srCyr || prompt.srLat || '(no prompt)',
    subtitle: `${answers.length} answers · correct: ${correctText}`,
  };
}
