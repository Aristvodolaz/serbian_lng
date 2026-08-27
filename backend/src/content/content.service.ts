import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Unit } from './entities/unit.entity';
import { Lesson } from './entities/lesson.entity';
import { Exercise } from './entities/exercise.entity';
import { UserLessonProgress } from './entities/user-lesson-progress.entity';
import { Word } from '../vocabulary/entities/word.entity';
import { ContentStatus } from '../common/enums/content-status.enum';
import { PathResponseDto, LessonPathStatus, UnitPathDto } from './dto/path-response.dto';
import { LessonDetailResponseDto } from './dto/lesson-detail-response.dto';
import { AnswerResultResponseDto } from './dto/answer-result-response.dto';
import { CompleteLessonResponseDto } from './dto/complete-lesson-response.dto';
import { User } from '../users/entities/user.entity';
import { BadgesService } from '../badges/badges.service';
import { collectWordIds, resolveExercisePayload, toPublicPayload } from './exercise-resolver';
import { getCorrectAnswer } from './exercise-types';

// Below this ratio a lesson still counts as completed (it unlocks the next
// one) but only earns half XP — mirrors "Провери" allowing imperfect runs.
const FULL_XP_THRESHOLD = 0.6;
const PARTIAL_XP_FACTOR = 0.5;

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Unit)
    private readonly unitRepository: Repository<Unit>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(Exercise)
    private readonly exerciseRepository: Repository<Exercise>,
    @InjectRepository(UserLessonProgress)
    private readonly progressRepository: Repository<UserLessonProgress>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Word)
    private readonly wordRepository: Repository<Word>,
    private readonly badgesService: BadgesService,
  ) {}

  async getPathForUser(userId: string): Promise<PathResponseDto> {
    const units = await this.unitRepository.find({
      where: { status: ContentStatus.PUBLISHED },
      relations: { lessons: true },
      order: { order: 'ASC', lessons: { order: 'ASC' } },
    });

    const completions = await this.progressRepository.find({ where: { userId } });
    const completedLessonIds = new Set(completions.map((c) => c.lessonId));

    const allLessons = units
      .flatMap((u) => u.lessons)
      .filter((l) => l.status === ContentStatus.PUBLISHED)
      .sort((a, b) => a.order - b.order);
    const currentLessonId = allLessons.find((l) => !completedLessonIds.has(l.id))?.id;

    const unitDtos: UnitPathDto[] = units.map((unit) => ({
      id: unit.id,
      titleCyrillic: unit.titleCyrillic,
      titleLatin: unit.titleLatin,
      titleTranslationRu: unit.titleTranslationRu,
      titleTranslationEn: unit.titleTranslationEn,
      order: unit.order,
      lessons: unit.lessons
        .filter((l) => l.status === ContentStatus.PUBLISHED)
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          titleLatin: lesson.titleLatin,
          titleTranslationRu: lesson.titleTranslationRu,
          titleTranslationEn: lesson.titleTranslationEn,
          order: lesson.order,
          xpReward: lesson.xpReward,
          status: completedLessonIds.has(lesson.id)
            ? LessonPathStatus.DONE
            : lesson.id === currentLessonId
              ? LessonPathStatus.CURRENT
              : LessonPathStatus.LOCKED,
        })),
    }));

    return { units: unitDtos };
  }

  async getLessonDetail(lessonId: string): Promise<LessonDetailResponseDto> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId, status: ContentStatus.PUBLISHED },
      relations: { exercises: true },
      order: { exercises: { order: 'ASC' } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

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
    lessonId: string,
    exerciseId: string,
    answerId: string,
  ): Promise<AnswerResultResponseDto> {
    const exercise = await this.exerciseRepository.findOne({ where: { id: exerciseId } });
    if (!exercise || exercise.lessonId !== lessonId) {
      throw new NotFoundException('Exercise not found in this lesson');
    }

    const payload = exercise.payload;
    if (!('answers' in payload)) {
      throw new NotFoundException('Exercise has no answers');
    }
    const chosen = payload.answers.find((a) => a.id === answerId);
    if (!chosen) throw new NotFoundException('Answer not found');

    const correct = chosen.id === payload.correctAnswerId;
    const correctAnswer = getCorrectAnswer(payload);

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
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId, status: ContentStatus.PUBLISHED },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

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
