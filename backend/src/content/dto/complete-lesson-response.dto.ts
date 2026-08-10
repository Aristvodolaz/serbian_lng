import { ApiProperty } from '@nestjs/swagger';
import { EarnedBadgeResponseDto } from '../../badges/dto/badge-response.dto';

export class CompleteLessonResponseDto {
  @ApiProperty() xpEarned: number;
  @ApiProperty() totalXp: number;
  @ApiProperty() streakDays: number;
  @ApiProperty({ type: [EarnedBadgeResponseDto] }) newBadges: EarnedBadgeResponseDto[];
}
