import { ApiProperty } from '@nestjs/swagger';
import { ExerciseType } from '../entities/exercise.entity';

export class ExerciseChoicePublicDto {
  @ApiProperty() id: string;
  @ApiProperty() text: string;
  @ApiProperty() textRu: string;
  // Deliberately no `isCorrect` — that would leak the answer before the
  // learner submits one. See AnswerResultResponseDto for the reveal.
}

export class ExercisePublicDto {
  @ApiProperty() id: string;
  @ApiProperty({ enum: ExerciseType }) type: ExerciseType;
  @ApiProperty() promptCyrillic: string;
  @ApiProperty() promptLatin: string;
  @ApiProperty() promptTranslationRu: string;
  @ApiProperty() promptTranslationEn: string;
  @ApiProperty() order: number;
  @ApiProperty({ type: [ExerciseChoicePublicDto] }) choices: ExerciseChoicePublicDto[];
}

export class LessonDetailResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty() titleLatin: string;
  @ApiProperty() titleTranslationRu: string;
  @ApiProperty() titleTranslationEn: string;
  @ApiProperty() xpReward: number;
  @ApiProperty({ type: [ExercisePublicDto] }) exercises: ExercisePublicDto[];
}
