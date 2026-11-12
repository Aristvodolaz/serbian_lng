import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ContentService } from './content.service';
import { TheoryLibraryResponseDto, TheoryTopicDto } from './dto/theory-response.dto';

// Theory is never gated (no assertLessonAccessible): any signed-in user can
// read published topics of published sections.
@ApiTags('theory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('theory')
export class TheoryController {
  constructor(private readonly contentService: ContentService) {}

  @Get('library')
  @ApiOkResponse({ type: TheoryLibraryResponseDto, description: 'Published theory topics grouped by published section' })
  getLibrary(): Promise<TheoryLibraryResponseDto> {
    return this.contentService.getTheoryLibrary();
  }

  @Get(':id')
  @ApiOkResponse({ type: TheoryTopicDto, description: 'Full theory topic with content blocks; 404 when topic or its section is DRAFT' })
  getTopic(@Param('id', ParseUUIDPipe) id: string): Promise<TheoryTopicDto> {
    return this.contentService.getTheoryTopic(id);
  }
}
