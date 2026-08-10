import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { ContentService } from './content.service';
import { LessonDetailResponseDto } from './dto/lesson-detail-response.dto';
import { AnswerExerciseDto } from './dto/answer-exercise.dto';
import { AnswerResultResponseDto } from './dto/answer-result-response.dto';
import { CompleteLessonDto } from './dto/complete-lesson.dto';
import { CompleteLessonResponseDto } from './dto/complete-lesson-response.dto';

@ApiTags('lessons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lessons')
export class LessonsController {
  constructor(private readonly contentService: ContentService) {}

  @Get(':lessonId')
  @ApiOkResponse({ type: LessonDetailResponseDto })
  getDetail(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ): Promise<LessonDetailResponseDto> {
    return this.contentService.getLessonDetail(lessonId);
  }

  @Post(':lessonId/exercises/:exerciseId/answer')
  @ApiOkResponse({ type: AnswerResultResponseDto })
  answer(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('exerciseId', ParseUUIDPipe) exerciseId: string,
    @Body() dto: AnswerExerciseDto,
  ): Promise<AnswerResultResponseDto> {
    return this.contentService.checkAnswer(lessonId, exerciseId, dto.choiceId);
  }

  @Post(':lessonId/complete')
  @ApiOkResponse({ type: CompleteLessonResponseDto })
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: CompleteLessonDto,
  ): Promise<CompleteLessonResponseDto> {
    return this.contentService.completeLesson(user.id, lessonId, dto.correctCount, dto.totalCount);
  }
}
