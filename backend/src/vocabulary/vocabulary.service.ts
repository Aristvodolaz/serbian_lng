import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Word } from './entities/word.entity';
import { UserWordProgress, WordProgressStatus } from './entities/user-word-progress.entity';
import { ReviewWordResponseDto } from './dto/review-word-response.dto';
import { ReviewResult } from './dto/submit-review.dto';
import { SubmitReviewResponseDto } from './dto/submit-review-response.dto';
import { WordPublicDto, WordsListResponseDto } from './dto/word-public.dto';
import { getWordAttributesResponse } from '../admin/word-attributes';
import { ContentStatus } from '../common/enums/content-status.enum';
import { BadgesService } from '../badges/badges.service';
import { User } from '../users/entities/user.entity';

// Simple spaced-repetition ladder, in hours, indexed by review count so far.
const KNOWN_INTERVALS_HOURS = [24, 72, 168, 336]; // 1d, 3d, 7d, 14d
const RELEARN_INTERVAL_MINUTES = 10;

@Injectable()
export class VocabularyService {
  constructor(
    @InjectRepository(Word)
    private readonly wordRepository: Repository<Word>,
    @InjectRepository(UserWordProgress)
    private readonly progressRepository: Repository<UserWordProgress>,
    private readonly badgesService: BadgesService,
  ) {}

  async getReviewQueue(userId: string, limit: number): Promise<ReviewWordResponseDto[]> {
    const now = new Date();

    const due = await this.progressRepository
      .createQueryBuilder('progress')
      .innerJoinAndSelect('progress.word', 'word')
      .where('progress.userId = :userId', { userId })
      .andWhere('(progress.nextReviewAt IS NULL OR progress.nextReviewAt <= :now)', { now })
      .orderBy('progress.nextReviewAt', 'ASC', 'NULLS FIRST')
      .take(limit)
      .getMany();

    const dueWordIds = due.map((p) => p.wordId);
    const results: ReviewWordResponseDto[] = due.map((p) => toDto(p.word, p.status));

    if (results.length < limit) {
      const remaining = limit - results.length;
      const excludeIds = dueWordIds.length > 0 ? dueWordIds : ['00000000-0000-0000-0000-000000000000'];
      const fresh = await this.wordRepository
        .createQueryBuilder('word')
        .leftJoin(
          UserWordProgress,
          'progress',
          'progress.wordId = word.id AND progress.userId = :userId',
          { userId },
        )
        .where('progress.id IS NULL')
        .andWhere('word.id NOT IN (:...excludeIds)', { excludeIds })
        .take(remaining)
        .getMany();
      results.push(...fresh.map((w) => toDto(w, WordProgressStatus.LEARNING)));
    }

    return results;
  }

  async submitReview(
    userId: string,
    wordId: string,
    result: ReviewResult,
  ): Promise<SubmitReviewResponseDto> {
    const word = await this.wordRepository.findOne({ where: { id: wordId } });
    if (!word) throw new NotFoundException('Word not found');

    let progress = await this.progressRepository.findOne({ where: { userId, wordId } });
    if (!progress) {
      progress = this.progressRepository.create({
        user: { id: userId } as User,
        word,
        reviewCount: 0,
      });
    }

    const now = new Date();
    progress.lastReviewedAt = now;
    progress.reviewCount += 1;

    if (result === ReviewResult.KNOW) {
      progress.status = WordProgressStatus.KNOWN;
      const stepIndex = Math.min(progress.reviewCount - 1, KNOWN_INTERVALS_HOURS.length - 1);
      const hours = KNOWN_INTERVALS_HOURS[stepIndex];
      progress.nextReviewAt = new Date(now.getTime() + hours * 60 * 60 * 1000);
    } else {
      progress.status = WordProgressStatus.LEARNING;
      progress.nextReviewAt = new Date(now.getTime() + RELEARN_INTERVAL_MINUTES * 60 * 1000);
    }

    await this.progressRepository.save(progress);

    const newBadges = await this.badgesService.evaluateForUser(userId);

    return {
      status: progress.status,
      nextReviewAt: progress.nextReviewAt,
      newBadges,
    };
  }

  async searchWords(
    search?: string,
    limit = 50,
    offset = 0,
  ): Promise<WordsListResponseDto> {
    const where = search
      ? [
          { status: ContentStatus.PUBLISHED, cyrillic: ILike(`%${search}%`) },
          { status: ContentStatus.PUBLISHED, latin: ILike(`%${search}%`) },
          { status: ContentStatus.PUBLISHED, translationRu: ILike(`%${search}%`) },
          { status: ContentStatus.PUBLISHED, translationEn: ILike(`%${search}%`) },
        ]
      : { status: ContentStatus.PUBLISHED };
    const [words, total] = await this.wordRepository.findAndCount({
      where,
      order: { cyrillic: 'ASC' },
      skip: offset,
      take: limit,
    });
    return { items: words.map(toPublicDto), total };
  }

  wordAttributes(): ReturnType<typeof getWordAttributesResponse> {
    return getWordAttributesResponse();
  }
}

function toPublicDto(word: Word): WordPublicDto {
  return {
    id: word.id,
    cyrillic: word.cyrillic,
    latin: word.latin,
    translationRu: word.translationRu,
    translationEn: word.translationEn,
    exampleCyrillic: word.exampleCyrillic,
    exampleTranslationRu: word.exampleTranslationRu,
    exampleTranslationEn: word.exampleTranslationEn,
    audioUrl: word.audioUrl,
    partOfSpeech: word.partOfSpeech,
    gender: word.gender,
    number: word.number,
    declension: word.declension,
    conjugation: word.conjugation,
    imageUrl: word.imageUrl,
  };
}

function toDto(word: Word, status: WordProgressStatus): ReviewWordResponseDto {
  return {
    wordId: word.id,
    cyrillic: word.cyrillic,
    latin: word.latin,
    translationRu: word.translationRu,
    translationEn: word.translationEn,
    exampleCyrillic: word.exampleCyrillic,
    exampleTranslationRu: word.exampleTranslationRu,
    exampleTranslationEn: word.exampleTranslationEn,
    audioUrl: word.audioUrl,
    status,
  };
}
