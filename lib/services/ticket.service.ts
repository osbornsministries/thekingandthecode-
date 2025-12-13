import { db } from '@/lib/db/db';
import { tickets } from '@/lib/drizzle/schema';
import { validateTicketPurchase } from '../utils/session-limits';
import { updateSessionCountsAfterPurchase } from '../utils/session-limits';

export async function createTicket({
  sessionId,
  ticketType,
  quantity,
  userId,
}: {
  sessionId: number;
  ticketType: 'ADULT' | 'STUDENT' | 'CHILD';
  quantity: number;
  userId: number;
}) {
  // 1️⃣ Validate availability
  const validation = await validateTicketPurchase(
    sessionId,
    ticketType,
    quantity
  );

  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  // 2️⃣ Insert ticket
// Insert ticket
const result = await db.insert(tickets).values({
  sessionId,
  ticketType,
  totalQuantity: quantity,
  userId,
});

// Get the inserted ticket ID
const ticketId = result.insertId;

// Optionally fetch the full ticket row if needed
const ticket = await db.query.tickets.findFirst({
  where: eq(tickets.id, ticketId),
});

  // 3️⃣ Update session limits (🔥 THIS IS THE TRIGGER)
  await updateSessionCountsAfterPurchase(
    sessionId,
    ticketType === 'ADULT' ? quantity : 0,
    ticketType === 'STUDENT' ? quantity : 0,
    ticketType === 'CHILD' ? quantity : 0
  );

  return ticket;
}
