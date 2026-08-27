import { ApiProperty } from '@nestjs/swagger';

export class ExercisePublicDto {
  @ApiProperty() id: string;
  @ApiProperty() type: string;
  @ApiProperty() order: number;
  @ApiProperty({
    description:
      'Resolved exercise payload with all languages/scripts, `correctAnswerId` deliberately stripped',
  })
  payload: Record<string, unknown>;
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
