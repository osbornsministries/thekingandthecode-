// lib/utils/ticket-validation.ts
import { db } from '@/lib/db/db';
import { checkSessionAvailability } from './session-limits';

export interface TicketPurchaseRequest {
  sessionId: number;
  tickets: {
    type: 'ADULT' | 'STUDENT' | 'CHILD';
    quantity: number;
  }[];
}

export async function validateTicketPurchase(request: TicketPurchaseRequest): Promise<{
  isValid: boolean;
  message?: string;
  availability?: any;
}> {
  try {
    // Get current availability
    const availability = await checkSessionAvailability(request.sessionId);

    // Check if session is active
    if (!availability.isActive) {
      return {
        isValid: false,
        message: 'This session is fully booked. Please select another session.',
        availability
      };
    }

    // Check each ticket type
    for (const ticket of request.tickets) {
      const categoryLimit = availability.categoryLimits[ticket.type.toLowerCase() as keyof typeof availability.categoryLimits];
      
      if (categoryLimit.available < ticket.quantity) {
        return {
          isValid: false,
          message: `Only ${categoryLimit.available} ${ticket.type.toLowerCase()} tickets available. You requested ${ticket.quantity}.`,
          availability
        };
      }
    }

    // Check total capacity
    const totalTickets = request.tickets.reduce((sum, t) => sum + t.quantity, 0);
    if (availability.totalAvailable < totalTickets) {
      return {
        isValid: false,
        message: `Only ${availability.totalAvailable} total tickets available. You requested ${totalTickets}.`,
        availability
      };
    }

    return {
      isValid: true,
      message: 'Tickets available for purchase',
      availability
    };

  } catch (error) {
    console.error('Error validating ticket purchase:', error);
    return {
      isValid: false,
      message: 'Error checking ticket availability. Please try again.'
    };
  }
}