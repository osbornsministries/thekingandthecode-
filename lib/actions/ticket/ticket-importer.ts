// lib/actions/ticket-importer.ts
'use server';

import { db } from '@/lib/db/db';
import { SMSService } from '@/lib/services/sms';
import { Logger } from '@/lib/logger/logger';
import { 
  tickets, transactions, adults, students, children, 
  eventSessions, eventDays, ticketPrices, paymentMethods
} from '@/lib/drizzle/schema';
import { eq, and, sql, like, or, inArray } from 'drizzle-orm';
// import { smsLogs } from '@/lib/drizzle/schema';

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------
export interface ImportTicketData {
  dayId: number;
  sessionId: number;
  priceId: number;
  quantity: number;
  paymentMethodId: string;
  fullName: string;
  phone: string;
  totalAmount: number;
  ticketType: 'ADULT' | 'STUDENT' | 'CHILD';
  studentId?: string;
  institution?: string;
  institutionName?: string;
  isPaid?: boolean;
  paymentStatus?: 'PAID' | 'PENDING' | 'FAILED';
  externalId?: string;
  transactionId?: string;
  importedAt?: Date;
  notes?: string;
}

export interface ImportResult {
  success: boolean;
  message: string;
  ticketId?: number;
  ticketCode?: string;
  isDuplicate?: boolean;
  originalTicketId?: number;
  originalTicketCode?: string;
  validationResults?: ValidationResult[];
  summary?: any;
}

export interface ValidationResult {
  passed: boolean;
  step: string;
  message: string;
  details?: any;
}



// ----------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------
function generateImportTicketCode(): string {
  const prefix = 'IMP';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900);
  return `${prefix}${timestamp}${random}`;
}

// Helper to normalize phone numbers
function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 255
  if (cleaned.startsWith('0')) {
    cleaned = '255' + cleaned.substring(1);
  }
  
  // If 9 digits and doesn't start with 255, add it
  if (cleaned.length === 9 && !cleaned.startsWith('255')) {
    cleaned = '255' + cleaned;
  }
  
  // Ensure it's exactly 12 digits
  if (cleaned.length === 12) {
    return cleaned;
  }
  
  return phone; // Return original if can't normalize
}

// Helper to parse amounts with various formats
function parseAmount(amount: string): number {
  if (!amount || amount.trim() === '') return 0;
  
  // Remove currency symbols, commas, slashes, equals, spaces
  const cleaned = amount
    .replace(/[^\d.-]/g, '') // Keep only numbers, dots, and minus
    .replace(/,/g, '') // Remove commas
    .trim();
  
  return parseFloat(cleaned) || 0;
}

// Helper to map session names to session IDs
async function getSessionIdByName(dayId: number, sessionName: string): Promise<number> {
  const normalizedSession = sessionName.toLowerCase().trim();
  
  // Map common session names
  const sessionMap: Record<string, string> = {
    'night': 'Night',
    'afternoon': 'Afternoon',
    'evening': 'Evening',
    'morning': 'Morning',
    'evening ': 'Evening',
    'afternoon ': 'Afternoon',
    'night ': 'Night'
  };
  
  const mappedName = sessionMap[normalizedSession] || sessionName;
  
  try {
    // Try to find session by name for the given day
    const session = await db.select()
      .from(eventSessions)
      .where(
        and(
          eq(eventSessions.dayId, dayId),
          like(sql`LOWER(${eventSessions.name})`, `%${normalizedSession}%`)
        )
      )
      .then(rows => rows[0]);

    if (session) {
      return session.id;
    }
    
    // If not found, get the first session for the day
    const firstSession = await db.select()
      .from(eventSessions)
      .where(eq(eventSessions.dayId, dayId))
      .orderBy(eventSessions.id)
      .limit(1)
      .then(rows => rows[0]);
    
    return firstSession?.id || 1;
  } catch (error) {
    return 1; // Default fallback
  }
}

// Helper to map ticket types to standard format
function normalizeTicketType(ticketType: string): 'ADULT' | 'STUDENT' | 'CHILD' {
  const normalized = ticketType.toLowerCase().trim();
  
  if (normalized.includes('student')) return 'STUDENT';
  if (normalized.includes('kid') || normalized.includes('child')) return 'CHILD';
  if (normalized.includes('adult')) return 'ADULT';
  
  // Default mapping
  const typeMap: Record<string, 'ADULT' | 'STUDENT' | 'CHILD'> = {
    'adult': 'ADULT',
    'student': 'STUDENT',
    'kid': 'CHILD',
    'child': 'CHILD',
    'children': 'CHILD'
  };
  
  return typeMap[normalized] || 'ADULT';
}

// Helper to map payment methods
function normalizePaymentMethod(paymentMethod: string): string {
  const normalized = paymentMethod.toLowerCase().trim();
  
  const methodMap: Record<string, string> = {
    'mpesa': 'MPESA',
    'pesa pal': 'PESAPAL',
    'pesapal': 'PESAPAL',
    'cash': 'CASH',
    'bank': 'BANK',
    'airtel': 'AIRTEL',
    'tigo': 'TIGO',
    'halotel': 'HALOTEL'
  };
  
  return methodMap[normalized] || 'CASH';
}

// Helper to get appropriate price ID based on ticket type and amount
async function getPriceId(ticketType: string, amount: number, dayId: number): Promise<number> {
  try {
    // Find prices for the given day and ticket type
    const prices = await db.select()
      .from(ticketPrices)
      .where(
        and(
          eq(ticketPrices.ticketType, ticketType),
          eq(ticketPrices.dayId, dayId)
        )
      )
      .then(rows => rows);

    if (prices.length === 0) {
      // If no specific price found, use default
      const defaultPrice = await db.select()
        .from(ticketPrices)
        .where(eq(ticketPrices.ticketType, ticketType))
        .orderBy(ticketPrices.id)
        .limit(1)
        .then(rows => rows[0]);
      
      return defaultPrice?.id || 1;
    }

    // Try to find matching price
    const matchingPrice = prices.find(price => 
      Math.abs(parseFloat(price.price) - amount) < 0.01
    );

    if (matchingPrice) {
      return matchingPrice.id;
    }

    // Return the first price for this type
    return prices[0].id;
  } catch (error) {
    return 1; // Default fallback
  }
}

// ----------------------------------------------------------------------
// CHECK USER EXISTS FUNCTION
// ----------------------------------------------------------------------
async function checkUserExists(phone: string, fullName: string): Promise<{
  exists: boolean;
  existingTickets: Array<{
    id: number;
    ticketCode: string;
    sessionId: number;
    ticketType: string;
    status: string;
    createdAt: Date;
    sessionName?: string;
    dayName?: string;
  }>;
}> {
  const logger = new Logger('user-check');
  
  try {
    // Normalize phone for comparison
    const normalizedPhone = normalizePhoneNumber(phone);
    
    // Find existing tickets for this user (phone + name combination)
    const existingTickets = await db.select({
      id: tickets.id,
      ticketCode: tickets.ticketCode,
      sessionId: tickets.sessionId,
      ticketType: tickets.ticketType,
      status: tickets.status,
      paymentStatus: tickets.paymentStatus,
      createdAt: tickets.createdAt,
      purchaserName: tickets.purchaserName,
      purchaserPhone: tickets.purchaserPhone,
      sessionName: eventSessions.name,
      dayName: eventDays.name
    })
    .from(tickets)
    .innerJoin(eventSessions, eq(tickets.sessionId, eventSessions.id))
    .innerJoin(eventDays, eq(eventSessions.dayId, eventDays.id))
    .where(
      and(
        eq(tickets.purchaserPhone, normalizedPhone),
        sql`LOWER(${tickets.purchaserName}) = LOWER(${fullName})`
      )
    )
    .orderBy(tickets.createdAt);

    logger.info('User check completed', {
      phone: normalizedPhone,
      fullName,
      foundTickets: existingTickets.length
    });

    return {
      exists: existingTickets.length > 0,
      existingTickets: existingTickets.map(ticket => ({
        id: ticket.id,
        ticketCode: ticket.ticketCode,
        sessionId: ticket.sessionId,
        ticketType: ticket.ticketType,
        status: ticket.status,
        createdAt: ticket.createdAt,
        sessionName: ticket.sessionName,
        dayName: ticket.dayName
      }))
    };
    
  } catch (error: any) {
    logger.error('Error checking user existence', error);
    return {
      exists: false,
      existingTickets: []
    };
  }
}

// ----------------------------------------------------------------------
// VALIDATE IMPORT DATA
// ----------------------------------------------------------------------
async function validateImportData(importData: ImportTicketData): Promise<{
  success: boolean;
  error?: string;
  validationResults: ValidationResult[];
  data?: {
    day: any;
    session: any;
    price: any;
    paymentMethod: any;
  };
}> {
  const logger = new Logger('import-validation');
  const validationResults: ValidationResult[] = [];
  
  try {
    logger.info('Starting import validation', { 
      fullName: importData.fullName,
      phone: importData.phone,
      ticketType: importData.ticketType 
    });

    // 1. Validate Day
    const day = await db.select()
      .from(eventDays)
      .where(eq(eventDays.id, importData.dayId))
      .then(rows => rows[0]);

    if (!day) {
      logger.error('Day validation failed', { dayId: importData.dayId });
      return {
        success: false,
        error: 'Selected day not found',
        validationResults: [{
          passed: false,
          step: 'DAY_VALIDATION',
          message: 'Day not found',
          details: { dayId: importData.dayId }
        }]
      };
    }

    // 2. Validate Session
    const session = await db.select()
      .from(eventSessions)
      .where(and(
        eq(eventSessions.id, importData.sessionId),
        eq(eventSessions.dayId, importData.dayId)
      ))
      .then(rows => rows[0]);

    if (!session) {
      logger.error('Session validation failed', { 
        sessionId: importData.sessionId, 
        dayId: importData.dayId 
      });
      return {
        success: false,
        error: 'Selected session not found for this day',
        validationResults: [{
          passed: false,
          step: 'SESSION_VALIDATION',
          message: 'Session not found for selected day',
          details: { sessionId: importData.sessionId, dayId: importData.dayId }
        }]
      };
    }

    // 3. Validate Ticket Price
    const price = await db.select()
      .from(ticketPrices)
      .where(eq(ticketPrices.id, importData.priceId))
      .then(rows => rows[0]);

    if (!price) {
      logger.error('Price validation failed', { priceId: importData.priceId });
      // For imports, we can proceed with a default price
      validationResults.push({
        passed: true,
        step: 'PRICE_VALIDATION',
        message: 'Using default price',
        details: { priceId: importData.priceId, note: 'Price not found, using default' }
      });
    } else {
      validationResults.push({
        passed: true,
        step: 'PRICE_VALIDATION',
        message: `Price: ${price.name} - TZS ${price.price}`,
        details: price
      });
    }

    // 4. Validate Payment Method
    const paymentMethod = await db.select()
      .from(paymentMethods)
      .where(eq(paymentMethods.id, importData.paymentMethodId))
      .then(rows => rows[0]);

    if (!paymentMethod) {
      logger.warn('Payment method not found, using CASH as default', { 
        paymentMethodId: importData.paymentMethodId 
      });
      
      // For imports, default to CASH if not found
      importData.paymentMethodId = 'CASH';
      
      const cashMethod = await db.select()
        .from(paymentMethods)
        .where(eq(paymentMethods.id, 'CASH'))
        .then(rows => rows[0]);
      
      if (cashMethod) {
        validationResults.push({
          passed: true,
          step: 'PAYMENT_METHOD_VALIDATION',
          message: `Payment Method: ${cashMethod.name} (defaulted from ${importData.paymentMethodId})`,
          details: cashMethod
        });
      } else {
        validationResults.push({
          passed: true,
          step: 'PAYMENT_METHOD_VALIDATION',
          message: 'Payment method not found, proceeding with CASH',
          details: { paymentMethodId: importData.paymentMethodId }
        });
      }
    } else {
      validationResults.push({
        passed: true,
        step: 'PAYMENT_METHOD_VALIDATION',
        message: `Payment Method: ${paymentMethod.name}`,
        details: paymentMethod
      });
    }

    // 5. Validate student data if ticket type is STUDENT
    if (importData.ticketType === 'STUDENT') {
      if (!importData.studentId || !importData.studentId.trim()) {
        // For imports, generate a student ID if not provided
        importData.studentId = `STU-IMP-${Date.now().toString().slice(-6)}`;
        validationResults.push({
          passed: true,
          step: 'STUDENT_VALIDATION',
          message: 'Generated student ID',
          details: { studentId: importData.studentId }
        });
      }
      
      if (!importData.institution) {
        // Default to UNIVERSITY for student tickets
        importData.institution = 'UNIVERSITY';
        validationResults.push({
          passed: true,
          step: 'STUDENT_VALIDATION',
          message: 'Default institution set to UNIVERSITY',
          details: { institution: importData.institution }
        });
      }
    }

    // All validations passed
    logger.info('Import validations passed successfully');
    
    validationResults.push(
      {
        passed: true,
        step: 'DAY_VALIDATION',
        message: `Day: ${day.name}`,
        details: day
      },
      {
        passed: true,
        step: 'SESSION_VALIDATION',
        message: `Session: ${session.name}`,
        details: session
      }
    );

    return {
      success: true,
      validationResults,
      data: { day, session, price: price || { id: importData.priceId, name: 'Default', price: '0' }, paymentMethod: paymentMethod || { id: 'CASH', name: 'Cash' } }
    };

  } catch (error: any) {
    logger.critical('Import validation system error', error);
    return {
      success: false,
      error: `Validation error: ${error.message}`,
      validationResults: [{
        passed: false,
        step: 'VALIDATION_ERROR',
        message: 'System error during validation',
        details: { error: error.message }
      }]
    };
  }
}

// ----------------------------------------------------------------------
// CREATE ATTENDEES FOR IMPORT
// ----------------------------------------------------------------------
async function createImportAttendees(
  ticketId: number,
  ticketCode: string,
  importData: ImportTicketData,
  validationResults: ValidationResult[]
): Promise<void> {
  const logger = new Logger('import-attendee-creation');
  
  const attendeeTable = importData.ticketType === 'ADULT' ? adults :
                       importData.ticketType === 'STUDENT' ? students :
                       importData.ticketType === 'CHILD' ? children : null;

  if (!attendeeTable) {
    logger.warn('No attendee table found for ticket type', { ticketType: importData.ticketType });
    return;
  }

  try {
    for (let i = 0; i < importData.quantity; i++) {
      const attendeeData: any = {
        ticketId: ticketId,
        fullName: importData.quantity > 1 ? `${importData.fullName} ${i + 1}` : importData.fullName,
        phoneNumber: importData.phone,
        isImported: true,
        importNotes: importData.notes || 'Imported via CSV'
      };

      // Add student-specific fields
      if (importData.ticketType === 'STUDENT') {
        attendeeData.studentId = importData.studentId || `STU-${ticketCode.slice(0, 8)}-${i + 1}`;
        attendeeData.institutionType = importData.institution || 'UNKNOWN';
        attendeeData.institutionName = importData.institution === 'OTHER' 
          ? (importData.institutionName || 'Other Institution')
          : importData.institution || 'Unknown Institution';
      }

      // Add child-specific fields
      if (importData.ticketType === 'CHILD') {
        attendeeData.parentName = importData.fullName;
      }

      await db.insert(attendeeTable).values(attendeeData);
    }
    
    logger.info(`Created ${importData.quantity} attendee record(s) for import`, { 
      ticketId, 
      ticketType: importData.ticketType 
    });
    
    validationResults.push({
      passed: true,
      step: 'ATTENDEE_CREATION',
      message: `Created ${importData.quantity} attendee record(s)`,
      details: { 
        quantity: importData.quantity, 
        type: importData.ticketType,
        isImported: true,
        ...(importData.ticketType === 'STUDENT' && {
          studentId: importData.studentId,
          institution: importData.institution
        })
      }
    });
    
  } catch (error: any) {
    logger.error('Error creating import attendees', error);
    validationResults.push({
      passed: false,
      step: 'ATTENDEE_CREATION',
      message: 'Failed to create attendee records',
      details: { error: error.message }
    });
  }
}

// ----------------------------------------------------------------------
// CREATE TRANSACTION FOR IMPORT
// ----------------------------------------------------------------------
async function createImportTransaction(
  ticketId: number,
  ticketCode: string,
  importData: ImportTicketData,
  validationResults: ValidationResult[]
): Promise<void> {
  const logger = new Logger('import-transaction');
  
  try {
    // Generate external ID if not provided
    const externalId = importData.externalId || `IMP-${Date.now()}-${ticketCode}`;
    const transId = importData.transactionId || externalId;
    
    // Determine status for import
    const paymentStatus = importData.isPaid ? 'PAID' : (importData.paymentStatus || 'PENDING');
    
    await db.insert(transactions).values({
      ticketId,
      externalId,
      reference: ticketCode,
      transId,
      provider: importData.paymentMethodId.toUpperCase(),
      accountNumber: importData.phone,
      amount: importData.totalAmount.toString(),
      status: paymentStatus,
      currency: 'TZS',
      message: `Imported ${importData.isPaid ? 'as paid' : 'as pending'}`,
      metadata: JSON.stringify({
        isImported: true,
        importData: {
          isPaid: importData.isPaid,
          paymentStatus: importData.paymentStatus,
          externalId: importData.externalId,
          transactionId: importData.transactionId,
          importedAt: new Date().toISOString(),
          notes: importData.notes
        },
        importMethod: 'csv_import',
        importTimestamp: new Date().toISOString()
      })
    });
    
    logger.info('Import transaction created', { 
      ticketId, 
      externalId,
      status: paymentStatus 
    });
    
    validationResults.push({
      passed: true,
      step: 'TRANSACTION_CREATION',
      message: `Transaction created (${paymentStatus})`,
      details: { 
        externalId,
        transactionId: transId,
        status: paymentStatus,
        isPaid: importData.isPaid
      }
    });
    
  } catch (error: any) {
    logger.error('Error creating import transaction', error);
    validationResults.push({
      passed: false,
      step: 'TRANSACTION_CREATION',
      message: 'Failed to create transaction record',
      details: { error: error.message }
    });
  }
}

// ----------------------------------------------------------------------
// SEND IMPORT NOTIFICATION
// ----------------------------------------------------------------------


// ----------------------------------------------------------------------
// SEND IMPORT NOTIFICATION WITH DATABASE SAVING
// ----------------------------------------------------------------------
async function sendImportNotification(
  importData: ImportTicketData,
  ticketCode: string,
  day: any,
  session: any,
  isDuplicate: boolean = false,
  validationResults: ValidationResult[],
  ticketId?: number
): Promise<void> {
  const logger = new Logger('import-notification');
  
  try {
    // Prepare different SMS messages for new users vs duplicates
    let smsMessage = '';
    let smsType = 'IMPORT_CONFIRMATION';
    
    if (isDuplicate) {
      smsMessage = `Hello ${importData.fullName}!\n\n`;
      smsMessage += `Additional ticket ${ticketCode} for ${day.name} - ${session.name} has been issued.\n`;
      smsMessage += `Quantity: ${importData.quantity}\n`;
      smsMessage += `Amount: TZS ${importData.totalAmount.toLocaleString()}\n\n`;
      smsMessage += `Status: ${importData.isPaid ? 'PAID ✓' : 'PENDING PAYMENT'}\n`;
      
      if (importData.isPaid) {
        smsMessage += `This ticket is now active and valid for entry.`;
      } else {
        smsMessage += `Please complete your payment to activate this ticket.`;
      }
      
      smsMessage += `\n\nNote: This is an additional ticket to your existing booking.`;
      smsType = 'DUPLICATE_IMPORT_CONFIRMATION';
      
    } else {
      // NEW USER - More detailed welcome message
      smsMessage = `Dear ${importData.fullName},\n\n`;
      smsMessage += `WELCOME TO THE KING & THE CODE EVENT!\n\n`;
      smsMessage += `We have received and confirmed your ticket:\n`;
      smsMessage += `🎟 Ticket Code: ${ticketCode}\n`;
      smsMessage += `📅 Day: ${day.name}\n`;
      smsMessage += `⏰ Session: ${session.name} (${session.startTime} - ${session.endTime})\n`;
      smsMessage += `👥 Quantity: ${importData.quantity} ${importData.ticketType.toLowerCase()} ticket(s)\n`;
      smsMessage += `💰 Amount: TZS ${importData.totalAmount.toLocaleString()}\n\n`;
      
    //   if (importData.isPaid) {
    //     smsMessage += `✅ STATUS: PAID & CONFIRMED\n`;
    //     smsMessage += `Your ticket is now active and ready for use!\n\n`;
    //     smsMessage += `Please present this ticket code at the entrance.`;
    //   } else {
    //     smsMessage += `⏳ STATUS: PENDING PAYMENT\n`;
    //     smsMessage += `To activate your ticket, please complete the payment.\n\n`;
    //     smsMessage += `Payment Method: ${importData.paymentMethodId}\n`;
    //     smsMessage += `Reference: ${ticketCode}`;
    //   }
      
    //   smsMessage += `\n\nWe look forward to seeing you at the event!\n`;
    //   smsMessage += `For any queries, contact our support team.`;
      smsType = 'NEW_USER_WELCOME';
    }
     smsMessage = `For any queries, contact our support team.`;
    
    // Send SMS
    const smsResult = await SMSService.sendSMS(importData.phone, smsMessage);
    
    // Save SMS log to database
    // try {
    //   await db.insert(smsLogs).values({
    //     phoneNumber: importData.phone,
    //     message: smsMessage,
    //     messageType: smsType,
    //     status: smsResult.success ? 'SENT' : 'FAILED',
    //     ticketId: ticketId,
    //     metadata: JSON.stringify({
    //       ticketCode,
    //       purchaserName: importData.fullName,
    //       isDuplicate,
    //       isPaid: importData.isPaid,
    //       paymentStatus: importData.paymentStatus,
    //       quantity: importData.quantity,
    //       amount: importData.totalAmount,
    //       day: day.name,
    //       session: session.name,
    //       importTimestamp: new Date().toISOString(),
    //       ...(smsResult.error && { error: smsResult.error }),
    //       ...(smsResult.provider && { provider: smsResult.provider }),
    //       ...(smsResult.messageId && { messageId: smsResult.messageId })
    //     }),
    //     createdAt: new Date(),
    //     updatedAt: new Date()
    //   });
      
    //   logger.info('SMS log saved to database', { 
    //     ticketId,
    //     smsType,
    //     saved: true 
    //   });
      
    // } catch (smsLogError: any) {
    //   logger.error('Failed to save SMS log to database', smsLogError);
    //   // Don't fail the whole import if SMS log fails
    // }
    
    if (smsResult.success) {
      logger.info('Import SMS notification sent successfully', { 
        recipient: importData.phone,
        isNewUser: !isDuplicate,
        isPaid: importData.isPaid,
        smsType
      });
    } else {
      logger.error('Failed to send import SMS notification', { 
        recipient: importData.phone,
        message : smsMessage,
        error: smsResult.error 
      });
    }
    
    validationResults.push({
      passed: smsResult.success,
      step: 'NOTIFICATION',
      message: smsResult.success 
        ? `SMS sent successfully to ${isDuplicate ? 'existing' : 'new'} user` 
        : 'Failed to send SMS',
      details: { 
        recipient: importData.phone,
        isNewUser: !isDuplicate,
        isPaid: importData.isPaid,
        smsType,
        ...(smsResult.error && { error: smsResult.error }),
        ...(smsResult.messageId && { messageId: smsResult.messageId })
      }
    });
    
  } catch (smsError: any) {
    logger.error('Error in import notification process', smsError);
    validationResults.push({
      passed: false,
      step: 'NOTIFICATION',
      message: 'Failed to send notification',
      details: { error: smsError.message }
    });
  }
}

// ----------------------------------------------------------------------
// MAIN ACTION: Import Ticket
// ----------------------------------------------------------------------
export async function importTicket(importData: ImportTicketData): Promise<ImportResult> {
  const logger = new Logger('ticket-import');
  const validationResults: ValidationResult[] = [];
  let isDuplicate = false;
  let originalTicketId: number | undefined;
  let originalTicketCode: string | undefined;

  try {
    logger.info(`Starting ticket import for ${importData.fullName}`, { 
      phone: importData.phone,
      amount: importData.totalAmount,
      ticketType: importData.ticketType
    });

    // Normalize phone number
    importData.phone = normalizePhoneNumber(importData.phone);

    // ---------------------------------------------------------
    // STEP 1: CHECK IF USER EXISTS
    // ---------------------------------------------------------
    const userCheck = await checkUserExists(importData.phone, importData.fullName);
    
    if (userCheck.exists) {
      isDuplicate = true;
      const latestTicket = userCheck.existingTickets[userCheck.existingTickets.length - 1];
      originalTicketId = latestTicket.id;
      originalTicketCode = latestTicket.ticketCode;
      
      logger.info('User already has existing tickets', {
        phone: importData.phone,
        fullName: importData.fullName,
        existingTicketsCount: userCheck.existingTickets.length,
        latestTicket: latestTicket.ticketCode
      });
      
      validationResults.push({
        passed: true,
        step: 'USER_CHECK',
        message: `User already has ${userCheck.existingTickets.length} ticket(s)`,
        details: {
          isDuplicate: true,
          existingTickets: userCheck.existingTickets,
          latestTicket: latestTicket
        }
      });
    } else {
      logger.info('No existing tickets found for user', {
        phone: importData.phone,
        fullName: importData.fullName
      });
      
      validationResults.push({
        passed: true,
        step: 'USER_CHECK',
        message: 'New user - no existing tickets found',
        details: { isDuplicate: false }
      });
    }

    // ---------------------------------------------------------
    // STEP 2: VALIDATE IMPORT DATA
    // ---------------------------------------------------------
    const validation = await validateImportData(importData);
    if (!validation.success) {
      logger.error('Import validation failed', validation.validationResults);
      return {
        success: false,
        message: validation.error || 'Validation failed',
        validationResults: validation.validationResults,
        isDuplicate,
        ...(isDuplicate && { originalTicketId, originalTicketCode })
      };
    }

    validationResults.push(...validation.validationResults);
    logger.info('Import validation passed', validation.validationResults);

    const { day, session, price, paymentMethod } = validation.data!;

    // ---------------------------------------------------------
    // STEP 3: CREATE TICKET RECORD
    // ---------------------------------------------------------
    const ticketCode = generateImportTicketCode();
    const status = importData.isPaid ? 'ACTIVE' : 'PENDING';
    const paymentStatus = importData.isPaid ? 'PAID' : (importData.paymentStatus || 'PENDING');

    logger.info('Creating import ticket record...', { 
      ticketCode,
      status,
      paymentStatus
    });
    
    // Insert the ticket
    await db.insert(tickets).values({
      sessionId: importData.sessionId,
      ticketCode: ticketCode,
      purchaserName: importData.fullName,
      purchaserPhone: importData.phone,
      ticketType: importData.ticketType,
      totalAmount: importData.totalAmount.toString(),
      status: status,
      paymentStatus: paymentStatus,
      paymentMethodId: importData.paymentMethodId,
      isImported: true,
      metadata: JSON.stringify({
        studentId: importData.studentId,
        institution: importData.institution,
        institutionName: importData.institutionName,
        dayName: day.name,
        sessionName: session.name,
        isPaid: importData.isPaid,
        paymentStatus: paymentStatus,
        externalId: importData.externalId,
        transactionId: importData.transactionId,
        importedAt: new Date().toISOString(),
        importNotes: importData.notes,
        isDuplicate: isDuplicate,
        originalTicketId: originalTicketId,
        originalTicketCode: originalTicketCode,
        existingTicketsCount: userCheck.existingTickets.length,
        importSource: 'csv'
      })
    });

    // Query for the ticket we just inserted
    const insertedTicket = await db.select()
      .from(tickets)
      .where(eq(tickets.ticketCode, ticketCode))
      .limit(1)
      .then(rows => rows[0]);

    if (!insertedTicket || !insertedTicket.id) {
      throw new Error('Could not retrieve ticket after creation');
    }

    const ticketId = insertedTicket.id;
    
    logger.info('Import ticket record created', { 
      ticketId, 
      ticketCode,
      isDuplicate,
      existingTickets: userCheck.existingTickets.length
    });
    
    validationResults.push({
      passed: true,
      step: 'TICKET_CREATION',
      message: `Ticket created successfully ${isDuplicate ? '(Duplicate)' : ''}`,
      details: { 
        ticketId, 
        ticketCode,
        status,
        paymentStatus,
        isDuplicate,
        ...(isDuplicate && {
          existingTicketsCount: userCheck.existingTickets.length,
          originalTicketId,
          originalTicketCode
        })
      }
    });

    // ---------------------------------------------------------
    // STEP 4: CREATE ATTENDEES
    // ---------------------------------------------------------
    await createImportAttendees(ticketId, ticketCode, importData, validationResults);

    // ---------------------------------------------------------
    // STEP 5: CREATE TRANSACTION RECORD
    // ---------------------------------------------------------
    await createImportTransaction(ticketId, ticketCode, importData, validationResults);

    // ---------------------------------------------------------
    // STEP 6: SEND NOTIFICATION
    // ---------------------------------------------------------
   await sendImportNotification(
  importData, 
  ticketCode, 
  day, 
  session, 
  isDuplicate, 
  validationResults,
  ticketId  
);

 // ---------------------------------------------------------
    // FINAL RESPONSE
    // ---------------------------------------------------------
    const finalResult: ImportResult = {
    success: true,
    message: isDuplicate 
        ? `Ticket imported successfully. ${userCheck.existingTickets.length + 1} total tickets for this user.`
        : `Ticket imported successfully. Welcome message sent to new user.`,
    ticketId,
    ticketCode,
    isDuplicate,
    ...(isDuplicate && { originalTicketId, originalTicketCode }),
    validationResults,
    summary: {
        purchaser: importData.fullName,
        phone: importData.phone,
        event: `${day.name} - ${session.name}`,
        date: day.date ? new Date(day.date).toLocaleDateString() : 'N/A',
        time: `${session.startTime} - ${session.endTime}`,
        ticketType: importData.ticketType,
        ...(importData.ticketType === 'STUDENT' && {
        studentId: importData.studentId,
        institution: importData.institution,
        institutionName: importData.institutionName
        }),
        quantity: importData.quantity,
        amount: importData.totalAmount,
        paymentMethod: importData.paymentMethodId,
        paymentMethodName: paymentMethod.name,
        paymentStatus: paymentStatus,
        ticketStatus: status,
        isPaid: importData.isPaid,
        isImported: true,
        isDuplicate: isDuplicate,
        ...(isDuplicate && {
        existingTicketsCount: userCheck.existingTickets.length,
        originalTicketId,
        originalTicketCode
        }),
        notes: importData.notes || 'No additional notes',
        externalId: importData.externalId,
        transactionId: importData.transactionId,
        importTimestamp: new Date().toISOString(),
        notificationSent: true, // Add this flag
        notificationType: isDuplicate ? 'duplicate_confirmation' : 'new_user_welcome', // Add this
        nextSteps: importData.isPaid 
        ? [
            'Ticket is active and ready for use',
            'Confirmation SMS sent to user',
            'Present ticket code at entrance'
            ]
        : [
            'Complete payment to activate ticket',
            'Payment reminder sent to user',
            'Contact support for payment assistance'
            ],
        supportInfo: {
        ticketCode: ticketCode,
        contactPhone: '255XXXXXXXXX', // Add your support number
        email: 'support@event.com',
        hours: '9AM - 6PM'
        }
    }
    };

    logger.info('Ticket import process completed', finalResult.summary);

    return finalResult;

        logger.info('Ticket import process completed', finalResult.summary);
        
        return finalResult;

    } catch (error: any) {
        logger.critical('Critical error in importTicket', error);
        
        validationResults.push({
        passed: false,
        step: 'SYSTEM_ERROR',
        message: 'System error occurred during import',
        details: { error: error.message, stack: error.stack }
        });

        return {
        success: false,
        message: `Import failed: ${error.message}`,
        isDuplicate,
        ...(isDuplicate && { originalTicketId, originalTicketCode }),
        validationResults
        };
    }
    }

// ----------------------------------------------------------------------
// BULK IMPORT ACTION (For CSV imports)
// ----------------------------------------------------------------------
export async function bulkImportTickets(ticketsData: ImportTicketData[]): Promise<{
  success: boolean;
  message: string;
  results: Array<ImportResult & { index: number }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    duplicates: number;
    newUsers: number;
    totalAmount: number;
    totalQuantity: number;
  };
}> {
  const logger = new Logger('bulk-import');
  const results: Array<ImportResult & { index: number }> = [];
  
  try {
    logger.info('Starting bulk import', { 
      totalTickets: ticketsData.length 
    });

    let successful = 0;
    let failed = 0;
    let duplicates = 0;
    let newUsers = 0;
    let totalAmount = 0;
    let totalQuantity = 0;

    // Process tickets sequentially to avoid overwhelming the database
    for (let i = 0; i < ticketsData.length; i++) {
      const ticketData = ticketsData[i];
      
      logger.info(`Processing ticket ${i + 1} of ${ticketsData.length}`, {
        index: i,
        fullName: ticketData.fullName,
        phone: ticketData.phone
      });

      try {
        // Get appropriate session ID if not provided
        if (!ticketData.sessionId) {
          ticketData.sessionId = await getSessionIdByName(ticketData.dayId, 'Night');
        }

        // Get appropriate price ID if not provided
        if (!ticketData.priceId || ticketData.priceId === 1) {
          ticketData.priceId = await getPriceId(ticketData.ticketType, ticketData.totalAmount, ticketData.dayId);
        }

        const result = await importTicket(ticketData);
        const resultWithIndex = {
          ...result,
          index: i + 1
        };
        
        results.push(resultWithIndex);
        
        if (result.success) {
          successful++;
          totalAmount += ticketData.totalAmount;
          totalQuantity += ticketData.quantity;
          
          if (result.isDuplicate) {
            duplicates++;
          } else {
            newUsers++;
          }
          
          logger.info(`Ticket ${i + 1} imported successfully`, {
            success: true,
            isDuplicate: result.isDuplicate,
            ticketCode: result.ticketCode
          });
        } else {
          failed++;
          logger.error(`Ticket ${i + 1} import failed`, {
            success: false,
            message: result.message
          });
        }
        
      } catch (ticketError: any) {
        failed++;
        logger.error(`Error processing ticket ${i + 1}`, ticketError);
        
        results.push({
          success: false,
          message: `Failed to import ticket: ${ticketError.message}`,
          index: i + 1,
          validationResults: [{
            passed: false,
            step: 'PROCESSING_ERROR',
            message: 'Error during processing',
            details: { error: ticketError.message }
          }]
        });
      }

      // Small delay between imports to avoid overwhelming the system
      if (i < ticketsData.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    const summary = {
      total: ticketsData.length,
      successful,
      failed,
      duplicates,
      newUsers,
      totalAmount,
      totalQuantity
    };

    logger.info('Bulk import completed', summary);
    
    return {
      success: failed === 0,
      message: failed === 0 
        ? `All ${successful} tickets imported successfully (${duplicates} duplicates, ${newUsers} new users)`
        : `${successful} tickets imported, ${failed} failed (${duplicates} duplicates, ${newUsers} new users)`,
      results,
      summary
    };

  } catch (error: any) {
    logger.critical('Critical error in bulkImportTickets', error);
    
    return {
      success: false,
      message: `Bulk import failed: ${error.message}`,
      results,
      summary: {
        total: ticketsData.length,
        successful: results.filter(r => r.success).length,
        failed: ticketsData.length - results.filter(r => r.success).length,
        duplicates: results.filter(r => r.success && r.isDuplicate).length,
        newUsers: results.filter(r => r.success && !r.isDuplicate).length,
        totalAmount: results.reduce((sum, r) => 
          r.success ? sum + ticketsData[r.index - 1].totalAmount : sum, 0
        ),
        totalQuantity: results.reduce((sum, r) => 
          r.success ? sum + ticketsData[r.index - 1].quantity : sum, 0
        )
      }
    };
  }
}

// ----------------------------------------------------------------------
// GET IMPORT HISTORY
// ----------------------------------------------------------------------
export async function getImportHistory(limit: number = 50) {
  const logger = new Logger('import-history');
  
  try {
    const importedTickets = await db.select({
      id: tickets.id,
      ticketCode: tickets.ticketCode,
      purchaserName: tickets.purchaserName,
      purchaserPhone: tickets.purchaserPhone,
      ticketType: tickets.ticketType,
      totalAmount: tickets.totalAmount,
      status: tickets.status,
      paymentStatus: tickets.paymentStatus,
      createdAt: tickets.createdAt,
      sessionName: eventSessions.name,
      dayName: eventDays.name,
      isImported: tickets.isImported,
      metadata: tickets.metadata
    })
    .from(tickets)
    .innerJoin(eventSessions, eq(tickets.sessionId, eventSessions.id))
    .innerJoin(eventDays, eq(eventSessions.dayId, eventDays.id))
    .where(eq(tickets.isImported, true))
    .orderBy(tickets.createdAt)
    .limit(limit);

    logger.info('Retrieved import history', { count: importedTickets.length });

    // Parse metadata for additional info
    const parsedTickets = importedTickets.map(ticket => ({
      ...ticket,
      metadata: ticket.metadata ? JSON.parse(ticket.metadata) : null,
      isDuplicate: ticket.metadata ? JSON.parse(ticket.metadata).isDuplicate || false : false,
      importSource: ticket.metadata ? JSON.parse(ticket.metadata).importSource || 'manual' : 'manual'
    }));

    return {
      success: true,
      tickets: parsedTickets,
      count: parsedTickets.length
    };

  } catch (error: any) {
    logger.error('Error getting import history', error);
    return {
      success: false,
      error: error.message,
      tickets: [],
      count: 0
    };
  }
}

// ----------------------------------------------------------------------
// NEW: PARSE CSV DATA FROM YOUR FORMAT
// ----------------------------------------------------------------------
export async function parseTicketListCSV(csvData: string): Promise<{
  success: boolean;
  tickets: ImportTicketData[];
  errors: string[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    skippedRows: number;
  };
}> {
  const logger = new Logger('csv-parser');
  const tickets: ImportTicketData[] = [];
  const errors: string[] = [];
  
  try {
    const lines = csvData.split('\n');
    let totalRows = 0;
    let validRows = 0;
    let invalidRows = 0;
    let skippedRows = 0;

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      totalRows++;
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line || line === ',,' || line.startsWith(',,,,')) {
        skippedRows++;
        continue;
      }

      const parts = line.split(',').map(part => part.trim());
      
      // Skip rows without essential data
      if (parts.length < 8 || !parts[1] || parts[1] === '') {
        skippedRows++;
        continue;
      }

      try {
        // Parse data from CSV format
        const serialNumber = parts[0] || '';
        const fullName = parts[1] || '';
        const phone = parts[2] || '';
        const paymentMethodRaw = parts[3] || 'CASH';
        const dayRaw = parts[4] || '1';
        const sessionRaw = parts[5] || 'Night';
        const ticketTypeRaw = parts[6] || 'Adult';
        const quantityRaw = parts[7] || '1';
        const pricePerTicketRaw = parts[8] || '0';
        const totalRaw = parts[9] || '0';
        const statusRaw = parts[10] || 'TAKEN';

        // Validate required fields
        if (!fullName) {
          errors.push(`Row ${i + 1}: Full name is required`);
          invalidRows++;
          continue;
        }

        if (!phone) {
          errors.push(`Row ${i + 1}: Phone number is required`);
          invalidRows++;
          continue;
        }

        // Normalize data
        const normalizedPhone = normalizePhoneNumber(phone);
        const normalizedTicketType = normalizeTicketType(ticketTypeRaw);
        const normalizedPaymentMethod = normalizePaymentMethod(paymentMethodRaw);
        
        // Parse numbers
        const dayId = parseInt(dayRaw) || 1;
        const quantity = parseInt(quantityRaw) || 1;
        const pricePerTicket = parseAmount(pricePerTicketRaw);
        const totalAmount = parseAmount(totalRaw) || (pricePerTicket * quantity);
        
        // Get session ID
        const sessionId = await getSessionIdByName(dayId, sessionRaw);
        
        // Get price ID
        const priceId = await getPriceId(normalizedTicketType, pricePerTicket, dayId);
        
        // Determine payment status
        const isPaid = statusRaw.toUpperCase() === 'TAKEN';
        const paymentStatus: 'PAID' | 'PENDING' | 'FAILED' = isPaid ? 'PAID' : 'PENDING';

        // Generate student ID if needed
        let studentId: string | undefined = undefined;
        if (normalizedTicketType === 'STUDENT') {
          studentId = `STU-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
        }

        // Create ticket data
        const ticketData: ImportTicketData = {
          dayId,
          sessionId,
          priceId,
          quantity,
          paymentMethodId: normalizedPaymentMethod,
          fullName,
          phone: normalizedPhone,
          totalAmount,
          ticketType: normalizedTicketType,
          studentId,
          institution: normalizedTicketType === 'STUDENT' ? 'UNIVERSITY' : undefined,
          institutionName: normalizedTicketType === 'STUDENT' ? 'University' : undefined,
          isPaid,
          paymentStatus,
          externalId: `CSV-IMP-${Date.now()}-${i}`,
          notes: `Imported from CSV - Row ${i + 1}`
        };

        tickets.push(ticketData);
        validRows++;
        
      } catch (parseError: any) {
        errors.push(`Row ${i + 1}: ${parseError.message || 'Invalid data format'}`);
        invalidRows++;
      }
    }

    const stats = {
      totalRows,
      validRows,
      invalidRows,
      skippedRows
    };

    logger.info('CSV parsing completed', stats);
    
    return {
      success: validRows > 0,
      tickets,
      errors,
      stats
    };

  } catch (error: any) {
    logger.error('Error parsing CSV data', error);
    return {
      success: false,
      tickets: [],
      errors: [`CSV parse error: ${error.message}`],
      stats: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        skippedRows: 0
      }
    };
  }
}