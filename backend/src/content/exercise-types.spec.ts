import {
  EXERCISE_TYPE_REGISTRY,
  validateExercisePayload,
  exercisePayloadIsValid,
  getCorrectAnswer,
  ExercisePayload,
  FillWordPayload,
} from './exercise-types';

const validTranslationChoice = (): ExercisePayload => ({
  question: { srCyr: 'шума', srLat: 'šuma', ru: 'лес', en: 'forest' },
  answers: [
    { id: 'a1', srCyr: 'шума', ru: 'лес' },
    { id: 'a2', srCyr: 'вода', ru: 'вода' },
    { id: 'a3', srCyr: 'град', ru: 'город' },
  ],
  correctAnswerId: 'a1',
});

const validFillWord = (): ExercisePayload => ({
  sentence: {
    srCyr: 'Ћутање не поседује путнике.',
    srLat: 'Ćutanje ne poseduje putnike.',
    ru: 'Молчание не обременяет путников.',
    en: 'Silence does not burden travellers.',
  },
  answers: [
    { id: 'w1', srCyr: 'путнике', srLat: 'putnike', ru: 'путников' },
    { id: 'w2', srCyr: 'шуме', srLat: 'šume', ru: 'шум' },
    { id: 'w3', srCyr: 'воде', srLat: 'vode', ru: 'вода' },
  ],
  correctAnswerId: 'w1',
});

describe('translation_choice validator', () => {
  it('accepts a valid payload', () => {
    expect(validateExercisePayload('translation_choice', validTranslationChoice())).toEqual([]);
  });

  it('rejects a non-object payload', () => {
    expect(validateExercisePayload('translation_choice', 'nope')).toHaveLength(1);
    expect(validateExercisePayload('translation_choice', null)).toHaveLength(1);
  });

  it('requires at least 3 answers', () => {
    const payload = validTranslationChoice();
    payload.answers = payload.answers.slice(0, 2);
    const issues = validateExercisePayload('translation_choice', payload);
    expect(issues.some((i) => i.field === 'answers')).toBe(true);
  });

  it('rejects empty answers array', () => {
    const payload = validTranslationChoice();
    (payload as { answers: unknown[] }).answers = [];
    const issues = validateExercisePayload('translation_choice', payload);
    expect(issues.some((i) => i.message.includes('at least 3'))).toBe(true);
  });

  it('rejects duplicate answer ids', () => {
    const payload = validTranslationChoice();
    payload.answers[1].id = 'a1';
    const issues = validateExercisePayload('translation_choice', payload);
    expect(issues.some((i) => i.message === 'duplicate answer id')).toBe(true);
  });

  it('rejects answers without text and without wordId', () => {
    const payload = validTranslationChoice();
    payload.answers[0] = { id: 'a1' };
    const issues = validateExercisePayload('translation_choice', payload);
    expect(issues.some((i) => i.message.includes('must reference a word'))).toBe(true);
  });

  it('accepts an answer backed only by a wordId', () => {
    const payload = validTranslationChoice();
    payload.answers[0] = { id: 'a1', wordId: 'word-uuid' };
    expect(validateExercisePayload('translation_choice', payload)).toEqual([]);
  });

  it('requires correctAnswerId to match one of the answers', () => {
    const payload = validTranslationChoice();
    payload.correctAnswerId = 'nope';
    const issues = validateExercisePayload('translation_choice', payload);
    expect(issues.some((i) => i.field === 'correctAnswerId')).toBe(true);
  });

  it('requires a non-empty correctAnswerId', () => {
    const payload = validTranslationChoice();
    payload.correctAnswerId = '';
    const issues = validateExercisePayload('translation_choice', payload);
    expect(issues.some((i) => i.field === 'correctAnswerId')).toBe(true);
  });

  it('requires a question with Serbian or translation text', () => {
    const payload = validTranslationChoice() as { question: Record<string, unknown> };
    payload.question = {};
    const issues = validateExercisePayload('translation_choice', payload);
    expect(issues.some((i) => i.field === 'question')).toBe(true);
  });
});

describe('fill_word validator', () => {
  it('accepts a valid payload', () => {
    expect(validateExercisePayload('fill_word', validFillWord())).toEqual([]);
  });

  it('rejects a non-object payload', () => {
    expect(validateExercisePayload('fill_word', 42)).toHaveLength(1);
  });

  it('requires Serbian sentence text in both scripts', () => {
    const payload = validFillWord() as {
      sentence: { srCyr: string; srLat: string; ru?: string; en?: string };
    };
    payload.sentence.srCyr = '';
    const issues = validateExercisePayload('fill_word', payload);
    expect(issues.some((i) => i.field === 'sentence.srCyr')).toBe(true);
  });

  it('rejects duplicate answer ids', () => {
    const payload = validFillWord();
    payload.answers[2].id = 'w1';
    const issues = validateExercisePayload('fill_word', payload);
    expect(issues.some((i) => i.message === 'duplicate answer id')).toBe(true);
  });

  it('rejects empty answers array', () => {
    const payload = validFillWord();
    (payload as { answers: unknown[] }).answers = [];
    const issues = validateExercisePayload('fill_word', payload);
    expect(issues.some((i) => i.message.includes('at least 3'))).toBe(true);
  });

  it('requires correctAnswerId to match one of the answers', () => {
    const payload = validFillWord();
    payload.correctAnswerId = 'missing';
    const issues = validateExercisePayload('fill_word', payload);
    expect(issues.some((i) => i.field === 'correctAnswerId')).toBe(true);
  });

  it('accepts a sentence whose correct answer appears verbatim (auto-blankable)', () => {
    const payload = validFillWord() as FillWordPayload;
    payload.sentence.srLat = 'Ćutanje ne poseduje putnike.';
    expect(validateExercisePayload('fill_word', payload)).toEqual([]);
  });

  it('rejects a sentence with no ____ and no verbatim correct answer', () => {
    const payload = validFillWord() as FillWordPayload;
    // Correct answer is «путнике» — «путника» is an inflected form, not a
    // whole-word match, so the blank would never be substituted.
    payload.sentence.srCyr = 'Ћутање не поседује путника.';
    payload.sentence.srLat = 'Ćutanje ne poseduje putnika.';
    const issues = validateExercisePayload('fill_word', payload);
    expect(issues.some((i) => i.field === 'sentence' && i.message.includes('____'))).toBe(true);
  });

  it('accepts an author-baked ____ even when the answer is not verbatim', () => {
    const payload = validFillWord() as FillWordPayload;
    payload.sentence.srCyr = 'Ћутање не поседује ____.';
    payload.sentence.srLat = 'Ćutanje ne poseduje ____.';
    expect(validateExercisePayload('fill_word', payload)).toEqual([]);
  });

  it('accepts a wordId-only correct answer without blocking on the blank check', () => {
    const payload = validFillWord() as FillWordPayload;
    payload.answers[0] = { id: 'w1', wordId: 'word-uuid' };
    expect(validateExercisePayload('fill_word', payload)).toEqual([]);
  });
});

describe('registry helpers', () => {
  it('rejects unknown types', () => {
    const issues = validateExercisePayload('listening', validTranslationChoice());
    expect(issues).toEqual([
      { field: 'type', message: 'unknown exercise type: listening' },
    ]);
  });

  it('exposes both types in the registry with createPayload/validate', () => {
    expect(Object.keys(EXERCISE_TYPE_REGISTRY).sort()).toEqual(['fill_word', 'translation_choice']);
    for (const definition of Object.values(EXERCISE_TYPE_REGISTRY)) {
      const template = definition.createPayload();
      expect(typeof definition.validate(template)).toBe('object');
    }
  });

  it('reports validity via exercisePayloadIsValid', () => {
    expect(exercisePayloadIsValid('translation_choice', validTranslationChoice())).toBe(true);
    expect(exercisePayloadIsValid('translation_choice', {})).toBe(false);
  });

  it('finds the correct answer of a payload', () => {
    const payload = validTranslationChoice();
    expect(getCorrectAnswer(payload)?.id).toBe('a1');
  });
});
