import { ApiProperty } from '@nestjs/swagger';

export enum LessonPathStatus {
  DONE = 'done',
  CURRENT = 'current',
  LOCKED = 'locked',
}

export class LessonSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty() titleLatin: string;
  @ApiProperty() titleTranslationRu: string;
  @ApiProperty() titleTranslationEn: string;
  @ApiProperty() order: number;
  @ApiProperty() xpReward: number;
  @ApiProperty({ enum: LessonPathStatus }) status: LessonPathStatus;
}

export class UnitPathDto {
  @ApiProperty() id: string;
  @ApiProperty() titleCyrillic: string;
  @ApiProperty() titleLatin: string;
  @ApiProperty() titleTranslationRu: string;
  @ApiProperty() titleTranslationEn: string;
  @ApiProperty() order: number;
  @ApiProperty({ type: [LessonSummaryDto] }) lessons: LessonSummaryDto[];
}

// Grammar theory topic summary embedded in the path per section (always
// accessible — theory is never gated).
export class TheorySummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() titleCyrillic: string;
  @ApiProperty() titleLatin: string;
  @ApiProperty() order: number;
}

// A section groups units on the path. `level` is the CEFR level (null for the
// tail pseudo-section that holds legacy units created before sections).
// `checkpoint` is the section's checkpoint lesson (kind='checkpoint'), which
// sits outside the units' lesson lists, at the end of the section.
export class SectionPathDto {
  @ApiProperty() id: string;
  @ApiProperty() titleCyrillic: string;
  @ApiProperty() titleLatin: string;
  @ApiProperty() titleTranslationRu: string;
  @ApiProperty() titleTranslationEn: string;
  @ApiProperty({ nullable: true }) level: string | null;
  @ApiProperty() order: number;
  @ApiProperty({ type: [UnitPathDto] }) units: UnitPathDto[];
  @ApiProperty({ type: [TheorySummaryDto] }) theory: TheorySummaryDto[];
  @ApiProperty({ type: LessonSummaryDto, nullable: true }) checkpoint: LessonSummaryDto | null;
}

export class PathResponseDto {
  @ApiProperty({ type: [SectionPathDto] })
  sections: SectionPathDto[];
}
