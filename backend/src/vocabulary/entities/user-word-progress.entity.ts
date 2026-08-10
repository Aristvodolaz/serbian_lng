import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Word } from './word.entity';

export enum WordProgressStatus {
  LEARNING = 'learning',
  KNOWN = 'known',
}

@Entity('user_word_progress')
@Unique(['userId', 'wordId'])
export class UserWordProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  wordId: string;

  @ManyToOne(() => Word, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wordId' })
  word: Word;

  @Column({ type: 'enum', enum: WordProgressStatus, default: WordProgressStatus.LEARNING })
  status: WordProgressStatus;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastReviewedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  nextReviewAt: Date | null;
}
