import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Unit } from './unit.entity';
import { Exercise } from './exercise.entity';
import { ContentStatus } from '../../common/enums/content-status.enum';

@Entity('lessons')
@Unique(['unitId', 'title'])
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  unitId: string;

  @ManyToOne(() => Unit, (unit) => unit.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unitId' })
  unit: Unit;

  @Column()
  title: string;

  @Column()
  titleLatin: string;

  @Column({ type: 'text', default: '' })
  titleTranslationRu: string;

  @Column({ type: 'text', default: '' })
  titleTranslationEn: string;

  @Column({ type: 'text', default: '' })
  descriptionRu: string;

  @Column({ type: 'text', default: '' })
  descriptionEn: string;

  // Minimum number of exercises a lesson must have before it can be published.
  @Column({ default: 5 })
  minExercises: number;

  @Column({ type: 'varchar', default: ContentStatus.DRAFT })
  status: ContentStatus;

  // Global order across the whole path — determines which lesson is
  // "current" for a user (first one after their last completed lesson).
  @Column()
  order: number;

  @Column({ default: 10 })
  xpReward: number;

  @OneToMany(() => Exercise, (exercise) => exercise.lesson, { cascade: true })
  exercises: Exercise[];
}
