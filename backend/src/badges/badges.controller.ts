import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { BadgesService } from './badges.service';
import { BadgeResponseDto, EarnedBadgeResponseDto } from './dto/badge-response.dto';

@ApiTags('badges')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get()
  @ApiOkResponse({ type: [BadgeResponseDto] })
  listCatalog(): Promise<BadgeResponseDto[]> {
    return this.badgesService.listCatalog();
  }

  @Get('me')
  @ApiOkResponse({ type: [EarnedBadgeResponseDto] })
  listMine(@CurrentUser() user: AuthenticatedUser): Promise<EarnedBadgeResponseDto[]> {
    return this.badgesService.listForUser(user.id);
  }
}
