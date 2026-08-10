import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { VocabularyService } from './vocabulary.service';
import { ReviewWordResponseDto } from './dto/review-word-response.dto';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { SubmitReviewResponseDto } from './dto/submit-review-response.dto';

@ApiTags('vocabulary')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Get('review')
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiOkResponse({ type: [ReviewWordResponseDto] })
  getReviewQueue(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: string,
  ): Promise<ReviewWordResponseDto[]> {
    const parsed = limit ? parseInt(limit, 10) : 20;
    const bounded = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 50) : 20;
    return this.vocabularyService.getReviewQueue(user.id, bounded);
  }

  @Post(':wordId/review')
  @ApiOkResponse({ type: SubmitReviewResponseDto })
  submitReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('wordId', ParseUUIDPipe) wordId: string,
    @Body() dto: SubmitReviewDto,
  ): Promise<SubmitReviewResponseDto> {
    return this.vocabularyService.submitReview(user.id, wordId, dto.result);
  }
}
