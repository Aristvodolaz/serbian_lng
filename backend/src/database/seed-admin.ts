import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

// Creates or password-resets the admin account. Credentials come from
// ADMIN_EMAIL / ADMIN_PASSWORD so secrets stay out of the repo.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User],
});

async function seedAdmin() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
    process.exit(1);
  }

  await dataSource.initialize();

  const repo = dataSource.getRepository(User);
  const existing = await repo.findOne({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    existing.passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    existing.role = UserRole.ADMIN;
    existing.banned = false;
    await repo.save(existing);
    console.log(`seed-admin: password reset for ${ADMIN_EMAIL}`);
  } else {
    await repo.save({
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      displayName: 'Admin',
      role: UserRole.ADMIN,
    });
    console.log(`seed-admin: admin created: ${ADMIN_EMAIL}`);
  }

  await dataSource.destroy();
}

seedAdmin().catch((error) => {
  console.error(error);
  process.exit(1);
});
