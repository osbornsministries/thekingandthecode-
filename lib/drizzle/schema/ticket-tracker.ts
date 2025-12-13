// lib/drizzle/schema/ticket-tracker.ts
import { int, mysqlTable, varchar, timestamp, boolean, json } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { eventSessions } from './session';

// This table tracks ticket purchases and updates counts in real-time
export const ticketTracker = mysqlTable('ticket_tracker', {
  id: int('id').autoincrement().primaryKey(),
  sessionId: int('session_id').notNull().references(() => eventSessions.id),
  
  // Track counts
  adultBooked: int('adult_booked').notNull().default(0),
  studentBooked: int('student_booked').notNull().default(0),
  childBooked: int('child_booked').notNull().default(0),
  totalBooked: int('total_booked').notNull().default(0),
  
  // Availability
  adultAvailable: int('adult_available').notNull().default(100),
  studentAvailable: int('student_available').notNull().default(50),
  childAvailable: int('child_available').notNull().default(50),
  totalAvailable: int('total_available').notNull().default(200),
  
  // Status
  isActive: boolean('is_active').default(true),
  isSoldOut: boolean('is_sold_out').default(false),
  
  // Last updated
  lastTicketAt: timestamp('last_ticket_at'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const ticketTrackerRelations = relations(ticketTracker, ({ one }) => ({
  session: one(eventSessions, {
    fields: [ticketTracker.sessionId],
    references: [eventSessions.id],
  }),
}));

// Also add relation to session
export const eventSessionsWithTrackerRelations = relations(eventSessions, ({ one }) => ({
  tracker: one(ticketTracker, {
    fields: [eventSessions.id],
    references: [ticketTracker.sessionId],
  }),
}));