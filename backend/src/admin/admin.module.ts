import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { UserLessonProgress } from '../content/entities/user-lesson-progress.entity';
import { UserWordProgress } from '../vocabulary/entities/user-word-progress.entity';
import { Unit } from '../content/entities/unit.entity';
import { Lesson } from '../content/entities/lesson.entity';
import { Exercise } from '../content/entities/exercise.entity';
import { Word } from '../vocabulary/entities/word.entity';
import { Badge } from '../badges/entities/badge.entity';
import { UserBadge } from '../badges/entities/user-badge.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserLessonProgress,
      UserWordProgress,
      Unit,
      Lesson,
      Exercise,
      Word,
      Badge,
      UserBadge,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
