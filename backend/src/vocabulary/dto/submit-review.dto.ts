import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Grade as ReviewResult } from '../srs';

// Same enum object as srs.Grade — the wire values are the scheduling grades.
export { ReviewResult };

export class SubmitReviewDto {
  @ApiProperty({
    enum: ReviewResult,
    description: 'Flashcard grading: again / hard / good / easy (SM-2)',
  })
  @IsEnum(ReviewResult)
  result: ReviewResult;
}
