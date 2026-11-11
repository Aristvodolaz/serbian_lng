// Pure path-assembly logic, separated from the DB work in ContentService the
// same way exercise-resolver and checkpoint-assembly are: building the
// sectioned path (sections → units → lessons, checkpoint at the section end,
// legacy tail pseudo-section) is deterministic and unit-testable without DB.

import { Section } from './entities/section.entity';
import { Unit } from './entities/unit.entity';
import { Lesson } from './entities/lesson.entity';
import { TheoryTopic } from './entities/theory-topic.entity';
import { ContentStatus } from '../common/enums/content-status.enum';
import {
  LessonPathStatus,
  LessonSummaryDto,
  PathResponseDto,
  SectionPathDto,
  TheorySummaryDto,
  UnitPathDto,
} from './dto/path-response.dto';

// Sentinel id for the tail pseudo-section holding units created before
// sections existed (CSV uploads without sectionTitle). The client hides its
// header like a legacy unit group.
export const LEGACY_SECTION_ID = 'legacy';

export interface PathSourceData {
  sections: Section[];
  orphanUnits: Unit[];
  checkpointLessons: Lesson[];
  theoryTopics: TheoryTopic[];
  completedLessonIds: Set<string>;
}

export function assemblePath(data: PathSourceData): PathResponseDto {
  const sections = [...data.sections].sort((a, b) => a.order - b.order);
  const checkpointLessons = [...data.checkpointLessons]
    .filter((l) => l.status === ContentStatus.PUBLISHED)
    .sort((a, b) => a.order - b.order);

  // Theory topics ride along per section; they never affect gating or the
  // current-lesson calculation.
  const theoryTopics = [...data.theoryTopics]
    .filter((t) => t.status === ContentStatus.PUBLISHED)
    .sort((a, b) => a.order - b.order);
  const theoryDto = (sectionId: string): TheorySummaryDto[] =>
    theoryTopics
      .filter((t) => t.sectionId === sectionId)
      .map((t) => ({ id: t.id, titleCyrillic: t.titleCyrillic, titleLatin: t.titleLatin, order: t.order }));

  const published = (lessons: Lesson[]): Lesson[] =>
    lessons.filter((l) => l.status === ContentStatus.PUBLISHED);

  const publishedUnits = (section: Section): Unit[] =>
    (section.units ?? [])
      .filter((u) => u.status === ContentStatus.PUBLISHED)
      .sort((a, b) => a.order - b.order);

  const publishedRegularLessons = (unit: Unit): Lesson[] =>
    published(unit.lessons ?? [])
      .filter((l) => l.kind !== 'checkpoint')
      .sort((a, b) => a.order - b.order);

  // Units without a section → tail pseudo-section (legacy compatibility).
  const orphanUnits = [...data.orphanUnits]
    .filter((u) => u.status === ContentStatus.PUBLISHED)
    .sort((a, b) => a.order - b.order);

  // currentLessonId follows the order the client actually renders: each
  // section's units in order, each unit's regular lessons in order, then the
  // section's checkpoint. Lesson `order` values are only unique per unit, so
  // sorting everything globally would interleave units and mark the wrong
  // node as current.
  const orderedLessons: Lesson[] = [];
  for (const section of sections) {
    for (const unit of publishedUnits(section)) {
      orderedLessons.push(...publishedRegularLessons(unit));
    }
    // One checkpoint per section: the first published one by global order.
    const checkpoint = checkpointLessons.find((l) => l.sectionId === section.id);
    if (checkpoint) orderedLessons.push(checkpoint);
  }
  for (const unit of orphanUnits) {
    orderedLessons.push(...publishedRegularLessons(unit));
  }
  const currentLessonId = orderedLessons.find((l) => !data.completedLessonIds.has(l.id))?.id;

  const summary = (lesson: Lesson): LessonSummaryDto => ({
    id: lesson.id,
    title: lesson.title,
    titleLatin: lesson.titleLatin,
    titleTranslationRu: lesson.titleTranslationRu,
    titleTranslationEn: lesson.titleTranslationEn,
    order: lesson.order,
    xpReward: lesson.xpReward,
    status: data.completedLessonIds.has(lesson.id)
      ? LessonPathStatus.DONE
      : lesson.id === currentLessonId
        ? LessonPathStatus.CURRENT
        : LessonPathStatus.LOCKED,
  });

  const unitDto = (unit: Unit): UnitPathDto => ({
    id: unit.id,
    titleCyrillic: unit.titleCyrillic,
    titleLatin: unit.titleLatin,
    titleTranslationRu: unit.titleTranslationRu,
    titleTranslationEn: unit.titleTranslationEn,
    order: unit.order,
    lessons: publishedRegularLessons(unit).map(summary),
  });

  const sectionDtos: SectionPathDto[] = sections.map((section) => {
    const units = publishedUnits(section).map(unitDto);
    // One checkpoint per section: the first published one by global order.
    const checkpoint = checkpointLessons.find((l) => l.sectionId === section.id);
    return {
      id: section.id,
      titleCyrillic: section.titleCyrillic,
      titleLatin: section.titleLatin,
      titleTranslationRu: section.titleTranslationRu,
      titleTranslationEn: section.titleTranslationEn,
      level: section.level,
      order: section.order,
      units,
      theory: theoryDto(section.id),
      checkpoint: checkpoint ? summary(checkpoint) : null,
    };
  });

  if (orphanUnits.length > 0) {
    sectionDtos.push({
      id: LEGACY_SECTION_ID,
      titleCyrillic: '',
      titleLatin: '',
      titleTranslationRu: '',
      titleTranslationEn: '',
      level: null,
      order: sections.length > 0 ? Math.max(...sections.map((s) => s.order)) + 1 : 0,
      units: orphanUnits.map(unitDto),
      theory: [],
      checkpoint: null,
    });
  }

  return { sections: sectionDtos };
}
