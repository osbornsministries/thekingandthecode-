// /lib/utils/ticket-utils.ts
import { TicketType } from "../types/ticketTypes";

// Dynamic ticket pricing and validation
export interface TicketPricing {
  type: TicketType;
  name: string;
  price: number;
  description?: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  ageRequirement?: {
    min?: number;
    max?: number;
  };
  validationRules?: string[];
}

export const TICKET_TYPES: Record<TicketType, TicketPricing> = {
  'ADULT': {
    type: 'ADULT',
    name: 'Adult',
    price: 15000, // Example price
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-100',
    textColor: 'text-blue-700',
    ageRequirement: { min: 18 },
    validationRules: ['Must have valid ID']
  },
  'STUDENT': {
    type: 'STUDENT',
    name: 'Student',
    price: 10000,
    color: 'green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-100',
    textColor: 'text-green-700',
    validationRules: ['Must show student ID', 'Valid school/college ID required']
  },
  'CHILD': {
    type: 'CHILD',
    name: 'Child',
    price: 5000,
    color: 'pink',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-100',
    textColor: 'text-pink-700',
    ageRequirement: { max: 17 },
    validationRules: ['Must be accompanied by adult']
  },
 

};

// Helper to get ticket type info
export function getTicketTypeInfo(type: TicketType): TicketPricing {
  return TICKET_TYPES[type] 
}

// Calculate total price for multiple tickets
export function calculateTotalPrice(ticketType: TicketType, quantity: number): number {
  const ticketInfo = getTicketTypeInfo(ticketType);
  return ticketInfo.price * quantity;
}

// Validate ticket based on type
export function validateTicket(ticketType: TicketType, data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const ticketInfo = getTicketTypeInfo(ticketType);
  
  // Check age requirements
  if (ticketInfo.ageRequirement) {
    if (ticketInfo.ageRequirement.min && data.age < ticketInfo.ageRequirement.min) {
      errors.push(`Must be at least ${ticketInfo.ageRequirement.min} years old`);
    }
    if (ticketInfo.ageRequirement.max && data.age > ticketInfo.ageRequirement.max) {
      errors.push(`Must be under ${ticketInfo.ageRequirement.max} years old`);
    }
  }
  

  
  return {
    valid: errors.length === 0,
    errors
  };
}