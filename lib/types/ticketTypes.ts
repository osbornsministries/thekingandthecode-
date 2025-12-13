// lib/types/ticket.ts

// --- DATABASE REF TYPES ---
export type AttendeeType = 'ADULT' | 'CHILD' | 'STUDENT';

export interface PriceConfig {
  id: number;
  name: string;
  type: AttendeeType;
  price: string; // Decimal comes as string from DB usually
  description: string | null;
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  imageUrl: string;
  colorClass: string | null;
}

export interface EventDayConfig {
  id: number;
  name: string;
  date: string; // "2024-12-25"
}

export interface EventSessionConfig {
  id: number;
  dayId: number;
  name: string;
  startTime: string; // "08:00:00"
  endTime: string;
}

// --- FORM STATE TYPES ---
// This is the shape of the data as the user fills the form
export interface AttendeeState {
  type: AttendeeType;
  fullName: string;
  // Conditional fields
  phoneNumber?: string;     // Adult
  studentId?: string;       // Student
  institution?: string;     // Student
  dateOfBirth?: string;     // Child
}

export interface TicketFormState {
  selectedDayId: number | null;
  selectedSessionId: number | null;
  attendees: AttendeeState[];
  paymentMethodId: string | null;
  purchaserName: string;
  purchaserPhone: string;
}


export type TicketType = 'ADULT' | 'STUDENT' | 'CHILD';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PENDING';
export type TicketStatus = 'PENDING' | 'CHECKED_IN' | 'CANCELLED' | 'EXPIRED';

export interface Ticket {
  id: number;
  sessionId: number;
  ticketCode: string;
  purchaserName: string | null;
  purchaserPhone: string | null;
  ticketType: TicketType;
  totalAmount: string;
  paymentStatus: PaymentStatus;
  paymentMethodId: string | null;
  status: TicketStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface TicketWithSession extends Ticket {
  session?: {
    id: number;
    name: string;
    startTime: string;
    dayId: number;
  };
}

export interface TicketFilters {
  search?: string;
  ticketType?: TicketType;
  paymentStatus?: PaymentStatus;
  status?: TicketStatus;
  startDate?: string;
  endDate?: string;
}