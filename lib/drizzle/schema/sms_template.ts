// lib/drizzle/schema/sms-templates.ts
import { mysqlTable, int, varchar, boolean, timestamp, text, json } from 'drizzle-orm/mysql-core';

export const smsTemplates = mysqlTable('sms_templates', {
  // FIX 1: Added primary key field (autoincrement requires primary key)
  id: int('id').autoincrement().primaryKey(),
  
  // FIX 2: Ensure name is required and unique as specified
  name: varchar('name', { length: 100 }).notNull().unique(),
  
  // FIX 3: Make description optional
  description: text('description'),
  
  // FIX 4: Content should be required (notNull)
  content: text('content').notNull(),
  
  // FIX 5: JSON field should specify type and provide default value
  // Use .$type<string[]>() to specify TypeScript type
  variables: json('variables').$type<string[]>().default([]),
  
  // FIX 6: Default to false for isActive
  isActive: boolean('is_active').default(false),
  
  // FIX 7: Set category default
  category: varchar('category', { length: 50 }).default('GENERAL'),
  
  // FIX 8: Add language field if needed
  language: varchar('language', { length: 10 }).default('en'),
  
  // FIX 9: Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Export type for TypeScript
export type SMSTemplate = typeof smsTemplates.$inferSelect;
export type NewSMSTemplate = typeof smsTemplates.$inferInsert;