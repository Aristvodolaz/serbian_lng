import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ScriptPreference } from '../enums/script-preference.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Милица' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  displayName?: string;

  @ApiPropertyOptional({ enum: ScriptPreference })
  @IsOptional()
  @IsEnum(ScriptPreference)
  scriptPreference?: ScriptPreference;
}
