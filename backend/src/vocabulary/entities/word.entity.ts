import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Unit } from '../../content/entities/unit.entity';

@Entity('words')
export class Word {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  unitId: string | null;

  @ManyToOne(() => Unit, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'unitId' })
  unit: Unit | null;

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
}
