// lib/drizzle/schema/sms.ts
import {
  mysqlTable,
  int,
  varchar,
  boolean,
  timestamp,
  text,
  json,
} from 'drizzle-orm/mysql-core';

export const smsLogs = mysqlTable('sms_logs', {
  id: int('id').primaryKey().autoincrement(),

  templateName: varchar('template_name', { length: 100 }),
  phone: varchar('phone', { length: 20 }).notNull(),
  message: text('message').notNull(),
  ticketId: int('ticket_id'),
  status: varchar('status', { length: 20 }).default('PENDING'),
  messageId: varchar('message_id', { length: 100 }),
  providerResponse: json('provider_response').$type<any>(),

  // Nullable timestamps (just remove defaultNow / notNull)
  sentAt: timestamp('sent_at', { mode: 'date' }),
  deliveredAt: timestamp('delivered_at', { mode: 'date' }),

  error: text('error'),
  cost: int('cost').default(1),
  isTest: boolean('is_test').default(false),

  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

export type SMSLog = typeof smsLogs.$inferSelect;
export type NewSMSLog = typeof smsLogs.$inferInsert;
