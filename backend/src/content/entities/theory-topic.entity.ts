import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Section } from './section.entity';
import { ContentStatus } from '../../common/enums/content-status.enum';
import { TheoryPayload } from '../theory-blocks';

// Grammar theory attached to a section. Not a lesson: no exercises, no user
// progress, never gated — rendered from the path and the theory library only.
@Entity('theory_topics')
@Index('IDX_theory_section', ['sectionId'])
export class TheoryTopic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sectionId: string;

  @ManyToOne(() => Section, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sectionId' })
  section: Section;

  @Column()
  titleCyrillic: string;

  @Column({ default: '' })
  titleLatin: string;

  @Column({ type: 'text', default: '' })
  titleTranslationRu: string;

  @Column({ type: 'text', default: '' })
  titleTranslationEn: string;

  @Column({ type: 'jsonb' })
  payload: TheoryPayload;

  @Column({ type: 'varchar', default: ContentStatus.DRAFT })
  status: ContentStatus;

  @Column()
  order: number;
}
