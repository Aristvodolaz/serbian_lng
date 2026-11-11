import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Unit } from './entities/unit.entity';
import { Lesson } from './entities/lesson.entity';
import { Section } from './entities/section.entity';
import { Exercise } from './entities/exercise.entity';
import { TheoryTopic } from './entities/theory-topic.entity';
import { TheoryController } from './theory.controller';
import { UserLessonProgress } from './entities/user-lesson-progress.entity';
import { UserExerciseAnswer } from './entities/user-exercise-answer.entity';
import { Word } from '../vocabulary/entities/word.entity';
import { ContentService } from './content.service';
import { UnitsController } from './units.controller';
import { LessonsController } from './lessons.controller';
import { User } from '../users/entities/user.entity';
import { BadgesModule } from '../badges/badges.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Section,
      Unit,
      Lesson,
      Exercise,
      TheoryTopic,
      UserLessonProgress,
      UserExerciseAnswer,
      Word,
      User,
    ]),
    BadgesModule,
  ],
  controllers: [UnitsController, LessonsController, TheoryController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
