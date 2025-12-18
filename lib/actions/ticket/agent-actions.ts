// lib/actions/ticket/agent-actions.ts
'use server';

import { db } from '@/lib/db/db';
import { 
  tickets, ticketAssignments, adults, students, children,
  eventSessions, eventDays, transactions, ticketPrices
} from '@/lib/drizzle/schema';
import { eq, and, like, or } from 'drizzle-orm';

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
  totalAmount: number;
  isValid: boolean;
  canBeAssigned: boolean;
  eventInfo?: {
    dayName: string;
    sessionName: string;
    sessionTime: string;
    date: Date;
  };
  attendeeInfo?: any;
  error?: string;
}

export interface AttendeeSearchResult {
  id: number;
  name: string;
  phone: string;
  email?: string;
  studentId?: string;
  institution?: string;
  type: 'ADULT' | 'STUDENT' | 'CHILD' | 'GENERAL';
  hasActiveTicket: boolean;
  existingTicketCode?: string;
}

export interface AssignmentData {
  ticketId: number;
  assigneeName: string;
  assigneePhone: string;
  assigneeEmail?: string;
  assigneeType?: 'ADULT' | 'STUDENT' | 'CHILD';
  agentId: string;
  requireOtp?: boolean;
  otpCode?: string;
  otpExpiry?: Date;
  notes?: string;
}

export interface AssignmentResult {
  success: boolean;
  message: string;
  assignmentId?: number;
  data?: any;
  error?: string;
}

// ----------------------------------------------------------------------
// TICKET SCANNING FOR ASSIGNMENT
// ----------------------------------------------------------------------
export async function scanTicketForAssignment(rawCode: string): Promise<{
  success: boolean;
  data?: TicketScanResult;
  error?: string;
}> {
  try {
    // Sanitize the code
    const code = rawCode.includes('/') 
      ? rawCode.split('/').pop()?.trim() 
      : rawCode.trim();
    
    if (!code || code.length < 8) {
      return {
        success: false,
        error: 'Invalid ticket code format'
      };
    }
    
    // Lookup ticket
    const ticket = await db.select()
      .from(tickets)
      .where(eq(tickets.ticketCode, code))
      .then(rows => rows[0]);
    
    if (!ticket) {
      return {
        success: false,
        error: 'Ticket not found'
      };
    }
    
    // Check if ticket can be assigned
    const canBeAssigned = (
      // ticket.status === 'ACTIVE' && 
      // ticket.paymentStatus === 'PAID' &&
      !ticket.isAssigned // You might want to add this field
    );
    
    if (!canBeAssigned) {
      return {
        success: false,
        error: `Ticket cannot be assigned. Status: ${ticket.status}, Payment: ${ticket.paymentStatus}`
      };
    }
    
    // Check for existing assignment
    const existingAssignment = await db.select()
      .from(ticketAssignments)
      .where(
        and(
          eq(ticketAssignments.ticketId, ticket.id),
          eq(ticketAssignments.status, 'ACTIVE')
        )
      )
      .then(rows => rows[0]);
    
    if (existingAssignment) {
      return {
        success: false,
        error: `Ticket already assigned to: ${existingAssignment.assignedTo}`
      };
    }
    
    // Get event information
    const session = await db.select()
      .from(eventSessions)
      .where(eq(eventSessions.id, ticket.sessionId))
      .then(rows => rows[0]);
    
    const day = session ? await db.select()
      .from(eventDays)
      .where(eq(eventDays.id, session.dayId))
      .then(rows => rows[0]) : null;
    
    // Get attendee information
    let attendeeInfo = null;
    if (ticket.ticketType === 'ADULT') {
      const adultAttendees = await db.select()
        .from(adults)
        .where(eq(adults.ticketId, ticket.id))
        .then(rows => rows);
      if (adultAttendees.length > 0) {
        attendeeInfo = {
          type: 'ADULT',
          attendees: adultAttendees.map(a => ({
            name: a.fullName,
            phone: a.phoneNumber
          }))
        };
      }
    } else if (ticket.ticketType === 'STUDENT') {
      const studentAttendees = await db.select()
        .from(students)
        .where(eq(students.ticketId, ticket.id))
        .then(rows => rows);
      if (studentAttendees.length > 0) {
        attendeeInfo = {
          type: 'STUDENT',
          attendees: studentAttendees.map(s => ({
            name: s.fullName,
            phone: s.phoneNumber,
            studentId: s.studentId,
            institution: s.institutionName
          }))
        };
      }
    } else if (ticket.ticketType === 'CHILD') {
      const childAttendees = await db.select()
        .from(children)
        .where(eq(children.ticketId, ticket.id))
        .then(rows => rows);
      if (childAttendees.length > 0) {
        attendeeInfo = {
          type: 'CHILD',
          attendees: childAttendees.map(c => ({
            name: c.fullName,
            parent: c.parentName
          }))
        };
      }
    }
    
    const result: TicketScanResult = {
      ticketId: ticket.id,
      ticketCode: ticket.ticketCode,
      ticketType: ticket.ticketType,
      originalOwner: ticket.purchaserName,
      originalPhone: ticket.purchaserPhone,
      status: ticket.status,
      paymentStatus: ticket.paymentStatus,
      totalAmount: parseFloat(ticket.totalAmount),
      isValid: true,
      canBeAssigned: true,
      eventInfo: day && session ? {
        dayName: day.name,
        sessionName: session.name,
        sessionTime: `${session.startTime} - ${session.endTime}`,
        date: day.date
      } : undefined,
      attendeeInfo
    };
    
    return {
      success: true,
      data: result
    };
    
  } catch (error: any) {
    console.error('Error scanning ticket:', error);
    return {
      success: false,
      error: `Scan failed: ${error.message}`
    };
  }
}

// ----------------------------------------------------------------------
// SEARCH ATTENDEES
// ----------------------------------------------------------------------
export async function searchAttendees(searchTerm: string): Promise<{
  success: boolean;
  data: AttendeeSearchResult[];
  error?: string;
}> {
  try {
    const search = `%${searchTerm}%`;
    
    // Search in adults
    const adultResults = await db.select({
      id: adults.id,
      name: adults.fullName,
      phone: adults.phoneNumber,
      type: 'ADULT' as const,
    })
    .from(adults)
    .where(
      or(
        like(adults.fullName, search),
        like(adults.phoneNumber, search)
      )
    )
    .limit(10);
    
    // Search in students
    const studentResults = await db.select({
      id: students.id,
      name: students.fullName,
      phone: students.phoneNumber,
      studentId: students.studentId,
      institution: students.institutionName,
      type: 'STUDENT' as const,
    })
    .from(students)
    .where(
      or(
        like(students.fullName, search),
        like(students.phoneNumber, search),
        like(students.studentId || '', search)
      )
    )
    .limit(10);
    
    // Search in children
    const childResults = await db.select({
      id: children.id,
      name: children.fullName,
      phone: children.parentName, // Parent's name as phone placeholder
      type: 'CHILD' as const,
    })
    .from(children)
    .where(
      or(
        like(children.fullName, search),
        like(children.parentName || '', search)
      )
    )
    .limit(10);
    
    // Combine results
    const combinedResults = [
      ...adultResults.map(r => ({
        ...r,
        hasActiveTicket: false, // You might want to check this
        existingTicketCode: undefined
      })),
      ...studentResults.map(r => ({
        ...r,
        phone: r.phone || 'N/A',
        hasActiveTicket: false,
        existingTicketCode: undefined
      })),
      ...childResults.map(r => ({
        ...r,
        phone: 'N/A', // Children don't have phone
        hasActiveTicket: false,
        existingTicketCode: undefined
      }))
    ];
    
    // Check if they have active tickets
    for (const result of combinedResults) {
      let attendeeTicketId;
      
      if (result.type === 'ADULT') {
        const adult = await db.select({ ticketId: adults.ticketId })
          .from(adults)
          .where(eq(adults.id, result.id))
          .then(rows => rows[0]);
        attendeeTicketId = adult?.ticketId;
      } else if (result.type === 'STUDENT') {
        const student = await db.select({ ticketId: students.ticketId })
          .from(students)
          .where(eq(students.id, result.id))
          .then(rows => rows[0]);
        attendeeTicketId = student?.ticketId;
      } else if (result.type === 'CHILD') {
        const child = await db.select({ ticketId: children.ticketId })
          .from(children)
          .where(eq(children.id, result.id))
          .then(rows => rows[0]);
        attendeeTicketId = child?.ticketId;
      }
      
      if (attendeeTicketId) {
        const ticket = await db.select({
          ticketCode: tickets.ticketCode,
          status: tickets.status
        })
        .from(tickets)
        .where(eq(tickets.id, attendeeTicketId))
        .then(rows => rows[0]);
        
        result.hasActiveTicket = ticket?.status === 'ACTIVE';
        result.existingTicketCode = ticket?.ticketCode;
      }
    }
    
    return {
      success: true,
      data: combinedResults.slice(0, 20) // Limit total results
    };
    
  } catch (error: any) {
    console.error('Error searching attendees:', error);
    return {
      success: false,
      data: [],
      error: `Search failed: ${error.message}`
    };
  }
}

// ----------------------------------------------------------------------
// GENERATE OTP
// ----------------------------------------------------------------------
export async function generateOtp(phone: string): Promise<{
  success: boolean;
  otp?: string;
  error?: string;
}> {
  try {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In production, you would send this OTP via SMS
    console.log(`OTP for ${phone}: ${otp}`);
    
    // Store OTP in database with expiry (optional)
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    return {
      success: true,
      otp
    };
    
  } catch (error: any) {
    console.error('Error generating OTP:', error);
    return {
      success: false,
      error: `Failed to generate OTP: ${error.message}`
    };
  }
}

// ----------------------------------------------------------------------
// ASSIGN TICKET TO ATTENDEE
// ----------------------------------------------------------------------
export async function assignTicketToAttendee(assignmentData: AssignmentData): Promise<AssignmentResult> {
  try {
    // Verify ticket exists and is assignable
    const ticket = await db.select()
      .from(tickets)
      .where(eq(tickets.id, assignmentData.ticketId))
      .then(rows => rows[0]);
    
    if (!ticket) {
      return {
        success: false,
        error: 'Ticket not found'
      };
    }
    
    if (ticket.status !== 'ACTIVE' || ticket.paymentStatus !== 'PAID') {
      return {
        success: false,
        error: `Ticket cannot be assigned. Status: ${ticket.status}, Payment: ${ticket.paymentStatus}`
      };
    }
    
    // Check for existing active assignment
    const existingAssignment = await db.select()
      .from(ticketAssignments)
      .where(
        and(
          eq(ticketAssignments.ticketId, assignmentData.ticketId),
          eq(ticketAssignments.status, 'ACTIVE')
        )
      )
      .then(rows => rows[0]);
    
    if (existingAssignment) {
      return {
        success: false,
        error: `Ticket already assigned to: ${existingAssignment.assignedTo}`
      };
    }
    
    // Create assignment record
    const assignment = await db.insert(ticketAssignments).values({
      ticketId: assignmentData.ticketId,
      assignedTo: assignmentData.assigneeName,
      assignedPhone: assignmentData.assigneePhone,
      assignedEmail: assignmentData.assigneeEmail,
      assigneeType: assignmentData.assigneeType || 'GENERAL',
      agentId: assignmentData.agentId,
      status: 'ACTIVE',
      assignmentType: 'AGENT_ASSIGNED',
      metadata: JSON.stringify({
        requireOtp: assignmentData.requireOtp,
        otpVerified: assignmentData.requireOtp && assignmentData.otpCode ? true : false,
        otpExpiry: assignmentData.otpExpiry,
        originalOwner: {
          name: ticket.purchaserName,
          phone: ticket.purchaserPhone
        },
        notes: assignmentData.notes,
        assignmentTimestamp: new Date().toISOString()
      }),
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Update ticket metadata to mark as assigned
    await db.update(tickets)
      .set({
        metadata: JSON.stringify({
          ...JSON.parse(ticket.metadata || '{}'),
          isAssigned: true,
          assignedTo: assignmentData.assigneeName,
          assignedPhone: assignmentData.assigneePhone,
          assignmentId: assignment[0].id,
          assignmentDate: new Date().toISOString(),
          assignedByAgent: assignmentData.agentId
        }),
        updatedAt: new Date()
      })
      .where(eq(tickets.id, assignmentData.ticketId));
    
    // Send confirmation to new assignee (optional)
    if (assignmentData.assigneePhone && assignmentData.assigneePhone !== 'N/A') {
      // Send SMS notification
      const message = `Hello ${assignmentData.assigneeName},\n\n` +
        `You have been assigned a ticket for the event.\n` +
        `Ticket Code: ${ticket.ticketCode}\n` +
        `Event: ${ticket.metadata ? JSON.parse(ticket.metadata).dayName || '' : ''}\n` +
        `Please present this ticket at the entrance.\n\n` +
        `Thank you!`;
      
      // await sendSMS(assignmentData.assigneePhone, message);
      console.log(`SMS would be sent to ${assignmentData.assigneePhone}: ${message}`);
    }
    
    return {
      success: true,
      message: 'Ticket assigned successfully',
      assignmentId: assignment[0].id,
      data: {
        ticketCode: ticket.ticketCode,
        assigneeName: assignmentData.assigneeName,
        assigneePhone: assignmentData.assigneePhone,
        assignmentDate: new Date().toISOString()
      }
    };
    
  } catch (error: any) {
    console.error('Error assigning ticket:', error);
    return {
      success: false,
      error: `Assignment failed: ${error.message}`
    };
  }
}

// ----------------------------------------------------------------------
// GET AGENT ASSIGNMENTS
// ----------------------------------------------------------------------
export async function getAgentAssignments(agentId: string, limit: number = 50): Promise<{
  success: boolean;
  data: any[];
  error?: string;
}> {
  try {
    const assignments = await db.select({
      assignment: ticketAssignments,
      ticket: tickets
    })
    .from(ticketAssignments)
    .innerJoin(tickets, eq(ticketAssignments.ticketId, tickets.id))
    .where(eq(ticketAssignments.agentId, agentId))
    .orderBy(ticketAssignments.createdAt)
    .limit(limit);
    
    return {
      success: true,
      data: assignments
    };
    
  } catch (error: any) {
    console.error('Error fetching agent assignments:', error);
    return {
      success: false,
      data: [],
      error: `Failed to fetch assignments: ${error.message}`
    };
  }
}

// ----------------------------------------------------------------------
// GET ASSIGNMENT BY TICKET CODE
// ----------------------------------------------------------------------
export async function getAssignmentByTicketCode(ticketCode: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const result = await db.select({
      assignment: ticketAssignments,
      ticket: tickets
    })
    .from(ticketAssignments)
    .innerJoin(tickets, eq(ticketAssignments.ticketId, tickets.id))
    .where(eq(tickets.ticketCode, ticketCode))
    .then(rows => rows[0]);
    
    if (!result) {
      return {
        success: false,
        error: 'No assignment found for this ticket'
      };
    }
    
    return {
      success: true,
      data: result
    };
    
  } catch (error: any) {
    console.error('Error fetching assignment:', error);
    return {
      success: false,
      error: `Failed to fetch assignment: ${error.message}`
    };
  }
}

// ----------------------------------------------------------------------
// CANCEL/REVOKE ASSIGNMENT
// ----------------------------------------------------------------------
export async function cancelAssignment(assignmentId: number, agentId: string): Promise<AssignmentResult> {
  try {
    const assignment = await db.select()
      .from(ticketAssignments)
      .where(eq(ticketAssignments.id, assignmentId))
      .then(rows => rows[0]);
    
    if (!assignment) {
      return {
        success: false,
        error: 'Assignment not found'
      };
    }
    
    if (assignment.agentId !== agentId) {
      return {
        success: false,
        error: 'You can only cancel your own assignments'
      };
    }
    
    // Mark assignment as cancelled
    await db.update(ticketAssignments)
      .set({
        status: 'CANCELLED',
        updatedAt: new Date(),
        metadata: JSON.stringify({
          ...JSON.parse(assignment.metadata || '{}'),
          cancelledAt: new Date().toISOString(),
          cancelledBy: agentId,
          reason: 'Cancelled by agent'
        })
      })
      .where(eq(ticketAssignments.id, assignmentId));
    
    // Update ticket metadata
    const ticket = await db.select()
      .from(tickets)
      .where(eq(tickets.id, assignment.ticketId))
      .then(rows => rows[0]);
    
    if (ticket) {
      await db.update(tickets)
        .set({
          metadata: JSON.stringify({
            ...JSON.parse(ticket.metadata || '{}'),
            isAssigned: false,
            assignmentCancelled: true,
            assignmentCancelledAt: new Date().toISOString()
          }),
          updatedAt: new Date()
        })
        .where(eq(tickets.id, assignment.ticketId));
    }
    
    return {
      success: true,
      message: 'Assignment cancelled successfully'
    };
    
  } catch (error: any) {
    console.error('Error cancelling assignment:', error);
    return {
      success: false,
      error: `Failed to cancel assignment: ${error.message}`
    };
  }
}