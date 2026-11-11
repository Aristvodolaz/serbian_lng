import { Lesson } from './entities/lesson.entity';
import { Section } from './entities/section.entity';
import { Unit } from './entities/unit.entity';
import { TheoryTopic } from './entities/theory-topic.entity';
import { ContentStatus } from '../common/enums/content-status.enum';
import { assemblePath, LEGACY_SECTION_ID } from './path-assembly';
import { LessonPathStatus } from './dto/path-response.dto';

const makeLesson = (
  id: string,
  order: number,
  overrides: Partial<Lesson> = {},
): Lesson =>
  ({
    id,
    order,
    kind: 'regular',
    status: ContentStatus.PUBLISHED,
    ...overrides,
  }) as unknown as Lesson;

const makeUnit = (id: string, order: number, lessons: Lesson[]): Unit =>
  ({ id, order, status: ContentStatus.PUBLISHED, lessons }) as unknown as Unit;

const makeSection = (
  id: string,
  order: number,
  units: Unit[],
  overrides: Partial<Section> = {},
): Section =>
  ({
    id,
    order,
    level: 'A1',
    status: ContentStatus.PUBLISHED,
    units,
    titleCyrillic: 'С',
    titleLatin: 'S',
    titleTranslationRu: '',
    titleTranslationEn: '',
    ...overrides,
  }) as unknown as Section;

describe('assemblePath', () => {
  it('orders sections, units and lessons by their order fields', () => {
    const s1 = makeSection('s1', 1, [makeUnit('u2', 2, [makeLesson('l3', 3), makeLesson('l1', 1)])]);
    const s2 = makeSection('s2', 0, [makeUnit('u1', 1, [makeLesson('l2', 2)])]);
    const path = assemblePath({
      sections: [s1, s2],
      orphanUnits: [],
      checkpointLessons: [],
      theoryTopics: [],
      completedLessonIds: new Set(),
    });
    expect(path.sections.map((s) => s.id)).toEqual(['s2', 's1']);
    expect(path.sections[0].units.map((u) => u.id)).toEqual(['u1']);
    expect(path.sections[1].units[0].lessons.map((l) => l.id)).toEqual(['l1', 'l3']);
  });

  it('places the checkpoint in section.checkpoint and excludes it from unit lessons', () => {
    const cp = makeLesson('cp', 10, { kind: 'checkpoint', sectionId: 's1', unitId: null });
    const regular = makeLesson('l1', 1);
    const s1 = makeSection('s1', 0, [makeUnit('u1', 1, [regular, cp as Lesson])]);
    const path = assemblePath({
      sections: [s1],
      orphanUnits: [],
      checkpointLessons: [cp],
      theoryTopics: [],
      completedLessonIds: new Set(),
    });
    expect(path.sections[0].units[0].lessons.map((l) => l.id)).toEqual(['l1']);
    expect(path.sections[0].checkpoint?.id).toEqual('cp');
  });

  it('returns checkpoint: null for a section without a published checkpoint', () => {
    const s1 = makeSection('s1', 0, [makeUnit('u1', 1, [makeLesson('l1', 1)])]);
    const draftCp = makeLesson('cp', 10, { kind: 'checkpoint', sectionId: 's1', status: ContentStatus.DRAFT });
    const path = assemblePath({
      sections: [s1],
      orphanUnits: [],
      checkpointLessons: [draftCp],
      theoryTopics: [],
      completedLessonIds: new Set(),
    });
    expect(path.sections[0].checkpoint).toBeNull();
  });

  it('puts units without a section into a tail pseudo-section with level null', () => {
    const orphan = makeUnit('u-orphan', 5, [makeLesson('l-orphan', 6)]);
    const s1 = makeSection('s1', 0, [makeUnit('u1', 1, [makeLesson('l1', 1)])]);
    const path = assemblePath({
      sections: [s1],
      orphanUnits: [orphan],
      checkpointLessons: [],
      theoryTopics: [],
      completedLessonIds: new Set(),
    });
    expect(path.sections).toHaveLength(2);
    const tail = path.sections[1];
    expect(tail.id).toEqual(LEGACY_SECTION_ID);
    expect(tail.level).toBeNull();
    expect(tail.checkpoint).toBeNull();
    expect(tail.units.map((u) => u.id)).toEqual(['u-orphan']);
  });

  it('emits no pseudo-section when there are no orphan units', () => {
    const path = assemblePath({ sections: [], orphanUnits: [], checkpointLessons: [], theoryTopics: [], completedLessonIds: new Set() });
    expect(path.sections).toEqual([]);
  });

  it('marks the first uncompleted lesson (across units and checkpoints) as current', () => {
    const cp = makeLesson('cp', 3, { kind: 'checkpoint', sectionId: 's1', unitId: null });
    const s1 = makeSection('s1', 0, [makeUnit('u1', 1, [makeLesson('l1', 1), makeLesson('l2', 2)])]);
    const path = assemblePath({
      sections: [s1],
      orphanUnits: [],
      checkpointLessons: [cp],
      theoryTopics: [],
      completedLessonIds: new Set(['l1']),
    });
    const lessons = path.sections[0].units[0].lessons;
    expect(lessons[0].status).toEqual(LessonPathStatus.DONE);
    expect(lessons[1].status).toEqual(LessonPathStatus.CURRENT);
    expect(path.sections[0].checkpoint?.status).toEqual(LessonPathStatus.LOCKED);
  });

  it('marks the checkpoint as current when it is the first uncompleted lesson', () => {
    const cp = makeLesson('cp', 3, { kind: 'checkpoint', sectionId: 's1', unitId: null });
    const s1 = makeSection('s1', 0, [makeUnit('u1', 1, [makeLesson('l1', 1), makeLesson('l2', 2)])]);
    const path = assemblePath({
      sections: [s1],
      orphanUnits: [],
      checkpointLessons: [cp],
      theoryTopics: [],
      completedLessonIds: new Set(['l1', 'l2']),
    });
    expect(path.sections[0].checkpoint?.status).toEqual(LessonPathStatus.CURRENT);
    expect(path.sections[0].units[0].lessons[1].status).toEqual(LessonPathStatus.DONE);
  });

  it('skips checkpoints whose section is not published', () => {
    const orphanCp = makeLesson('cp-other', 10, { kind: 'checkpoint', sectionId: 'missing', unitId: null });
    const path = assemblePath({
      sections: [],
      orphanUnits: [],
      checkpointLessons: [orphanCp],
      theoryTopics: [],
      completedLessonIds: new Set(),
    });
    expect(path.sections).toEqual([]);
  });

  it('does not interleave units whose lesson order values collide', () => {
    // bulkCreateLessons resets `order` per unit, so two units can both hold
    // lessons with order 1 and 2 — the walk must follow the rendered
    // structure, not a global order sort.
    const s1 = makeSection('s1', 0, [
      makeUnit('u1', 1, [makeLesson('u1-l1', 1), makeLesson('u1-l2', 2)]),
      makeUnit('u2', 2, [makeLesson('u2-l1', 1), makeLesson('u2-l2', 2)]),
    ]);
    const path = assemblePath({
      sections: [s1],
      orphanUnits: [],
      checkpointLessons: [],
      theoryTopics: [],
      completedLessonIds: new Set(['u1-l1']),
    });
    const lessons = path.sections[0].units.flatMap((u) => u.lessons.map((l) => l.id));
    expect(lessons).toEqual(['u1-l1', 'u1-l2', 'u2-l1', 'u2-l2']);
    // The current node is the next lesson in the rendered order (u1-l2),
    // not the lowest-order uncompleted lesson of another unit (u2-l1).
    expect(path.sections[0].units[0].lessons[1].status).toEqual(LessonPathStatus.CURRENT);
    expect(path.sections[0].units[1].lessons[0].status).toEqual(LessonPathStatus.LOCKED);
  });

  it('attaches published theory topics per section and never to the legacy tail', () => {
    const makeTheory = (id: string, sectionId: string | null, order: number, status = ContentStatus.PUBLISHED) =>
      ({ id, sectionId, order, status, titleCyrillic: 'Т', titleLatin: 'T' }) as unknown as TheoryTopic;
    const s1 = makeSection('s1', 0, [makeUnit('u1', 1, [makeLesson('l1', 1)])]);
    const path = assemblePath({
      sections: [s1],
      orphanUnits: [makeUnit('u-orphan', 5, [makeLesson('l-orphan', 6)])],
      checkpointLessons: [],
      theoryTopics: [
        makeTheory('t2', 's1', 2),
        makeTheory('t1', 's1', 1),
        makeTheory('t-draft', 's1', 3, ContentStatus.DRAFT),
        makeTheory('t-orphan', null, 0),
      ],
      completedLessonIds: new Set(),
    });
    expect(path.sections[0].theory.map((t) => t.id)).toEqual(['t1', 't2']);
    expect(path.sections[1].theory).toEqual([]);
  });
});
