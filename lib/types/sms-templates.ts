// app/admin/sms-templates/types.ts
export interface SMSTemplate {
  id?: number;
  name: string;
  description?: string;
  content: string;
  variables: string[];
  category: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Ticket {
  id: number;
  ticketCode: string;
  purchaserName: string;
  purchaserPhone: string;
  ticketType: 'ADULT' | 'STUDENT' | 'CHILD';
  status: string;
  paymentStatus: string;
  sessionId: number;
  createdAt: string;
}

export interface Session {
  id: number;
  name: string;
  dayId: number;
  startTime: string;
  endTime: string;
}

export interface Day {
  id: number;
  name: string;
  date: string;
}

export interface SMSSendingResult {
  ticketCode: string;
  success: boolean;
  phone: string;
  error?: string;
}