import { ApiProperty } from '@nestjs/swagger';
import { WordProgressStatus } from '../entities/user-word-progress.entity';
import { EarnedBadgeResponseDto } from '../../badges/dto/badge-response.dto';

export class SubmitReviewResponseDto {
  @ApiProperty({ enum: WordProgressStatus }) status: WordProgressStatus;
  @ApiProperty() nextReviewAt: Date;
  @ApiProperty({ type: [EarnedBadgeResponseDto] }) newBadges: EarnedBadgeResponseDto[];
}
