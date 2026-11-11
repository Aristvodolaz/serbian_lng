import { DataSource } from 'typeorm';
import { Word } from '../vocabulary/entities/word.entity';
import { BadgesService } from '../badges/badges.service';
import { Exercise } from './entities/exercise.entity';
import { Lesson } from './entities/lesson.entity';
import { Section } from './entities/section.entity';
import { ContentService } from './content.service';
import {
  buildVocabPayloads,
  CHECKPOINT_EXERCISE_LIMIT,
  collectSectionWordIds,
  sampleCheckpointExercises,
} from './checkpoint-assembly';
import { validateExercisePayload } from './exercise-types';
import { ContentStatus } from '../common/enums/content-status.enum';

const makeLesson = (id: string, order: number): Lesson =>
  ({
    id,
    order,
    kind: 'regular',
    status: ContentStatus.PUBLISHED,
    exercises: [],
  }) as unknown as Lesson;

const makeExercise = (id: string, order: number): Exercise =>
  ({ id, order, status: ContentStatus.PUBLISHED }) as unknown as Exercise;

describe('sampleCheckpointExercises', () => {
  it('takes one exercise per lesson per round, up to the limit', () => {
    const lessons = [makeLesson('l1', 1), makeLesson('l2', 2), makeLesson('l3', 3)];
    const pools = new Map<string, Exercise[]>([
      ['l1', ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'].map((id, i) => makeExercise(id, i + 1))],
      ['l2', ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'].map((id, i) => makeExercise(id, i + 1))],
      ['l3', ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].map((id, i) => makeExercise(id, i + 1))],
    ]);
    const sampled = sampleCheckpointExercises(lessons, pools);
    expect(sampled.map((e) => e.id)).toEqual(['a1', 'b1', 'c1', 'a2', 'b2', 'c2', 'a3', 'b3']);
    expect(sampled).toHaveLength(CHECKPOINT_EXERCISE_LIMIT);
  });

  it('is deterministic for the same input', () => {
    const lessons = [makeLesson('l1', 1), makeLesson('l2', 2)];
    const pools = new Map<string, Exercise[]>([
      ['l1', ['a1', 'a2'].map((id, i) => makeExercise(id, i + 1))],
      ['l2', ['b1', 'b2'].map((id, i) => makeExercise(id, i + 1))],
    ]);
    expect(sampleCheckpointExercises(lessons, pools).map((e) => e.id)).toEqual(
      sampleCheckpointExercises(lessons, pools).map((e) => e.id),
    );
  });

  it('stops early when every lesson is exhausted, keeping lesson order', () => {
    const lessons = [makeLesson('l1', 1), makeLesson('l2', 2)];
    const pools = new Map<string, Exercise[]>([
      ['l1', ['a1', 'a2'].map((id, i) => makeExercise(id, i + 1))],
      ['l2', ['b1'].map((id, i) => makeExercise(id, i + 1))],
    ]);
    expect(sampleCheckpointExercises(lessons, pools).map((e) => e.id)).toEqual(['a1', 'b1', 'a2']);
  });

  it('skips lessons with an empty published pool', () => {
    const lessons = [makeLesson('l1', 1), makeLesson('l2', 2)];
    const pools = new Map<string, Exercise[]>([
      ['l1', []],
      ['l2', ['b1', 'b2'].map((id, i) => makeExercise(id, i + 1))],
    ]);
    expect(sampleCheckpointExercises(lessons, pools).map((e) => e.id)).toEqual(['b1', 'b2']);
  });
});

describe('collectSectionWordIds', () => {
  it('deduplicates wordIds across exercises', () => {
    const e1 = {
      payload: {
        question: { wordId: 'w1' },
        answers: [{ id: 'a1', wordId: 'w2' }],
        correctAnswerId: 'a1',
      },
    };
    const e2 = {
      payload: {
        question: { wordId: 'w2' },
        answers: [
          { id: 'a1', wordId: 'w1' },
          { id: 'a2', wordId: 'w3' },
        ],
        correctAnswerId: 'a2',
      },
    };
    expect(collectSectionWordIds([e1, e2] as unknown as Exercise[]).sort()).toEqual([
      'w1',
      'w2',
      'w3',
    ]);
  });
});

describe('buildVocabPayloads', () => {
  const makeWord = (id: string, cyrillic: string): Word =>
    ({
      id,
      cyrillic,
      latin: cyrillic.toLowerCase(),
      translationRu: `ru-${cyrillic}`,
      translationEn: `en-${cyrillic}`,
    }) as unknown as Word;

  it('creates one translation_choice per section word with 3 section distractors', () => {
    const words = ['д', 'а', 'б', 'в'].map((c, i) => makeWord(`w${i}`, c));
    const payloads = buildVocabPayloads(words, []);
    expect(payloads).toHaveLength(4);
    for (const payload of payloads) {
      expect(payload.answers).toHaveLength(4);
      const correct = payload.answers.find((a) => a.id === payload.correctAnswerId);
      expect(correct).toBeDefined();
      const distractorWordIds = payload.answers
        .filter((a) => a.id !== payload.correctAnswerId)
        .map((a) => (a as { wordId?: string }).wordId);
      expect(distractorWordIds).toHaveLength(3);
      expect(distractorWordIds).not.toContain((correct as { wordId: string }).wordId);
      // Deterministic: the alphabetical (cyrillic) pool fills distractors in order.
      const distractorCyr = payload.answers
        .filter((a) => a.id !== payload.correctAnswerId)
        .map((a) => (a as { srCyr: string }).srCyr);
      expect(distractorCyr).toEqual(distractorCyr.slice().sort((a, b) => a.localeCompare(b)));
      expect(validateExercisePayload('translation_choice', payload)).toEqual([]);
    }
  });

  it('pads distractors from the global dictionary when the section has < 4 words', () => {
    const section = [makeWord('w1', 'а'), makeWord('w2', 'б')];
    const global = [makeWord('g1', 'в'), makeWord('g2', 'г'), makeWord('g3', 'д')];
    const payloads = buildVocabPayloads(section, global);
    expect(payloads).toHaveLength(2);
    const first = payloads[0];
    expect(first.answers).toHaveLength(4);
    expect(first.answers.map((a) => (a as { wordId?: string }).wordId)).toContain('g1');
  });

  it('uses word-<id> answer ids and never duplicates the correct answer', () => {
    const words = ['а', 'б', 'в', 'г', 'д'].map((c, i) => makeWord(`w${i}`, c));
    for (const payload of buildVocabPayloads(words, [])) {
      const correct = payload.answers.find((a) => a.id === payload.correctAnswerId);
      expect(payload.correctAnswerId).toMatch(/^word-/);
      expect(payload.answers.filter((a) => a.id === payload.correctAnswerId)).toHaveLength(1);
      expect((correct as { wordId: string }).wordId).toEqual(
        payload.correctAnswerId.replace('word-', ''),
      );
    }
  });
});

describe('checkpoint materialization (freeze + idempotency)', () => {
  const makeSectionTree = () => {
    const exercise = makeExercise('ex-1', 1);
    const lesson = makeLesson('les-1', 1);
    lesson.exercises = [exercise];
    const unit = { id: 'u1', lessons: [lesson] };
    return {
      section: { id: 's1', units: [unit] } as unknown as Section,
      lesson,
    };
  };

  const makeService = (section: Section, outsideAnswers: number, insideAnswers: number) => {
    const manager = {
      // The transaction first takes a pessimistic lock on the lesson row
      // (Lesson.findOne with lock), then counts answers (UserExerciseAnswer).
      getRepository: (cls: unknown) =>
        cls === Lesson
          ? { findOne: jest.fn().mockResolvedValue({ id: 'cp-1' }) }
          : { count: jest.fn().mockResolvedValue(insideAnswers) },
      delete: jest.fn().mockResolvedValue({}),
      create: (_cls: unknown, data: unknown) => data,
      save: jest.fn().mockResolvedValue([]),
    };
    const transaction = jest.fn((cb: (m: unknown) => Promise<unknown>) => cb(manager));
    const service = new ContentService(
      {} as never, // unitRepository
      { findOne: jest.fn().mockResolvedValue(section) } as never, // sectionRepository
      {} as never, // lessonRepository
      {} as never, // exerciseRepository
      {} as never, // theoryRepository
      {} as never, // progressRepository
      { count: jest.fn().mockResolvedValue(outsideAnswers) } as never, // answerRepository
      {} as never, // userRepository
      { findBy: jest.fn().mockResolvedValue([]) } as never, // wordRepository
      {} as BadgesService,
      { transaction } as unknown as DataSource,
    );
    return { service, transaction, manager };
  };

  const ensure = (service: ContentService) =>
    (service as unknown as {
      ensureCheckpointMaterialized: (lesson: Lesson) => Promise<Exercise[] | null>;
    }).ensureCheckpointMaterialized;

  it('rebuilds published exercise rows inside a transaction when not frozen', async () => {
    const { section } = makeSectionTree();
    const { service, transaction, manager } = makeService(section, 0, 0);
    await ensure(service).call(service, {
      id: 'cp-1',
      kind: 'checkpoint',
      sectionId: 's1',
    } as unknown as Lesson);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(manager.delete).toHaveBeenCalledWith(Exercise, { lessonId: 'cp-1' });
    expect(manager.save).toHaveBeenCalled();
    const rows = manager.save.mock.calls[0][0] as Exercise[];
    expect(rows.every((r) => r.lessonId === 'cp-1')).toBe(true);
  });

  it('is frozen once any answer exists for the lesson: no regeneration', async () => {
    const { section } = makeSectionTree();
    const { service, transaction, manager } = makeService(section, 1, 1);
    await ensure(service).call(service, {
      id: 'cp-1',
      kind: 'checkpoint',
      sectionId: 's1',
    } as unknown as Lesson);
    expect(transaction).not.toHaveBeenCalled();
    expect(manager.delete).not.toHaveBeenCalled();
  });

  it('aborts the transaction when an answer appears between the outer check and the delete (race guard)', async () => {
    const { section } = makeSectionTree();
    const { service, transaction, manager } = makeService(section, 0, 1);
    await ensure(service).call(service, {
      id: 'cp-1',
      kind: 'checkpoint',
      sectionId: 's1',
    } as unknown as Lesson);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(manager.delete).not.toHaveBeenCalled();
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('is idempotent: repeated rebuilds produce the same row set', async () => {
    const { section } = makeSectionTree();
    const { service, manager } = makeService(section, 0, 0);
    const lesson = { id: 'cp-1', kind: 'checkpoint', sectionId: 's1' } as unknown as Lesson;
    await ensure(service).call(service, lesson);
    await ensure(service).call(service, lesson);
    const [firstSave, secondSave] = manager.save.mock.calls.map(
      (call) => call[0] as Exercise[],
    );
    expect(secondSave).toEqual(firstSave);
  });

  it('returns the rebuilt rows so the caller can skip a reload', async () => {
    const { section } = makeSectionTree();
    const { service, manager } = makeService(section, 0, 0);
    const rows = await ensure(service).call(service, {
      id: 'cp-1',
      kind: 'checkpoint',
      sectionId: 's1',
    } as unknown as Lesson);
    expect(rows).toEqual(manager.save.mock.calls[0][0]);
  });

  it('aborts without rebuilding when the lesson row is gone before the lock', async () => {
    const { section } = makeSectionTree();
    const { service, transaction, manager } = makeService(section, 0, 0);
    manager.getRepository = (() => ({
      findOne: jest.fn().mockResolvedValue(null),
    })) as typeof manager.getRepository;
    await ensure(service).call(service, {
      id: 'cp-1',
      kind: 'checkpoint',
      sectionId: 's1',
    } as unknown as Lesson);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(manager.delete).not.toHaveBeenCalled();
    expect(manager.save).not.toHaveBeenCalled();
  });
});
