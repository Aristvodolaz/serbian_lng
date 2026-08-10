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
  @ApiProperty() titleTranslation: string;
  @ApiProperty() order: number;
  @ApiProperty() xpReward: number;
  @ApiProperty({ enum: LessonPathStatus }) status: LessonPathStatus;
}

export class UnitPathDto {
  @ApiProperty() id: string;
  @ApiProperty() titleCyrillic: string;
  @ApiProperty() titleLatin: string;
  @ApiProperty() titleTranslation: string;
  @ApiProperty() order: number;
  @ApiProperty({ type: [LessonSummaryDto] }) lessons: LessonSummaryDto[];
}

export class PathResponseDto {
  @ApiProperty({ type: [UnitPathDto] })
  units: UnitPathDto[];
}
