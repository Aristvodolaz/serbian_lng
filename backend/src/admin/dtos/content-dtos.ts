import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ExerciseType } from '../../content/entities/exercise.entity';

// Exercise Choice DTOs
export class ExerciseChoiceAdminResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() text: string;
  @ApiProperty() textRu: string;
  @ApiProperty() isCorrect: boolean;
  @ApiProperty() order: number;
}

export class CreateExerciseChoiceDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  text: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  textRu: string;

  @ApiProperty()
  @IsBoolean()
  isCorrect: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  order?: number;
}

export class UpdateExerciseChoiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  text?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  textRu?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  order?: number;
}

// Exercise DTOs
export class ExerciseAdminResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ enum: ExerciseType }) type: ExerciseType;
  @ApiProperty() promptCyrillic: string;
  @ApiProperty() promptLatin: string;
  @ApiProperty() promptTranslationRu: string;
  @ApiProperty() promptTranslationEn: string;
  @ApiProperty() order: number;
  @ApiProperty({ type: [ExerciseChoiceAdminResponseDto] }) choices: ExerciseChoiceAdminResponseDto[];
}

export class CreateExerciseDto {
  @ApiProperty({ enum: ExerciseType, required: false })
  @IsOptional()
  type?: ExerciseType;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  promptCyrillic: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  promptLatin: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  promptTranslationRu: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  promptTranslationEn: string;

  @ApiProperty()
  @IsArray()
  @IsArray()
  choices: CreateExerciseChoiceDto[];
}

export class BulkCreateExerciseDto {
  @ApiProperty()
  @IsString()
  lessonId: string;

  @ApiProperty({ enum: ExerciseType, required: false })
  @IsOptional()
  type?: ExerciseType;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  promptCyrillic: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  promptLatin: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  promptTranslationRu: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  promptTranslationEn: string;

  @ApiProperty()
  @IsArray()
  choices: CreateExerciseChoiceDto[];
}

export class UpdateExerciseDto {
  @ApiPropertyOptional({ enum: ExerciseType })
  @IsOptional()
  type?: ExerciseType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  promptCyrillic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  promptLatin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  promptTranslationRu?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  promptTranslationEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  choices?: CreateExerciseChoiceDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  order?: number;
}

// Lesson DTOs
export class LessonAdminResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() unitId: string;
  @ApiProperty() title: string;
  @ApiProperty() titleLatin: string;
  @ApiProperty() titleTranslationRu: string;
  @ApiProperty() titleTranslationEn: string;
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

// Unit DTOs
export class UnitAdminResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() titleCyrillic: string;
  @ApiProperty() titleLatin: string;
  @ApiProperty() titleTranslationRu: string;
  @ApiProperty() titleTranslationEn: string;
  @ApiProperty() order: number;
  @ApiProperty({ type: [LessonAdminResponseDto], required: false })
  lessons?: LessonAdminResponseDto[];
}

export class CreateUnitDto {
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
  titleTranslationRu: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  titleTranslationEn: string;
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
  @IsInt()
  @Min(1)
  @Type(() => Number)
  order?: number;
}

// Word DTOs
export class WordAdminResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ nullable: true }) unitId: string | null;
  @ApiProperty() cyrillic: string;
  @ApiProperty() latin: string;
  @ApiProperty() translationRu: string;
  @ApiProperty() translationEn: string;
  @ApiProperty({ nullable: true }) exampleCyrillic: string | null;
  @ApiProperty({ nullable: true }) exampleTranslationRu: string | null;
  @ApiProperty({ nullable: true }) exampleTranslationEn: string | null;
  @ApiProperty({ nullable: true }) audioUrl: string | null;
}

export class CreateWordDto {
  @ApiProperty({ required: false })
  @IsOptional()
  unitId?: string;

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
}

export class UpdateWordDto {
  @ApiPropertyOptional({ required: false })
  @IsOptional()
  unitId?: string | null;

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
}

// Bulk DTOs
export class BulkCreateUnitDto {
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
  titleTranslationRu: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  titleTranslationEn: string;
}

export class BulkCreateLessonDto {
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
  @IsInt()
  @Min(1)
  @Type(() => Number)
  xpReward?: number;
}

export class BulkCreateExerciseDto {
  @ApiProperty()
  @IsString()
  lessonId: string;

  @ApiProperty({ enum: ExerciseType, required: false })
  @IsOptional()
  type?: ExerciseType;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  promptCyrillic: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  promptLatin: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  promptTranslationRu: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  promptTranslationEn: string;

  @ApiProperty({ type: [CreateExerciseChoiceDto] })
  @IsArray()
  choices: CreateExerciseChoiceDto[];
}

// Badge DTOs
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

// Analytics DTOs
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
