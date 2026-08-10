import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum ReviewResult {
  KNOW = 'know',
  LEARNING = 'learning',
}

export class SubmitReviewDto {
  @ApiProperty({ enum: ReviewResult, description: '"Знам" vs "Учим" on the flashcard' })
  @IsEnum(ReviewResult)
  result: ReviewResult;
}
