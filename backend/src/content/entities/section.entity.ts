import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Unit } from './unit.entity';
import { ContentStatus } from '../../common/enums/content-status.enum';

// A chapter above units: carries the CEFR level for the whole group and
// optionally ends with a checkpoint lesson that gates the next section.
@Entity('sections')
@Unique(['titleCyrillic'])
export class Section {
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

  @Column({ type: 'varchar', default: 'A1' })
  level: string;

  @Column({ type: 'varchar', default: ContentStatus.DRAFT })
  status: ContentStatus;

  @Column()
  order: number;

  @OneToMany(() => Unit, (unit) => unit.section)
  units: Unit[];
}
