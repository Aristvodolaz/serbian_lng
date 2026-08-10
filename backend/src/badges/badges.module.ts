import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { BadgesService } from './badges.service';
import { BadgesController } from './badges.controller';
import { User } from '../users/entities/user.entity';
import { UserLessonProgress } from '../content/entities/user-lesson-progress.entity';
import { UserWordProgress } from '../vocabulary/entities/user-word-progress.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Badge, UserBadge, User, UserLessonProgress, UserWordProgress]),
  ],
  controllers: [BadgesController],
  providers: [BadgesService],
  exports: [BadgesService],
})
export class BadgesModule {}
