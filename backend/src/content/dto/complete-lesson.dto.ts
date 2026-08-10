import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CompleteLessonDto {
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  correctCount: number;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  totalCount: number;
}
