import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Unit } from './unit.entity';
import { Exercise } from './exercise.entity';

@Entity('lessons')
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

  @Column()
  titleTranslationRu: string;

  @Column()
  titleTranslationEn: string;

  // Global order across the whole path — determines which lesson is
  // "current" for a user (first one after their last completed lesson).
  @Column()
  order: number;

  @Column({ default: 10 })
  xpReward: number;

  @OneToMany(() => Exercise, (exercise) => exercise.lesson, { cascade: true })
  exercises: Exercise[];
}
