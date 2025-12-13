import { int, timestamp, mysqlTable, varchar, decimal, json } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { tickets } from './tickets';

export const transactions = mysqlTable('transactions', {
  id: int('id').autoincrement().primaryKey(),
  
  // Foreign Key to Ticket
  ticketId: int('ticket_id').notNull().references(() => tickets.id),
  
  // AzamPay Specifics
  externalId: varchar('external_id', { length: 255 }).unique().notNull(), // Our unique ref sent to Azam
  provider: varchar('provider', { length: 50 }).notNull(), // Airtel, Mpesa, etc.
  accountNumber: varchar('account_number', { length: 50 }).notNull(), // Phone number paying
  
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('TZS'),
  
  // Response Data
  status: varchar('status', { length: 50 }).default('PENDING'), // success, failed
  message: varchar('message', { length: 255 }),
  rawResponse: json('raw_response'), // Store full API response for debugging
  
  createdAt: timestamp('created_at').defaultNow(),
});

// Relationships
export const transactionsRelations = relations(transactions, ({ one }) => ({
  ticket: one(tickets, {
    fields: [transactions.ticketId],
    references: [tickets.id],
  }),
}));