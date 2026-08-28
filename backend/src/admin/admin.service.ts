import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { UserLessonProgress } from '../content/entities/user-lesson-progress.entity';
import { UserWordProgress, WordProgressStatus } from '../vocabulary/entities/user-word-progress.entity';
import { Unit } from '../content/entities/unit.entity';
import { Lesson } from '../content/entities/lesson.entity';
import { Exercise } from '../content/entities/exercise.entity';
import { Word } from '../vocabulary/entities/word.entity';
import { Badge } from '../badges/entities/badge.entity';
import { UserBadge } from '../badges/entities/user-badge.entity';
import { ContentStatus } from '../common/enums/content-status.enum';
import { ExercisePayload, ExerciseType } from '../content/exercise-types';
import {
  getExerciseTypeDefinition,
  validateExercisePayload,
  EXERCISE_TYPE_REGISTRY,
} from '../content/exercise-types';
import {
  WordAttributeField,
  WordAttributeOption,
  getWordAttributesResponse,
  validateWordAttributes,
} from './word-attributes';
import { collectWordIds, exercisePreview } from '../content/exercise-resolver';
import { PaginationDto, PaginatedResponse } from './dtos/pagination.dto';
import {
  AdminUserDetailResponseDto,
  AdminUserListResponseDto,
  CompletedLessonDto,
  UpdateAdminUserDto,
} from './dtos/admin-user-response.dto';
import { DashboardStatsResponseDto } from './dtos/dashboard-stats-response.dto';
import {
  AdminExerciseListItemDto,
  BadgeAdminResponseDto,
  BadgeEarnerResponseDto,
  CreateBadgeDto,
  CreateExerciseDto,
  CreateLessonDto,
  CreateUnitDto,
  CreateWordDto,
  ExerciseAdminResponseDto,
  ExerciseTemplateResponseDto,
  LessonAdminResponseDto,
  LessonCompletionDto,
  ListExercisesQueryDto,
  UnitAdminResponseDto,
  UpdateBadgeDto,
  UpdateExerciseDto,
  UpdateLessonDto,
  UpdateUnitDto,
  UpdateWordDto,
  WordAdminResponseDto,
} from './dtos/content-dtos';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Unit) private readonly unitRepo: Repository<Unit>,
    @InjectRepository(Lesson) private readonly lessonRepo: Repository<Lesson>,
    @InjectRepository(Exercise) private readonly exerciseRepo: Repository<Exercise>,
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
    const maxOrder = (await this.unitRepo.find({
      order: { order: 'DESC' },
      select: ['order'],
      take: 1,
    }))[0];
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

  async bulkCreateUnits(units: { titleCyrillic: string; titleLatin?: string; titleTranslationRu?: string; titleTranslationEn?: string; icon?: string }[]): Promise<{ created: number; updated: number }> {
    const maxOrder = (await this.unitRepo.find({
      order: { order: 'DESC' },
      select: ['order'],
      take: 1,
    }))[0];
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
      descriptionRu: dto.descriptionRu ?? '',
      descriptionEn: dto.descriptionEn ?? '',
      minExercises: dto.minExercises ?? 5,
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

  async bulkCreateLessons(lessons: { unitId: string; title: string; titleLatin?: string; titleTranslationRu?: string; titleTranslationEn?: string; descriptionRu?: string; descriptionEn?: string; minExercises?: number; xpReward?: number }[]): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    // Group by unitId to assign order
    const byUnit = new Map<string, typeof lessons[number][]>();
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
            descriptionRu: dto.descriptionRu ?? '',
            descriptionEn: dto.descriptionEn ?? '',
            minExercises: dto.minExercises ?? 5,
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

  getExerciseTemplates(): ExerciseTemplateResponseDto[] {
    return Object.values(EXERCISE_TYPE_REGISTRY).map((definition) => ({
      type: definition.type,
      label: definition.label,
      description: definition.description,
    }));
  }

  getWordAttributes(): Record<WordAttributeField, WordAttributeOption[]> {
    return getWordAttributesResponse();
  }

  async listExercises(
    query: ListExercisesQueryDto,
  ): Promise<PaginatedResponse<AdminExerciseListItemDto>> {
    const { page, limit } = this.getP(query);
    const qb = this.exerciseRepo
      .createQueryBuilder('e')
      .innerJoinAndSelect('e.lesson', 'lesson')
      .innerJoin('lesson.unit', 'unit')
      .orderBy('lesson.order', 'ASC')
      .addOrderBy('e.order', 'ASC');

    if (query.unitId) qb.andWhere('unit.id = :unitId', { unitId: query.unitId });
    if (query.lessonId) qb.andWhere('lesson.id = :lessonId', { lessonId: query.lessonId });
    if (query.type) qb.andWhere('e.type = :type', { type: query.type });
    if (query.status) qb.andWhere('e.status = :status', { status: query.status });

    const [rows, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return PaginatedResponse.from(
      rows.map((e) => this.mapExerciseListItem(e)),
      total,
      page,
      limit,
    );
  }

  async getExercise(exerciseId: string): Promise<ExerciseAdminResponseDto> {
    const exercise = await this.exerciseRepo.findOne({ where: { id: exerciseId } });
    if (!exercise) throw new NotFoundException('Exercise not found');
    return this.mapExercise(exercise);
  }

  async publishExercise(exerciseId: string): Promise<ExerciseAdminResponseDto> {
    const exercise = await this.exerciseRepo.findOne({ where: { id: exerciseId } });
    if (!exercise) throw new NotFoundException('Exercise not found');
    const issues = validateExercisePayload(exercise.type, exercise.payload);
    if (issues.length > 0) {
      throw new BadRequestException({
        message: 'Exercise cannot be published while it has validation issues',
        issues,
      });
    }
    exercise.status = ContentStatus.PUBLISHED;
    await this.exerciseRepo.save(exercise);
    return this.mapExercise(exercise);
  }

  async unpublishExercise(exerciseId: string): Promise<ExerciseAdminResponseDto> {
    const exercise = await this.exerciseRepo.findOne({ where: { id: exerciseId } });
    if (!exercise) throw new NotFoundException('Exercise not found');
    exercise.status = ContentStatus.DRAFT;
    await this.exerciseRepo.save(exercise);
    return this.mapExercise(exercise);
  }

  async publishLesson(lessonId: string): Promise<LessonAdminResponseDto> {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId },
      relations: { exercises: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const publishedExercises = lesson.exercises.filter(
      (e) => e.status === ContentStatus.PUBLISHED,
    );
    if (publishedExercises.length < lesson.minExercises) {
      throw new BadRequestException(
        `Lesson needs at least ${lesson.minExercises} published exercises, has ${publishedExercises.length}`,
      );
    }
    lesson.status = ContentStatus.PUBLISHED;
    await this.lessonRepo.save(lesson);
    return this.mapLesson(lesson);
  }

  async unpublishLesson(lessonId: string): Promise<LessonAdminResponseDto> {
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    lesson.status = ContentStatus.DRAFT;
    await this.lessonRepo.save(lesson);
    return this.mapLesson(lesson);
  }

  async publishUnit(unitId: string): Promise<UnitAdminResponseDto> {
    const unit = await this.unitRepo.findOne({
      where: { id: unitId },
      relations: { lessons: true },
    });
    if (!unit) throw new NotFoundException('Unit not found');

    const publishedLessons = unit.lessons.filter((l) => l.status === ContentStatus.PUBLISHED);
    if (publishedLessons.length === 0) {
      throw new BadRequestException('Unit needs at least one published lesson');
    }
    unit.status = ContentStatus.PUBLISHED;
    await this.unitRepo.save(unit);
    return this.mapUnit(unit);
  }

  async unpublishUnit(unitId: string): Promise<UnitAdminResponseDto> {
    const unit = await this.unitRepo.findOne({ where: { id: unitId } });
    if (!unit) throw new NotFoundException('Unit not found');
    unit.status = ContentStatus.DRAFT;
    await this.unitRepo.save(unit);
    return this.mapUnit(unit);
  }

  async createExercise(
    lessonId: string,
    dto: CreateExerciseDto,
  ): Promise<ExerciseAdminResponseDto> {
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const type = (dto.type ?? 'translation_choice') as ExerciseType;
    if (!getExerciseTypeDefinition(type)) {
      throw new BadRequestException(`Unknown exercise type: ${type}`);
    }
    if (typeof dto.payload !== 'object' || dto.payload === null) {
      throw new BadRequestException('payload must be an object');
    }

    const maxOrder = await this.exerciseRepo.findOne({
      where: { lessonId },
      order: { order: 'DESC' },
      select: ['order'],
    });

    const exercise = this.exerciseRepo.create({
      lessonId,
      type,
      payload: dto.payload as unknown as ExercisePayload,
      order: (maxOrder?.order ?? 0) + 1,
    });
    await this.exerciseRepo.save(exercise);
    return this.mapExercise(exercise);
  }

  async updateExercise(
    exerciseId: string,
    dto: UpdateExerciseDto,
  ): Promise<ExerciseAdminResponseDto> {
    const exercise = await this.exerciseRepo.findOne({ where: { id: exerciseId } });
    if (!exercise) throw new NotFoundException('Exercise not found');

    if (dto.type !== undefined) {
      if (!getExerciseTypeDefinition(dto.type)) {
        throw new BadRequestException(`Unknown exercise type: ${dto.type}`);
      }
      exercise.type = dto.type as ExerciseType;
    }
    if (dto.payload !== undefined) {
      if (typeof dto.payload !== 'object' || dto.payload === null) {
        throw new BadRequestException('payload must be an object');
      }
      exercise.payload = dto.payload as unknown as ExercisePayload;
    }
    if (dto.order !== undefined) exercise.order = dto.order;
    if (dto.status !== undefined) exercise.status = dto.status;

    await this.exerciseRepo.save(exercise);
    return this.mapExercise(exercise);
  }

  async deleteExercise(exerciseId: string): Promise<{ deleted: true }> {
    const exercise = await this.exerciseRepo.findOne({ where: { id: exerciseId } });
    if (!exercise) throw new NotFoundException('Exercise not found');
    await this.exerciseRepo.remove(exercise);
    return { deleted: true };
  }

  async bulkCreateExercises(
    exercises: Array<{ lessonId: string; type?: string; payload: Record<string, unknown> }>,
  ): Promise<{ created: number; updated: number }> {
    let created = 0;

    const byLesson = new Map<string, typeof exercises[number][]>();
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
        const type = (dto.type ?? 'translation_choice') as ExerciseType;
        if (!getExerciseTypeDefinition(type)) {
          throw new BadRequestException(`Unknown exercise type: ${type}`);
        }
        if (typeof dto.payload !== 'object' || dto.payload === null) {
          throw new BadRequestException('payload must be an object');
        }
        nextOrder++;
        const exercise = this.exerciseRepo.create({
          lessonId,
          type,
          payload: dto.payload as unknown as ExercisePayload,
          order: nextOrder,
        });
        await this.exerciseRepo.save(exercise);
        created++;
      }
    }
    return { created, updated: 0 };
  }

  // ── Words ──────────────────────────────────────────────────

  async listWords(
    pagination: PaginationDto,
    search?: string,
  ): Promise<PaginatedResponse<WordAdminResponseDto>> {
    const { page, limit } = this.getP(pagination);
    const where = search
      ? [
          { cyrillic: ILike(`%${search}%`) },
          { latin: ILike(`%${search}%`) },
          { translationRu: ILike(`%${search}%`) },
          { translationEn: ILike(`%${search}%`) },
        ]
      : undefined;
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
    const problems = validateWordAttributes(dto);
    if (problems.length > 0) {
      throw new BadRequestException({ message: 'Invalid word attributes', problems });
    }
    const word = this.wordRepo.create({
      cyrillic: dto.cyrillic,
      latin: dto.latin,
      translationRu: dto.translationRu,
      translationEn: dto.translationEn,
      exampleCyrillic: dto.exampleCyrillic ?? null,
      exampleTranslationRu: dto.exampleTranslationRu ?? null,
      exampleTranslationEn: dto.exampleTranslationEn ?? null,
      audioUrl: dto.audioUrl ?? null,
      partOfSpeech: dto.partOfSpeech ?? null,
      gender: dto.gender ?? null,
      number: dto.number ?? null,
      declension: dto.declension ?? null,
      conjugation: dto.conjugation ?? null,
      imageUrl: dto.imageUrl ?? null,
    });
    await this.wordRepo.save(word);
    return this.mapWord(word);
  }

  async bulkCreateWords(words: CreateWordDto[]): Promise<{ created: number; updated: number }> {
    const problems: string[] = [];
    words.forEach((dto, index) => {
      for (const p of validateWordAttributes(dto)) {
        problems.push(`words[${index}].${p}`);
      }
    });
    if (problems.length > 0) {
      throw new BadRequestException({ message: 'Invalid word attributes', problems });
    }

    let created = 0;
    let updated = 0;

    for (const dto of words) {
      const existing = await this.wordRepo.findOne({
        where: { cyrillic: dto.cyrillic },
      });
      if (existing) {
        Object.assign(existing, {
          latin: dto.latin,
          translationRu: dto.translationRu,
          translationEn: dto.translationEn,
          exampleCyrillic: dto.exampleCyrillic ?? existing.exampleCyrillic,
          exampleTranslationRu: dto.exampleTranslationRu ?? existing.exampleTranslationRu,
          exampleTranslationEn: dto.exampleTranslationEn ?? existing.exampleTranslationEn,
          audioUrl: dto.audioUrl ?? existing.audioUrl,
          partOfSpeech: dto.partOfSpeech ?? existing.partOfSpeech,
          gender: dto.gender ?? existing.gender,
          number: dto.number ?? existing.number,
          declension: dto.declension ?? existing.declension,
          conjugation: dto.conjugation ?? existing.conjugation,
          imageUrl: dto.imageUrl ?? existing.imageUrl,
        });
        await this.wordRepo.save(existing);
        updated++;
      } else {
        const word = this.wordRepo.create({
          cyrillic: dto.cyrillic,
          latin: dto.latin,
          translationRu: dto.translationRu,
          translationEn: dto.translationEn,
          exampleCyrillic: dto.exampleCyrillic ?? null,
          exampleTranslationRu: dto.exampleTranslationRu ?? null,
          exampleTranslationEn: dto.exampleTranslationEn ?? null,
          audioUrl: dto.audioUrl ?? null,
          partOfSpeech: dto.partOfSpeech ?? null,
          gender: dto.gender ?? null,
          number: dto.number ?? null,
          declension: dto.declension ?? null,
          conjugation: dto.conjugation ?? null,
          imageUrl: dto.imageUrl ?? null,
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
    const problems = validateWordAttributes(dto);
    if (problems.length > 0) {
      throw new BadRequestException({ message: 'Invalid word attributes', problems });
    }
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
      status: u.status,
      icon: u.icon,
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
      descriptionRu: l.descriptionRu,
      descriptionEn: l.descriptionEn,
      minExercises: l.minExercises,
      status: l.status,
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
      status: e.status,
      order: e.order,
      payload: e.payload as unknown as Record<string, unknown>,
      validationIssues: validateExercisePayload(e.type, e.payload),
    };
  }

  private mapExerciseListItem(e: Exercise): AdminExerciseListItemDto {
    return {
      id: e.id,
      lessonId: e.lessonId,
      unitId: e.lesson?.unitId ?? '',
      type: e.type,
      status: e.status,
      order: e.order,
      preview: exercisePreview(e.payload),
      linkedWordCount: collectWordIds(e.payload).length,
      validationIssues: validateExercisePayload(e.type, e.payload),
    };
  }

  private mapWord(w: Word): WordAdminResponseDto {
    return {
      id: w.id,
      cyrillic: w.cyrillic,
      latin: w.latin,
      translationRu: w.translationRu,
      translationEn: w.translationEn,
      exampleCyrillic: w.exampleCyrillic,
      exampleTranslationRu: w.exampleTranslationRu,
      exampleTranslationEn: w.exampleTranslationEn,
      audioUrl: w.audioUrl,
      partOfSpeech: w.partOfSpeech,
      gender: w.gender,
      number: w.number,
      declension: w.declension,
      conjugation: w.conjugation,
      imageUrl: w.imageUrl,
      status: w.status,
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
