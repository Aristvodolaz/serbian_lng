import { ApiProperty } from '@nestjs/swagger';

/// Public dictionary word — everything the Word entity carries except status
/// (only PUBLISHED words are served) and the internal DB id shape.
export class WordPublicDto {
  @ApiProperty() id: string;
  @ApiProperty() cyrillic: string;
  @ApiProperty() latin: string;
  @ApiProperty() translationRu: string;
  @ApiProperty() translationEn: string;
  @ApiProperty({ type: String, nullable: true }) exampleCyrillic: string | null;
  @ApiProperty({ type: String, nullable: true }) exampleTranslationRu: string | null;
  @ApiProperty({ type: String, nullable: true }) exampleTranslationEn: string | null;
  @ApiProperty({ type: String, nullable: true }) audioUrl: string | null;
  @ApiProperty({ type: String, nullable: true }) partOfSpeech: string | null;
  @ApiProperty({ type: String, nullable: true }) gender: string | null;
  @ApiProperty({ type: String, nullable: true }) number: string | null;
  @ApiProperty({ type: String, nullable: true }) declension: string | null;
  @ApiProperty({ type: String, nullable: true }) conjugation: string | null;
  @ApiProperty({ type: String, nullable: true }) imageUrl: string | null;
}

export class WordsListResponseDto {
  @ApiProperty({ type: [WordPublicDto] }) items: WordPublicDto[];
  @ApiProperty() total: number;
}
