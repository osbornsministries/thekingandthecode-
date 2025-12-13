import { int, mysqlTable, varchar, boolean, timestamp } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { tickets } from './tickets';

// lib/drizzle/schema.ts (students table update)
export const students = mysqlTable('attendees_students', {
  id: int('id').autoincrement().primaryKey(),
  ticketId: int('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  
  fullName: varchar('full_name', { length: 255 }).notNull(),
  studentId: varchar('student_id', { length: 50 }).notNull(), // Added
  institutionType: varchar('institution_type', { length: 50 }).notNull(), // UNIVERSITY, COLLEGE, HIGH_SCHOOL, OTHER
  institutionName: varchar('institution_name', { length: 255 }).notNull(), // Specific institution name
  phoneNumber: varchar('phone_number', { length: 20 }),
  
  // SECURITY: Scan Status
  isUsed: boolean('is_used').default(false),
  scannedAt: timestamp('scanned_at'),
});