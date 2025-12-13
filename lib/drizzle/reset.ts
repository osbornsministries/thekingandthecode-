import "dotenv/config";
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/db';

async function reset() {
  console.log('🗑️  Resetting Database...');

  try {
    // 1. Disable Foreign Key Checks (so we can drop parent tables freely)
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);

    // 2. Dynamic Query: Get all table names in the current database
    // We use information_schema to get the exact list dynamically
    const [tables]: any = await db.execute(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()`
    );

    if (tables.length === 0) {
      console.log('   ℹ️  Database is already empty.');
    } else {
      // 3. Loop through every table found and drop it
      for (const row of tables) {
        // Handle inconsistent casing (MySQL returns TABLE_NAME or table_name depending on config)
        const tableName = row.TABLE_NAME || row.table_name;
        
        if (tableName) {
          // We use sql.raw to inject the table name directly into the DROP statement
          await db.execute(sql.raw(`DROP TABLE IF EXISTS \`${tableName}\``));
          console.log(`   🔥 Dropped table: ${tableName}`);
        }
      }
    }

    // 4. Re-enable Foreign Key Checks
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);

    console.log('✅ Database is clean and ready.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  }
}

reset();