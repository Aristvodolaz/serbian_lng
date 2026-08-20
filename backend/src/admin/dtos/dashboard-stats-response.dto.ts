import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsResponseDto {
  @ApiProperty() totalUsers: number;
  @ApiProperty() activeUsersToday: number;
  @ApiProperty() activeUsersThisWeek: number;
  @ApiProperty() newUsersThisWeek: number;
  @ApiProperty() totalLessonsCompleted: number;
  @ApiProperty() lessonsCompletedToday: number;
  @ApiProperty() totalWords: number;
  @ApiProperty() totalUnits: number;
  @ApiProperty() totalLessons: number;
  @ApiProperty() bannedUsers: number;
}
