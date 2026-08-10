import { ApiProperty } from '@nestjs/swagger';

export class UserStatsResponseDto {
  @ApiProperty({ description: 'Words with status KNOWN in the flashcard deck' })
  wordsLearned: number;

  @ApiProperty({ description: 'Average lesson accuracy across all completed lessons, 0–100' })
  accuracy: number;

  @ApiProperty() lessonsCompleted: number;

  @ApiProperty({ description: 'Distinct ISO calendar weeks with at least one completed lesson' })
  weeksActive: number;

  @ApiProperty() xp: number;
  @ApiProperty() streakDays: number;
}
