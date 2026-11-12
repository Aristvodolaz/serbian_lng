import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { UserLessonProgress } from '../content/entities/user-lesson-progress.entity';
import { UserWordProgress, WordProgressStatus } from '../vocabulary/entities/user-word-progress.entity';
import { Section } from '../content/entities/section.entity';
import { Unit } from '../content/entities/unit.entity';
import { Lesson } from '../content/entities/lesson.entity';
import { Exercise } from '../content/entities/exercise.entity';
import { TheoryTopic } from '../content/entities/theory-topic.entity';
import { validateTheoryPayload } from '../content/theory-blocks';
import { Word } from '../vocabulary/entities/word.entity';
import { Badge } from '../badges/entities/badge.entity';
import { UserBadge } from '../badges/entities/user-badge.entity';
import { ContentStatus } from '../common/enums/content-status.enum';
import { ExercisePayload, ExerciseType } from '../content/exercise-types';
import {
  getExerciseTypeDefinition,
  validateExercisePayload,
  EXERCISE_TYPE_REGISTRY,
  ValidationIssue,
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
  CreateSectionDto,
  CreateTheoryTopicDto,
  ExerciseAdminResponseDto,
  ExerciseTemplateResponseDto,
  LessonAdminResponseDto,
  LessonCompletionDto,
  LessonPublishResultDto,
  ListExercisesQueryDto,
  ListTheoryQueryDto,
  PublishAllResultDto,
  PublishIssueDto,
  PublishWordsResultDto,
  SectionAdminResponseDto,
  SectionPublishResultDto,
  TheoryAdminResponseDto,
  UnitAdminResponseDto,
  UnitPublishResultDto,
  UpdateBadgeDto,
  UpdateExerciseDto,
  UpdateLessonDto,
  UpdateSectionDto,
  UpdateTheoryTopicDto,
  UpdateUnitDto,
  UpdateWordDto,
  WordAdminResponseDto,
} from './dtos/content-dtos';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Section) private readonly sectionRepo: Repository<Section>,
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
    @InjectRepository(TheoryTopic)
    private readonly theoryRepo: Repository<TheoryTopic>,
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

  async bulkCreateUnits(
    units: {
      titleCyrillic: string;
      titleLatin?: string;
      titleTranslationRu?: string;
      titleTranslationEn?: string;
      icon?: string;
      sectionTitle?: string;
    }[],
  ): Promise<{ created: number; updated: number }> {
    const maxOrder = (await this.unitRepo.find({
      order: { order: 'DESC' },
      select: ['order'],
      take: 1,
    }))[0];
    let nextOrder = maxOrder?.order ?? 0;
    let created = 0;
    let updated = 0;

    // sectionTitle is a CSV-only key — resolve (or auto-create, so the CSV
    // cycle passes even without sections.csv) before touching units.
    const sectionIdsByTitle = new Map<string, string>();
    let nextSectionOrder = (await this.sectionRepo.find({
      order: { order: 'DESC' },
      select: ['order'],
      take: 1,
    }))[0]?.order ?? 0;
    for (const dto of units) {
      if (!dto.sectionTitle || sectionIdsByTitle.has(dto.sectionTitle)) continue;
      let section = await this.sectionRepo.findOne({
        where: { titleCyrillic: dto.sectionTitle },
      });
      if (!section) {
        nextSectionOrder++;
        section = this.sectionRepo.create({
          titleCyrillic: dto.sectionTitle,
          level: 'A1',
          order: nextSectionOrder,
        });
        await this.sectionRepo.save(section);
      }
      sectionIdsByTitle.set(dto.sectionTitle, section.id);
    }

    for (const dto of units) {
      const { sectionTitle, ...unitData } = dto;
      const sectionId = sectionTitle ? sectionIdsByTitle.get(sectionTitle) : undefined;
      const existing = await this.unitRepo.findOne({
        where: { titleCyrillic: dto.titleCyrillic },
      });
      if (existing) {
        Object.assign(existing, unitData);
        if (sectionId) existing.sectionId = sectionId;
        await this.unitRepo.save(existing);
        updated++;
      } else {
        nextOrder++;
        const unit = this.unitRepo.create({ ...unitData, order: nextOrder, sectionId });
        await this.unitRepo.save(unit);
        created++;
      }
    }
    return { created, updated };
  }

  // ── Sections ───────────────────────────────────────────────

  async listSections(pagination: PaginationDto): Promise<PaginatedResponse<SectionAdminResponseDto>> {
    const { page, limit } = this.getP(pagination);
    const [sections, total] = await this.sectionRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { order: 'ASC' },
    });
    return PaginatedResponse.from(
      sections.map((s) => this.mapSection(s)),
      total,
      page,
      limit,
    );
  }

  async createSection(dto: CreateSectionDto): Promise<SectionAdminResponseDto> {
    const maxOrder = (await this.sectionRepo.find({
      order: { order: 'DESC' },
      select: ['order'],
      take: 1,
    }))[0];
    const section = this.sectionRepo.create({
      ...dto,
      level: dto.level ?? 'A1',
      order: (maxOrder?.order ?? 0) + 1,
    });
    await this.sectionRepo.save(section);
    return this.mapSection(section);
  }

  async getSection(sectionId: string): Promise<SectionAdminResponseDto> {
    const section = await this.sectionRepo.findOne({ where: { id: sectionId } });
    if (!section) throw new NotFoundException('Section not found');

    const units = await this.unitRepo.find({
      where: { sectionId: section.id },
      order: { order: 'ASC' },
    });
    const lessons = units.length
      ? await this.lessonRepo.find({
          where: { unitId: In(units.map((u) => u.id)) },
          order: { order: 'ASC' },
        })
      : [];
    const lessonsByUnit = new Map<string, Lesson[]>();
    for (const lesson of lessons) {
      const unitId = lesson.unitId!;
      if (!lessonsByUnit.has(unitId)) lessonsByUnit.set(unitId, []);
      lessonsByUnit.get(unitId)!.push(lesson);
    }

    return {
      ...this.mapSection(section),
      units: units.map((u) => this.mapUnitWithLessons(u, lessonsByUnit.get(u.id) ?? [])),
    };
  }

  async updateSection(sectionId: string, dto: UpdateSectionDto): Promise<SectionAdminResponseDto> {
    const section = await this.sectionRepo.findOne({ where: { id: sectionId } });
    if (!section) throw new NotFoundException('Section not found');
    Object.assign(section, dto);
    await this.sectionRepo.save(section);
    return this.mapSection(section);
  }

  async deleteSection(
    sectionId: string,
  ): Promise<{ deleted: true; deletedCheckpoints: number; deletedExercises: number }> {
    const section = await this.sectionRepo.findOne({ where: { id: sectionId } });
    if (!section) throw new NotFoundException('Section not found');
    // Checkpoint lessons are owned by the section: the FK cascade removes
    // them, their materialized exercises, and the user answers referencing
    // them, in the same statement. The UI warns before the delete with its
    // confirm dialog; the counters in the response record what was lost for
    // API consumers and logs.
    const checkpoints = await this.lessonRepo.find({
      where: { sectionId, kind: 'checkpoint' },
      select: { id: true },
    });
    const deletedExercises =
      checkpoints.length > 0
        ? await this.exerciseRepo.count({
            where: { lessonId: In(checkpoints.map((l) => l.id)) },
          })
        : 0;
    // Detach units instead of cascading the delete into them.
    await this.unitRepo.update({ sectionId }, { sectionId: null });
    await this.sectionRepo.remove(section);
    return {
      deleted: true,
      deletedCheckpoints: checkpoints.length,
      deletedExercises,
    };
  }

  async bulkCreateSections(dtos: CreateSectionDto[]): Promise<{ created: number; updated: number }> {
    const maxOrder = (await this.sectionRepo.find({
      order: { order: 'DESC' },
      select: ['order'],
      take: 1,
    }))[0];
    let nextOrder = maxOrder?.order ?? 0;
    let created = 0;
    let updated = 0;

    for (const dto of dtos) {
      const existing = await this.sectionRepo.findOne({
        where: { titleCyrillic: dto.titleCyrillic },
      });
      if (existing) {
        Object.assign(existing, dto);
        await this.sectionRepo.save(existing);
        updated++;
      } else {
        nextOrder++;
        const section = this.sectionRepo.create({
          ...dto,
          level: dto.level ?? 'A1',
          order: nextOrder,
        });
        await this.sectionRepo.save(section);
        created++;
      }
    }
    return { created, updated };
  }

  // ── Theory topics ──────────────────────────────────────────

  private mapTheory(t: TheoryTopic): TheoryAdminResponseDto {
    return {
      id: t.id,
      sectionId: t.sectionId,
      sectionTitleCyrillic: t.section?.titleCyrillic ?? '',
      titleCyrillic: t.titleCyrillic,
      titleLatin: t.titleLatin,
      titleTranslationRu: t.titleTranslationRu,
      titleTranslationEn: t.titleTranslationEn,
      payload: t.payload,
      status: t.status,
      order: t.order,
    };
  }

  private async loadTheory(id: string): Promise<TheoryTopic> {
    const topic = await this.theoryRepo.findOne({ where: { id }, relations: { section: true } });
    if (!topic) throw new NotFoundException('Theory topic not found');
    return topic;
  }

  async listTheory(query: ListTheoryQueryDto): Promise<PaginatedResponse<TheoryAdminResponseDto>> {
    const { page, limit } = this.getP(query);
    const [topics, total] = await this.theoryRepo.findAndCount({
      where: query.sectionId ? { sectionId: query.sectionId } : {},
      relations: { section: true },
      order: { section: { order: 'ASC' }, order: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return PaginatedResponse.from(
      topics.map((t) => this.mapTheory(t)),
      total,
      page,
      limit,
    );
  }

  async createTheory(dto: CreateTheoryTopicDto): Promise<TheoryAdminResponseDto> {
    const error = validateTheoryPayload(dto.payload);
    if (error) throw new BadRequestException(`Invalid theory payload: ${error}`);
    const section = await this.sectionRepo.findOne({ where: { id: dto.sectionId } });
    if (!section) throw new NotFoundException('Section not found');
    // Two concurrent creates read the same max(order); the unique index on
    // (sectionId, order) makes the loser fail, so it retries with a fresh max.
    for (let attempt = 0; ; attempt++) {
      const maxOrder = (await this.theoryRepo.find({
        where: { sectionId: dto.sectionId },
        order: { order: 'DESC' },
        select: ['order'],
        take: 1,
      }))[0];
      const topic = this.theoryRepo.create({
        ...dto,
        titleLatin: dto.titleLatin ?? '',
        titleTranslationRu: dto.titleTranslationRu ?? '',
        titleTranslationEn: dto.titleTranslationEn ?? '',
        order: (maxOrder?.order ?? 0) + 1,
      });
      try {
        await this.theoryRepo.save(topic);
        topic.section = section;
        return this.mapTheory(topic);
      } catch (err) {
        if (attempt >= 2 || (err as { code?: string }).code !== '23505') {
          throw err;
        }
      }
    }
  }

  async getTheory(id: string): Promise<TheoryAdminResponseDto> {
    return this.mapTheory(await this.loadTheory(id));
  }

  async updateTheory(id: string, dto: UpdateTheoryTopicDto): Promise<TheoryAdminResponseDto> {
    if (dto.payload) {
      const error = validateTheoryPayload(dto.payload);
      if (error) throw new BadRequestException(`Invalid theory payload: ${error}`);
    }
    const topic = await this.loadTheory(id);
    if (dto.sectionId && dto.sectionId !== topic.sectionId) {
      const section = await this.sectionRepo.findOne({ where: { id: dto.sectionId } });
      if (!section) throw new NotFoundException('Section not found');
      topic.section = section;
    }
    Object.assign(topic, dto);
    await this.theoryRepo.save(topic);
    return this.mapTheory(topic);
  }

  async deleteTheory(id: string): Promise<{ deleted: true }> {
    const topic = await this.loadTheory(id);
    await this.theoryRepo.remove(topic);
    return { deleted: true };
  }

  // Theory is published separately from publishSection's cascade: a topic
  // requires its section to already be PUBLISHED so users never see a topic
  // from an invisible section.
  async publishTheory(id: string): Promise<TheoryAdminResponseDto> {
    const topic = await this.loadTheory(id);
    if (topic.section?.status !== ContentStatus.PUBLISHED) {
      throw new BadRequestException('Сначала опубликуйте главу');
    }
    topic.status = ContentStatus.PUBLISHED;
    await this.theoryRepo.save(topic);
    return this.mapTheory(topic);
  }

  async unpublishTheory(id: string): Promise<TheoryAdminResponseDto> {
    const topic = await this.loadTheory(id);
    topic.status = ContentStatus.DRAFT;
    await this.theoryRepo.save(topic);
    return this.mapTheory(topic);
  }

  /**
   * Publishes each unit's lessons and the units that reached their lesson
   * minimum. Returns per-section counters for the caller to aggregate.
   */
  private async publishSectionUnits(
    section: Section,
    skipped: PublishIssueDto[],
  ): Promise<{ publishedUnits: number; publishedLessons: number; publishedExercises: number }> {
    let publishedUnits = 0;
    let publishedLessons = 0;
    let publishedExercises = 0;

    for (const unit of section.units ?? []) {
      const result = await this.publishUnitLessons(unit.lessons, skipped);
      if (result.publishedLessons === 0) {
        skipped.push({
          kind: 'unit',
          id: unit.id,
          reason: 'min_lessons',
          detail: 'needs at least one published lesson',
        });
        continue;
      }
      unit.status = ContentStatus.PUBLISHED;
      await this.unitRepo.save(unit);
      publishedUnits++;
      publishedLessons += result.publishedLessons;
      publishedExercises += result.publishedExercises;
    }

    return { publishedUnits, publishedLessons, publishedExercises };
  }

  /**
   * Publishes the section's checkpoint when the section has at least one
   * published lesson AND one published exercise (the checkpoint's vocabulary
   * exercises are built from the section's words, which come from its
   * exercises); otherwise it is skipped with a reason.
   */
  private async publishSectionCheckpoint(
    section: Section,
    publishedLessons: number,
    publishedExercises: number,
    skipped: PublishIssueDto[],
  ): Promise<void> {
    const checkpoint = await this.lessonRepo.findOne({
      where: { sectionId: section.id, kind: 'checkpoint' },
      order: { order: 'ASC' },
    });
    if (!checkpoint) return;

    if (publishedLessons > 0 && publishedExercises > 0) {
      if (checkpoint.status !== ContentStatus.PUBLISHED) {
        checkpoint.status = ContentStatus.PUBLISHED;
        await this.lessonRepo.save(checkpoint);
      }
      return;
    }
    skipped.push({
      kind: 'lesson',
      id: checkpoint.id,
      reason: 'checkpoint_not_ready',
      detail: 'needs at least one published lesson and one exercise in the section',
    });
  }

  async publishSection(sectionId: string): Promise<SectionPublishResultDto> {
    const section = await this.sectionRepo.findOne({
      where: { id: sectionId },
      relations: { units: { lessons: { exercises: true } } },
    });
    if (!section) throw new NotFoundException('Section not found');

    const skipped: PublishIssueDto[] = [];
    const { publishedUnits, publishedLessons, publishedExercises } =
      await this.publishSectionUnits(section, skipped);
    await this.publishSectionCheckpoint(section, publishedLessons, publishedExercises, skipped);

    if (publishedUnits === 0) {
      throw new BadRequestException(
        skipped.length
          ? `Section needs at least one published unit (skipped: ${skipped.map((s) => s.id).join(', ')})`
          : 'Section needs at least one published unit',
      );
    }

    section.status = ContentStatus.PUBLISHED;
    await this.sectionRepo.save(section);
    return {
      section: this.mapSection(section),
      publishedUnits,
      publishedLessons,
      publishedExercises,
      skipped,
    };
  }

  async publishAllSections(): Promise<PublishAllResultDto> {
    const sections = await this.sectionRepo.find({
      relations: { units: { lessons: { exercises: true } } },
      order: { order: 'ASC' },
    });

    const skipped: PublishIssueDto[] = [];
    let publishedSections = 0;
    let publishedUnitsTotal = 0;
    let publishedLessonsTotal = 0;
    let publishedExercisesTotal = 0;

    for (const section of sections) {
      // An already-published section is re-processed only when it gained
      // unpublished content (a new draft unit or lesson); a fully published
      // one has nothing to do and would only inflate the counters.
      const hasUnpublished =
        section.status !== ContentStatus.PUBLISHED ||
        (section.units ?? []).some(
          (unit) =>
            unit.status !== ContentStatus.PUBLISHED ||
            unit.lessons.some((lesson) => lesson.status !== ContentStatus.PUBLISHED),
        );
      if (!hasUnpublished) continue;

      const { publishedUnits, publishedLessons, publishedExercises } =
        await this.publishSectionUnits(section, skipped);
      await this.publishSectionCheckpoint(
        section,
        publishedLessons,
        publishedExercises,
        skipped,
      );

      if (publishedUnits === 0) {
        skipped.push({
          kind: 'section',
          id: section.id,
          reason: 'min_lessons',
          detail: 'needs at least one published unit',
        });
        continue;
      }
      section.status = ContentStatus.PUBLISHED;
      await this.sectionRepo.save(section);
      publishedSections++;
      publishedUnitsTotal += publishedUnits;
      publishedLessonsTotal += publishedLessons;
      publishedExercisesTotal += publishedExercises;
    }

    return {
      published: {
        units: publishedUnitsTotal,
        sections: publishedSections,
        lessons: publishedLessonsTotal,
        exercises: publishedExercisesTotal,
      },
      skipped,
    };
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

  async bulkCreateLessons(
    lessons: {
      unitId?: string;
      sectionId?: string;
      sectionTitle?: string;
      kind?: string;
      title: string;
      titleLatin?: string;
      titleTranslationRu?: string;
      titleTranslationEn?: string;
      descriptionRu?: string;
      descriptionEn?: string;
      minExercises?: number;
      xpReward?: number;
    }[],
  ): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    const checkpointRows: typeof lessons = [];
    const regularRows: typeof lessons = [];
    const unitlessRegular: typeof lessons = [];
    for (const l of lessons) {
      if (l.kind === 'checkpoint') checkpointRows.push(l);
      else if (l.unitId) regularRows.push(l);
      else unitlessRegular.push(l);
    }
    if (unitlessRegular.length > 0) {
      throw new BadRequestException(
        `Regular lessons need a unitId: ${unitlessRegular.map((l) => l.title).join(', ')}`,
      );
    }

    // Regular lessons: group by unitId to assign order.
    const byUnit = new Map<string, typeof regularRows>();
    for (const dto of regularRows) {
      if (!byUnit.has(dto.unitId!)) byUnit.set(dto.unitId!, []);
      byUnit.get(dto.unitId!)!.push(dto);
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

    // Checkpoint lessons: one per section, resolved by id or titleCyrillic
    // (auto-created, so the CSV cycle passes even without sections.csv).
    for (const dto of checkpointRows) {
      const sectionId = await this.resolveSectionForBulk(dto.sectionId, dto.sectionTitle);

      const existing = await this.lessonRepo.findOne({
        where: { sectionId, kind: 'checkpoint' },
      });
      if (existing) {
        Object.assign(existing, {
          title: dto.title,
          titleLatin: dto.titleLatin ?? existing.titleLatin,
          titleTranslationRu: dto.titleTranslationRu ?? existing.titleTranslationRu,
          titleTranslationEn: dto.titleTranslationEn ?? existing.titleTranslationEn,
          xpReward: dto.xpReward ?? existing.xpReward,
        });
        await this.lessonRepo.save(existing);
        updated++;
        continue;
      }

      const maxOrderRow = await this.lessonRepo
        .createQueryBuilder('l')
        .leftJoin('l.unit', 'u')
        .select('COALESCE(MAX(l.order), 0)', 'max')
        .where('(l.sectionId = :sectionId OR u.sectionId = :sectionId)', { sectionId })
        .getRawOne();
      const lesson = this.lessonRepo.create({
        unitId: null,
        sectionId,
        kind: 'checkpoint',
        title: dto.title,
        titleLatin: dto.titleLatin ?? '',
        titleTranslationRu: dto.titleTranslationRu ?? '',
        titleTranslationEn: dto.titleTranslationEn ?? '',
        descriptionRu: dto.descriptionRu ?? '',
        descriptionEn: dto.descriptionEn ?? '',
        minExercises: dto.minExercises ?? 5,
        order: Number(maxOrderRow?.max ?? 0) + 1,
        xpReward: dto.xpReward ?? 10,
      });
      await this.lessonRepo.save(lesson);
      created++;
    }

    return { created, updated };
  }

  private async resolveSectionForBulk(
    sectionId: string | undefined,
    sectionTitle: string | undefined,
  ): Promise<string> {
    if (sectionId) {
      const section = await this.sectionRepo.findOne({ where: { id: sectionId } });
      if (!section) throw new NotFoundException(`Section ${sectionId} not found`);
      return section.id;
    }
    if (sectionTitle) {
      let section = await this.sectionRepo.findOne({
        where: { titleCyrillic: sectionTitle },
      });
      if (!section) {
        const maxOrder = (await this.sectionRepo.find({
          order: { order: 'DESC' },
          select: ['order'],
          take: 1,
        }))[0];
        section = this.sectionRepo.create({
          titleCyrillic: sectionTitle,
          level: 'A1',
          order: (maxOrder?.order ?? 0) + 1,
        });
        await this.sectionRepo.save(section);
      }
      return section.id;
    }
    throw new BadRequestException('Checkpoint lesson needs a section (sectionId or sectionTitle)');
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
      // Checkpoint exercises belong to lessons without a unit — must not drop them.
      .leftJoin('lesson.unit', 'unit')
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

  async publishLesson(lessonId: string): Promise<LessonPublishResultDto> {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId },
      relations: { exercises: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const skipped: PublishIssueDto[] = [];
    const publishedExercises = await this.publishLessonExercises(lesson, skipped);

    if (publishedExercises < lesson.minExercises) {
      const skippedIds = skipped.length
        ? ` (skipped: ${skipped.map((s) => s.id).join(', ')})`
        : '';
      throw new BadRequestException(
        `Lesson needs at least ${lesson.minExercises} published exercises, has ${publishedExercises}${skippedIds}`,
      );
    }

    lesson.status = ContentStatus.PUBLISHED;
    await this.lessonRepo.save(lesson);
    return { lesson: this.mapLesson(lesson), publishedExercises, skipped };
  }

  async unpublishLesson(lessonId: string): Promise<LessonAdminResponseDto> {
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    lesson.status = ContentStatus.DRAFT;
    await this.lessonRepo.save(lesson);
    return this.mapLesson(lesson);
  }

  async publishUnit(unitId: string): Promise<UnitPublishResultDto> {
    const unit = await this.unitRepo.findOne({
      where: { id: unitId },
      relations: { lessons: { exercises: true } },
    });
    if (!unit) throw new NotFoundException('Unit not found');

    const skipped: PublishIssueDto[] = [];
    const { publishedLessons, publishedExercises } = await this.publishUnitLessons(
      unit.lessons,
      skipped,
    );

    if (publishedLessons === 0) {
      throw new BadRequestException('Unit needs at least one published lesson');
    }
    unit.status = ContentStatus.PUBLISHED;
    await this.unitRepo.save(unit);
    return {
      unit: this.mapUnitWithLessons(unit, unit.lessons),
      publishedLessons,
      publishedExercises,
      skipped,
    };
  }

  // Legacy pre-sections endpoint kept for the units-page button. Visibility
  // on clients is governed by section status, so publishing units alone
  // cannot make content visible — delegate to the section-aware flow.
  async publishAllUnits(): Promise<PublishAllResultDto> {
    return this.publishAllSections();
  }

  async publishAllWords(): Promise<PublishWordsResultDto> {
    const result = await this.wordRepo
      .createQueryBuilder()
      .update(Word)
      .set({ status: ContentStatus.PUBLISHED })
      .where('status = :status', { status: ContentStatus.DRAFT })
      .execute();
    return { published: result.affected ?? 0 };
  }

  /// Best-effort: publishes every valid draft exercise of a lesson, records
  /// validation failures in `skipped`. Returns the total count now published.
  private async publishLessonExercises(
    lesson: Lesson,
    skipped: PublishIssueDto[],
  ): Promise<number> {
    let published = 0;
    for (const exercise of lesson.exercises) {
      if (exercise.status === ContentStatus.PUBLISHED) {
        published++;
        continue;
      }
      const issues = validateExercisePayload(exercise.type, exercise.payload);
      if (issues.length > 0) {
        skipped.push({
          kind: 'exercise',
          id: exercise.id,
          reason: 'validation',
          detail: issues.map((i) => `${i.field}: ${i.message}`).join('; '),
        });
        continue;
      }
      exercise.status = ContentStatus.PUBLISHED;
      await this.exerciseRepo.save(exercise);
      published++;
    }
    return published;
  }

  /// Cascades `publishLessonExercises` into every lesson of a unit, publishing
  /// each lesson that reaches its exercise minimum. Mutates `skipped` in place.
  private async publishUnitLessons(
    lessons: Lesson[],
    skipped: PublishIssueDto[],
  ): Promise<{ publishedLessons: number; publishedExercises: number }> {
    let publishedLessons = 0;
    let publishedExercises = 0;
    for (const lesson of lessons) {
      if (lesson.status === ContentStatus.PUBLISHED) {
        publishedLessons++;
        continue;
      }
      const lessonExercises = await this.publishLessonExercises(lesson, skipped);
      publishedExercises += lessonExercises;
      if (lessonExercises < lesson.minExercises) {
        skipped.push({
          kind: 'lesson',
          id: lesson.id,
          reason: 'min_exercises',
          detail: `needs at least ${lesson.minExercises} published exercises, has ${lessonExercises}`,
        });
        continue;
      }
      lesson.status = ContentStatus.PUBLISHED;
      await this.lessonRepo.save(lesson);
      publishedLessons++;
    }
    return { publishedLessons, publishedExercises };
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
    const issues = validateExercisePayload(type, dto.payload);
    if (issues.length > 0) {
      throw new BadRequestException({
        message: 'Exercise payload has validation issues',
        issues,
      });
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

    // Only re-validate when the payload-relevant fields changed, so legacy
    // broken exercises stay editable (order/status fixes still go through).
    if (dto.type !== undefined || dto.payload !== undefined) {
      const issues = validateExercisePayload(exercise.type, exercise.payload);
      if (issues.length > 0) {
        throw new BadRequestException({
          message: 'Exercise payload has validation issues',
          issues,
        });
      }
    }

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
    // Validate the whole batch before touching the DB — a single bad row
    // rejects the entire import, with its (1-based) row number in the list.
    const validationErrors: Array<{ row: number; issues: ValidationIssue[] }> = [];
    exercises.forEach((dto, index) => {
      const type = (dto.type ?? 'translation_choice') as ExerciseType;
      const issues: ValidationIssue[] = [];
      if (!getExerciseTypeDefinition(type)) {
        issues.push({ field: 'type', message: `unknown exercise type: ${type}` });
      }
      if (typeof dto.payload !== 'object' || dto.payload === null) {
        issues.push({ field: 'payload', message: 'payload must be an object' });
      } else {
        issues.push(...validateExercisePayload(type, dto.payload));
      }
      if (issues.length > 0) validationErrors.push({ row: index + 1, issues });
    });
    if (validationErrors.length > 0) {
      throw new BadRequestException({
        message: 'Bulk import rejected: some rows have validation issues',
        rows: validationErrors,
      });
    }

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

  private mapSection(s: Section): SectionAdminResponseDto {
    return {
      id: s.id,
      titleCyrillic: s.titleCyrillic,
      titleLatin: s.titleLatin,
      titleTranslationRu: s.titleTranslationRu,
      titleTranslationEn: s.titleTranslationEn,
      level: s.level,
      status: s.status,
      order: s.order,
    };
  }

  private mapUnit(u: Unit): UnitAdminResponseDto {
    return {
      id: u.id,
      sectionId: u.sectionId,
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
      sectionId: l.sectionId,
      kind: l.kind,
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
