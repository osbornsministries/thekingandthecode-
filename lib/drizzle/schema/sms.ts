// lib/drizzle/schema.ts
import { pgTable, text, integer, boolean, timestamp, json, serial } from 'drizzle-orm/pg-core';
import { tickets } from './tickets'; // Make sure this import path is correct

export const smsLogs = pgTable('sms_logs', {
  id: serial('id').primaryKey(), // Use serial for auto-increment
  phoneNumber: text('phone_number').notNull(),
  message: text('message').notNull(),
  messageType: text('message_type'), // e.g., 'WELCOME', 'CONFIRMATION', 'REMINDER'
  status: text('status').notNull(), // 'SENT', 'FAILED', 'DELIVERED'
  ticketId: integer('ticket_id').references(() => tickets.id),
  metadata: json('metadata'), // Store provider info, messageId, etc.
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Alternative if you prefer generatedAlwaysAsIdentity:
/*
export const smsLogs = pgTable('sms_logs', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(), // Make sure this matches your DB
  phoneNumber: text('phone_number').notNull(),
  message: text('message').notNull(),
  messageType: text('message_type'),
  status: text('status').notNull(),
  ticketId: integer('ticket_id').references(() => tickets.id, { onDelete: 'cascade' }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
*/