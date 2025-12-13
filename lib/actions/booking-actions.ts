// lib/actions/booking-actions.ts
'use server';

import { db } from '@/lib/db/db';
import * as schema from '@/lib/drizzle/schema';
import { validateTicketPurchase } from '@/lib/utils/ticket-validation';
import { revalidatePath } from 'next/cache';

export async function createBooking(formData: FormData) {
  try {
    const sessionId = Number(formData.get('sessionId'));
    const adultTickets = Number(formData.get('adultTickets')) || 0;
    const studentTickets = Number(formData.get('studentTickets')) || 0;
    const childTickets = Number(formData.get('childTickets')) || 0;

    // Prepare ticket request
    const tickets = [];
    if (adultTickets > 0) tickets.push({ type: 'ADULT', quantity: adultTickets });
    if (studentTickets > 0) tickets.push({ type: 'STUDENT', quantity: studentTickets });
    if (childTickets > 0) tickets.push({ type: 'CHILD', quantity: childTickets });

    // Validate before proceeding
    const validation = await validateTicketPurchase({
      sessionId,
      tickets
    });

    if (!validation.isValid) {
      return {
        success: false,
        message: validation.message || 'Ticket validation failed',
        availability: validation.availability
      };
    }

    // Create booking (you'll need to implement the actual booking logic)
    // This is a simplified example
    const booking = await db.insert(schema.bookings).values({
      sessionId,
      adultCount: adultTickets,
      studentCount: studentTickets,
      childCount: childTickets,
      // ... other booking fields
    });

    // Re-check and update session status after booking
    await checkSessionAvailability(sessionId);

    revalidatePath('/booking');
    
    return {
      success: true,
      message: 'Booking created successfully!',
      bookingId: booking.insertId
    };

  } catch (error: any) {
    console.error('Booking error:', error);
    return {
      success: false,
      message: error.message || 'Failed to create booking'
    };
  }
}