import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Lesson } from './lesson.entity';
import { Exercise } from './exercise.entity';

// One row per (user, exercise): the LAST attempt. completeLesson counts the
// first attempt only (attemptNumber = 1), so wrong-then-corrected answers
// don't inflate XP.
@Entity('user_exercise_answers')
@Unique(['userId', 'exerciseId'])
@Index(['userId', 'lessonId'])
export class UserExerciseAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  exerciseId: string;

  @ManyToOne(() => Exercise, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exerciseId' })
  exercise: Exercise;

  @Column()
  lessonId: string;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson;

  @Column()
  correct: boolean;

  @Column()
  attemptNumber: number;

  @Column({ type: 'timestamptz' })
  answeredAt: Date;
}
