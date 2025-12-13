import { int, timestamp, mysqlTable, varchar, decimal, serial,boolean, json } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { eventSessions } from './session';
import { transactions } from './transactions';
import { adults } from './adult';
import { students } from './student';
import { children } from './children';

export const tickets = mysqlTable('tickets', {
  id: int('id').autoincrement().primaryKey(),
  
  sessionId: int('session_id').notNull().references(() => eventSessions.id),
  
  ticketCode: varchar('ticket_code', { length: 64 }).notNull().unique(),
  purchaserName: varchar('purchaser_name', { length: 255 }),
  purchaserPhone: varchar('purchaser_phone', { length: 20 }),
  
  // --- ADD THIS LINE BACK ---
  ticketType: varchar('ticket_type', { length: 50 }).notNull().default('REGULAR'), 
  
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  paymentStatus: varchar('payment_status', { length: 20 }).default('UNPAID'), 
  paymentMethodId: varchar('payment_method_id', { length: 50 }),
  
  status: varchar('status', { length: 20 }).default('PENDING'),

    // ADD QUANTITY BREAKDOWN
  adultQuantity: int('adult_quantity').notNull().default(0),
  studentQuantity: int('student_quantity').notNull().default(0),
  childQuantity: int('child_quantity').notNull().default(0),
  totalQuantity: int('total_quantity').notNull().default(1),
  
  // totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  // paymentStatus: varchar('payment_status', { length: 20 }).default('UNPAID'), 
  // paymentMethodId: varchar('payment_method_id', { length: 50 }),
  
  // status: varchar('status', { length: 20 }).default('PENDING'),

  // ADD STUDENT INFO (optional)
  studentId: varchar('student_id', { length: 50 }),
  institution: varchar('institution', { length: 100 }),
  
  // ADD METADATA FOR LIMITS
  metadata: json('metadata'), // Store availability at purchase time

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});



export const agentAssignments = mysqlTable('agent_assignments', {
id: int('id').autoincrement().primaryKey(),
  ticketId: int('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  agentId: varchar('agent_id', { length: 50 }).notNull(), // User ID of the agent
  assignedTo: varchar('assigned_to', { length: 100 }), // Name of person assigned to
  assignedPhone: varchar('assigned_phone', { length: 20 }), // Phone number
  assignedEmail: varchar('assigned_email', { length: 100 }), // Email
  assignmentType: varchar('assignment_type', { length: 20 }).$type<'SCAN' | 'MANUAL' | 'SYNC'>().default('SCAN'),
  status: varchar('status', { length: 20 }).$type<'PENDING' | 'COMPLETED' | 'CANCELLED'>().default('PENDING'),
  otpCode: varchar('otp_code', { length: 6 }), // Optional OTP for verification
  otpExpiry: timestamp('otp_expiry'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type AgentAssignment = typeof agentAssignments.$inferSelect;
export type NewAgentAssignment = typeof agentAssignments.$inferInsert;

// Relationships
export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  session: one(eventSessions, {
    fields: [tickets.sessionId],
    references: [eventSessions.id],
  }),
  transactions: many(transactions),
  adults: many(adults),
  students: many(students),
  children: many(children),
}));