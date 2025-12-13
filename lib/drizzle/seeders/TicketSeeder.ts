import { db } from '@/lib/db/db';
import { tickets, adults, students, children, transactions } from '../schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const SESSIONS = [1, 2]; // Assuming these IDs exist from ScheduleSeeder
const PROVIDERS = ['mpesa', 'tigopesa', 'airtel', 'azampay'];

export async function seedTickets() {
  console.log('🎟️ Seeding Realistic Transaction Flows...');

  // Generate 10 Random Scenarios
  const scenarios = Array.from({ length: 10 }).map((_, i) => ({
    name: `Guest ${i + 1}`,
    phone: `07${Math.floor(Math.random() * 100000000)}`,
    // 70% chance of success, 30% failure
    paymentOutcome: Math.random() > 0.3 ? 'SUCCESS' : 'FAILED', 
    type: Math.random() > 0.5 ? 'ADULT' : 'STUDENT'
  }));

  for (const scenario of scenarios) {
    const ticketCode = randomUUID();
    const sessionId = SESSIONS[Math.floor(Math.random() * SESSIONS.length)];
    const provider = PROVIDERS[Math.floor(Math.random() * PROVIDERS.length)];
    
    // 1. CREATE TICKET (Initially PENDING/UNPAID)
    // We do NOT hardcode 'PAID' here. We let the transaction decide.
    const [ticket] = await db.insert(tickets).values({
      ticketCode: ticketCode,
      sessionId: sessionId,
      purchaserName: scenario.name,
      purchaserPhone: scenario.phone,
      ticketType: 'REGULAR',
      totalAmount: '50000.00',
      paymentStatus: 'UNPAID', // <--- Starts as UNPAID
      status: 'PENDING'
    }).$returningId();

    console.log(`   👉 Created Ticket ${ticket.id} for ${scenario.name} (Pending)...`);

    // 2. CREATE TRANSACTION (Random Outcome)
    const isSuccess = scenario.paymentOutcome === 'SUCCESS';
    const failReason = isSuccess ? null : 'Insufficient Funds';

    await db.insert(transactions).values({
      ticketId: ticket.id,
      externalId: randomUUID(),
      provider: provider,
      accountNumber: scenario.phone,
      amount: '50000.00',
      currency: 'TZS',
      // The crucial status
      status: isSuccess ? 'success' : 'failed',
      message: isSuccess ? 'Transaction Completed' : failReason,
      rawResponse: { 
        success: isSuccess, 
        response_code: isSuccess ? '200' : '402' 
      }
    });

    // 3. AUTOMATE THE UPDATE (Mimic the Webhook)
    // In real life, AzamPay calls your API, and your API runs this update.
    if (isSuccess) {
      await db.update(tickets)
        .set({ paymentStatus: 'PAID', status: 'CONFIRMED' })
        .where(eq(tickets.id, ticket.id));
      
      console.log(`      ✅ Payment Success! Ticket ${ticket.id} marked as PAID.`);
    } else {
      await db.update(tickets)
        .set({ paymentStatus: 'FAILED', status: 'CANCELLED' })
        .where(eq(tickets.id, ticket.id));

      console.log(`      ❌ Payment Failed. Ticket ${ticket.id} marked as FAILED.`);
    }

    // 4. ADD ATTENDEES (Only if paid, or add them anyway but they will be blocked at gate)
    // It's better to add them so you can test "Scanning a Failed Ticket"
    if (scenario.type === 'ADULT') {
      await db.insert(adults).values({
        ticketId: ticket.id,
        fullName: scenario.name,
        phoneNumber: scenario.phone,
        isUsed: false // New ticket, not used yet
      });
    } else {
      await db.insert(students).values({
        ticketId: ticket.id,
        fullName: `${scenario.name} (Student)`,
        studentId: `ST-${Math.floor(Math.random() * 1000)}`,
        institution: 'UDSM',
        isUsed: false
      });
    }
  }

  console.log('   ✅ Realistic Seeding Complete.');
}