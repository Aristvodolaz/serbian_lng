import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Lesson } from './lesson.entity';
import { Section } from './section.entity';
import { ContentStatus } from '../../common/enums/content-status.enum';

@Entity('units')
@Unique(['titleCyrillic'])
export class Unit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titleCyrillic: string;

  @Column({ default: '' })
  titleLatin: string;

  @Column({ type: 'text', default: '' })
  titleTranslationRu: string;

  @Column({ type: 'text', default: '' })
  titleTranslationEn: string;

  @Column({ type: 'varchar', default: ContentStatus.DRAFT })
  status: ContentStatus;

  @Column({ type: 'varchar', nullable: true })
  icon: string | null;

  @Column()
  order: number;

  // Nullable: units created before sections exist (CSV uploads without
  // sectionTitle) stay valid and render as the legacy tail pseudo-section.
  @Column({ type: 'uuid', nullable: true })
  sectionId: string | null;

  @ManyToOne(() => Section, (section) => section.units, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sectionId' })
  section: Section | null;

  @OneToMany(() => Lesson, (lesson) => lesson.unit, { cascade: true })
  lessons: Lesson[];
}
