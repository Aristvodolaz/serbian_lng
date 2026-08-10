import { ApiProperty } from '@nestjs/swagger';

export class AnswerResultResponseDto {
  @ApiProperty() correct: boolean;
  @ApiProperty({ format: 'uuid' }) correctChoiceId: string;
}
