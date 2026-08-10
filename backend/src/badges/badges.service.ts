import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { BadgeResponseDto, EarnedBadgeResponseDto } from './dto/badge-response.dto';
import { User } from '../users/entities/user.entity';
import { UserLessonProgress } from '../content/entities/user-lesson-progress.entity';
import {
  UserWordProgress,
  WordProgressStatus,
} from '../vocabulary/entities/user-word-progress.entity';

const KNOWN_WORDS_FOR_BADGE = 100;
const STREAK_DAYS_FOR_BADGE = 7;

@Injectable()
export class BadgesService {
  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
    @InjectRepository(UserBadge)
    private readonly userBadgeRepository: Repository<UserBadge>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserLessonProgress)
    private readonly lessonProgressRepository: Repository<UserLessonProgress>,
    @InjectRepository(UserWordProgress)
    private readonly wordProgressRepository: Repository<UserWordProgress>,
  ) {}

  async listCatalog(): Promise<BadgeResponseDto[]> {
    return this.badgeRepository.find({ order: { titleCyrillic: 'ASC' } });
  }

  async listForUser(userId: string): Promise<EarnedBadgeResponseDto[]> {
    const earned = await this.userBadgeRepository.find({
      where: { userId },
      order: { earnedAt: 'DESC' },
    });
    return earned.map((e) => ({
      id: e.badge.id,
      code: e.badge.code,
      titleCyrillic: e.badge.titleCyrillic,
      titleLatin: e.badge.titleLatin,
      description: e.badge.description,
      earnedAt: e.earnedAt,
    }));
  }

  /**
   * Checks all badge criteria for a user and awards any newly-satisfied ones.
   * Called after lesson completion and after vocabulary review.
   */
  async evaluateForUser(userId: string): Promise<EarnedBadgeResponseDto[]> {
    const alreadyEarned = await this.userBadgeRepository.find({ where: { userId } });
    const earnedCodes = new Set(alreadyEarned.map((e) => e.badge.code));

    const newlyEarned: EarnedBadgeResponseDto[] = [];

    if (!earnedCodes.has('first_week')) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user && user.streakDays >= STREAK_DAYS_FOR_BADGE) {
        const badge = await this.award(userId, 'first_week');
        if (badge) newlyEarned.push(badge);
      }
    }

    if (!earnedCodes.has('100_words')) {
      const knownCount = await this.wordProgressRepository.count({
        where: { userId, status: WordProgressStatus.KNOWN },
      });
      if (knownCount >= KNOWN_WORDS_FOR_BADGE) {
        const badge = await this.award(userId, '100_words');
        if (badge) newlyEarned.push(badge);
      }
    }

    if (!earnedCodes.has('no_mistakes')) {
      const perfect = await this.lessonProgressRepository
        .createQueryBuilder('progress')
        .where('progress.userId = :userId', { userId })
        .andWhere('progress.correctCount = progress.totalCount')
        .getExists();
      if (perfect) {
        const badge = await this.award(userId, 'no_mistakes');
        if (badge) newlyEarned.push(badge);
      }
    }

    return newlyEarned;
  }

  private async award(userId: string, code: string): Promise<EarnedBadgeResponseDto | null> {
    const badge = await this.badgeRepository.findOne({ where: { code } });
    if (!badge) return null; // badge not seeded — nothing to award

    const userBadge = this.userBadgeRepository.create({
      user: { id: userId } as User,
      badge,
      earnedAt: new Date(),
    });
    await this.userBadgeRepository.save(userBadge);

    return {
      id: badge.id,
      code: badge.code,
      titleCyrillic: badge.titleCyrillic,
      titleLatin: badge.titleLatin,
      description: badge.description,
      earnedAt: userBadge.earnedAt,
    };
  }
}
