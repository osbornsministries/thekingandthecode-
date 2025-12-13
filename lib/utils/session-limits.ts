// lib/drizzle/schema/utils/session-limits-utils.ts
import { db } from '@/lib/db/db';
import { eventSessions, sessionLimits, tickets } from '@/lib/drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';

export interface SessionAvailability {
  isActive: boolean;
  isSoldOut: boolean;
  categoryLimits: {
    adult: { available: number; total: number; booked: number };
    student: { available: number; total: number; booked: number };
    child: { available: number; total: number; booked: number };
  };
  totalAvailable: number;
  totalCapacity: number;
  totalBooked: number;
}

// Initialize session limits if not exists
export async function ensureSessionLimits(sessionId: number) {
  const existing = await db.query.sessionLimits.findFirst({
    where: eq(sessionLimits.sessionId, sessionId),
  });
  
  if (!existing) {
    await db.insert(sessionLimits).values({
      sessionId,
      // Default limits: 100 adult, 50 student, 50 child, 200 total
      adultCapacity: 100,
      studentCapacity: 50,
      childCapacity: 50,
      totalCapacity: 200,
      adultAvailable: 100,
      studentAvailable: 50,
      childAvailable: 50,
      totalAvailable: 200,
    });
  }
}

// Get session availability
export async function getSessionAvailability(sessionId: number): Promise<SessionAvailability> {
  // Ensure limits exist
  await ensureSessionLimits(sessionId);
  
  const sessionWithLimits = await db.query.sessionLimits.findFirst({
    where: eq(sessionLimits.sessionId, sessionId),
    with: {
      session: true,
    },
  });
  
  if (!sessionWithLimits) {
    throw new Error('Session limits not found');
  }
  
  // Calculate if sold out
  const isSoldOut = 
    sessionWithLimits.adultAvailable <= 0 &&
    sessionWithLimits.studentAvailable <= 0 &&
    sessionWithLimits.childAvailable <= 0 &&
    sessionWithLimits.totalAvailable <= 0;
  
  const isActive = sessionWithLimits.isActive && !isSoldOut && sessionWithLimits.session.isActive;
  
  return {
    isActive,
    isSoldOut,
    categoryLimits: {
      adult: {
        available: Math.max(0, sessionWithLimits.adultAvailable),
        total: sessionWithLimits.adultCapacity,
        booked: sessionWithLimits.adultBooked
      },
      student: {
        available: Math.max(0, sessionWithLimits.studentAvailable),
        total: sessionWithLimits.studentCapacity,
        booked: sessionWithLimits.studentBooked
      },
      child: {
        available: Math.max(0, sessionWithLimits.childAvailable),
        total: sessionWithLimits.childCapacity,
        booked: sessionWithLimits.childBooked
      }
    },
    totalAvailable: Math.max(0, sessionWithLimits.totalAvailable),
    totalCapacity: sessionWithLimits.totalCapacity,
    totalBooked: sessionWithLimits.totalBooked
  };
}

// Validate ticket purchase
export async function validateTicketPurchase(
  sessionId: number,
  ticketType: 'ADULT' | 'STUDENT' | 'CHILD',
  quantity: number
) {
  const availability = await getSessionAvailability(sessionId);
  
  if (!availability.isActive) {
    return {
      isValid: false,
      message: 'This session is not available for booking.',
      availability
    };
  }
  
  let availableForType = 0;
  let categoryName = '';
  
  switch (ticketType) {
    case 'ADULT':
      availableForType = availability.categoryLimits.adult.available;
      categoryName = 'adult';
      break;
    case 'STUDENT':
      availableForType = availability.categoryLimits.student.available;
      categoryName = 'student';
      break;
    case 'CHILD':
      availableForType = availability.categoryLimits.child.available;
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
  
  if (availability.totalAvailable < quantity) {
    return {
      isValid: false,
      message: `Only ${availability.totalAvailable} total tickets available.`,
      availability
    };
  }
  
  return {
    isValid: true,
    message: 'Tickets available for purchase.',
    availability
  };
}

// Update session counts after purchase
export async function updateSessionCountsAfterPurchase(
  sessionId: number,
  adultQuantity: number,
  studentQuantity: number,
  childQuantity: number
) {
  await ensureSessionLimits(sessionId);
  
  const totalQuantity = adultQuantity + studentQuantity + childQuantity;
  
  await db.update(sessionLimits)
    .set({
      adultBooked: sql`adult_booked + ${adultQuantity}`,
      studentBooked: sql`student_booked + ${studentQuantity}`,
      childBooked: sql`child_booked + ${childQuantity}`,
      totalBooked: sql`total_booked + ${totalQuantity}`,
      adultAvailable: sql`adult_available - ${adultQuantity}`,
      studentAvailable: sql`student_available - ${studentQuantity}`,
      childAvailable: sql`child_available - ${childQuantity}`,
      totalAvailable: sql`total_available - ${totalQuantity}`,
      isSoldOut: sql`(
        (adult_available - ${adultQuantity}) <= 0 AND
        (student_available - ${studentQuantity}) <= 0 AND
        (child_available - ${childQuantity}) <= 0
      )`,
    })
    .where(eq(sessionLimits.sessionId, sessionId));
}

// Check and update all sessions
export async function updateAllSessionsStatus() {
  const allSessions = await db.query.eventSessions.findMany({
    with: { limits: true },
  });
  
  for (const session of allSessions) {
    if (session.limits) {
      const isSoldOut = 
        session.limits.adultAvailable <= 0 &&
        session.limits.studentAvailable <= 0 &&
        session.limits.childAvailable <= 0;
      
      await db.update(sessionLimits)
        .set({
          isSoldOut,
          isActive: !isSoldOut,
        })
        .where(eq(sessionLimits.sessionId, session.id));
      
      // Also update the main session table if you added isActive
      await db.update(eventSessions)
        .set({ isActive: !isSoldOut })
        .where(eq(eventSessions.id, session.id));
    }
  }
}