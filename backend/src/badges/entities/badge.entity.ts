import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('badges')
export class Badge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Stable identifier the criteria-evaluator matches against — see BadgesService.
  @Column({ unique: true })
  code: string;

  @Column()
  titleCyrillic: string;

  @Column()
  titleLatin: string;

  @Column()
  description: string;
}
