// lib/drizzle/seeders/UserSeeder.ts
import { db } from '@/lib/db/db';
import { users } from '../schema/users';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

export async function seedUsers() {
  console.log('🌱 Seeding Users...');

  // Check if admin exists
  const existingUser = await db.select().from(users).where(eq(users.email, 'admin@gmail.com'));
  if (existingUser.length === 0) {
    const password = await bcrypt.hash('admin123', 10);
    await db.insert(users).values({
      name: 'Main Admin',
      email: 'admin@afyalink.com',
      password: password,
      role: 'admin'
    });
    console.log('   ✅ Admin user created.');
  } else {
    console.log('   Skipping: Admin already exists.');
  }
}