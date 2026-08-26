import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Lesson } from './lesson.entity';

@Entity('units')
@Unique(['titleCyrillic'])
export class Unit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titleCyrillic: string;

  @Column()
  titleLatin: string;

  @Column({ type: 'text', default: '' })
  titleTranslationRu: string;

  @Column({ type: 'text', default: '' })
  titleTranslationEn: string;

  @Column()
  order: number;

  @OneToMany(() => Lesson, (lesson) => lesson.unit, { cascade: true })
  lessons: Lesson[];
}
