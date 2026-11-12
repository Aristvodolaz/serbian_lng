import { ApiProperty } from '@nestjs/swagger';
import { TheoryPayload } from '../theory-blocks';

export class TheoryTopicDto {
  @ApiProperty() id: string;
  @ApiProperty() sectionId: string;
  @ApiProperty() titleCyrillic: string;
  @ApiProperty() titleLatin: string;
  @ApiProperty() titleTranslationRu: string;
  @ApiProperty() titleTranslationEn: string;
  @ApiProperty() payload: TheoryPayload;
  @ApiProperty() order: number;
}

export class TheoryTopicSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() titleCyrillic: string;
  @ApiProperty() titleLatin: string;
  @ApiProperty() order: number;
}

export class TheoryLibrarySectionDto {
  @ApiProperty() id: string;
  @ApiProperty() level: string;
  @ApiProperty() titleCyrillic: string;
  @ApiProperty() titleLatin: string;
  @ApiProperty() titleTranslationRu: string;
  @ApiProperty() titleTranslationEn: string;
  @ApiProperty() order: number;
  @ApiProperty({ type: [TheoryTopicSummaryDto] }) topics: TheoryTopicSummaryDto[];
}

export class TheoryLibraryResponseDto {
  @ApiProperty({ type: [TheoryLibrarySectionDto] })
  sections: TheoryLibrarySectionDto[];
}
