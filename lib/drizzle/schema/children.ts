import { int, mysqlTable, varchar, boolean, timestamp, date } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { tickets } from './tickets';

export const children = mysqlTable('attendees_children', {
  id: int('id').autoincrement().primaryKey(),
  ticketId: int('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  
  fullName: varchar('full_name', { length: 255 }).notNull(),
  parentName: varchar('parent_name', { length: 255 }), // Optional: Guardian name if different from purchaser
  dateOfBirth: date('date_of_birth'), // To verify age < 15
  
  // SECURITY: Scan Status
  isUsed: boolean('is_used').default(false),
  scannedAt: timestamp('scanned_at'),
});

export const childrenRelations = relations(children, ({ one }) => ({
  ticket: one(tickets, {
    fields: [children.ticketId],
    references: [tickets.id],
  }),
}));