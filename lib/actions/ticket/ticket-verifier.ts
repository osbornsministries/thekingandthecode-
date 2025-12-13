// lib/actions/ticket-verifier.ts
'use server';

import { db } from '@/lib/db/db';
import { randomUUID } from 'crypto'; 
import { 
  tickets, adults, students, children, 
  eventSessions, eventDays, transactions
} from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------
export interface VerificationStep {
  step: string;
  passed: boolean;
  message: string;
  details?: any;
  timestamp: Date;
  
}

export interface VerificationResult {
  success: boolean;
  error?: string;
  step?: string;
  details?: string;
  data?: any;
  verificationSteps: VerificationStep[];
}

// ----------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------
function createSimpleLogger(service: string) {
  return {
    info: (message: string, data?: any) => {
      console.log(`[${service}] INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '');
    },
    error: (message: string, error?: any) => {
      console.error(`[${service}] ERROR: ${message}`, error || '');
    }
  };
}

function getCurrentTimeEAT() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Dar_es_Salaam" }));
}

function isSameDay(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatTime(timeStr: string) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

// ----------------------------------------------------------------------
// VALIDATION STEPS
// ----------------------------------------------------------------------
async function sanitizeInput(rawCode: string): Promise<{
  success: boolean;
  code?: string;
  step?: VerificationStep;
}> {
  const sanitizationStart = new Date();
  const code = rawCode.includes('/') ? rawCode.split('/').pop()?.trim() : rawCode.trim();
  
  if (!code || code.length < 8) {
    return {
      success: false,
      step: {
        step: 'INPUT_SANITIZATION',
        passed: false,
        message: 'Invalid ticket code format',
        details: { input: rawCode, sanitized: code },
        timestamp: sanitizationStart
      }
    };
  }
  
  return {
    success: true,
    code,
    step: {
      step: 'INPUT_SANITIZATION',
      passed: true,
      message: 'Ticket code sanitized successfully',
      details: { input: rawCode, sanitized: code },
      timestamp: sanitizationStart
    }
  };
}

async function lookupTicket(code: string): Promise<{
  success: boolean;
  ticket?: any;
  session?: any;
  day?: any;
  transactions?: any[];
  attendeeInfo?: any;
  studentData?: any;
  steps: VerificationStep[];
}> {
  const steps: VerificationStep[] = [];
  const lookupStart = new Date();
  
  try {
    const ticket = await db.select()
      .from(tickets)
      .where(eq(tickets.ticketCode, code))
      .then(rows => rows[0]);

    if (!ticket) {
      steps.push({
        step: 'DATABASE_LOOKUP',
        passed: false,
        message: 'Ticket not found in database',
        details: { code },
        timestamp: lookupStart
      });
      return { success: false, steps };
    }
    
    const session = await db.select()
      .from(eventSessions)
      .where(eq(eventSessions.id, ticket.sessionId))
      .then(rows => rows[0]);
    
    if (!session) {
      steps.push({
        step: 'DATABASE_LOOKUP',
        passed: false,
        message: 'Session not found for ticket',
        details: { sessionId: ticket.sessionId },
        timestamp: lookupStart
      });
      return { success: false, steps };
    }
    
    const day = await db.select()
      .from(eventDays)
      .where(eq(eventDays.id, session.dayId))
      .then(rows => rows[0]);
    
    if (!day) {
      steps.push({
        step: 'DATABASE_LOOKUP',
        passed: false,
        message: 'Day not found for session',
        details: { dayId: session.dayId },
        timestamp: lookupStart
      });
      return { success: false, steps };
    }
    
    const ticketTransactions = await db.select()
      .from(transactions)
      .where(eq(transactions.ticketId, ticket.id))
      .then(rows => rows);

    let attendeeInfo = null;
    let studentData = null;
    
    if (ticket.ticketType === 'ADULT') {
      const adultAttendees = await db.select()
        .from(adults)
        .where(eq(adults.ticketId, ticket.id))
        .limit(1);
      if (adultAttendees.length > 0) {
        attendeeInfo = {
          type: 'Adult',
          name: adultAttendees[0].fullName,
          phone: adultAttendees[0].phoneNumber
        };
      }
    } else if (ticket.ticketType === 'STUDENT') {
      const studentAttendees = await db.select()
        .from(students)
        .where(eq(students.ticketId, ticket.id))
        .limit(1);
      if (studentAttendees.length > 0) {
        attendeeInfo = {
          type: 'Student',
          name: studentAttendees[0].fullName,
          institutionType: studentAttendees[0].institutionType,
          institutionName: studentAttendees[0].institutionName,
          studentId: studentAttendees[0].studentId
        };
        studentData = {
          studentId: studentAttendees[0].studentId,
          institution: studentAttendees[0].institutionName,
          phone: studentAttendees[0].phoneNumber
        };
      }
    } else if (ticket.ticketType === 'CHILD') {
      const childAttendees = await db.select()
        .from(children)
        .where(eq(children.ticketId, ticket.id))
        .limit(1);
      if (childAttendees.length > 0) {
        attendeeInfo = {
          type: 'Child',
          name: childAttendees[0].fullName,
          parent: childAttendees[0].parentName
        };
      }
    }
    
    steps.push({
      step: 'DATABASE_LOOKUP',
      passed: true,
      message: 'Ticket found in database',
      details: {
        ticketId: ticket.id,
        purchaser: ticket.purchaserName,
        type: ticket.ticketType,
        status: ticket.status
      },
      timestamp: lookupStart
    });

    return {
      success: true,
      ticket,
      session,
      day,
      transactions: ticketTransactions,
      attendeeInfo,
      studentData,
      steps
    };

  } catch (error: any) {
    steps.push({
      step: 'DATABASE_LOOKUP',
      passed: false,
      message: 'Database lookup error',
      details: { error: error.message },
      timestamp: lookupStart
    });
    return { success: false, steps };
  }
}

async function verifyPayment(ticket: any, transactions: any[]): Promise<{
  passed: boolean;
  step: VerificationStep;
}> {
  const paymentCheckStart = new Date();
  const isPaid = ticket.paymentStatus === 'PAID' || 
                 ticket.paymentStatus === 'COMPLIMENTARY' ||
                 transactions.some(t => t.status === 'COMPLETED' || t.status === 'SUCCESS');

  if (!isPaid) {
    return {
      passed: false,
      step: {
        step: 'PAYMENT_VERIFICATION',
        passed: false,
        message: 'Ticket payment not verified',
        details: {
          paymentStatus: ticket.paymentStatus,
          transactions: transactions.map(t => ({
            provider: t.provider,
            status: t.status,
            amount: t.amount
          }))
        },
        timestamp: paymentCheckStart
      }
    };
  }
  
  return {
    passed: true,
    step: {
      step: 'PAYMENT_VERIFICATION',
      passed: true,
      message: 'Payment verified successfully',
      details: {
        paymentStatus: ticket.paymentStatus,
        transactionCount: transactions.length,
        latestTransaction: transactions[0] ? {
          provider: transactions[0].provider,
          status: transactions[0].status,
          amount: transactions[0].amount
        } : null
      },
      timestamp: paymentCheckStart
    }
  };
}

async function verifyStudentId(
  ticketType: string,
  studentData: any,
  requireStudentIdCheck: boolean
): Promise<{
  passed: boolean;
  step?: VerificationStep;
}> {
  if (ticketType !== 'STUDENT' || !requireStudentIdCheck) {
    return { passed: true };
  }

  const studentCheckStart = new Date();
  
  if (!studentData || !studentData.studentId) {
    return {
      passed: false,
      step: {
        step: 'STUDENT_ID_VERIFICATION',
        passed: false,
        message: 'Student ID not found in ticket records',
        details: { ticketType: 'STUDENT' },
        timestamp: studentCheckStart
      }
    };
  }
  
  const studentIdRegex = /^[A-Z0-9\-]+$/;
  if (!studentIdRegex.test(studentData.studentId)) {
    return {
      passed: false,
      step: {
        step: 'STUDENT_ID_VERIFICATION',
        passed: false,
        message: 'Invalid student ID format',
        details: { studentId: studentData.studentId },
        timestamp: studentCheckStart
      }
    };
  }
  
  return {
    passed: true,
    step: {
      step: 'STUDENT_ID_VERIFICATION',
      passed: true,
      message: 'Student ID verified',
      details: {
        studentId: studentData.studentId,
        institution: studentData.institution,
        note: 'Physical ID card verification still required at entry'
      },
      timestamp: studentCheckStart
    }
  };
}

function validateDate(day: any): { passed: boolean; step: VerificationStep } {
  const dateCheckStart = new Date();
  const now = getCurrentTimeEAT();
  const eventDate = new Date(day.date);
  const isToday = isSameDay(now, eventDate);

  if (!isToday) {
    return {
      passed: false,
      step: {
        step: 'DATE_VALIDATION',
        passed: false,
        message: 'Ticket is not valid for today',
        details: {
          today: now.toDateString(),
          eventDate: eventDate.toDateString(),
          difference: Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        },
        timestamp: dateCheckStart
      }
    };
  }
  
  return {
    passed: true,
    step: {
      step: 'DATE_VALIDATION',
      passed: true,
      message: 'Date validation passed - ticket is valid for today',
      details: {
        today: now.toDateString(),
        eventDate: eventDate.toDateString()
      },
      timestamp: dateCheckStart
    }
  };
}

function validateTime(session: any, day: any): { passed: boolean; step: VerificationStep } {
  const timeCheckStart = new Date();
  const now = getCurrentTimeEAT();
  const eventDate = new Date(day.date);
  
  const sessionStart = new Date(eventDate);
  const sessionEnd = new Date(eventDate);
  
  const [startH, startM] = session.startTime.split(':').map(Number);
  const [endH, endM] = session.endTime.split(':').map(Number);
  
  sessionStart.setHours(startH, startM, 0);
  sessionEnd.setHours(endH, endM, 0);

  // Allow entry 2 hours before start
  const entryStart = new Date(sessionStart.getTime() - (2 * 60 * 60 * 1000));
  
  const isTimeValid = now >= entryStart && now <= sessionEnd;

  if (!isTimeValid) {
    return {
      passed: false,
      step: {
        step: 'TIME_VALIDATION',
        passed: false,
        message: 'Ticket is not valid at this time',
        details: {
          currentTime: now.toLocaleTimeString(),
          sessionTime: `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`,
          entryWindow: `${new Date(entryStart).toLocaleTimeString()} - ${new Date(sessionEnd).toLocaleTimeString()}`
        },
        timestamp: timeCheckStart
      }
    };
  }
  
  return {
    passed: true,
    step: {
      step: 'TIME_VALIDATION',
      passed: true,
      message: 'Time validation passed',
      details: {
        currentTime: now.toLocaleTimeString(),
        sessionTime: `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`,
        status: now < sessionStart ? 'Entry allowed (early arrival)' : 'Entry allowed (during session)'
      },
      timestamp: timeCheckStart
    }
  };
}

function validateUsage(ticket: any): { passed: boolean; step: VerificationStep } {
  const usageCheckStart = new Date();
  if (ticket.status === 'USED' || ticket.status === 'ALL_USED') {
    return {
      passed: false,
      step: {
        step: 'USAGE_VALIDATION',
        passed: false,
        message: 'Ticket has already been used',
        details: {
          currentStatus: ticket.status,
          lastUpdated: ticket.updatedAt
        },
        timestamp: usageCheckStart
      }
    };
  }
  
  return {
    passed: true,
    step: {
      step: 'USAGE_VALIDATION',
      passed: true,
      message: 'Ticket has not been used yet',
      details: {
        currentStatus: ticket.status,
        lastUpdated: ticket.updatedAt
      },
      timestamp: usageCheckStart
    }
  };
}

async function updateTicketStatus(ticket: any, studentData: any): Promise<VerificationStep> {
  const updateStart = new Date();
  const now = getCurrentTimeEAT();
  
  await db.update(tickets)
    .set({ 
      status: 'USED',
      updatedAt: now
    })
    .where(eq(tickets.id, ticket.id));

  // Update student attendee status if applicable
  if (ticket.ticketType === 'STUDENT' && studentData) {
    await db.update(students)
      .set({ 
        isUsed: true,
        scannedAt: now
      })
      .where(eq(students.ticketId, ticket.id));
  }
  
  return {
    step: 'STATUS_UPDATE',
    passed: true,
    message: 'Ticket status updated to USED',
    details: {
      oldStatus: ticket.status,
      newStatus: 'USED',
      timestamp: now.toISOString(),
      ...(ticket.ticketType === 'STUDENT' && {
        studentMarked: true,
        scannedAt: now.toISOString()
      })
    },
    timestamp: updateStart
  };
}

// ----------------------------------------------------------------------
// MAIN ACTION: Verify Ticket
// ----------------------------------------------------------------------
export async function verifyTicket(rawCode: string, requireStudentIdCheck: boolean = false): Promise<VerificationResult> {
  const logger = createSimpleLogger('ticket-verification');
  const verificationSteps: VerificationStep[] = [];
  const startTime = new Date();
  
  try {
    // Step 1: Input Sanitization
    const sanitization = await sanitizeInput(rawCode);
    if (!sanitization.success) {
      verificationSteps.push(sanitization.step!);
      return { 
        success: false, 
        error: 'Invalid ticket code format',
        verificationSteps 
      };
    }
    verificationSteps.push(sanitization.step!);

    // Step 2: Database Lookup
    const lookup = await lookupTicket(sanitization.code!);
    if (!lookup.success) {
      verificationSteps.push(...lookup.steps);
      return { 
        success: false, 
        error: 'Ticket not found',
        verificationSteps 
      };
    }
    verificationSteps.push(...lookup.steps);

    const { ticket, session, day, transactions, attendeeInfo, studentData } = lookup;

    // Step 3: Payment Verification
    const payment = await verifyPayment(ticket, transactions);
    if (!payment.passed) {
      verificationSteps.push(payment.step);
      return {
        success: false,
        step: 'PAYMENT',
        error: 'Payment Not Verified',
        details: 'Ticket has not been paid for',
        verificationSteps
      };
    }
    verificationSteps.push(payment.step);

    // Step 4: Student ID Verification
    const studentIdCheck = await verifyStudentId(ticket.ticketType, studentData, requireStudentIdCheck);
    if (!studentIdCheck.passed) {
      verificationSteps.push(studentIdCheck.step!);
      return {
        success: false,
        step: 'STUDENT_ID',
        error: 'Student ID Verification Required',
        details: 'This student ticket requires ID verification. Please check student ID card.',
        verificationSteps
      };
    }
    if (studentIdCheck.step) {
      verificationSteps.push(studentIdCheck.step);
    }

    // Step 5: Date Validation
    const dateValidation = validateDate(day);
    if (!dateValidation.passed) {
      verificationSteps.push(dateValidation.step);
      return {
        success: false,
        step: 'DAY',
        error: 'Wrong Day',
        details: `Valid on ${new Date(day.date).toDateString()} only`,
        verificationSteps
      };
    }
    verificationSteps.push(dateValidation.step);

    // Step 6: Session Time Validation
    const timeValidation = validateTime(session, day);
    if (!timeValidation.passed) {
      verificationSteps.push(timeValidation.step);
      return {
        success: false,
        step: 'SESSION',
        error: 'Invalid Session Time',
        details: `Allowed entry: ${formatTime(session.startTime)} (opens 2 hours before)`,
        verificationSteps
      };
    }
    verificationSteps.push(timeValidation.step);

    // Step 7: Usage Validation
    const usageValidation = validateUsage(ticket);
    if (!usageValidation.passed) {
      verificationSteps.push(usageValidation.step);
      return {
        success: false,
        step: 'USAGE',
        error: 'Ticket Already Used',
        details: 'This ticket was scanned previously',
        verificationSteps
      };
    }
    verificationSteps.push(usageValidation.step);

    // Step 8: Attendee Validation
    const attendeeCheckStart = new Date();
    if (attendeeInfo) {
      verificationSteps.push({
        step: 'ATTENDEE_VALIDATION',
        passed: true,
        message: 'Attendee information validated',
        details: attendeeInfo,
        timestamp: attendeeCheckStart
      });
    } else {
      verificationSteps.push({
        step: 'ATTENDEE_VALIDATION',
        passed: true,
        message: 'No specific attendee record found, using purchaser info',
        details: { purchaserName: ticket.purchaserName },
        timestamp: attendeeCheckStart
      });
    }

    // Step 9: Update Status
    const statusUpdate = await updateTicketStatus(ticket, studentData);
    verificationSteps.push(statusUpdate);

    const endTime = new Date();
    const totalDuration = endTime.getTime() - startTime.getTime();

    // Summary
    const passedSteps = verificationSteps.filter(step => step.passed).length;
    const totalSteps = verificationSteps.length;

    logger.info('Verification completed successfully', {
      ticketId: ticket.id,
      durationMs: totalDuration,
      stepsPassed: `${passedSteps}/${totalSteps}`,
      ticketType: ticket.ticketType,
      ...(ticket.ticketType === 'STUDENT' && {
        studentId: studentData?.studentId,
        institution: studentData?.institution
      })
    });

    return {
      success: true,
      message: 'Access Granted',
      data: {
        verificationId: randomUUID(),
        timestamp: getCurrentTimeEAT().toISOString(),
        durationMs: totalDuration,
        summary: {
          purchaser: ticket.purchaserName,
          phone: ticket.purchaserPhone,
          ticketType: ticket.ticketType,
          ...(ticket.ticketType === 'STUDENT' && {
            studentId: studentData?.studentId,
            institution: studentData?.institution,
            note: 'Student ID must be presented for physical verification'
          }),
          session: session.name,
          time: `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`,
          day: day.name,
          date: new Date(day.date).toLocaleDateString(),
          verificationScore: `${passedSteps}/${totalSteps} steps passed`
        },
        attendee: attendeeInfo || { type: 'General', name: ticket.purchaserName },
        ...(ticket.ticketType === 'STUDENT' && {
          studentVerification: {
            required: true,
            studentId: studentData?.studentId,
            institution: studentData?.institution,
            phone: studentData?.phone,
            reminder: 'Physical student ID card must be presented'
          }
        })
      },
      verificationSteps
    };

  } catch (error: any) {
    logger.error('Verification error:', error);
    
    verificationSteps.push({
      step: 'SYSTEM_ERROR',
      passed: false,
      message: 'System error occurred during verification',
      details: {
        error: error.message,
        stack: error.stack
      },
      timestamp: new Date()
    });

    return {
      success: false,
      error: 'System error during verification',
      verificationSteps
    };
  }
}

// ----------------------------------------------------------------------
// ACTION: Get Verification History
// ----------------------------------------------------------------------
export async function getVerificationHistory(ticketId?: number, limit: number = 50) {
  const logger = createSimpleLogger('verification-history');
  
  try {
    let query = db.select()
      .from(tickets)
      .where(eq(tickets.status, 'USED'))
      .orderBy(tickets.updatedAt)
      .limit(limit);

    if (ticketId) {
      query = query.where(eq(tickets.id, ticketId));
    }

    const verifiedTickets = await query;

    logger.info('Retrieved verification history', { count: verifiedTickets.length });

    return {
      success: true,
      data: verifiedTickets.map(ticket => ({
        id: ticket.id,
        code: ticket.ticketCode,
        purchaser: ticket.purchaserName,
        type: ticket.ticketType,
        verifiedAt: ticket.updatedAt,
        sessionId: ticket.sessionId,
        paymentMethod: ticket.paymentMethodId
      }))
    };
  } catch (error: any) {
    logger.error('Failed to fetch verification history:', error);
    return {
      success: false,
      error: 'Failed to fetch verification history'
    };
  }
}