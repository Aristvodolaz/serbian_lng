import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserStatsResponseDto } from './dto/user-stats-response.dto';
import { DayActivityDto, WeekActivityResponseDto } from './dto/week-activity-response.dto';
import { UserLessonProgress } from '../content/entities/user-lesson-progress.entity';
import {
  UserWordProgress,
  WordProgressStatus,
} from '../vocabulary/entities/user-word-progress.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserLessonProgress)
    private readonly lessonProgressRepository: Repository<UserLessonProgress>,
    @InjectRepository(UserWordProgress)
    private readonly wordProgressRepository: Repository<UserWordProgress>,
  ) {}

  async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findByIdOrThrow(id);
    if (dto.displayName !== undefined) user.displayName = dto.displayName;
    if (dto.scriptPreference !== undefined) user.scriptPreference = dto.scriptPreference;
    if (dto.languagePreference !== undefined) user.languagePreference = dto.languagePreference;
    return this.userRepository.save(user);
  }

  async getStats(userId: string): Promise<UserStatsResponseDto> {
    const user = await this.findByIdOrThrow(userId);

    const wordsLearned = await this.wordProgressRepository.count({
      where: { userId, status: WordProgressStatus.KNOWN },
    });

    const completions = await this.lessonProgressRepository.find({ where: { userId } });
    const lessonsCompleted = completions.length;

    let accuracy = 0;
    if (lessonsCompleted > 0) {
      const totalCorrect = completions.reduce((sum, c) => sum + c.correctCount, 0);
      const totalQuestions = completions.reduce((sum, c) => sum + c.totalCount, 0);
      accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    }

    const weeksActive = new Set(completions.map((c) => isoWeekKey(c.completedAt))).size;

    return {
      wordsLearned,
      accuracy,
      lessonsCompleted,
      weeksActive,
      xp: user.xp,
      streakDays: user.streakDays,
    };
  }

  async getWeekActivity(userId: string): Promise<WeekActivityResponseDto> {
    const lessonDates = await this.lessonProgressRepository.find({ where: { userId } });
    const wordDates = await this.wordProgressRepository.find({ where: { userId } });

    const activeDates = new Set<string>();
    for (const c of lessonDates) activeDates.add(toDateKey(c.completedAt));
    for (const w of wordDates) {
      if (w.lastReviewedAt) activeDates.add(toDateKey(w.lastReviewedAt));
    }

    const days: DayActivityDto[] = [];
    const today = new Date();
    // Build a Mon..Sun window ending today, matching the profile screen's weekly strip.
    const currentWeekday = isoWeekday(today); // 1..7
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentWeekday - 1));

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = toDateKey(d);
      days.push({ date: key, weekday: i + 1, active: activeDates.has(key) });
    }

    return { days };
  }
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isoWeekday(date: Date): number {
  const day = date.getDay(); // 0=Sun..6=Sat
  return day === 0 ? 7 : day;
}

function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const weekday = isoWeekday(d);
  d.setUTCDate(d.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
}
