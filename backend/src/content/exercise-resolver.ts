// Payload helpers shared by the public API. Resolving means merging the
// current dictionary Word content into every answer/question that carries a
// wordId (the Word is the source of truth; inline fields are fallbacks), and
// stripping the anti-cheat field before the payload leaves the server.

import { Word } from '../vocabulary/entities/word.entity';
import { ExerciseAnswer, ExercisePayload } from './exercise-types';

/** Short human-readable preview of an exercise payload (for admin lists). */
export function exercisePreview(payload: ExercisePayload): string {
  if ('sentence' in payload && payload.sentence) {
    return payload.sentence.srCyr || payload.sentence.srLat || payload.sentence.ru || '';
  }
  if ('question' in payload && payload.question) {
    return (
      payload.question.srCyr ||
      payload.question.srLat ||
      payload.question.ru ||
      payload.question.en ||
      ''
    );
  }
  return '';
}

/** Collects every wordId referenced by the payload (deduplicated). */
export function collectWordIds(payload: ExercisePayload): string[] {
  const ids: string[] = [];
  const push = (id: unknown): void => {
    if (typeof id === 'string' && id.length > 0) ids.push(id);
  };
  if ('question' in payload && payload.question) {
    push(payload.question.wordId);
  }
  if ('answers' in payload) {
    for (const answer of payload.answers) push(answer.wordId);
  }
  return [...new Set(ids)];
}

function resolveAnswer(answer: ExerciseAnswer, wordsById: Map<string, Word>): ExerciseAnswer {
  if (!answer.wordId) return answer;
  const word = wordsById.get(answer.wordId);
  if (!word) return answer;
  return {
    ...answer,
    srCyr: word.cyrillic ?? answer.srCyr,
    srLat: word.latin ?? answer.srLat,
    ru: word.translationRu ?? answer.ru,
    en: word.translationEn ?? answer.en,
    audioUrl: word.audioUrl ?? answer.audioUrl ?? null,
    imageUrl: word.imageUrl ?? answer.imageUrl ?? null,
  };
}

export function resolveExercisePayload(
  payload: ExercisePayload,
  wordsById: Map<string, Word>,
): ExercisePayload {
  if ('answers' in payload) {
    return {
      ...payload,
      answers: payload.answers.map((a) => resolveAnswer(a, wordsById)),
    };
  }
  return payload;
}

/**
 * Returns the payload as the client should see it: resolved, with the
 * anti-cheat `correctAnswerId` removed.
 */
export function toPublicPayload(payload: ExercisePayload): Record<string, unknown> {
  const { correctAnswerId: _correctAnswerId, ...rest } = payload;
  return rest as unknown as Record<string, unknown>;
}
