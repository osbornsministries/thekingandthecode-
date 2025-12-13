import { int, mysqlTable, varchar, boolean, timestamp } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { tickets } from './tickets';

export const adults = mysqlTable('attendees_adults', {
  id: int('id').autoincrement().primaryKey(),
  ticketId: int('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  
  fullName: varchar('full_name', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  
  // SECURITY: Scan Status
  isUsed: boolean('is_used').default(false),
  scannedAt: timestamp('scanned_at'),
});

export const adultsRelations = relations(adults, ({ one }) => ({
  ticket: one(tickets, {
    fields: [adults.ticketId],
    references: [tickets.id],
  }),
}));