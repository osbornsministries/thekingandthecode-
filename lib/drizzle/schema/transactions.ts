import { int, timestamp, mysqlTable, varchar, decimal, json } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { tickets } from './tickets';

export const transactions = mysqlTable('transactions', {
  id: int('id').autoincrement().primaryKey(),
  
  ticketId: int('ticket_id', { mode: 'nullable' }).references(() => tickets.id), // nullable

  externalId: varchar('external_id', { length: 255, mode: 'nullable' }),
  reference: varchar('reference', { length: 255, mode: 'nullable' }),
  transId: varchar('trans_id', { length: 255, mode: 'nullable' }),

  provider: varchar('provider', { length: 50, mode: 'nullable' }),
  accountNumber: varchar('account_number', { length: 50, mode: 'nullable' }),
  
  amount: decimal('amount', { precision: 10, scale: 2, mode: 'nullable' }),
  currency: varchar('currency', { length: 10 }).default('TZS'),

  status: varchar('status', { length: 50, mode: 'nullable' }).default('PENDING'),
  message: varchar('message', { length: 255, mode: 'nullable' }),
  rawResponse: json('raw_response', { mode: 'nullable' }),

  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const transactionsRelations = relations(transactions, ({ one }) => ({
  ticket: one(tickets, {
    fields: [transactions.ticketId],
    references: [tickets.id],
  }),
}));
