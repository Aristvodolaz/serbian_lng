import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VocabularyService } from './vocabulary.service';
import { WordsListResponseDto } from './dto/word-public.dto';

@ApiTags('words')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('words')
export class WordsController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Get()
  @ApiQuery({ name: 'search', required: false, description: 'Substring match on cyrillic/latin/translations' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiOkResponse({ type: WordsListResponseDto, description: 'Published dictionary words, ordered by cyrillic' })
  list(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<WordsListResponseDto> {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const boundedLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 50;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    const boundedOffset = Number.isFinite(parsedOffset) ? Math.max(parsedOffset, 0) : 0;
    const query = search?.trim() || undefined;
    return this.vocabularyService.searchWords(query, boundedLimit, boundedOffset);
  }

  @Get('attributes')
  @ApiOkResponse({ description: 'Grammar attribute dictionaries (code -> RU/EN labels)' })
  attributes() {
    return this.vocabularyService.wordAttributes();
  }
}
