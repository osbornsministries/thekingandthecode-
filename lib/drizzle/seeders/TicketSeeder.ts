// lib/drizzle/seeders/TicketSeeder.ts
import { db } from '@/lib/db/db';
import { tickets, transactions, adults, students, children, eventSessions, eventDays, ticketPrices, paymentMethods } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { faker } from '@faker-js/faker';

export async function seedTickets() {
  try {
    console.log('🎟️ Starting ticket seeding...');
    
    // First, fetch all required data
    const sessions = await db.select().from(eventSessions);
    const days = await db.select().from(eventDays);
    const prices = await db.select().from(ticketPrices);
    const methods = await db.select().from(paymentMethods);
    
    if (sessions.length === 0 || days.length === 0 || prices.length === 0 || methods.length === 0) {
      throw new Error('Required data (sessions, days, prices, or payment methods) is missing. Run event seeder first.');
    }
    
    console.log(`📊 Found: ${sessions.length} sessions, ${days.length} days, ${prices.length} prices, ${methods.length} payment methods`);
    
    // Generate realistic ticket data
    const ticketCount = 50; // Number of tickets to generate
    const ticketsData = [];
    
    for (let i = 0; i < ticketCount; i++) {
      const session = faker.helpers.arrayElement(sessions);
      const price = faker.helpers.arrayElement(prices);
      const paymentMethod = faker.helpers.arrayElement(methods);
      const ticketType = faker.helpers.arrayElement(['ADULT', 'STUDENT', 'CHILD']);
      const quantity = faker.number.int({ min: 1, max: 4 });
      const totalAmount = parseFloat(price.price) * quantity;
      
      // Generate unique ticket code
      const ticketCode = `TK${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;
      
      // Generate realistic Tanzanian phone number
      const phone = `2557${faker.number.int({ min: 10000000, max: 99999999 })}`;
      
      ticketsData.push({
        sessionId: session.id,
        ticketCode,
        purchaserName: faker.person.fullName(),
        purchaserPhone: phone,
        ticketType,
        totalAmount: totalAmount.toString(),
        status: faker.helpers.arrayElement(['ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED']),
        paymentStatus: faker.helpers.arrayElement(['PAID', 'PENDING', 'FAILED']),
        paymentMethodId: paymentMethod.id,
        metadata: JSON.stringify({
          studentId: ticketType === 'STUDENT' ? `STU${faker.number.int({ min: 100000, max: 999999 })}` : undefined,
          institution: ticketType === 'STUDENT' ? faker.helpers.arrayElement(['UNIVERSITY', 'SECONDARY', 'OTHER']) : undefined,
          institutionName: ticketType === 'STUDENT' ? faker.company.name() : undefined,
          dayName: days.find(d => d.id === session.dayId)?.name,
          sessionName: session.name,
          seededAt: new Date().toISOString()
        })
      });
    }
    
    // Insert tickets
    console.log(`📝 Inserting ${ticketsData.length} tickets...`);
    await db.insert(tickets).values(ticketsData);
    
    console.log('✅ Tickets seeded successfully!');
  } catch (error: any) {
    console.error('❌ Ticket seeding failed:', error.message);
    throw error;
  }
}