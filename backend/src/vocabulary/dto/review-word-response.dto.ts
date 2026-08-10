import { ApiProperty } from '@nestjs/swagger';
import { WordProgressStatus } from '../entities/user-word-progress.entity';

export class ReviewWordResponseDto {
  @ApiProperty() wordId: string;
  @ApiProperty() cyrillic: string;
  @ApiProperty() latin: string;
  @ApiProperty() translation: string;
  @ApiProperty({ type: String, nullable: true }) exampleCyrillic: string | null;
  @ApiProperty({ type: String, nullable: true }) exampleTranslation: string | null;
  @ApiProperty({ type: String, nullable: true }) audioUrl: string | null;
  @ApiProperty({ enum: WordProgressStatus })
  status: WordProgressStatus;
}
