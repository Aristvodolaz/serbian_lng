import { ApiProperty } from '@nestjs/swagger';

export class DayActivityDto {
  @ApiProperty({ example: '2026-08-10' }) date: string;
  @ApiProperty({ description: 'Mon=1 .. Sun=7 (ISO weekday)' }) weekday: number;
  @ApiProperty() active: boolean;
}

export class WeekActivityResponseDto {
  @ApiProperty({ type: [DayActivityDto] })
  days: DayActivityDto[];
}
