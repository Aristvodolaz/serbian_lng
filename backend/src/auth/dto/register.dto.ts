import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ScriptPreference } from '../../users/enums/script-preference.enum';

export class RegisterDto {
  @ApiProperty({ example: 'milica@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8, example: 'sigurna-lozinka' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Милица' })
  @IsString()
  @MinLength(1)
  displayName: string;

  @ApiPropertyOptional({ enum: ScriptPreference, default: ScriptPreference.BOTH })
  @IsOptional()
  @IsEnum(ScriptPreference)
  scriptPreference?: ScriptPreference;
}
