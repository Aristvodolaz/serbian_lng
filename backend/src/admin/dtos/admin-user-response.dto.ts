import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScriptPreference } from '../../users/enums/script-preference.enum';
import { UserRole } from '../../users/enums/user-role.enum';

export class AdminUserListResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() displayName: string;
  @ApiProperty({ enum: ScriptPreference }) scriptPreference: ScriptPreference;
  @ApiProperty({ enum: UserRole }) role: UserRole;
  @ApiProperty() banned: boolean;
  @ApiProperty() xp: number;
  @ApiProperty() streakDays: number;
  @ApiProperty({ type: String, nullable: true }) lastActivityDate: string | null;
  @ApiProperty() createdAt: Date;
}

export class CompletedLessonDto {
  @ApiProperty() lessonId: string;
  @ApiProperty() title: string;
  @ApiProperty() correctCount: number;
  @ApiProperty() totalCount: number;
  @ApiProperty() completedAt: Date;
}

export class AdminUserDetailResponseDto extends AdminUserListResponseDto {
  @ApiProperty() lessonsCompleted: number;
  @ApiProperty() wordsLearned: number;
  @ApiProperty() badgesEarned: number;
  @ApiProperty({ type: [CompletedLessonDto] }) recentLessons: CompletedLessonDto[];
}

export class UpdateAdminUserDto {
  @ApiPropertyOptional({ enum: UserRole })
  role?: UserRole;

  @ApiPropertyOptional()
  banned?: boolean;
}
