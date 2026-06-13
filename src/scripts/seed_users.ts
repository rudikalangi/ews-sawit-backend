import { db } from '../db';
import { users } from '../db/schema';
import * as bcrypt from 'bcrypt';

async function seedUsers() {
  console.log('Seeding default users...');
  
  const passwordHash = await bcrypt.hash('admin123', 10);

  // We use insert onConflictDoNothing in case it already exists, or just a simple insert
  try {
    await db.insert(users).values({
      nama: 'Administrator',
      email: 'admin@ews.com',
      passwordHash: passwordHash,
      role: 'admin',
      isActive: true
    });
    console.log('Admin user created successfully. Email: admin@ews.com | Password: admin123');
  } catch (error) {
    console.log('User might already exist or error occurred:', error);
  }

  process.exit(0);
}

seedUsers();
