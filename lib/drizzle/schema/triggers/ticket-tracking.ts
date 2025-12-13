// lib/drizzle/schema/triggers/ticket-tracking.ts
import { db } from '@/lib/db/db';
import { tickets, eventSessions, ticketTracker } from '..';

import { eq, sql } from 'drizzle-orm';

// Function to initialize tracker for a session
export async function initSessionTracker(sessionId: number) {
  const existing = await db.query.ticketTracker.findFirst({
    where: eq(ticketTracker.sessionId, sessionId),
  });
  
  if (!existing) {
    await db.insert(ticketTracker).values({
      sessionId,
      // Default limits
      adultAvailable: 100,
      studentAvailable: 50,
      childAvailable: 50,
      totalAvailable: 200,
    });
  }
}

// Function to update tracker when ticket is created
export async function updateTrackerOnTicketCreate(ticketId: number) {
  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.id, ticketId),
    with: {
      session: true,
    },
  });
  
  if (!ticket || !ticket.session) return;
  
  await initSessionTracker(ticket.sessionId);
  
  // Calculate quantities
  let adultQty = 0;
  let studentQty = 0;
  let childQty = 0;
  
  if (ticket.ticketType === 'ADULT') adultQty = ticket.totalQuantity;
  else if (ticket.ticketType === 'STUDENT') studentQty = ticket.totalQuantity;
  else if (ticket.ticketType === 'CHILD') childQty = ticket.totalQuantity;
  
  const totalQty = ticket.totalQuantity;
  
  // Update tracker
  await db.update(ticketTracker)
    .set({
      adultBooked: sql`adult_booked + ${adultQty}`,
      studentBooked: sql`student_booked + ${studentQty}`,
      childBooked: sql`child_booked + ${studentQty}`,
      totalBooked: sql`total_booked + ${totalQty}`,
      adultAvailable: sql`adult_available - ${adultQty}`,
      studentAvailable: sql`student_available - ${studentQty}`,
      childAvailable: sql`child_available - ${childQty}`,
      totalAvailable: sql`total_available - ${totalQty}`,
      lastTicketAt: new Date(),
    })
    .where(eq(ticketTracker.sessionId, ticket.sessionId));
  
  // Check and update sold out status
  await checkAndUpdateSoldOutStatus(ticket.sessionId);
}

// Function to check if session is sold out
export async function checkAndUpdateSoldOutStatus(sessionId: number) {
  const tracker = await db.query.ticketTracker.findFirst({
    where: eq(ticketTracker.sessionId, sessionId),
  });
  
  if (!tracker) return;
  
  const isSoldOut = 
    tracker.adultAvailable <= 0 &&
    tracker.studentAvailable <= 0 &&
    tracker.childAvailable <= 0;
  
  // Update tracker
  await db.update(ticketTracker)
    .set({
      isSoldOut,
      isActive: !isSoldOut,
    })
    .where(eq(ticketTracker.sessionId, sessionId));
  
  // Also update session if you added isActive field
  await db.update(eventSessions)
    .set({ isActive: !isSoldOut })
    .where(eq(eventSessions.id, sessionId));
}

// Function to get current availability
export async function getSessionAvailability(sessionId: number) {
  await initSessionTracker(sessionId);
  
  const tracker = await db.query.ticketTracker.findFirst({
    where: eq(ticketTracker.sessionId, sessionId),
  });
  
  if (!tracker) {
    throw new Error('Tracker not found');
  }
  
  return {
    isActive: tracker.isActive && !tracker.isSoldOut,
    isSoldOut: tracker.isSoldOut,
    adult: {
      booked: tracker.adultBooked,
      available: tracker.adultAvailable,
      capacity: 100
    },
    student: {
      booked: tracker.studentBooked,
      available: tracker.studentAvailable,
      capacity: 50
    },
    child: {
      booked: tracker.childBooked,
      available: tracker.childAvailable,
      capacity: 50
    },
    total: {
      booked: tracker.totalBooked,
      available: tracker.totalAvailable,
      capacity: 200
    }
  };
}

// Function to validate before purchase
export async function validateTicketPurchase(
  sessionId: number,
  ticketType: 'ADULT' | 'STUDENT' | 'CHILD',
  quantity: number
) {
  const availability = await getSessionAvailability(sessionId);
  
  if (!availability.isActive) {
    return {
      isValid: false,
      message: 'This session is fully booked.',
      availability
    };
  }
  
  let availableForType = 0;
  let categoryName = '';
  
  switch (ticketType) {
    case 'ADULT':
      availableForType = availability.adult.available;
      categoryName = 'adult';
      break;
    case 'STUDENT':
      availableForType = availability.student.available;
      categoryName = 'student';
      break;
    case 'CHILD':
      availableForType = availability.child.available;
      categoryName = 'child';
      break;
  }
  
  if (availableForType < quantity) {
    return {
      isValid: false,
      message: `Only ${availableForType} ${categoryName} tickets available.`,
      availability
    };
  }
  
  if (availability.total.available < quantity) {
    return {
      isValid: false,
      message: `Only ${availability.total.available} total tickets available.`,
      availability
    };
  }
  
  return {
    isValid: true,
    message: 'Tickets available.',
    availability
  };
}

// Function to recalculate all sessions
export async function recalculateAllSessionTrackers() {
  const allSessions = await db.query.eventSessions.findMany();
  
  for (const session of allSessions) {
    await recalculateSessionTracker(session.id);
  }
}

// Recalculate from actual ticket data
export async function recalculateSessionTracker(sessionId: number) {
  // Get all tickets for this session
  const sessionTickets = await db.query.tickets.findMany({
    where: eq(tickets.sessionId, sessionId),
  });
  
  // Calculate totals
  let adultBooked = 0;
  let studentBooked = 0;
  let childBooked = 0;
  
  for (const ticket of sessionTickets) {
    if (ticket.ticketType === 'ADULT') adultBooked += ticket.totalQuantity;
    else if (ticket.ticketType === 'STUDENT') studentBooked += ticket.totalQuantity;
    else if (ticket.ticketType === 'CHILD') childBooked += ticket.totalQuantity;
  }
  
  const totalBooked = adultBooked + studentBooked + childBooked;
  
  const adultAvailable = Math.max(0, 100 - adultBooked);
  const studentAvailable = Math.max(0, 50 - studentBooked);
  const childAvailable = Math.max(0, 50 - childBooked);
  const totalAvailable = Math.max(0, 200 - totalBooked);
  
  const isSoldOut = totalAvailable <= 0;
  
  // Update or create tracker
  const existing = await db.query.ticketTracker.findFirst({
    where: eq(ticketTracker.sessionId, sessionId),
  });
  
  if (existing) {
    await db.update(ticketTracker)
      .set({
        adultBooked,
        studentBooked,
        childBooked,
        totalBooked,
        adultAvailable,
        studentAvailable,
        childAvailable,
        totalAvailable,
        isSoldOut,
        isActive: !isSoldOut,
        updatedAt: new Date(),
      })
      .where(eq(ticketTracker.sessionId, sessionId));
  } else {
    await db.insert(ticketTracker).values({
      sessionId,
      adultBooked,
      studentBooked,
      childBooked,
      totalBooked,
      adultAvailable,
      studentAvailable,
      childAvailable,
      totalAvailable,
      isSoldOut,
      isActive: !isSoldOut,
    });
  }
  
  // Update session
  await db.update(eventSessions)
    .set({ isActive: !isSoldOut })
    .where(eq(eventSessions.id, sessionId));
}