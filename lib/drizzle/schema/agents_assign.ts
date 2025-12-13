// lib/drizzle/schema/agent-assignments.ts
import {
  mysqlTable,
  int,
  varchar,
  timestamp,
  json,
} from 'drizzle-orm/mysql-core';

export const agentAssignments = mysqlTable('agent_assignments', {
id: int('id').autoincrement().primaryKey(),


  ticketId: int('ticket_id').notNull(),
  agentId: varchar('agent_id', { length: 50 }).notNull(),

  assignedTo: varchar('assigned_to', { length: 100 }),
  assignedPhone: varchar('assigned_phone', { length: 20 }),
  assignedEmail: varchar('assigned_email', { length: 100 }),

  assignmentType: varchar('assignment_type', { length: 20 })
    .default('SCAN'),

  status: varchar('status', { length: 20 })
    .default('PENDING'),

  otpCode: varchar('otp_code', { length: 6 }),
  otpExpiry: timestamp('otp_expiry'),

  metadata: json('metadata'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
