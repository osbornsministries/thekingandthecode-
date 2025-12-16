// lib/drizzle/schema.ts
import { mysqlTable, int, varchar, text, json, timestamp } from 'drizzle-orm/mysql-core';
import {tickets}  from './tickets'

export const ticketAssignments = mysqlTable('ticket_assignments', {
  id: int('id').primaryKey().autoincrement(),
  ticketId: int('ticket_id').notNull().references(() => tickets.id),
  assignedTo: varchar('assigned_to', { length: 255 }).notNull(), // Person who receives the ticket
  assignedPhone: varchar('assigned_phone', { length: 20 }),
  assignedEmail: varchar('assigned_email', { length: 255 }),
  assigneeType: varchar('assignee_type', { length: 50 }), // 'ADULT', 'STUDENT', 'CHILD', 'GENERAL'
  agentId: varchar('agent_id', { length: 100 }).notNull(), // Agent who performed the assignment
  status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // 'ACTIVE', 'CANCELLED', 'REVOKED'
  assignmentType: varchar('assignment_type', { length: 50 }), // 'AGENT_ASSIGNED', 'TRANSFER', 'REASSIGNMENT'
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});