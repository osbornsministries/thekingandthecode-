// lib/drizzle/seeders/ScheduleSeeder.ts

import { db } from '@/lib/db/db';
import { eventDays, eventSessions } from '../schema';

export async function seedSchedule() {
  console.log('📅 Seeding Schedule (Days & Sessions)...');

  // 1. Create a Day
  const [day1] = await db.insert(eventDays).values({
    name: 'Day 1 - Grand Opening',
    // ✅ FIX 1: Convert date string to Date object
    date: new Date('2024-12-25'), 
    isActive: true
  }).$returningId(); 

  // 2. Create Sessions for that Day
  await db.insert(eventSessions).values([
    { dayId: day1.id, name: 'Morning Session', startTime: '08:00:00', endTime: '12:00:00' },
    { dayId: day1.id, name: 'Gala Dinner', startTime: '18:00:00', endTime: '23:00:00' },
  ]);

  console.log('   ✅ Schedule seeded.');
}