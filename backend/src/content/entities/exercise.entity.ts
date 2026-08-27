import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Lesson } from './lesson.entity';
import { ContentStatus } from '../../common/enums/content-status.enum';
import { ExercisePayload, ExerciseType } from '../exercise-types';

@Entity('exercises')
@Unique(['lessonId', 'order'])
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  lessonId: string;

  @ManyToOne(() => Lesson, (lesson) => lesson.exercises, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson;

  // Plain varchar (no Postgres enum): new exercise types are registry
  // entries, never DB migrations. Validated against EXERCISE_TYPE_REGISTRY.
  @Column()
  type: ExerciseType;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  payload: ExercisePayload;

  @Column({ type: 'varchar', default: ContentStatus.DRAFT })
  status: ContentStatus;

  @Column()
  order: number;
}
