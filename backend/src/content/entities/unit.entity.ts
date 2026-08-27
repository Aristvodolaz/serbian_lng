import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Lesson } from './lesson.entity';
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

  @OneToMany(() => Lesson, (lesson) => lesson.unit, { cascade: true })
  lessons: Lesson[];
}
