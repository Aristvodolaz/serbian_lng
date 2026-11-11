import { DataSource } from 'typeorm';
import { BadgesService } from '../badges/badges.service';
import { ForbiddenException } from '@nestjs/common';
import { ContentService } from './content.service';
import { Lesson } from './entities/lesson.entity';
import { Section } from './entities/section.entity';
import { ContentStatus } from '../common/enums/content-status.enum';

const makeLesson = (id: string, overrides: Partial<Lesson> = {}): Lesson =>
  ({
    id,
    kind: 'regular',
    status: ContentStatus.PUBLISHED,
    sectionId: null,
    unitId: null,
    ...overrides,
  }) as unknown as Lesson;

const makeSection = (id: string, order: number): Section =>
  ({ id, order, status: ContentStatus.PUBLISHED }) as unknown as Section;

// The checkpoint gate counts regular lessons through a query builder that
// joins the unit — mock the chainable builder, not repository.find.
const makeRegularLessonQueryBuilder = (rows: { id: string }[]) => {
  const qb: Record<string, jest.Mock> = {} as Record<string, jest.Mock>;
  for (const method of ['select', 'leftJoin', 'where', 'andWhere']) {
    qb[method] = jest.fn().mockReturnValue(qb);
  }
  qb.getRawMany = jest.fn().mockResolvedValue(rows);
  return qb;
};

// The regular-lesson gate looks up the nearest preceding published checkpoint
// through a second query builder that joins the section.
const makePreviousCheckpointQueryBuilder = (result: Lesson | null) => {
  const qb: Record<string, jest.Mock> = {} as Record<string, jest.Mock>;
  for (const method of ['innerJoin', 'where', 'andWhere', 'orderBy', 'addOrderBy']) {
    qb[method] = jest.fn().mockReturnValue(qb);
  }
  qb.getOne = jest.fn().mockResolvedValue(result);
  return qb;
};

interface Repos {
  lessonFindOne: jest.Mock;
  createQueryBuilderResult: ReturnType<
    typeof makeRegularLessonQueryBuilder | typeof makePreviousCheckpointQueryBuilder
  >;
  sectionFindOne: jest.Mock;
  progressFindOne: jest.Mock;
  progressCount: jest.Mock;
}

const makeService = (repos: Repos) => {
  const lessonRepository = {
    findOne: repos.lessonFindOne,
    createQueryBuilder: jest.fn().mockReturnValue(repos.createQueryBuilderResult),
  };
  const sectionRepository = { findOne: repos.sectionFindOne };
  const progressRepository = {
    findOne: repos.progressFindOne,
    count: repos.progressCount,
  };
  const service = new ContentService(
    {} as never, // unitRepository
    sectionRepository as never,
    lessonRepository as never,
    {} as never, // exerciseRepository
    {} as never, // theoryRepository
    progressRepository as never,
    {} as never, // answerRepository
    {} as never, // userRepository
    {} as never, // wordRepository
    {} as BadgesService,
    { transaction: jest.fn() } as unknown as DataSource,
  );
  return service;
};

describe('assertLessonAccessible', () => {
  it('opens a lesson without a section', async () => {
    const service = makeService({
      lessonFindOne: jest.fn().mockResolvedValue(makeLesson('l1')),
      createQueryBuilderResult: makePreviousCheckpointQueryBuilder(null),
      sectionFindOne: jest.fn(),
      progressFindOne: jest.fn(),
      progressCount: jest.fn(),
    });
    await expect(service.assertLessonAccessible('user1', 'l1')).resolves.toBeUndefined();
  });

  it('reuses a preloaded lesson instead of looking it up again', async () => {
    const lesson = makeLesson('l1');
    const lessonFindOne = jest.fn();
    const service = makeService({
      lessonFindOne,
      createQueryBuilderResult: makePreviousCheckpointQueryBuilder(null),
      sectionFindOne: jest.fn(),
      progressFindOne: jest.fn(),
      progressCount: jest.fn(),
    });
    await expect(
      service.assertLessonAccessible('user1', lesson.id, lesson),
    ).resolves.toBeUndefined();
    expect(lessonFindOne).not.toHaveBeenCalled();
  });

  it('opens a regular lesson in the first published section (nothing precedes it)', async () => {
    const lesson = makeLesson('l1', { sectionId: 's1' });
    const sectionFindOne = jest.fn().mockResolvedValue(makeSection('s1', 0));
    const gateQb = makePreviousCheckpointQueryBuilder(null);
    const service = makeService({
      lessonFindOne: jest.fn().mockResolvedValue(lesson),
      createQueryBuilderResult: gateQb,
      sectionFindOne,
      progressFindOne: jest.fn(),
      progressCount: jest.fn(),
    });
    await expect(service.assertLessonAccessible('user1', 'l1')).resolves.toBeUndefined();
    expect(gateQb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('section."order" < :order'),
      expect.objectContaining({ order: 0 }),
    );
  });

  it('locks a regular lesson in a later section until the previous section\'s checkpoint is passed (403 SECTION_LOCKED)', async () => {
    const lesson = makeLesson('l1', { sectionId: 's2' });
    const sectionFindOne = jest.fn().mockResolvedValue(makeSection('s2', 1));
    const gateQb = makePreviousCheckpointQueryBuilder(
      makeLesson('cp-1', { kind: 'checkpoint', sectionId: 's1' }),
    );
    const service = makeService({
      lessonFindOne: jest.fn().mockResolvedValue(lesson),
      createQueryBuilderResult: gateQb,
      sectionFindOne,
      progressFindOne: jest.fn().mockResolvedValue(null),
      progressCount: jest.fn(),
    });
    const error = await service.assertLessonAccessible('user1', 'l1').catch((e) => e);
    expect(error).toBeInstanceOf(ForbiddenException);
    expect(error.getResponse()).toEqual({ message: 'SECTION_LOCKED', sectionId: 's2' });
    expect(gateQb.where).toHaveBeenCalledWith(
      expect.stringContaining('lesson.kind = :kind'),
      expect.objectContaining({ kind: 'checkpoint' }),
    );
    expect(gateQb.orderBy).toHaveBeenCalledWith('section."order"', 'DESC');
  });

  it('opens a regular lesson in a later section once the previous checkpoint progress row exists', async () => {
    const lesson = makeLesson('l1', { sectionId: 's2' });
    const progressFindOne = jest.fn().mockResolvedValue({ id: 'p1' });
    const service = makeService({
      lessonFindOne: jest.fn().mockResolvedValue(lesson),
      createQueryBuilderResult: makePreviousCheckpointQueryBuilder(
        makeLesson('cp-1', { kind: 'checkpoint', sectionId: 's1' }),
      ),
      sectionFindOne: jest.fn().mockResolvedValue(makeSection('s2', 1)),
      progressFindOne,
      progressCount: jest.fn(),
    });
    await expect(service.assertLessonAccessible('user1', 'l1')).resolves.toBeUndefined();
    expect(progressFindOne).toHaveBeenCalledWith({
      where: { userId: 'user1', lessonId: 'cp-1' },
    });
  });

  it('opens a later section whose predecessor chain has no published checkpoint', async () => {
    const lesson = makeLesson('l1', { sectionId: 's3' });
    const progressFindOne = jest.fn();
    const service = makeService({
      lessonFindOne: jest.fn().mockResolvedValue(lesson),
      createQueryBuilderResult: makePreviousCheckpointQueryBuilder(null),
      sectionFindOne: jest.fn().mockResolvedValue(makeSection('s3', 2)),
      progressFindOne,
      progressCount: jest.fn(),
    });
    await expect(service.assertLessonAccessible('user1', 'l1')).resolves.toBeUndefined();
    expect(progressFindOne).not.toHaveBeenCalled();
  });

  it('matches regular lessons through their unit, not only lesson.sectionId', async () => {
    const lesson = makeLesson('cp', { kind: 'checkpoint', sectionId: 's1' });
    const qb = makeRegularLessonQueryBuilder([]);
    const service = makeService({
      lessonFindOne: jest.fn().mockResolvedValue(lesson),
      createQueryBuilderResult: qb,
      sectionFindOne: jest.fn(),
      progressFindOne: jest.fn(),
      progressCount: jest.fn(),
    });
    await service.assertLessonAccessible('user1', 'cp');
    expect(qb.where).toHaveBeenCalledWith(
      expect.stringContaining('unit.sectionId = :sectionId'),
      expect.objectContaining({ sectionId: 's1' }),
    );
  });

  it('locks a checkpoint until every published regular lesson of its section is completed', async () => {
    const lesson = makeLesson('cp', { kind: 'checkpoint', sectionId: 's1' });
    const service = makeService({
      lessonFindOne: jest.fn().mockResolvedValue(lesson),
      createQueryBuilderResult: makeRegularLessonQueryBuilder([{ id: 'l1' }, { id: 'l2' }]),
      sectionFindOne: jest.fn(),
      progressFindOne: jest.fn(),
      progressCount: jest.fn().mockResolvedValue(1), // only 1 of 2 completed
    });
    const error = await service.assertLessonAccessible('user1', 'cp').catch((e) => e);
    expect(error).toBeInstanceOf(ForbiddenException);
    expect(error.getResponse()).toEqual({ message: 'SECTION_LOCKED', sectionId: 's1' });
  });

  it('opens a checkpoint when all published regular lessons of its section are completed', async () => {
    const lesson = makeLesson('cp', { kind: 'checkpoint', sectionId: 's1' });
    const service = makeService({
      lessonFindOne: jest.fn().mockResolvedValue(lesson),
      createQueryBuilderResult: makeRegularLessonQueryBuilder([{ id: 'l1' }, { id: 'l2' }]),
      sectionFindOne: jest.fn(),
      progressFindOne: jest.fn(),
      progressCount: jest.fn().mockResolvedValue(2),
    });
    await expect(service.assertLessonAccessible('user1', 'cp')).resolves.toBeUndefined();
  });

  it('opens a checkpoint whose section has no published regular lessons', async () => {
    const lesson = makeLesson('cp', { kind: 'checkpoint', sectionId: 's1' });
    const service = makeService({
      lessonFindOne: jest.fn().mockResolvedValue(lesson),
      createQueryBuilderResult: makeRegularLessonQueryBuilder([]),
      sectionFindOne: jest.fn(),
      progressFindOne: jest.fn(),
      progressCount: jest.fn(),
    });
    await expect(service.assertLessonAccessible('user1', 'cp')).resolves.toBeUndefined();
  });

  it('gates checkAnswer and completeLesson through the same assertion', async () => {
    const lesson = makeLesson('l1', { sectionId: 's2' });
    const repos: Repos = {
      lessonFindOne: jest.fn().mockResolvedValue(lesson),
      createQueryBuilderResult: makePreviousCheckpointQueryBuilder(
        makeLesson('cp-1', { kind: 'checkpoint', sectionId: 's1' }),
      ),
      sectionFindOne: jest.fn().mockResolvedValue(makeSection('s2', 1)),
      progressFindOne: jest.fn().mockResolvedValue(null),
      progressCount: jest.fn(),
    };
    const service = makeService(repos);
    await expect(service.checkAnswer('user1', 'l1', 'ex1', 'a1')).rejects.toThrow(
      ForbiddenException,
    );
    await expect(service.completeLesson('user1', 'l1', 1, 1)).rejects.toThrow(
      ForbiddenException,
    );
    // Each gated entry point hits lessonFindOnce once — for the lesson itself;
    // the gate's checkpoint lookup goes through the query builder.
    expect(repos.lessonFindOne).toHaveBeenCalledTimes(2);
  });
});
