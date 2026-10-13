import { Word } from '../vocabulary/entities/word.entity';
import { resolveExercisePayload, toPublicPayload } from './exercise-resolver';
import { ExercisePayload, FillWordPayload } from './exercise-types';

const makeWord = (overrides: Partial<Word>): Word =>
  ({
    id: 'word-1',
    cyrillic: 'шума',
    latin: 'šuma',
    translationRu: 'лес',
    translationEn: 'forest',
    ...overrides,
  }) as unknown as Word;

const fillWordPayload = (sentence: Partial<FillWordPayload['sentence']>): ExercisePayload => ({
  sentence: { srCyr: '', srLat: '', ...sentence },
  answers: [{ id: 'w1', srCyr: 'шума', srLat: 'šuma', ru: 'лес' }],
  correctAnswerId: 'w1',
});

describe('toPublicPayload', () => {
  it('removes correctAnswerId from every payload', () => {
    const payload = fillWordPayload({ srCyr: '____.', srLat: '____.' });
    const publicPayload = toPublicPayload(payload);
    expect(publicPayload).not.toHaveProperty('correctAnswerId');
  });

  it('blanks the exact whole-word occurrence, merging the word first', () => {
    const payload = fillWordPayload({
      srCyr: 'Видим лес.',
      srLat: 'Vidim les.',
      ru: 'Вижу лес.',
      en: 'I see the forest.',
    });
    const wordsById = new Map<string, Word>([
      ['word-1', makeWord({ cyrillic: 'лес', latin: 'les' })],
    ]);
    const payloadWithWord: ExercisePayload = {
      ...payload,
      answers: [{ id: 'w1', wordId: 'word-1' }],
    };
    // Same pipeline as content.service.getLessonDetail: resolve, then publish.
    const publicPayload = toPublicPayload(
      resolveExercisePayload(payloadWithWord, wordsById),
    ) as { sentence: { srCyr: string; srLat: string } };
    // resolveExercisePayload merges the Word content (лес/les) into the
    // answer before blanking, so the correct answer text is the word form.
    expect(publicPayload.sentence.srCyr).toBe('Видим ____.');
    expect(publicPayload.sentence.srLat).toBe('Vidim ____.');
  });

  it('does not blank an inflected form that only differs morphologically', () => {
    // `шуму` is a whole word that is NOT equal to `шума`, so the regex must
    // not match — the blank has to be authored into the sentence.
    const payload = fillWordPayload({
      srCyr: 'Видим шуму.',
      srLat: 'Vidim šumu.',
    });
    const publicPayload = toPublicPayload(payload) as { sentence: { srCyr: string } };
    expect(publicPayload.sentence.srCyr).toBe('Видим шуму.');
    expect(publicPayload.sentence.srCyr).not.toContain('____');
  });

  it('does not blank inside a longer word (word boundaries respected)', () => {
    // `шумом` contains `шум` but as part of a longer word — no substitution.
    const payload = fillWordPayload({
      srCyr: 'Махали су шумом.',
    });
    const publicPayload = toPublicPayload({
      ...payload,
      answers: [{ id: 'w1', srCyr: 'шум', srLat: 'šum' }],
    }) as { sentence: { srCyr: string } };
    expect(publicPayload.sentence.srCyr).toBe('Махали су шумом.');
  });

  it('respects an author-baked ____ over derived blanking', () => {
    const payload = fillWordPayload({
      srCyr: 'Ћутање не поседује ____.',
      srLat: 'Ćutanje ne poseduje ____.',
    });
    const publicPayload = toPublicPayload(payload) as { sentence: { srCyr: string } };
    expect(publicPayload.sentence.srCyr).toBe('Ћутање не поседује ____.');
    // Only one blank even though the correct answer does not literally
    // appear — author blank wins, no derived blanking on top.
    expect(publicPayload.sentence.srCyr.match(/____/g)).toHaveLength(1);
  });

  it('does not blank translation_choice payloads', () => {
    const payload: ExercisePayload = {
      question: { srCyr: 'шума', ru: 'лес' },
      answers: [{ id: 'a1', ru: 'лес' }],
      correctAnswerId: 'a1',
    };
    const publicPayload = toPublicPayload(payload);
    expect(publicPayload).not.toHaveProperty('sentence');
    expect(publicPayload).toHaveProperty('question');
  });
});
