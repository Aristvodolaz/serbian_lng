import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit } from './entities/unit.entity';
import { Lesson } from './entities/lesson.entity';
import { Exercise } from './entities/exercise.entity';
import { UserLessonProgress } from './entities/user-lesson-progress.entity';
import { PathResponseDto, LessonPathStatus, UnitPathDto } from './dto/path-response.dto';
import { LessonDetailResponseDto } from './dto/lesson-detail-response.dto';
import { AnswerResultResponseDto } from './dto/answer-result-response.dto';
import { CompleteLessonResponseDto } from './dto/complete-lesson-response.dto';
import { User } from '../users/entities/user.entity';
import { BadgesService } from '../badges/badges.service';

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
    private readonly badgesService: BadgesService,
  ) {}

  async getPathForUser(userId: string): Promise<PathResponseDto> {
    const units = await this.unitRepository.find({
      relations: { lessons: true },
      order: { order: 'ASC', lessons: { order: 'ASC' } },
    });

    const completions = await this.progressRepository.find({ where: { userId } });
    const completedLessonIds = new Set(completions.map((c) => c.lessonId));

    const allLessons = units.flatMap((u) => u.lessons).sort((a, b) => a.order - b.order);
    const currentLessonId = allLessons.find((l) => !completedLessonIds.has(l.id))?.id;

    const unitDtos: UnitPathDto[] = units.map((unit) => ({
      id: unit.id,
      titleCyrillic: unit.titleCyrillic,
      titleLatin: unit.titleLatin,
      titleTranslation: unit.titleTranslation,
      order: unit.order,
      lessons: unit.lessons
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          titleLatin: lesson.titleLatin,
          titleTranslation: lesson.titleTranslation,
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
      where: { id: lessonId },
      relations: { exercises: { choices: true } },
      order: { exercises: { order: 'ASC' } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    return {
      id: lesson.id,
      title: lesson.title,
      titleLatin: lesson.titleLatin,
      xpReward: lesson.xpReward,
      exercises: lesson.exercises
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((exercise) => ({
          id: exercise.id,
          type: exercise.type,
          promptCyrillic: exercise.promptCyrillic,
          promptLatin: exercise.promptLatin,
          order: exercise.order,
          choices: exercise.choices
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((choice) => ({ id: choice.id, text: choice.text })),
        })),
    };
  }

  async checkAnswer(
    lessonId: string,
    exerciseId: string,
    choiceId: string,
  ): Promise<AnswerResultResponseDto> {
    const exercise = await this.exerciseRepository.findOne({
      where: { id: exerciseId },
      relations: { choices: true },
    });
    if (!exercise || exercise.lessonId !== lessonId) {
      throw new NotFoundException('Exercise not found in this lesson');
    }

    const chosen = exercise.choices.find((c) => c.id === choiceId);
    if (!chosen) throw new NotFoundException('Choice not found');

    const correctChoice = exercise.choices.find((c) => c.isCorrect);
    if (!correctChoice) throw new NotFoundException('Exercise has no correct choice configured');

    return { correct: chosen.isCorrect, correctChoiceId: correctChoice.id };
  }

  async completeLesson(
    userId: string,
    lessonId: string,
    correctCount: number,
    totalCount: number,
  ): Promise<CompleteLessonResponseDto> {
    const lesson = await this.lessonRepository.findOne({ where: { id: lessonId } });
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
