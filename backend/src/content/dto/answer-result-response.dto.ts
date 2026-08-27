import { ApiProperty } from '@nestjs/swagger';

export class AnswerResultResponseDto {
  @ApiProperty() correct: boolean;
  @ApiProperty() correctAnswerId: string;
  @ApiProperty({
    description:
      'Resolved correct answer (id + all languages/scripts) — only revealed after the learner submits',
    required: false,
  })
  correctAnswer?: Record<string, unknown>;
}
