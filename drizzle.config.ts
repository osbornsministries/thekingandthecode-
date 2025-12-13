import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/drizzle/schema/index.ts", // Point to the index file
  out: "./lib/drizzle/migrations",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});