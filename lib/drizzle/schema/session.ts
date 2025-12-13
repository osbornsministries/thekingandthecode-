// lib/drizzle/schema/session.ts
import { int, mysqlTable, varchar, time, boolean } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { tickets } from './tickets';
import { eventDays } from './event';

export const eventSessions = mysqlTable('event_sessions', {
  id: int('id').autoincrement().primaryKey(),
  dayId: int('day_id').notNull().references(() => eventDays.id, { onDelete: 'cascade' }),
  
  name: varchar('name', { length: 50 }).notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),

  isActive: boolean('is_active').default(true),
});

export const eventSessionsRelations = relations(eventSessions, ({ one, many }) => ({
  day: one(eventDays, {
    fields: [eventSessions.dayId],
    references: [eventDays.id],
  }),
  tickets: many(tickets),
}));
