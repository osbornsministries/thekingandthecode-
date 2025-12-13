import { int, mysqlTable, varchar, time, date, boolean } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { tickets } from './tickets';

// 1. EVENT DAYS (e.g., "Day 1", "Day 2")
export const eventDays = mysqlTable('event_days', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 50 }).notNull(), // e.g., "Opening Day"
  date: date('date').notNull(), // e.g., 2024-12-25
  isActive: boolean('is_active').default(true),
});