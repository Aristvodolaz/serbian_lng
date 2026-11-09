import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { Unit } from './entities/unit.entity';
import { Section } from './entities/section.entity';
import { Lesson } from './entities/lesson.entity';
import { Exercise } from './entities/exercise.entity';
import { UserLessonProgress } from './entities/user-lesson-progress.entity';
import { UserExerciseAnswer } from './entities/user-exercise-answer.entity';
import { Word } from '../vocabulary/entities/word.entity';
import { ContentStatus } from '../common/enums/content-status.enum';
import { PathResponseDto } from './dto/path-response.dto';
import { LessonDetailResponseDto } from './dto/lesson-detail-response.dto';
import { AnswerResultResponseDto } from './dto/answer-result-response.dto';
import { CompleteLessonResponseDto } from './dto/complete-lesson-response.dto';
import { User } from '../users/entities/user.entity';
import { BadgesService } from '../badges/badges.service';
import { collectWordIds, resolveExercisePayload, toPublicPayload } from './exercise-resolver';
import {
  buildVocabPayloads,
  CHECKPOINT_EXERCISE_LIMIT,
  collectSectionWordIds,
  sampleCheckpointExercises,
} from './checkpoint-assembly';
import { assemblePath } from './path-assembly';
import {
  ExercisePayload,
  getCorrectAnswer,
  validateExercisePayload,
} from './exercise-types';

// Below this ratio a lesson still counts as completed (it unlocks the next
// one) but only earns half XP — mirrors "Провери" allowing imperfect runs.
const FULL_XP_THRESHOLD = 0.6;
const PARTIAL_XP_FACTOR = 0.5;

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Unit)
    private readonly unitRepository: Repository<Unit>,
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(Exercise)
    private readonly exerciseRepository: Repository<Exercise>,
    @InjectRepository(UserLessonProgress)
    private readonly progressRepository: Repository<UserLessonProgress>,
    @InjectRepository(UserExerciseAnswer)
    private readonly answerRepository: Repository<UserExerciseAnswer>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Word)
    private readonly wordRepository: Repository<Word>,
    private readonly badgesService: BadgesService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getPathForUser(userId: string): Promise<PathResponseDto> {
    const sections = await this.sectionRepository.find({
      where: { status: ContentStatus.PUBLISHED },
      relations: { units: { lessons: true } },
      order: { order: 'ASC', units: { order: 'ASC', lessons: { order: 'ASC' } } },
    });
    const orphanUnits = await this.unitRepository.find({
      where: { status: ContentStatus.PUBLISHED, sectionId: IsNull() },
      relations: { lessons: true },
      order: { order: 'ASC', lessons: { order: 'ASC' } },
    });
    const checkpointLessons = await this.lessonRepository.find({
      where: { kind: 'checkpoint', status: ContentStatus.PUBLISHED },
      order: { order: 'ASC' },
    });

    const completions = await this.progressRepository.find({ where: { userId } });
    const completedLessonIds = new Set(completions.map((c) => c.lessonId));

    return assemblePath({ sections, orphanUnits, checkpointLessons, completedLessonIds });
  }

  async getLessonDetail(userId: string, lessonId: string): Promise<LessonDetailResponseDto> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId, status: ContentStatus.PUBLISHED },
      relations: { exercises: true, unit: true },
      order: { exercises: { order: 'ASC' } },
    });
    // A null lesson (e.g. DRAFT) still goes through the gate: its own
    // unfiltered lookup keeps the current 404/lock behavior.
    await this.assertLessonAccessible(userId, lessonId, lesson ?? undefined);
    if (!lesson) throw new NotFoundException('Lesson not found');

    if (lesson.kind === 'checkpoint') {
      const materialized = await this.ensureCheckpointMaterialized(lesson);
      if (materialized) {
        lesson.exercises = materialized;
      } else {
        // Nothing was rebuilt (frozen by answers or no content) — fall back
        // to a reload in case a concurrent request rebuilt the rows.
        const reloaded = await this.lessonRepository.findOne({
          where: { id: lessonId, status: ContentStatus.PUBLISHED },
          relations: { exercises: true },
          order: { exercises: { order: 'ASC' } },
        });
        if (reloaded) lesson.exercises = reloaded.exercises;
      }
    }

    const publishedExercises = lesson.exercises
      .filter((e) => e.status === ContentStatus.PUBLISHED)
      .sort((a, b) => a.order - b.order);

    const wordsById = await this.loadWordsById(publishedExercises);

    return {
      id: lesson.id,
      title: lesson.title,
      titleLatin: lesson.titleLatin,
      titleTranslationRu: lesson.titleTranslationRu,
      titleTranslationEn: lesson.titleTranslationEn,
      xpReward: lesson.xpReward,
      exercises: publishedExercises.map((exercise) => ({
        id: exercise.id,
        type: exercise.type,
        order: exercise.order,
        payload: toPublicPayload(resolveExercisePayload(exercise.payload, wordsById)),
      })),
    };
  }

  async checkAnswer(
    userId: string,
    lessonId: string,
    exerciseId: string,
    answerId: string,
  ): Promise<AnswerResultResponseDto> {
    await this.assertLessonAccessible(userId, lessonId);
    const exercise = await this.exerciseRepository.findOne({ where: { id: exerciseId } });
    if (!exercise || exercise.lessonId !== lessonId) {
      throw new NotFoundException('Exercise not found in this lesson');
    }

    const payload = exercise.payload;
    const payloadIssues = validateExercisePayload(exercise.type, payload);
    if (payloadIssues.length > 0) {
      throw new BadRequestException({
        message: 'Exercise payload is broken and cannot be answered',
        issues: payloadIssues,
      });
    }
    const chosen = payload.answers.find((a) => a.id === answerId);
    if (!chosen) throw new NotFoundException('Answer not found');

    const correct = chosen.id === payload.correctAnswerId;
    const correctAnswer = getCorrectAnswer(payload);

    // Server-side record of the last attempt per (user, exercise); the first
    // attempt (attemptNumber = 1) is what completeLesson scores.
    const existing = await this.answerRepository.findOne({
      where: { userId, exerciseId },
    });
    if (existing) {
      existing.correct = correct;
      existing.attemptNumber = existing.attemptNumber + 1;
      existing.answeredAt = new Date();
      await this.answerRepository.save(existing);
    } else {
      try {
        await this.answerRepository.insert({
          userId,
          exerciseId,
          lessonId,
          correct,
          attemptNumber: 1,
          answeredAt: new Date(),
        });
      } catch (error) {
        // Two concurrent first answers race the unique (userId, exerciseId)
        // constraint; the loser of the insert re-applies as an update instead
        // of surfacing the 23505 as a 500.
        if ((error as { code?: string }).code !== '23505') throw error;
        await this.answerRepository.update(
          { userId, exerciseId },
          {
            correct,
            attemptNumber: () => '"attemptNumber" + 1',
            answeredAt: new Date(),
          },
        );
      }
    }

    let correctAnswerResolved = correctAnswer;
    if (correctAnswer) {
      const wordsById = await this.loadWordsById([exercise]);
      correctAnswerResolved = resolveExercisePayload(
        { ...payload, correctAnswerId: correctAnswer.id },
        wordsById,
      ).answers.find((a) => a.id === correctAnswer.id);
    }

    return {
      correct,
      correctAnswerId: payload.correctAnswerId,
      correctAnswer: correctAnswerResolved
        ? (correctAnswerResolved as unknown as Record<string, unknown>)
        : undefined,
    };
  }

  async completeLesson(
    userId: string,
    lessonId: string,
    correctCount: number,
    totalCount: number,
  ): Promise<CompleteLessonResponseDto> {
    await this.assertLessonAccessible(userId, lessonId);
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId, status: ContentStatus.PUBLISHED },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Server records are the source of truth: score by the FIRST attempt of
    // each exercise. The client report is only a fallback for lessons answered
    // before server-side accounting existed.
    const firstAttempts = await this.answerRepository.find({
      where: { userId, lessonId, attemptNumber: 1 },
    });
    if (firstAttempts.length > 0) {
      correctCount = firstAttempts.filter((a) => a.correct).length;
      totalCount = firstAttempts.length;
    }

    const now = new Date();
    const ratio = totalCount > 0 ? correctCount / totalCount : 0;
    const xpEarned = Math.round(
      lesson.xpReward * (ratio >= FULL_XP_THRESHOLD ? 1 : PARTIAL_XP_FACTOR),
    );

    let progress = await this.progressRepository.findOne({ where: { userId, lessonId } });
    if (!progress) {
      progress = this.progressRepository.create({ user: { id: userId } as User, lesson });
    }
    progress.correctCount = correctCount;
    progress.totalCount = totalCount;
    progress.completedAt = now;
    await this.progressRepository.save(progress);

    this.applyStreakAndXp(user, now, xpEarned);
    await this.userRepository.save(user);

    const newBadges = await this.badgesService.evaluateForUser(userId);

    return {
      xpEarned,
      totalXp: user.xp,
      streakDays: user.streakDays,
      newBadges,
    };
  }

  /**
   * Section gate. A checkpoint requires every published regular lesson of its
   * section to be completed (one IN query). A regular lesson requires the
   * checkpoint of the nearest preceding published section to be passed —
   * which opens the first published section for free, since nothing precedes
   * it. Earlier checkpoints need no separate check: they are transitively
   * satisfied by the chain. Lessons without a section are always open.
   */
  async assertLessonAccessible(
    userId: string,
    lessonId: string,
    preloaded?: Lesson,
  ): Promise<void> {
    const lesson =
      preloaded ??
      (await this.lessonRepository.findOne({
        where: { id: lessonId },
        relations: { unit: true },
      }));
    if (!lesson) throw new NotFoundException('Lesson not found');

    const sectionId = lesson.sectionId ?? lesson.unit?.sectionId ?? null;
    if (!sectionId) return;

    if (lesson.kind === 'checkpoint') {
      // Regular lessons belong to the section through their unit — the
      // lessons.sectionId column is only written for checkpoints.
      const regularLessonIds = (
        await this.lessonRepository
          .createQueryBuilder('lesson')
          .select('lesson.id', 'id')
          .leftJoin('lesson.unit', 'unit')
          .where('(lesson.sectionId = :sectionId OR unit.sectionId = :sectionId)', {
            sectionId,
          })
          .andWhere('lesson.kind = :kind', { kind: 'regular' })
          .andWhere('lesson.status = :status', { status: ContentStatus.PUBLISHED })
          .getRawMany<{ id: string }>()
      ).map((row) => row.id);
      if (regularLessonIds.length === 0) return;
      const completed = await this.progressRepository.count({
        where: { userId, lessonId: In(regularLessonIds) },
      });
      if (completed < regularLessonIds.length) {
        throw new ForbiddenException({ message: 'SECTION_LOCKED', sectionId });
      }
      return;
    }

    const section = await this.sectionRepository.findOne({ where: { id: sectionId } });
    if (!section) return;

    const gatingCheckpoint = await this.lessonRepository
      .createQueryBuilder('lesson')
      .innerJoin('lesson.section', 'section')
      .where('lesson.kind = :kind', { kind: 'checkpoint' })
      .andWhere('lesson.status = :lessonStatus', { lessonStatus: ContentStatus.PUBLISHED })
      .andWhere('section.status = :sectionStatus', { sectionStatus: ContentStatus.PUBLISHED })
      .andWhere('section."order" < :order', { order: section.order })
      .orderBy('section."order"', 'DESC')
      .addOrderBy('lesson."order"', 'ASC')
      .getOne();
    if (!gatingCheckpoint) return;

    const passed = await this.progressRepository.findOne({
      where: { userId, lessonId: gatingCheckpoint.id },
    });
    if (!passed) throw new ForbiddenException({ message: 'SECTION_LOCKED', sectionId });
  }

  /**
   * Serves a checkpoint lesson by materializing its exercises as real
   * `exercise` rows (PUBLISHED), so checkAnswer/completeLesson/
   * UserExerciseAnswer work unchanged. Idempotent delete+recreate; frozen
   * once ANY UserExerciseAnswer exists for the lesson — the answer rows
   * reference the materialized exercise ids, so regenerating would orphan
   * them.
   */
  private async ensureCheckpointMaterialized(lesson: Lesson): Promise<Exercise[] | null> {
    if (!lesson.sectionId) return null;

    const frozen = await this.answerRepository.count({ where: { lessonId: lesson.id } });
    if (frozen > 0) return null;

    const section = await this.sectionRepository.findOne({
      where: { id: lesson.sectionId },
      relations: { units: { lessons: { exercises: true } } },
    });
    if (!section) return null;

    const sectionLessons = (section.units ?? [])
      .flatMap((unit) => unit.lessons)
      .filter(
        (l) => l.kind !== 'checkpoint' && l.status === ContentStatus.PUBLISHED,
      )
      .sort((a, b) => a.order - b.order);

    const exercisesByLessonId = new Map<string, Exercise[]>();
    const allSectionExercises: Exercise[] = [];
    for (const l of sectionLessons) {
      const pool = l.exercises
        .filter((e) => e.status === ContentStatus.PUBLISHED)
        .sort((a, b) => a.order - b.order);
      exercisesByLessonId.set(l.id, pool);
      allSectionExercises.push(...pool);
    }

    // Deterministic round-robin: one exercise per lesson in lesson order,
    // cycling until the limit is reached or every lesson is exhausted.
    const sampled = sampleCheckpointExercises(sectionLessons, exercisesByLessonId);

    // Section words: distinct wordIds across ALL published exercises of the
    // section (not just the sampled ones), per the approved design.
    const sectionWordIds = collectSectionWordIds(allSectionExercises);
    if (sampled.length === 0 && sectionWordIds.length === 0) return null;

    const sectionWords = sectionWordIds.length
      ? await this.wordRepository.findBy({ id: In(sectionWordIds) })
      : [];
    // Not enough section words to host 3 distractors — pad from the global
    // published dictionary.
    const fallbackWords =
      sectionWords.length > 0 && sectionWords.length < 4
        ? await this.wordRepository.find({
            where: { status: ContentStatus.PUBLISHED },
            order: { cyrillic: 'ASC' },
          })
        : [];

    const built = await this.dataSource.transaction(async (manager): Promise<Exercise[] | null> => {
      // Serialize concurrent materializations of the same checkpoint: the
      // answer count alone can't do it under READ COMMITTED. The row lock
      // makes the second writer wait, then see the answers the first one
      // recorded (or none, and rebuild after it).
      const locked = await manager.getRepository(Lesson).findOne({
        where: { id: lesson.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!locked) return null;

      // Re-check inside the transaction: a user may have answered between the
      // outer check and this delete — regenerating then would orphan their
      // answer rows.
      const answers = await manager
        .getRepository(UserExerciseAnswer)
        .count({ where: { lessonId: lesson.id } });
      if (answers > 0) return null;

      await manager.delete(Exercise, { lessonId: lesson.id });

      const rows: Exercise[] = [];
      let order = 1;
      for (const src of sampled) {
        rows.push(
          manager.create(Exercise, {
            lessonId: lesson.id,
            type: src.type,
            payload: src.payload,
            status: ContentStatus.PUBLISHED,
            order: order++,
          }),
        );
      }
      for (const payload of buildVocabPayloads(sectionWords, fallbackWords)) {
        rows.push(
          manager.create(Exercise, {
            lessonId: lesson.id,
            type: 'translation_choice',
            payload,
            status: ContentStatus.PUBLISHED,
            order: order++,
          }),
        );
      }
      if (rows.length > 0) await manager.save(rows);
      return rows;
    });
    return built;
  }

  private async loadWordsById(exercises: Exercise[]): Promise<Map<string, Word>> {
    const ids = new Set<string>();
    for (const exercise of exercises) {
      if (exercise.payload && typeof exercise.payload === 'object') {
        for (const id of collectWordIds(exercise.payload)) ids.add(id);
      }
    }
    if (ids.size === 0) return new Map();
    const words = await this.wordRepository.findBy({ id: In([...ids]) });
    return new Map(words.map((w) => [w.id, w]));
  }

  private applyStreakAndXp(user: User, now: Date, xpEarned: number): void {
    const todayKey = toDateKey(now);
    if (user.lastActivityDate !== todayKey) {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      user.streakDays = user.lastActivityDate === toDateKey(yesterday) ? user.streakDays + 1 : 1;
      user.lastActivityDate = todayKey;
    }
    user.xp += xpEarned;
  }
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
