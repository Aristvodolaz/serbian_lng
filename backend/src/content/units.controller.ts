import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { ContentService } from './content.service';
import { PathResponseDto } from './dto/path-response.dto';

@ApiTags('units')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('units')
export class UnitsController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  @ApiOkResponse({ type: PathResponseDto, description: 'Units and lessons with per-lesson status (done/current/locked) for the home path screen' })
  getPath(@CurrentUser() user: AuthenticatedUser): Promise<PathResponseDto> {
    return this.contentService.getPathForUser(user.id);
  }
}
