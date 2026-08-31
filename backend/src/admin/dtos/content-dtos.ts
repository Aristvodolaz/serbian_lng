import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsObject, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ContentStatus } from '../../common/enums/content-status.enum';
import { EXERCISE_TYPES, ValidationIssue } from '../../content/exercise-types';
import { WordAttributeOption } from '../word-attributes';
import { PaginationDto } from './pagination.dto';

// ── Exercise payload / validation ─────────────────────────────

export class ValidationIssueDto implements ValidationIssue {
  @ApiProperty() field: string;
  @ApiProperty() message: string;
}

export class ExerciseAdminResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ enum: EXERCISE_TYPES }) type: string;
  @ApiProperty({ enum: ContentStatus }) status: ContentStatus;
  @ApiProperty() order: number;
  @ApiProperty({ description: 'Admin payload — includes wordId refs and correctAnswerId' })
  payload: Record<string, unknown>;
  @ApiProperty({ type: [ValidationIssueDto] })
  validationIssues: ValidationIssue[];
}

export class ExerciseTemplateResponseDto {
  @ApiProperty({ enum: EXERCISE_TYPES }) type: string;
  @ApiProperty() label: string;
  @ApiProperty() description: string;
}

export class AdminExerciseListItemDto {
  @ApiProperty() id: string;
  @ApiProperty() lessonId: string;
  @ApiProperty() unitId: string;
  @ApiProperty({ enum: EXERCISE_TYPES }) type: string;
  @ApiProperty({ enum: ContentStatus }) status: ContentStatus;
  @ApiProperty() order: number;
  @ApiProperty() preview: string;
  @ApiProperty({ description: 'Number of distinct dictionary words the payload references' })
  linkedWordCount: number;
  @ApiProperty({ type: [ValidationIssueDto] })
  validationIssues: ValidationIssue[];
}

export class ListExercisesQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiPropertyOptional({ enum: EXERCISE_TYPES })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateExerciseDto {
  @ApiProperty({ enum: EXERCISE_TYPES, required: false })
  @IsOptional()
  type?: string;

  @ApiProperty({ description: 'Type-specific payload, validated against the exercise type registry' })
  @IsObject()
  payload: Record<string, unknown>;
}

export class UpdateExerciseDto {
  @ApiPropertyOptional({ enum: EXERCISE_TYPES })
  @IsOptional()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  status?: ContentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  order?: number;
}

// ── Lesson DTOs ───────────────────────────────────────────────

export class LessonAdminResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() unitId: string;
  @ApiProperty() title: string;
  @ApiProperty() titleLatin: string;
  @ApiProperty() titleTranslationRu: string;
  @ApiProperty() titleTranslationEn: string;
  @ApiProperty() descriptionRu: string;
  @ApiProperty() descriptionEn: string;
  @ApiProperty() minExercises: number;
  @ApiProperty({ enum: ContentStatus }) status: ContentStatus;
  @ApiProperty() order: number;
  @ApiProperty() xpReward: number;
  @ApiProperty({ type: [ExerciseAdminResponseDto], required: false })
  exercises?: ExerciseAdminResponseDto[];
}

export class CreateLessonDto {
  @ApiProperty()
  @IsString()
  unitId: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  titleLatin: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  titleTranslationRu: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  titleTranslationEn: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionRu?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minExercises?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  xpReward?: number;
}

export class UpdateLessonDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  titleLatin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  titleTranslationRu?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  titleTranslationEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionRu?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minExercises?: number;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  status?: ContentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  xpReward?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  order?: number;
}

// ── Unit DTOs ─────────────────────────────────────────────────

export class UnitAdminResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() titleCyrillic: string;
  @ApiProperty() titleLatin: string;
  @ApiProperty() titleTranslationRu: string;
  @ApiProperty() titleTranslationEn: string;
  @ApiProperty({ enum: ContentStatus }) status: ContentStatus;
  @ApiProperty({ nullable: true }) icon: string | null;
  @ApiProperty() order: number;
  @ApiProperty({ type: [LessonAdminResponseDto], required: false })
  lessons?: LessonAdminResponseDto[];
}

export class CreateUnitDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  titleCyrillic: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleLatin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleTranslationRu?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleTranslationEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;
}

export class UpdateUnitDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  titleCyrillic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  titleLatin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  titleTranslationRu?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  titleTranslationEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  status?: ContentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  order?: number;
}

// ── Word DTOs ─────────────────────────────────────────────────

export class WordAdminResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() cyrillic: string;
  @ApiProperty() latin: string;
  @ApiProperty() translationRu: string;
  @ApiProperty() translationEn: string;
  @ApiProperty({ nullable: true }) exampleCyrillic: string | null;
  @ApiProperty({ nullable: true }) exampleTranslationRu: string | null;
  @ApiProperty({ nullable: true }) exampleTranslationEn: string | null;
  @ApiProperty({ nullable: true }) audioUrl: string | null;
  @ApiProperty({ nullable: true }) partOfSpeech: string | null;
  @ApiProperty({ nullable: true }) gender: string | null;
  @ApiProperty({ nullable: true }) number: string | null;
  @ApiProperty({ nullable: true }) declension: string | null;
  @ApiProperty({ nullable: true }) conjugation: string | null;
  @ApiProperty({ nullable: true }) imageUrl: string | null;
  @ApiProperty({ enum: ContentStatus }) status: ContentStatus;
}

export class CreateWordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  cyrillic: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  latin: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  translationRu: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  translationEn: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exampleCyrillic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exampleTranslationRu?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exampleTranslationEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  partOfSpeech?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declension?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  conjugation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateWordDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  cyrillic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  latin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  translationRu?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  translationEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exampleCyrillic?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exampleTranslationRu?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exampleTranslationEn?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  audioUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  partOfSpeech?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  number?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declension?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  conjugation?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  status?: ContentStatus;
}

// ── Word attribute dictionary ────────────────────────────────

export class WordAttributeOptionDto implements WordAttributeOption {
  @ApiProperty() value: string;
  @ApiProperty() ru: string;
  @ApiProperty() en: string;
}

export class WordAttributesResponseDto {
  @ApiProperty({ type: [WordAttributeOptionDto] })
  partOfSpeech: WordAttributeOption[];
  @ApiProperty({ type: [WordAttributeOptionDto] })
  gender: WordAttributeOption[];
  @ApiProperty({ type: [WordAttributeOptionDto] })
  number: WordAttributeOption[];
  @ApiProperty({ type: [WordAttributeOptionDto] })
  declension: WordAttributeOption[];
  @ApiProperty({ type: [WordAttributeOptionDto] })
  conjugation: WordAttributeOption[];
}

// ── Bulk DTOs ─────────────────────────────────────────────────

export class BulkCreateUnitDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  titleCyrillic: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleLatin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleTranslationRu?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleTranslationEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;
}

export class BulkCreateLessonDto {
  @ApiProperty()
  @IsString()
  unitId: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleLatin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleTranslationRu?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleTranslationEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  xpReward?: number;
}

export class BulkCreateExerciseDto {
  @ApiProperty()
  @IsString()
  lessonId: string;

  @ApiProperty({ enum: EXERCISE_TYPES, required: false })
  @IsOptional()
  type?: string;

  @ApiProperty()
  @IsObject()
  payload: Record<string, unknown>;
}

// ── Badge DTOs ────────────────────────────────────────────────

export class BadgeAdminResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() code: string;
  @ApiProperty() titleCyrillic: string;
  @ApiProperty() titleLatin: string;
  @ApiProperty() description: string;
}

export class BadgeEarnerResponseDto {
  @ApiProperty() userId: string;
  @ApiProperty() email: string;
  @ApiProperty() displayName: string;
  @ApiProperty() earnedAt: Date;
}

export class CreateBadgeDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  code: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  titleCyrillic: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  titleLatin: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  description: string;
}

export class UpdateBadgeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  titleCyrillic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  titleLatin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;
}

// ── Analytics DTOs ────────────────────────────────────────────

export class UserGrowthDataDto {
  @ApiProperty() day: string;
  @ApiProperty() count: number;
}

export class ActivityHeatmapDto {
  @ApiProperty() day: string;
  @ApiProperty() hour: number;
  @ApiProperty() count: number;
}

export class LessonCompletionDto {
  @ApiProperty() lessonId: string;
  @ApiProperty() title: string;
  @ApiProperty() completionCount: number;
  @ApiProperty() uniqueUsers: number;
  @ApiProperty() completionRate: number;
}

// ── Publish results ────────────────────────────────────────────

export class PublishIssueDto {
  @ApiProperty({ enum: ['unit', 'lesson', 'exercise', 'word'] })
  kind: 'unit' | 'lesson' | 'exercise' | 'word';
  @ApiProperty() id: string;
  @ApiProperty({ enum: ['validation', 'min_exercises', 'min_lessons'] }) reason: string;
  @ApiProperty({ required: false }) detail?: string;
}

export class LessonPublishResultDto {
  @ApiProperty({ type: LessonAdminResponseDto }) lesson: LessonAdminResponseDto;
  @ApiProperty() publishedExercises: number;
  @ApiProperty({ type: [PublishIssueDto] }) skipped: PublishIssueDto[];
}

export class UnitPublishResultDto {
  @ApiProperty({ type: UnitAdminResponseDto }) unit: UnitAdminResponseDto;
  @ApiProperty() publishedLessons: number;
  @ApiProperty() publishedExercises: number;
  @ApiProperty({ type: [PublishIssueDto] }) skipped: PublishIssueDto[];
}

export class PublishAllResultDto {
  @ApiProperty({
    type: 'object',
    properties: {
      units: { type: 'number' },
      lessons: { type: 'number' },
      exercises: { type: 'number' },
    },
  })
  published: { units: number; lessons: number; exercises: number };
  @ApiProperty({ type: [PublishIssueDto] }) skipped: PublishIssueDto[];
}

export class PublishWordsResultDto {
  @ApiProperty() published: number;
}
