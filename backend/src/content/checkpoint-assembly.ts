// Pure checkpoint-assembly logic, separated from the DB work in
// ContentService the same way exercise-resolver is: sampling, distractor
// selection and payload building are deterministic and unit-testable without
// Postgres.

import { Word } from '../vocabulary/entities/word.entity';
import { Exercise } from './entities/exercise.entity';
import { Lesson } from './entities/lesson.entity';
import { collectWordIds } from './exercise-resolver';
import { ExercisePayload } from './exercise-types';

export const CHECKPOINT_EXERCISE_LIMIT = 8;

/**
 * Deterministic round-robin over the section's lessons in lesson order: one
 * published exercise per lesson per round, cycling until the limit is
 * reached or every lesson is exhausted. `exercisesByLessonId` must already
 * contain each lesson's published exercises sorted by order.
 */
export function sampleCheckpointExercises(
  lessons: Lesson[],
  exercisesByLessonId: Map<string, Exercise[]>,
  limit = CHECKPOINT_EXERCISE_LIMIT,
): Exercise[] {
  const sampled: Exercise[] = [];
  for (let round = 0; sampled.length < limit; round++) {
    let took = false;
    for (const lesson of lessons) {
      const pool = exercisesByLessonId.get(lesson.id) ?? [];
      if (round < pool.length) {
        sampled.push(pool[round]);
        took = true;
        if (sampled.length >= limit) break;
      }
    }
    if (!took) break;
  }
  return sampled;
}

/** Distinct wordIds across all the section's published exercises. */
export function collectSectionWordIds(exercises: Exercise[]): string[] {
  const ids = new Set<string>();
  for (const exercise of exercises) {
    if (exercise.payload && typeof exercise.payload === 'object') {
      for (const id of collectWordIds(exercise.payload)) ids.add(id);
    }
  }
  return [...ids];
}

/**
 * One translation_choice per section word: the word as the question, three
 * distractors from other section words (deterministic — alphabetical),
 * padded from `fallbackWords` when the section is too small. Inline text is
 * baked alongside wordId so the payload is playable even before serve-time
 * word resolution.
 */
export function buildVocabPayloads(
  sectionWords: Word[],
  fallbackWords: Word[],
): ExercisePayload[] {
  if (sectionWords.length === 0) return [];
  const pool = [...sectionWords].sort((a, b) => a.cyrillic.localeCompare(b.cyrillic));
  const known = new Set(pool.map((w) => w.id));
  for (const word of fallbackWords) {
    if (pool.length >= 4) break;
    if (!known.has(word.id)) {
      pool.push(word);
      known.add(word.id);
    }
  }

  return sectionWords.map((word) => {
    const distractors = pool.filter((w) => w.id !== word.id).slice(0, 3);
    const answers = [word, ...distractors].map((w) => ({
      id: `word-${w.id}`,
      wordId: w.id,
      srCyr: w.cyrillic,
      srLat: w.latin,
      ru: w.translationRu,
      en: w.translationEn,
    }));
    return {
      question: {
        wordId: word.id,
        srCyr: word.cyrillic,
        srLat: word.latin,
        ru: word.translationRu,
        en: word.translationEn,
      },
      answers,
      correctAnswerId: `word-${word.id}`,
      settings: { shuffleOptions: true },
    } as ExercisePayload;
  });
}
