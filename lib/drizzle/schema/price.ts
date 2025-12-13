// db/schema.ts
import { int, mysqlTable, varchar, decimal, boolean, mysqlEnum, text } from 'drizzle-orm/mysql-core';

// 1. PRICES (The "Constants")
export const ticketPrices = mysqlTable('ticket_prices', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 50 }).notNull(), // e.g., "Adult", "Student", "Child"
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  type: mysqlEnum('type', ['ADULT', 'CHILD', 'STUDENT']).notNull(), 
  description: varchar('description', { length: 255 }), // e.g., "Must have ID"
  isActive: boolean('is_active').default(true),
});
