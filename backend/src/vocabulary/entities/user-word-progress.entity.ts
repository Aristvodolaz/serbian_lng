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

// A const object, not a TS enum: its values are then the same string-literal
// union as srs.ProgressStatus, so no cast is needed to pass them between the
// scheduling math and the entity.
export const WordProgressStatus = {
  LEARNING: 'learning',
  KNOWN: 'known',
} as const;
export type WordProgressStatus = (typeof WordProgressStatus)[keyof typeof WordProgressStatus];

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

  // SM-2 state: ease factor and the interval the next GOOD/EASY multiplies.
  @Column({ type: 'real', default: 2.5 })
  easeFactor: number;

  // Previous interval in ms; pg returns bigint as string, so keep loose typing.
  @Column({ type: 'bigint', nullable: true })
  intervalMs: string | number | null;
}
