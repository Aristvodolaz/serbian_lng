import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AnswerExerciseDto {
  @ApiProperty({ description: 'Id of the answer the learner picked (an id from the exercise payload)' })
  @IsString()
  @IsNotEmpty()
  answerId: string;
}
