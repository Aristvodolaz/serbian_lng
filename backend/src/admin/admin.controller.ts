import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { AdminGuard } from '../common/guards/admin.guard';
import { AdminService } from './admin.service';
import { PaginationDto, PaginatedResponse } from './dtos/pagination.dto';
import {
  AdminUserDetailResponseDto,
  AdminUserListResponseDto,
  UpdateAdminUserDto,
} from './dtos/admin-user-response.dto';
import { DashboardStatsResponseDto } from './dtos/dashboard-stats-response.dto';
import {
  BadgeAdminResponseDto,
  BadgeEarnerResponseDto,
  BulkCreateExerciseDto,
  CreateBadgeDto,
  CreateExerciseChoiceDto,
  CreateExerciseDto,
  CreateLessonDto,
  CreateUnitDto,
  CreateWordDto,
  ExerciseAdminResponseDto,
  ExerciseChoiceAdminResponseDto,
  LessonAdminResponseDto,
  UnitAdminResponseDto,
  UpdateBadgeDto,
  UpdateExerciseDto,
  UpdateLessonDto,
  UpdateUnitDto,
  UpdateWordDto,
  WordAdminResponseDto,
} from './dtos/content-dtos';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Dashboard ──────────────────────────────────────────────

  @Get('dashboard')
  @ApiOkResponse({ type: DashboardStatsResponseDto })
  getDashboardStats(): Promise<DashboardStatsResponseDto> {
    return this.adminService.getDashboardStats();
  }

  // ── Users ──────────────────────────────────────────────────

  @Get('users')
  @ApiOkResponse({ type: PaginatedResponse, isArray: true })
  listUsers(@Query() pagination: PaginationDto): Promise<PaginatedResponse<AdminUserListResponseDto>> {
    return this.adminService.listUsers(pagination);
  }

  @Get('users/:id')
  @ApiOkResponse({ type: AdminUserDetailResponseDto })
  getUserDetail(
    @Param('id', ParseUUIDPipe) userId: string,
  ): Promise<AdminUserDetailResponseDto> {
    return this.adminService.getUserDetail(userId);
  }

  @Patch('users/:id')
  @ApiOkResponse({ type: AdminUserListResponseDto })
  updateUser(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateAdminUserDto,
  ): Promise<AdminUserListResponseDto> {
    return this.adminService.updateUser(userId, dto);
  }

  @Delete('users/:id')
  deleteUser(
    @Param('id', ParseUUIDPipe) userId: string,
  ): Promise<{ deleted: true }> {
    return this.adminService.deleteUser(userId);
  }

  // ── Units ──────────────────────────────────────────────────

  @Get('units')
  @ApiOkResponse({ type: PaginatedResponse })
  listUnits(@Query() pagination: PaginationDto): Promise<PaginatedResponse<UnitAdminResponseDto>> {
    return this.adminService.listUnits(pagination);
  }

  @Post('units')
  @ApiOkResponse({ type: UnitAdminResponseDto })
  createUnit(@Body() dto: CreateUnitDto): Promise<UnitAdminResponseDto> {
    return this.adminService.createUnit(dto);
  }

  @Get('units/:id')
  @ApiOkResponse({ type: UnitAdminResponseDto })
  getUnit(
    @Param('id', ParseUUIDPipe) unitId: string,
  ): Promise<UnitAdminResponseDto> {
    return this.adminService.getUnit(unitId);
  }

  @Patch('units/:id')
  @ApiOkResponse({ type: UnitAdminResponseDto })
  updateUnit(
    @Param('id', ParseUUIDPipe) unitId: string,
    @Body() dto: UpdateUnitDto,
  ): Promise<UnitAdminResponseDto> {
    return this.adminService.updateUnit(unitId, dto);
  }

  @Delete('units/:id')
  deleteUnit(
    @Param('id', ParseUUIDPipe) unitId: string,
  ): Promise<{ deleted: true }> {
    return this.adminService.deleteUnit(unitId);
  }

  @Post('units/bulk')
  bulkCreateUnits(
    @Body() dto: { units: CreateUnitDto[] },
  ): Promise<{ created: number; updated: number }> {
    return this.adminService.bulkCreateUnits(dto.units);
  }

  // ── Lessons ────────────────────────────────────────────────

  @Get('lessons')
  @ApiOkResponse({ type: PaginatedResponse })
  listLessons(
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResponse<LessonAdminResponseDto>> {
    return this.adminService.listLessons(pagination);
  }

  @Post('lessons')
  @ApiOkResponse({ type: LessonAdminResponseDto })
  createLesson(@Body() dto: CreateLessonDto): Promise<LessonAdminResponseDto> {
    return this.adminService.createLesson(dto);
  }

  @Get('lessons/:id')
  @ApiOkResponse({ type: LessonAdminResponseDto })
  getLesson(
    @Param('id', ParseUUIDPipe) lessonId: string,
  ): Promise<LessonAdminResponseDto> {
    return this.adminService.getLesson(lessonId);
  }

  @Patch('lessons/:id')
  @ApiOkResponse({ type: LessonAdminResponseDto })
  updateLesson(
    @Param('id', ParseUUIDPipe) lessonId: string,
    @Body() dto: UpdateLessonDto,
  ): Promise<LessonAdminResponseDto> {
    return this.adminService.updateLesson(lessonId, dto);
  }

  @Delete('lessons/:id')
  deleteLesson(
    @Param('id', ParseUUIDPipe) lessonId: string,
  ): Promise<{ deleted: true }> {
    return this.adminService.deleteLesson(lessonId);
  }

  @Post('lessons/bulk')
  bulkCreateLessons(
    @Body() dto: { lessons: CreateLessonDto[] },
  ): Promise<{ created: number; updated: number }> {
    return this.adminService.bulkCreateLessons(dto.lessons);
  }

  // ── Exercises ──────────────────────────────────────────────

  @Post('lessons/:lessonId/exercises')
  @ApiOkResponse({ type: ExerciseAdminResponseDto })
  createExercise(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: CreateExerciseDto,
  ): Promise<ExerciseAdminResponseDto> {
    return this.adminService.createExercise(lessonId, dto);
  }

  @Patch('exercises/:id')
  @ApiOkResponse({ type: ExerciseAdminResponseDto })
  updateExercise(
    @Param('id', ParseUUIDPipe) exerciseId: string,
    @Body() dto: UpdateExerciseDto,
  ): Promise<ExerciseAdminResponseDto> {
    return this.adminService.updateExercise(exerciseId, dto);
  }

  @Delete('exercises/:id')
  deleteExercise(
    @Param('id', ParseUUIDPipe) exerciseId: string,
  ): Promise<{ deleted: true }> {
    return this.adminService.deleteExercise(exerciseId);
  }

  @Post('exercises/bulk')
  bulkCreateExercises(
    @Body() dto: { exercises: BulkCreateExerciseDto[] },
  ): Promise<{ created: number; updated: number }> {
    return this.adminService.bulkCreateExercises(dto.exercises);
  }

  // ── Exercise Choices ───────────────────────────────────────

  @Post('exercises/:exerciseId/choices')
  @ApiOkResponse({ type: ExerciseChoiceAdminResponseDto })
  createChoice(
    @Param('exerciseId', ParseUUIDPipe) exerciseId: string,
    @Body() dto: CreateExerciseChoiceDto,
  ): Promise<ExerciseChoiceAdminResponseDto> {
    return this.adminService.createChoice(exerciseId, dto);
  }

  @Patch('exercise-choices/:id')
  @ApiOkResponse({ type: ExerciseChoiceAdminResponseDto })
  updateChoice(
    @Param('id', ParseUUIDPipe) choiceId: string,
    @Body() dto: Partial<CreateExerciseChoiceDto>,
  ): Promise<ExerciseChoiceAdminResponseDto> {
    return this.adminService.updateChoice(choiceId, dto);
  }

  @Delete('exercise-choices/:id')
  deleteChoice(
    @Param('id', ParseUUIDPipe) choiceId: string,
  ): Promise<{ deleted: true }> {
    return this.adminService.deleteChoice(choiceId);
  }

  // ── Words ──────────────────────────────────────────────────

  @Get('words')
  @ApiOkResponse({ type: PaginatedResponse })
  @ApiQuery({ name: 'unitId', required: false })
  listWords(
    @Query() pagination: PaginationDto,
    @Query('unitId') unitId?: string,
  ): Promise<PaginatedResponse<WordAdminResponseDto>> {
    return this.adminService.listWords(pagination, unitId);
  }

  @Post('words')
  @ApiOkResponse({ type: WordAdminResponseDto })
  createWord(@Body() dto: CreateWordDto): Promise<WordAdminResponseDto> {
    return this.adminService.createWord(dto);
  }

  @Post('words/bulk')
  bulkCreateWords(
    @Body() dto: { words: CreateWordDto[] },
  ): Promise<{ created: number; updated: number }> {
    return this.adminService.bulkCreateWords(dto.words);
  }

  @Get('words/:id')
  @ApiOkResponse({ type: WordAdminResponseDto })
  getWord(
    @Param('id', ParseUUIDPipe) wordId: string,
  ): Promise<WordAdminResponseDto> {
    return this.adminService.getWord(wordId);
  }

  @Patch('words/:id')
  @ApiOkResponse({ type: WordAdminResponseDto })
  updateWord(
    @Param('id', ParseUUIDPipe) wordId: string,
    @Body() dto: UpdateWordDto,
  ): Promise<WordAdminResponseDto> {
    return this.adminService.updateWord(wordId, dto);
  }

  @Delete('words/:id')
  deleteWord(
    @Param('id', ParseUUIDPipe) wordId: string,
  ): Promise<{ deleted: true }> {
    return this.adminService.deleteWord(wordId);
  }

  // ── Badges ─────────────────────────────────────────────────

  @Get('badges')
  @ApiOkResponse({ type: BadgeAdminResponseDto, isArray: true })
  listBadges(): Promise<BadgeAdminResponseDto[]> {
    return this.adminService.listBadges();
  }

  @Post('badges')
  @ApiOkResponse({ type: BadgeAdminResponseDto })
  createBadge(@Body() dto: CreateBadgeDto): Promise<BadgeAdminResponseDto> {
    return this.adminService.createBadge(dto);
  }

  @Patch('badges/:id')
  @ApiOkResponse({ type: BadgeAdminResponseDto })
  updateBadge(
    @Param('id', ParseUUIDPipe) badgeId: string,
    @Body() dto: UpdateBadgeDto,
  ): Promise<BadgeAdminResponseDto> {
    return this.adminService.updateBadge(badgeId, dto);
  }

  @Delete('badges/:id')
  deleteBadge(
    @Param('id', ParseUUIDPipe) badgeId: string,
  ): Promise<{ deleted: true }> {
    return this.adminService.deleteBadge(badgeId);
  }

  @Get('badges/:id/earners')
  @ApiOkResponse({ type: PaginatedResponse })
  getBadgeEarnerList(
    @Param('id', ParseUUIDPipe) badgeId: string,
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResponse<BadgeEarnerResponseDto>> {
    return this.adminService.getBadgeEarnerList(badgeId, pagination);
  }

  // ── Analytics ──────────────────────────────────────────────

  @Get('analytics/user-growth')
  @ApiQuery({ name: 'days', required: false, example: 30 })
  getUserGrowth(
    @Query('days') days?: string,
  ): Promise<any[]> {
    return this.adminService.getUserGrowth(parseInt(days || '30'));
  }

  @Get('analytics/activity-heatmap')
  @ApiQuery({ name: 'days', required: false, example: 90 })
  getActivityHeatmap(
    @Query('days') days?: string,
  ): Promise<any[]> {
    return this.adminService.getActivityHeatmap(parseInt(days || '90'));
  }

  @Get('analytics/lesson-completion')
  getLessonCompletion(): Promise<any[]> {
    return this.adminService.getLessonCompletion();
  }
}
