// lib/actions/agent-actions.ts
'use server';

import { db } from '@/lib/db/db';
import { 
  tickets, adults, students, children, 
  eventDays, eventSessions, agentAssignments 
} from '@/lib/drizzle/schema';
import { eq, and, or, desc, isNull, not } from 'drizzle-orm';
import { randomInt } from 'crypto';

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------
export interface TicketScanResult {
  ticketId: number;
  ticketCode: string;
  ticketType: 'ADULT' | 'STUDENT' | 'CHILD';
  originalOwner: string;
  originalPhone: string;
  status: string;
  paymentStatus: string;
  isValid: boolean;
  isAssigned: boolean;
  assignedTo?: string;
  assignedPhone?: string;
  eventInfo?: {
    dayName: string;
    sessionName: string;
    sessionTime: string;
  };
  price: number;
  createdAt: Date;
}

export interface AttendeeSearchResult {
  id: number;
  name: string;
  phone: string;
  email?: string;
  type: 'ADULT' | 'STUDENT' | 'CHILD';
  studentId?: string;
  institution?: string;
  hasActiveTicket: boolean;
  ticketId?: number;
}

export interface AssignmentData {
  ticketId: number;
  assigneeName: string;
  assigneePhone: string;
  assigneeEmail?: string;
  agentId: string;
  requireOtp?: boolean;
}

// ----------------------------------------------------------------------
// TICKET SCANNING & VALIDATION
// ----------------------------------------------------------------------
export async function scanTicketForAssignment(ticketCode: string): Promise<{
  success: boolean;
  data?: TicketScanResult;
  error?: string;
}> {
  try {
    // Find ticket
    const ticket = await db.select()
      .from(tickets)
      .where(eq(tickets.ticketCode, ticketCode))
      .then(rows => rows[0]);

    if (!ticket) {
      return { 
        success: false, 
        error: 'Ticket not found' 
      };
    }

    // Check if ticket is already assigned
    const existingAssignment = await db.select()
      .from(agentAssignments)
      .where(and(
        eq(agentAssignments.ticketId, ticket.id),
        eq(agentAssignments.status, 'COMPLETED')
      ))
      .then(rows => rows[0]);

    if (existingAssignment) {
      return { 
        success: false, 
        error: 'Ticket already assigned' 
      };
    }

    // Get event info
    const session = await db.select()
      .from(eventSessions)
      .where(eq(eventSessions.id, ticket.sessionId))
      .then(rows => rows[0]);

    const day = session ? await db.select()
      .from(eventDays)
      .where(eq(eventDays.id, session.dayId))
      .then(rows => rows[0]) : null;

    // Get original attendee info
    let originalOwner = 'Walk-in POS';
    let originalPhone = 'N/A';

    if (ticket.ticketType === 'ADULT') {
      const adult = await db.select()
        .from(adults)
        .where(eq(adults.ticketId, ticket.id))
        .then(rows => rows[0]);
      if (adult) {
        originalOwner = adult.fullName;
        originalPhone = adult.phoneNumber;
      }
    } else if (ticket.ticketType === 'STUDENT') {
      const student = await db.select()
        .from(students)
        .where(eq(students.ticketId, ticket.id))
        .then(rows => rows[0]);
      if (student) {
        originalOwner = student.fullName;
        originalPhone = student.phoneNumber;
      }
    } else if (ticket.ticketType === 'CHILD') {
      const child = await db.select()
        .from(children)
        .where(eq(children.ticketId, ticket.id))
        .then(rows => rows[0]);
      if (child) {
        originalOwner = child.fullName;
        originalPhone = 'N/A';
      }
    }

    const result: TicketScanResult = {
      ticketId: ticket.id,
      ticketCode: ticket.ticketCode,
      ticketType: ticket.ticketType,
      originalOwner,
      originalPhone,
      status: ticket.status,
      paymentStatus: ticket.paymentStatus,
      isValid: ticket.status === 'ACTIVE' && ticket.paymentStatus === 'PAID',
      isAssigned: !!existingAssignment,
      eventInfo: day && session ? {
        dayName: day.name,
        sessionName: session.name,
        sessionTime: `${session.startTime} - ${session.endTime}`
      } : undefined,
      price: parseFloat(ticket.totalAmount),
      createdAt: ticket.createdAt || new Date()
    };

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Scan error:', error);
    return { 
      success: false, 
      error: 'Failed to scan ticket' 
    };
  }
}

// ----------------------------------------------------------------------
// ATTENDEE SEARCH
// ----------------------------------------------------------------------
export async function searchAttendees(searchTerm: string): Promise<{
  success: boolean;
  data: AttendeeSearchResult[];
  error?: string;
}> {
  try {
    const term = `%${searchTerm}%`;
    
    // Search in adults
    const adultResults = await db.select({
      id: adults.id,
      name: adults.fullName,
      phone: adults.phoneNumber,
      type: 'ADULT' as const,
      studentId: null,
      institution: null
    })
    .from(adults)
    .where(or(
      adults.fullName.ilike(term),
      adults.phoneNumber.ilike(term)
    ))
    .limit(10);

    // Search in students
    const studentResults = await db.select({
      id: students.id,
      name: students.fullName,
      phone: 'N/A',
      type: 'STUDENT' as const,
      studentId: students.studentId,
      institution: students.institutionName
    })
    .from(students)
    .where(or(
      students.fullName.ilike(term),
      students.studentId.ilike(term),
      students.institutionName.ilike(term)
    ))
    .limit(10);

    // Search in children
    const childResults = await db.select({
      id: children.id,
      name: children.fullName,
      phone: 'N/A',
      type: 'CHILD' as const,
      studentId: null,
      institution: null
    })
    .from(children)
    .where(children.fullName.ilike(term))
    .limit(10);

    // Combine and check for active tickets
    const allResults = [...adultResults, ...studentResults, ...childResults];
    
    const resultsWithTicketCheck = await Promise.all(
      allResults.map(async (result) => {
        const attendeeTickets = await db.select()
          .from(tickets)
          .where(and(
            or(
              result.type === 'ADULT' ? eq(tickets.id, result.id) : undefined,
              result.type === 'STUDENT' ? eq(tickets.id, result.id) : undefined,
              result.type === 'CHILD' ? eq(tickets.id, result.id) : undefined
            ),
            eq(tickets.status, 'ACTIVE'),
            eq(tickets.paymentStatus, 'PAID')
          ))
          .then(rows => rows[0]);

        return {
          ...result,
          hasActiveTicket: !!attendeeTickets,
          ticketId: attendeeTickets?.id
        };
      })
    );

    return {
      success: true,
      data: resultsWithTicketCheck
    };
  } catch (error: any) {
    console.error('Search error:', error);
    return {
      success: false,
      data: [],
      error: 'Search failed'
    };
  }
}

// ----------------------------------------------------------------------
// GENERATE OTP
// ----------------------------------------------------------------------
export async function generateOtp(phone: string): Promise<{
  success: boolean;
  otp?: string;
  expiry?: Date;
  error?: string;
}> {
  try {
    // Generate 6-digit OTP
    const otp = randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // TODO: Send OTP via SMS (integrate with your SMS service)
    console.log(`OTP for ${phone}: ${otp}`);
    
    return {
      success: true,
      otp,
      expiry
    };
  } catch (error: any) {
    return {
      success: false,
      error: 'Failed to generate OTP'
    };
  }
}

// ----------------------------------------------------------------------
// ASSIGN TICKET TO ATTENDEE
// ----------------------------------------------------------------------
export async function assignTicketToAttendee(data: AssignmentData & {
  otpCode?: string;
  otpExpiry?: Date;
}): Promise<{
  success: boolean;
  assignmentId?: number;
  error?: string;
}> {
  try {
    // Check if ticket is still available
    const existingAssignment = await db.select()
      .from(agentAssignments)
      .where(and(
        eq(agentAssignments.ticketId, data.ticketId),
        eq(agentAssignments.status, 'COMPLETED')
      ))
      .then(rows => rows[0]);

    if (existingAssignment) {
      return {
        success: false,
        error: 'Ticket already assigned to another attendee'
      };
    }

    // Create assignment record
 const result = await db.insert(agentAssignments).values({
  ticketId: data.ticketId,
  agentId: data.agentId,
  assignedTo: data.assigneeName,
  assignedPhone: data.assigneePhone,
  assignedEmail: data.assigneeEmail,
  assignmentType: 'MANUAL',
  status: 'COMPLETED',
  otpCode: data.otpCode,
  otpExpiry: data.otpExpiry,
  metadata: JSON.stringify({
    assignedAt: new Date().toISOString(),
    requireOtp: data.requireOtp || false
  })
});

// Get the inserted assignment ID (MySQL)
const assignmentId = result.insertId;

// Optionally, fetch the full assignment row if needed
const assignment = await db.query.agentAssignments.findFirst({
  where: eq(agentAssignments.id, assignmentId),
});


    // Update the attendee record based on ticket type
    const ticket = await db.select()
      .from(tickets)
      .where(eq(tickets.id, data.ticketId))
      .then(rows => rows[0]);

    if (!ticket) {
      return {
        success: false,
        error: 'Ticket not found'
      };
    }

    // Update the attendee information
    if (ticket.ticketType === 'ADULT') {
      await db.update(adults)
        .set({
          fullName: data.assigneeName,
          phoneNumber: data.assigneePhone,
          updatedAt: new Date()
        })
        .where(eq(adults.ticketId, data.ticketId));
    } else if (ticket.ticketType === 'STUDENT') {
      await db.update(students)
        .set({
          fullName: data.assigneeName,
          updatedAt: new Date()
        })
        .where(eq(students.ticketId, data.ticketId));
    } else if (ticket.ticketType === 'CHILD') {
      await db.update(children)
        .set({
          fullName: data.assigneeName,
          updatedAt: new Date()
        })
        .where(eq(children.ticketId, data.ticketId));
    }

    return {
      success: true,
      assignmentId: assignment.id
    };
  } catch (error: any) {
    console.error('Assignment error:', error);
    return {
      success: false,
      error: 'Failed to assign ticket'
    };
  }
}

// ----------------------------------------------------------------------
// GET AGENT ASSIGNMENT HISTORY
// ----------------------------------------------------------------------
export async function getAgentAssignments(agentId: string, limit: number = 20): Promise<{
  success: boolean;
  data: any[];
  error?: string;
}> {
  try {
    const assignments = await db.select({
      assignment: agentAssignments,
      ticket: tickets,
      day: eventDays,
      session: eventSessions
    })
    .from(agentAssignments)
    .innerJoin(tickets, eq(agentAssignments.ticketId, tickets.id))
    .innerJoin(eventSessions, eq(tickets.sessionId, eventSessions.id))
    .innerJoin(eventDays, eq(eventSessions.dayId, eventDays.id))
    .where(eq(agentAssignments.agentId, agentId))
    .orderBy(desc(agentAssignments.createdAt))
    .limit(limit);

    return {
      success: true,
      data: assignments
    };
  } catch (error: any) {
    return {
      success: false,
      data: [],
      error: 'Failed to fetch assignments'
    };
  }
}