import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum ReviewResult {
  AGAIN = 'again',
  HARD = 'hard',
  GOOD = 'good',
  EASY = 'easy',
}

export class SubmitReviewDto {
  @ApiProperty({
    enum: ReviewResult,
    description: 'Flashcard grading: again / hard / good / easy (SM-2)',
  })
  @IsEnum(ReviewResult)
  result: ReviewResult;
}
