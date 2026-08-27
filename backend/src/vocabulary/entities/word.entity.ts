import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ContentStatus } from '../../common/enums/content-status.enum';

@Entity('words')
@Unique(['cyrillic'])
export class Word {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  cyrillic: string;

  @Column()
  latin: string;

  @Column({ type: 'text' })
  translationRu: string;

  @Column({ type: 'text' })
  translationEn: string;

  @Column({ type: 'text', nullable: true })
  exampleCyrillic: string | null;

  @Column({ type: 'text', nullable: true })
  exampleTranslationRu: string | null;

  @Column({ type: 'text', nullable: true })
  exampleTranslationEn: string | null;

  @Column({ type: 'text', nullable: true })
  audioUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  partOfSpeech: string | null;

  @Column({ type: 'varchar', nullable: true })
  gender: string | null;

  @Column({ type: 'varchar', nullable: true })
  number: string | null;

  @Column({ type: 'varchar', nullable: true })
  declension: string | null;

  @Column({ type: 'varchar', nullable: true })
  conjugation: string | null;

  @Column({ type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'varchar', default: ContentStatus.DRAFT })
  status: ContentStatus;
}
