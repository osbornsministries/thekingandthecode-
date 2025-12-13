// db/schema.ts
import { int, mysqlTable, varchar, decimal, boolean, mysqlEnum, text } from 'drizzle-orm/mysql-core';



// 2. PAYMENT METHODS (Dynamic Payment Options)
export const paymentMethods = mysqlTable('payment_methods', {
  id: varchar('id', { length: 50 }).primaryKey(), // e.g., 'mpesa', 'tigopesa'
  name: varchar('name', { length: 100 }).notNull(), // e.g., "Vodacom M-Pesa"
  imageUrl: varchar('image_url', { length: 255 }).notNull(),
  colorClass: varchar('color_class', { length: 100 }), // e.g., "border-red-500 text-red-600"
  isActive: boolean('is_active').default(true),
});

