import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserLessonProgress } from '../content/entities/user-lesson-progress.entity';
import { UserWordProgress } from '../vocabulary/entities/user-word-progress.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserLessonProgress, UserWordProgress])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
