import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ScriptPreference } from '../enums/script-preference.enum';
import { UserRole } from '../enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  displayName: string;

  @Column({
    type: 'enum',
    enum: ScriptPreference,
    default: ScriptPreference.BOTH,
  })
  scriptPreference: ScriptPreference;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ default: 0 })
  xp: number;

  @Column({ default: 0 })
  streakDays: number;

  // Local date (YYYY-MM-DD) of the last streak-counted activity, used to
  // decide whether today continues, restarts, or already counted the streak.
  @Column({ type: 'date', nullable: true })
  lastActivityDate: string | null;

  @Column({ default: false })
  banned: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
