import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@/lib/drizzle/schema";

// 1. Declare a global type to hold the connection during hot-reloads
const globalForDb = globalThis as unknown as {
  conn: mysql.Pool | undefined;
};

// 2. Reuse the existing pool if it exists, otherwise create a new one
const pool = globalForDb.conn ?? mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 5, // Keep this low for dev
  queueLimit: 0
});

// 3. Save the pool to the global object in development
if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = pool;
}

// 4. Initialize Drizzle
export const db = drizzle(pool, { schema, mode: "default" });