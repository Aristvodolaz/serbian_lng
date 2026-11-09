import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Unit } from './unit.entity';
import { Section } from './section.entity';
import { Exercise } from './exercise.entity';
import { ContentStatus } from '../../common/enums/content-status.enum';

// Uniqueness is enforced by partial unique indexes (migration 1795):
// (unitId, title) for regular lessons, (sectionId, title) for checkpoints —
// a checkpoint belongs to a section, not a unit, so unitId is nullable.
@Entity('lessons')
@Index('IDX_lessons_section', ['sectionId'])
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  unitId: string | null;

  @ManyToOne(() => Unit, (unit) => unit.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unitId' })
  unit: Unit | null;

  // 'regular' by default; 'checkpoint' marks a section-gating lesson whose
  // exercises are assembled at serve time (see ContentService).
  @Column({ type: 'varchar', default: 'regular' })
  kind: 'regular' | 'checkpoint';

  @Column({ type: 'uuid', nullable: true })
  sectionId: string | null;

  @ManyToOne(() => Section, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sectionId' })
  section: Section | null;

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
