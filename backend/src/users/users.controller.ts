import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserStatsResponseDto } from './dto/user-stats-response.dto';
import { WeekActivityResponseDto } from './dto/week-activity-response.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOkResponse({ type: UserResponseDto })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDto> {
    const entity = await this.usersService.findByIdOrThrow(user.id);
    return UserResponseDto.fromEntity(entity);
  }

  @Patch('me')
  @ApiOkResponse({ type: UserResponseDto })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const entity = await this.usersService.updateProfile(user.id, dto);
    return UserResponseDto.fromEntity(entity);
  }

  @Get('me/stats')
  @ApiOkResponse({ type: UserStatsResponseDto })
  stats(@CurrentUser() user: AuthenticatedUser): Promise<UserStatsResponseDto> {
    return this.usersService.getStats(user.id);
  }

  @Get('me/week')
  @ApiOkResponse({ type: WeekActivityResponseDto })
  week(@CurrentUser() user: AuthenticatedUser): Promise<WeekActivityResponseDto> {
    return this.usersService.getWeekActivity(user.id);
  }
}
