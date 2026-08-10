import { ApiProperty } from '@nestjs/swagger';

export class BadgeResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() code: string;
  @ApiProperty() titleCyrillic: string;
  @ApiProperty() titleLatin: string;
  @ApiProperty() description: string;
}

export class EarnedBadgeResponseDto extends BadgeResponseDto {
  @ApiProperty() earnedAt: Date;
}
