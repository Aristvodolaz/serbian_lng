import { ApiProperty } from '@nestjs/swagger';
import { ScriptPreference } from '../enums/script-preference.enum';
import { User } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() displayName: string;
  @ApiProperty({ enum: ScriptPreference }) scriptPreference: ScriptPreference;
  @ApiProperty() xp: number;
  @ApiProperty() streakDays: number;
  @ApiProperty({ type: String, nullable: true }) lastActivityDate: string | null;
  @ApiProperty() createdAt: Date;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.displayName = user.displayName;
    dto.scriptPreference = user.scriptPreference;
    dto.xp = user.xp;
    dto.streakDays = user.streakDays;
    dto.lastActivityDate = user.lastActivityDate;
    dto.createdAt = user.createdAt;
    return dto;
  }
}
