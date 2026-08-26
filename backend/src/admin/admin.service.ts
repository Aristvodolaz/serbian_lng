import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { UserLessonProgress } from '../content/entities/user-lesson-progress.entity';
import { UserWordProgress, WordProgressStatus } from '../vocabulary/entities/user-word-progress.entity';
import { Unit } from '../content/entities/unit.entity';
import { Lesson } from '../content/entities/lesson.entity';
import { Exercise, ExerciseType } from '../content/entities/exercise.entity';
import { ExerciseChoice } from '../content/entities/exercise-choice.entity';
import { Word } from '../vocabulary/entities/word.entity';
import { Badge } from '../badges/entities/badge.entity';
import { UserBadge } from '../badges/entities/user-badge.entity';
import { PaginationDto, PaginatedResponse } from './dtos/pagination.dto';
import {
  AdminUserDetailResponseDto,
  AdminUserListResponseDto,
  CompletedLessonDto,
  UpdateAdminUserDto,
} from './dtos/admin-user-response.dto';
import { DashboardStatsResponseDto } from './dtos/dashboard-stats-response.dto';
import {
  BadgeAdminResponseDto,
  BadgeEarnerResponseDto,
  CreateBadgeDto,
  CreateExerciseChoiceDto,
  CreateExerciseDto,
  CreateLessonDto,
  CreateUnitDto,
  CreateWordDto,
  ExerciseAdminResponseDto,
  ExerciseChoiceAdminResponseDto,
  LessonAdminResponseDto,
  LessonCompletionDto,
  UnitAdminResponseDto,
  UpdateBadgeDto,
  UpdateExerciseDto,
  UpdateLessonDto,
  UpdateUnitDto,
  UpdateWordDto,
  UserGrowthDataDto,
  WordAdminResponseDto,
} from './dtos/content-dtos';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Unit) private readonly unitRepo: Repository<Unit>,
    @InjectRepository(Lesson) private readonly lessonRepo: Repository<Lesson>,
    @InjectRepository(Exercise) private readonly exerciseRepo: Repository<Exercise>,
    @InjectRepository(ExerciseChoice) private readonly choiceRepo: Repository<ExerciseChoice>,
    @InjectRepository(Word) private readonly wordRepo: Repository<Word>,
    @InjectRepository(Badge) private readonly badgeRepo: Repository<Badge>,
    @InjectRepository(UserBadge) private readonly userBadgeRepo: Repository<UserBadge>,
    @InjectRepository(UserLessonProgress)
    private readonly lessonProgressRepo: Repository<UserLessonProgress>,
    @InjectRepository(UserWordProgress)
    private readonly wordProgressRepo: Repository<UserWordProgress>,
  ) {}

  private getP(p: PaginationDto): { page: number; limit: number } {
    return { page: p.page ?? 1, limit: p.limit ?? 20 };
  }

  // ── Dashboard ──────────────────────────────────────────────

  async getDashboardStats(): Promise<DashboardStatsResponseDto> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const activeUsersThisWeek = await this.userRepo
      .createQueryBuilder('user')
      .where("user.lastActivityDate >= :start AND user.lastActivityDate < :end", {
        start: startOfWeek.toISOString().slice(0, 10),
        end: endOfWeek.toISOString().slice(0, 10),
      })
      .getCount();

    const [
      totalUsers,
      activeUsersToday,
      newUsersThisWeek,
      totalLessonsCompleted,
      lessonsCompletedToday,
      totalWords,
      totalUnits,
      totalLessons,
      bannedUsers,
    ] = await Promise.all([
      this.userRepo.count(),
      this.userRepo.count({ where: { lastActivityDate: startOfDay.toISOString().slice(0, 10) } }),
      this.userRepo.count({ where: { createdAt: Between(startOfWeek, now) } }),
      this.lessonProgressRepo.count(),
      this.lessonProgressRepo.count({
        where: { completedAt: Between(startOfDay, now) },
      }),
      this.wordRepo.count(),
      this.unitRepo.count(),
      this.lessonRepo.count(),
      this.userRepo.count({ where: { banned: true } }),
    ]);

    return {
      totalUsers,
      activeUsersToday,
      activeUsersThisWeek,
      newUsersThisWeek,
      totalLessonsCompleted,
      lessonsCompletedToday,
      totalWords,
      totalUnits,
      totalLessons,
      bannedUsers,
    };
  }

  // ── Users ──────────────────────────────────────────────────

  async listUsers(pagination: PaginationDto): Promise<PaginatedResponse<AdminUserListResponseDto>> {
    const { page, limit } = this.getP(pagination);
    const [users, total] = await this.userRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return PaginatedResponse.from(this.mapUserList(users), total, page, limit);
  }

  async getUserDetail(userId: string): Promise<AdminUserDetailResponseDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const [lessonsCompleted, wordsLearned, badgesEarned, recentLessons] = await Promise.all([
      this.lessonProgressRepo.count({ where: { userId: user.id } }),
      this.wordProgressRepo.count({
        where: { userId: user.id, status: WordProgressStatus.KNOWN },
      }),
      this.userBadgeRepo.count({ where: { userId: user.id } }),
      this.lessonProgressRepo.find({
        where: { userId: user.id },
        order: { completedAt: 'DESC' },
        take: 10,
      }),
    ]);

    const resp = {
      ...this.mapUserList([user])[0],
      lessonsCompleted,
      wordsLearned,
      badgesEarned,
      recentLessons: recentLessons.map((p) => ({
        lessonId: p.lessonId,
        title: '',
        correctCount: p.correctCount,
        totalCount: p.totalCount,
        completedAt: p.completedAt,
      })) as CompletedLessonDto[],
    };

    // Fetch lesson titles
    const lessonIds = recentLessons.map((p) => p.lessonId);
    if (lessonIds.length > 0) {
      const lessons = await this.lessonRepo.findByIds(lessonIds);
      const titleMap = new Map(lessons.map((l) => [l.id, l.title]));
      resp.recentLessons = resp.recentLessons.map((r) => ({
        ...r,
        title: titleMap.get(r.lessonId) || '',
      }));
    }

    return resp;
  }

  async updateUser(userId: string, dto: UpdateAdminUserDto): Promise<AdminUserListResponseDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.role !== undefined) user.role = dto.role;
    if (dto.banned !== undefined) user.banned = dto.banned;

    await this.userRepo.save(user);
    return this.mapUserList([user])[0];
  }

  async deleteUser(userId: string): Promise<{ deleted: true }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    await this.userRepo.remove(user);
    return { deleted: true };
  }

  // ── Units ──────────────────────────────────────────────────

  async listUnits(pagination: PaginationDto): Promise<PaginatedResponse<UnitAdminResponseDto>> {
    const { page, limit } = this.getP(pagination);
    const [units, total] = await this.unitRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { order: 'ASC' },
    });
    return PaginatedResponse.from(
      units.map((u) => this.mapUnit(u)),
      total,
      page,
      limit,
    );
  }

  async createUnit(dto: CreateUnitDto): Promise<UnitAdminResponseDto> {
    const maxOrder = await this.unitRepo.findOne({
      order: { order: 'DESC' },
      select: ['order'],
    });
    const unit = this.unitRepo.create({
      ...dto,
      order: (maxOrder?.order ?? 0) + 1,
    });
    await this.unitRepo.save(unit);
    return this.mapUnit(unit);
  }

  async getUnit(unitId: string): Promise<UnitAdminResponseDto> {
    const unit = await this.unitRepo.findOne({ where: { id: unitId } });
    if (!unit) throw new NotFoundException('Unit not found');

    const lessons = await this.lessonRepo.find({
      where: { unitId: unit.id },
      order: { order: 'ASC' },
    });
    return this.mapUnitWithLessons(unit, lessons);
  }

  async updateUnit(unitId: string, dto: UpdateUnitDto): Promise<UnitAdminResponseDto> {
    const unit = await this.unitRepo.findOne({ where: { id: unitId } });
    if (!unit) throw new NotFoundException('Unit not found');
    Object.assign(unit, dto);
    await this.unitRepo.save(unit);
    return this.mapUnit(unit);
  }

  async deleteUnit(unitId: string): Promise<{ deleted: true }> {
    const unit = await this.unitRepo.findOne({ where: { id: unitId } });
    if (!unit) throw new NotFoundException('Unit not found');
    await this.unitRepo.remove(unit);
    return { deleted: true };
  }

  async bulkCreateUnits(units: CreateUnitDto[]): Promise<{ created: number; updated: number }> {
    const maxOrder = await this.unitRepo.findOne({
      order: { order: 'DESC' },
      select: ['order'],
    });
    let nextOrder = maxOrder?.order ?? 0;
    let created = 0;
    let updated = 0;

    for (const dto of units) {
      const existing = await this.unitRepo.findOne({
        where: { titleCyrillic: dto.titleCyrillic },
      });
      if (existing) {
        Object.assign(existing, dto);
        await this.unitRepo.save(existing);
        updated++;
      } else {
        nextOrder++;
        const unit = this.unitRepo.create({ ...dto, order: nextOrder });
        await this.unitRepo.save(unit);
        created++;
      }
    }
    return { created, updated };
  }

  // ── Lessons ────────────────────────────────────────────────

  async listLessons(pagination: PaginationDto): Promise<PaginatedResponse<LessonAdminResponseDto>> {
    const { page, limit } = this.getP(pagination);
    const [lessons, total] = await this.lessonRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { order: 'ASC' },
    });
    return PaginatedResponse.from(
      lessons.map((l) => this.mapLesson(l)),
      total,
      page,
      limit,
    );
  }

  async createLesson(dto: CreateLessonDto): Promise<LessonAdminResponseDto> {
    const unit = await this.unitRepo.findOne({ where: { id: dto.unitId } });
    if (!unit) throw new NotFoundException('Unit not found');

    const maxOrder = await this.lessonRepo.findOne({
      where: { unitId: dto.unitId },
      order: { order: 'DESC' },
      select: ['order'],
    });
    const lesson = this.lessonRepo.create({
      unitId: dto.unitId,
      title: dto.title,
      titleLatin: dto.titleLatin,
      titleTranslationRu: dto.titleTranslationRu,
      titleTranslationEn: dto.titleTranslationEn,
      order: (maxOrder?.order ?? 0) + 1,
      xpReward: dto.xpReward ?? 10,
    });
    await this.lessonRepo.save(lesson);
    return this.mapLesson(lesson);
  }

  async getLesson(lessonId: string): Promise<LessonAdminResponseDto> {
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const exercises = await this.exerciseRepo.find({
      where: { lessonId: lesson.id },
      order: { order: 'ASC' },
      relations: ['choices'],
    });
    return this.mapLessonWithExercises(lesson, exercises);
  }

  async updateLesson(lessonId: string, dto: UpdateLessonDto): Promise<LessonAdminResponseDto> {
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    Object.assign(lesson, dto);
    await this.lessonRepo.save(lesson);
    return this.mapLesson(lesson);
  }

  async deleteLesson(lessonId: string): Promise<{ deleted: true }> {
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.lessonRepo.remove(lesson);
    return { deleted: true };
  }

  async bulkCreateLessons(lessons: CreateLessonDto[]): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    // Group by unitId to assign order
    const byUnit = new Map<string, CreateLessonDto[]>();
    for (const dto of lessons) {
      if (!byUnit.has(dto.unitId)) byUnit.set(dto.unitId, []);
      byUnit.get(dto.unitId)!.push(dto);
    }

    for (const [unitId, dtos] of byUnit) {
      const unit = await this.unitRepo.findOne({ where: { id: unitId } });
      if (!unit) throw new NotFoundException(`Unit ${unitId} not found`);

      const maxOrder = await this.lessonRepo.findOne({
        where: { unitId },
        order: { order: 'DESC' },
        select: ['order'],
      });
      let nextOrder = maxOrder?.order ?? 0;

      for (const dto of dtos) {
        const existing = await this.lessonRepo.findOne({
          where: { unitId, title: dto.title },
        });
        if (existing) {
          Object.assign(existing, {
            titleLatin: dto.titleLatin,
            titleTranslationRu: dto.titleTranslationRu,
            titleTranslationEn: dto.titleTranslationEn,
            xpReward: dto.xpReward ?? existing.xpReward,
          });
          await this.lessonRepo.save(existing);
          updated++;
        } else {
          nextOrder++;
          const lesson = this.lessonRepo.create({
            unitId,
            title: dto.title,
            titleLatin: dto.titleLatin,
            titleTranslationRu: dto.titleTranslationRu,
            titleTranslationEn: dto.titleTranslationEn,
            order: nextOrder,
            xpReward: dto.xpReward ?? 10,
          });
          await this.lessonRepo.save(lesson);
          created++;
        }
      }
    }
    return { created, updated };
  }

  // ── Exercises ──────────────────────────────────────────────

  async createExercise(
    lessonId: string,
    dto: CreateExerciseDto,
  ): Promise<ExerciseAdminResponseDto> {
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const maxOrder = await this.exerciseRepo.findOne({
      where: { lessonId },
      order: { order: 'DESC' },
      select: ['order'],
    });

    const exercise = this.exerciseRepo.create({
      lessonId,
      type: dto.type ?? ExerciseType.TRANSLATE_CHOICE,
      promptCyrillic: dto.promptCyrillic,
      promptLatin: dto.promptLatin,
      promptTranslationRu: dto.promptTranslationRu,
      promptTranslationEn: dto.promptTranslationEn,
      order: (maxOrder?.order ?? 0) + 1,
    });

    if (dto.choices?.length) {
      exercise.choices = dto.choices.map((c, i) => ({
        text: c.text,
        textRu: c.textRu,
        isCorrect: c.isCorrect,
        order: c.order ?? i + 1,
      }) as ExerciseChoice);
    }

    await this.exerciseRepo.save(exercise);
    const saved = await this.exerciseRepo.findOne({
      where: { id: exercise.id },
      relations: ['choices'],
    });
    return this.mapExercise(saved!);
  }

  async updateExercise(
    exerciseId: string,
    dto: UpdateExerciseDto,
  ): Promise<ExerciseAdminResponseDto> {
    const exercise = await this.exerciseRepo.findOne({
      where: { id: exerciseId },
      relations: ['choices'],
    });
    if (!exercise) throw new NotFoundException('Exercise not found');

    if (dto.type !== undefined) exercise.type = dto.type;
    if (dto.promptCyrillic !== undefined) exercise.promptCyrillic = dto.promptCyrillic;
    if (dto.promptLatin !== undefined) exercise.promptLatin = dto.promptLatin;
    if (dto.promptTranslationRu !== undefined) exercise.promptTranslationRu = dto.promptTranslationRu;
    if (dto.promptTranslationEn !== undefined) exercise.promptTranslationEn = dto.promptTranslationEn;
    if (dto.order !== undefined) exercise.order = dto.order;

    if (dto.choices !== undefined) {
      await this.choiceRepo.delete({ exerciseId: exercise.id });
      exercise.choices = dto.choices.map((c, i) => ({
        exerciseId: exercise.id,
        text: c.text,
        textRu: c.textRu,
        isCorrect: c.isCorrect,
        order: c.order ?? i + 1,
      }) as ExerciseChoice);
    }

    await this.exerciseRepo.save(exercise);
    const saved = await this.exerciseRepo.findOne({
      where: { id: exercise.id },
      relations: ['choices'],
    });
    return this.mapExercise(saved!);
  }

  async deleteExercise(exerciseId: string): Promise<{ deleted: true }> {
    const exercise = await this.exerciseRepo.findOne({ where: { id: exerciseId } });
    if (!exercise) throw new NotFoundException('Exercise not found');
    await this.exerciseRepo.remove(exercise);
    return { deleted: true };
  }

  async bulkCreateExercises(
    exercises: Array<CreateExerciseDto & { lessonId: string }>,
  ): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    // Group by lessonId to assign order
    const byLesson = new Map<string, Array<CreateExerciseDto & { lessonId: string }>>();
    for (const dto of exercises) {
      if (!byLesson.has(dto.lessonId)) byLesson.set(dto.lessonId, []);
      byLesson.get(dto.lessonId)!.push(dto);
    }

    for (const [lessonId, dtos] of byLesson) {
      const lesson = await this.lessonRepo.findOne({ where: { id: lessonId } });
      if (!lesson) throw new NotFoundException(`Lesson ${lessonId} not found`);

      const maxOrder = await this.exerciseRepo.findOne({
        where: { lessonId },
        order: { order: 'DESC' },
        select: ['order'],
      });
      let nextOrder = maxOrder?.order ?? 0;

      for (const dto of dtos) {
        const existing = await this.exerciseRepo.findOne({
          where: { lessonId, promptCyrillic: dto.promptCyrillic },
          relations: ['choices'],
        });
        if (existing) {
          Object.assign(existing, {
            type: dto.type ?? existing.type,
            promptLatin: dto.promptLatin,
            promptTranslationRu: dto.promptTranslationRu,
            promptTranslationEn: dto.promptTranslationEn,
          });
          // Replace choices
          await this.choiceRepo.delete({ exerciseId: existing.id });
          existing.choices = dto.choices.map((c, i) => ({
            exerciseId: existing.id,
            text: c.text,
            textRu: c.textRu,
            isCorrect: c.isCorrect,
            order: c.order ?? i + 1,
          }) as ExerciseChoice);
          await this.exerciseRepo.save(existing);
          updated++;
        } else {
          nextOrder++;
          const exercise = this.exerciseRepo.create({
            lessonId,
            type: dto.type ?? ExerciseType.TRANSLATE_CHOICE,
            promptCyrillic: dto.promptCyrillic,
            promptLatin: dto.promptLatin,
            promptTranslationRu: dto.promptTranslationRu,
            promptTranslationEn: dto.promptTranslationEn,
            order: nextOrder,
            choices: dto.choices.map((c, i) => ({
              text: c.text,
              textRu: c.textRu,
              isCorrect: c.isCorrect,
              order: c.order ?? i + 1,
            }) as ExerciseChoice),
          });
          await this.exerciseRepo.save(exercise);
          created++;
        }
      }
    }
    return { created, updated };
  }

  // ── Exercise Choices ───────────────────────────────────────

  async createChoice(
    exerciseId: string,
    dto: CreateExerciseChoiceDto,
  ): Promise<ExerciseChoiceAdminResponseDto> {
    const exercise = await this.exerciseRepo.findOne({ where: { id: exerciseId } });
    if (!exercise) throw new NotFoundException('Exercise not found');

    const maxOrder = await this.choiceRepo.findOne({
      where: { exerciseId },
      order: { order: 'DESC' },
      select: ['order'],
    });

    const choice = this.choiceRepo.create({
      exerciseId,
      text: dto.text,
      textRu: dto.textRu,
      isCorrect: dto.isCorrect,
      order: dto.order ?? (maxOrder?.order ?? 0) + 1,
    });
    await this.choiceRepo.save(choice);
    return this.mapChoice(choice);
  }

  async updateChoice(
    choiceId: string,
    dto: Partial<CreateExerciseChoiceDto>,
  ): Promise<ExerciseChoiceAdminResponseDto> {
    const choice = await this.choiceRepo.findOne({ where: { id: choiceId } });
    if (!choice) throw new NotFoundException('Choice not found');
    Object.assign(choice, dto);
    await this.choiceRepo.save(choice);
    return this.mapChoice(choice);
  }

  async deleteChoice(choiceId: string): Promise<{ deleted: true }> {
    const choice = await this.choiceRepo.findOne({ where: { id: choiceId } });
    if (!choice) throw new NotFoundException('Choice not found');
    await this.choiceRepo.remove(choice);
    return { deleted: true };
  }

  // ── Words ──────────────────────────────────────────────────

  async listWords(
    pagination: PaginationDto,
    unitId?: string,
  ): Promise<PaginatedResponse<WordAdminResponseDto>> {
    const { page, limit } = this.getP(pagination);
    const where = unitId ? { unitId } : {};
    const [words, total] = await this.wordRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { cyrillic: 'ASC' },
    });
    return PaginatedResponse.from(
      words.map((w) => this.mapWord(w)),
      total,
      page,
      limit,
    );
  }

  async createWord(dto: CreateWordDto): Promise<WordAdminResponseDto> {
    const word = this.wordRepo.create({
      unitId: dto.unitId ?? null,
      cyrillic: dto.cyrillic,
      latin: dto.latin,
      translationRu: dto.translationRu,
      translationEn: dto.translationEn,
      exampleCyrillic: dto.exampleCyrillic ?? null,
      exampleTranslationRu: dto.exampleTranslationRu ?? null,
      exampleTranslationEn: dto.exampleTranslationEn ?? null,
      audioUrl: dto.audioUrl ?? null,
    });
    await this.wordRepo.save(word);
    return this.mapWord(word);
  }

  async bulkCreateWords(words: CreateWordDto[]): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    for (const dto of words) {
      const existing = await this.wordRepo.findOne({
        where: { cyrillic: dto.cyrillic },
      });
      if (existing) {
        Object.assign(existing, {
          unitId: dto.unitId ?? existing.unitId,
          latin: dto.latin,
          translationRu: dto.translationRu,
          translationEn: dto.translationEn,
          exampleCyrillic: dto.exampleCyrillic ?? existing.exampleCyrillic,
          exampleTranslationRu: dto.exampleTranslationRu ?? existing.exampleTranslationRu,
          exampleTranslationEn: dto.exampleTranslationEn ?? existing.exampleTranslationEn,
          audioUrl: dto.audioUrl ?? existing.audioUrl,
        });
        await this.wordRepo.save(existing);
        updated++;
      } else {
        const word = this.wordRepo.create({
          unitId: dto.unitId ?? null,
          cyrillic: dto.cyrillic,
          latin: dto.latin,
          translationRu: dto.translationRu,
          translationEn: dto.translationEn,
          exampleCyrillic: dto.exampleCyrillic ?? null,
          exampleTranslationRu: dto.exampleTranslationRu ?? null,
          exampleTranslationEn: dto.exampleTranslationEn ?? null,
          audioUrl: dto.audioUrl ?? null,
        });
        await this.wordRepo.save(word);
        created++;
      }
    }
    return { created, updated };
  }

  async getWord(wordId: string): Promise<WordAdminResponseDto> {
    const word = await this.wordRepo.findOne({ where: { id: wordId } });
    if (!word) throw new NotFoundException('Word not found');
    return this.mapWord(word);
  }

  async updateWord(wordId: string, dto: UpdateWordDto): Promise<WordAdminResponseDto> {
    const word = await this.wordRepo.findOne({ where: { id: wordId } });
    if (!word) throw new NotFoundException('Word not found');
    Object.assign(word, dto);
    await this.wordRepo.save(word);
    return this.mapWord(word);
  }

  async deleteWord(wordId: string): Promise<{ deleted: true }> {
    const word = await this.wordRepo.findOne({ where: { id: wordId } });
    if (!word) throw new NotFoundException('Word not found');
    await this.wordRepo.remove(word);
    return { deleted: true };
  }

  // ── Badges ─────────────────────────────────────────────────

  async listBadges(): Promise<BadgeAdminResponseDto[]> {
    const badges = await this.badgeRepo.find({ order: { id: 'ASC' } });
    return badges.map((b) => this.mapBadge(b));
  }

  async createBadge(dto: CreateBadgeDto): Promise<BadgeAdminResponseDto> {
    const badge = this.badgeRepo.create(dto);
    await this.badgeRepo.save(badge);
    return this.mapBadge(badge);
  }

  async updateBadge(badgeId: string, dto: UpdateBadgeDto): Promise<BadgeAdminResponseDto> {
    const badge = await this.badgeRepo.findOne({ where: { id: badgeId } });
    if (!badge) throw new NotFoundException('Badge not found');
    Object.assign(badge, dto);
    await this.badgeRepo.save(badge);
    return this.mapBadge(badge);
  }

  async deleteBadge(badgeId: string): Promise<{ deleted: true }> {
    const badge = await this.badgeRepo.findOne({ where: { id: badgeId } });
    if (!badge) throw new NotFoundException('Badge not found');
    await this.badgeRepo.remove(badge);
    return { deleted: true };
  }

  async getBadgeEarnerList(
    badgeId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<BadgeEarnerResponseDto>> {
    const badge = await this.badgeRepo.findOne({ where: { id: badgeId } });
    if (!badge) throw new NotFoundException('Badge not found');

    const query = this.userBadgeRepo
      .createQueryBuilder('ub')
      .innerJoin('users', 'u', 'u.id = ub.userId')
      .where('ub.badgeId = :badgeId', { badgeId })
      .select(['u.id as userId', 'u.email', 'u.displayName', 'ub.earnedAt'])
      .orderBy('ub.earnedAt', 'DESC');

    const { page, limit } = this.getP(pagination);
    const [results, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return PaginatedResponse.from(
      results as any[],
      total,
      page,
      limit,
    );
  }

  // ── Analytics ──────────────────────────────────────────────

  async getUserGrowth(days: number): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = await this.userRepo
      .createQueryBuilder('user')
      .select("DATE(user.createdAt)", 'day')
      .addSelect('COUNT(user.id)', 'count')
      .where('user.createdAt >= :startDate', { startDate })
      .groupBy("DATE(user.createdAt)")
      .orderBy('day', 'ASC')
      .getRawMany();

    // Fill missing days
    const dayMap = new Map(results.map((r) => [r.day, parseInt(r.count)]));
    const growth: any[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      growth.push({ day: key, count: dayMap.get(key) || 0 });
    }
    return growth;
  }

  async getActivityHeatmap(days: number): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = await this.lessonProgressRepo
      .createQueryBuilder('p')
      .select("DATE(p.completedAt)", 'day')
      .addSelect("EXTRACT(HOUR FROM p.completedAt)::int", 'hour')
      .addSelect('COUNT(*)::int', 'count')
      .where('p.completedAt >= :startDate', { startDate })
      .groupBy('day, hour')
      .getRawMany();

    return results.map((r) => ({
      day: r.day,
      hour: parseInt(r.hour),
      count: parseInt(r.count),
    }));
  }

  async getLessonCompletion(): Promise<LessonCompletionDto[]> {
    const totalUsers = await this.userRepo.count();

    const results = await this.lessonProgressRepo
      .createQueryBuilder('p')
      .innerJoin('lessons', 'l', 'l.id = p.lessonId')
      .select('p.lessonId', 'lessonId')
      .addSelect('l.title', 'title')
      .addSelect('COUNT(p.id)::int', 'completionCount')
      .addSelect('COUNT(DISTINCT p.userId)::int', 'uniqueUsers')
      .groupBy('p.lessonId, l.title')
      .orderBy('completionCount', 'DESC')
      .getRawMany();

    return results.map((r) => ({
      lessonId: r.lessonId,
      title: r.title,
      completionCount: parseInt(r.completionCount),
      uniqueUsers: parseInt(r.uniqueUsers),
      completionRate: totalUsers ? parseInt(r.uniqueUsers) / totalUsers : 0,
    }));
  }

  // ── Mappers ────────────────────────────────────────────────

  private mapUserList(users: User[]): AdminUserListResponseDto[] {
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      scriptPreference: u.scriptPreference,
      languagePreference: u.languagePreference,
      role: u.role,
      banned: u.banned,
      xp: u.xp,
      streakDays: u.streakDays,
      lastActivityDate: u.lastActivityDate,
      createdAt: u.createdAt,
    }));
  }

  private mapUnit(u: Unit): UnitAdminResponseDto {
    return {
      id: u.id,
      titleCyrillic: u.titleCyrillic,
      titleLatin: u.titleLatin,
      titleTranslationRu: u.titleTranslationRu,
      titleTranslationEn: u.titleTranslationEn,
      order: u.order,
    };
  }

  private mapUnitWithLessons(u: Unit, lessons: Lesson[]): UnitAdminResponseDto {
    return {
      ...this.mapUnit(u),
      lessons: lessons.map((l) => this.mapLesson(l)),
    };
  }

  private mapLesson(l: Lesson): LessonAdminResponseDto {
    return {
      id: l.id,
      unitId: l.unitId,
      title: l.title,
      titleLatin: l.titleLatin,
      titleTranslationRu: l.titleTranslationRu,
      titleTranslationEn: l.titleTranslationEn,
      order: l.order,
      xpReward: l.xpReward,
    };
  }

  private mapLessonWithExercises(
    l: Lesson,
    exercises: Exercise[],
  ): LessonAdminResponseDto {
    return {
      ...this.mapLesson(l),
      exercises: exercises.map((e) => this.mapExercise(e)),
    };
  }

  private mapExercise(e: Exercise): ExerciseAdminResponseDto {
    return {
      id: e.id,
      type: e.type,
      promptCyrillic: e.promptCyrillic,
      promptLatin: e.promptLatin,
      promptTranslationRu: e.promptTranslationRu,
      promptTranslationEn: e.promptTranslationEn,
      order: e.order,
      choices: (e.choices || []).map((c) => this.mapChoice(c)),
    };
  }

  private mapChoice(c: ExerciseChoice): ExerciseChoiceAdminResponseDto {
    return {
      id: c.id,
      text: c.text,
      textRu: c.textRu,
      isCorrect: c.isCorrect,
      order: c.order,
    };
  }

  private mapWord(w: Word): WordAdminResponseDto {
    return {
      id: w.id,
      unitId: w.unitId,
      cyrillic: w.cyrillic,
      latin: w.latin,
      translationRu: w.translationRu,
      translationEn: w.translationEn,
      exampleCyrillic: w.exampleCyrillic,
      exampleTranslationRu: w.exampleTranslationRu,
      exampleTranslationEn: w.exampleTranslationEn,
      audioUrl: w.audioUrl,
    };
  }

  private mapBadge(b: Badge): BadgeAdminResponseDto {
    return {
      id: b.id,
      code: b.code,
      titleCyrillic: b.titleCyrillic,
      titleLatin: b.titleLatin,
      description: b.description,
    };
  }
}
