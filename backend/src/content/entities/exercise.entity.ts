import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Lesson } from './lesson.entity';
import { ExerciseChoice } from './exercise-choice.entity';

export enum ExerciseType {
  TRANSLATE_CHOICE = 'translate_choice',
}

@Entity('exercises')
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  lessonId: string;

  @ManyToOne(() => Lesson, (lesson) => lesson.exercises, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson;

  @Column({ type: 'enum', enum: ExerciseType, default: ExerciseType.TRANSLATE_CHOICE })
  type: ExerciseType;

  @Column()
  promptCyrillic: string;

  @Column()
  promptLatin: string;

  @Column()
  promptTranslationRu: string;

  @Column()
  promptTranslationEn: string;

  @Column()
  order: number;

  @OneToMany(() => ExerciseChoice, (choice) => choice.exercise, { cascade: true, eager: true })
  choices: ExerciseChoice[];
}
