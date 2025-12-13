// lib/drizzle/schema/session-limits.ts
import { int, mysqlTable, boolean, timestamp } from 'drizzle-orm/mysql-core';

export const sessionLimits = mysqlTable('session_limits', {
  id: int('id').autoincrement().primaryKey(),
  sessionId: int('session_id').notNull().unique(),

  adultCapacity: int('adult_capacity').notNull().default(100),
  studentCapacity: int('student_capacity').notNull().default(50),
  childCapacity: int('child_capacity').notNull().default(50),
  totalCapacity: int('total_capacity').notNull().default(200),

  adultBooked: int('adult_booked').notNull().default(0),
  studentBooked: int('student_booked').notNull().default(0),
  childBooked: int('child_booked').notNull().default(0),
  totalBooked: int('total_booked').notNull().default(0),

  adultAvailable: int('adult_available').notNull().default(100),
  studentAvailable: int('student_available').notNull().default(50),
  childAvailable: int('child_available').notNull().default(50),
  totalAvailable: int('total_available').notNull().default(200),

  isActive: boolean('is_active').default(true),
  isSoldOut: boolean('is_sold_out').default(false),

  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  createdAt: timestamp('created_at').defaultNow(),
});
