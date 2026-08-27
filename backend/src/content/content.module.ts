import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Unit } from './entities/unit.entity';
import { Lesson } from './entities/lesson.entity';
import { Exercise } from './entities/exercise.entity';
import { UserLessonProgress } from './entities/user-lesson-progress.entity';
import { Word } from '../vocabulary/entities/word.entity';
import { ContentService } from './content.service';
import { UnitsController } from './units.controller';
import { LessonsController } from './lessons.controller';
import { User } from '../users/entities/user.entity';
import { BadgesModule } from '../badges/badges.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Unit, Lesson, Exercise, UserLessonProgress, Word, User]),
    BadgesModule,
  ],
  controllers: [UnitsController, LessonsController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
