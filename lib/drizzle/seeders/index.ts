import "dotenv/config";
import { db } from '@/lib/db/db';
import { seedDatabase } from "./ConfigSeeder";
import { seedSchedule } from './ScheduleSeeder';
import { seedTickets } from './TicketSeeder'; 
import { seedUsers } from './UserSeeder'; 

async function main() {
  console.log('🚀 Starting Database Seed...');
  console.log('-----------------------------');

  try {
    // 1. CONFIG: Prices & Payment Methods (Essential for Tickets)
    await seedDatabase();

    // 2. SCHEDULE: Days & Sessions (Essential for Tickets)
    await seedSchedule();

    // 3. USERS: Admins/Staff (Independent)
    await seedUsers();

    // 4. TICKETS: Logic includes creating Tickets + Transactions + Attendees
    // This now handles the entire "Purchase Flow" simulation
    await seedTickets();
    
    console.log('-----------------------------');
    console.log('✨ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();