import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Exercise } from './exercise.entity';

@Entity('exercise_choices')
export class ExerciseChoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  exerciseId: string;

  @ManyToOne(() => Exercise, (exercise) => exercise.choices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exerciseId' })
  exercise: Exercise;

  @Column()
  text: string;

  @Column()
  textRu: string;

  // Never serialize this to the client before an answer is submitted —
  // see ExercisePublicDto, which deliberately omits it.
  @Column({ default: false })
  isCorrect: boolean;

  @Column()
  order: number;
}
