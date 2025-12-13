'use server';

import { db } from '@/lib/db/db';
import { AzamPayService } from '../services/azampay';
import { SMSService } from '@/lib/services/sms';
import { randomUUID } from 'crypto'; 
import { 
  tickets, transactions, adults, students, children, 
  eventSessions, eventDays, ticketPrices, paymentMethods
} from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------
interface PurchaseData {
  dayId: number;
  sessionId: number;
  priceId: number;
  quantity: number;
  paymentMethodId: string;
  fullName: string;
  phone: string;
  totalAmount: number;
  ticketType: 'ADULT' | 'STUDENT' | 'CHILD';
}

interface ValidationResult {
  passed: boolean;
  step: string;
  message: string;
  details?: any;
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
    },
    warn: (message: string, data?: any) => {
      console.warn(`[${service}] WARN: ${message}`, data || '');
    }
  };
}

function getCurrentTimeEAT() {
  // Get current time in Tanzania (EAT = UTC+3)
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
// MAIN ACTION: Process Ticket Purchase with Payment
// ----------------------------------------------------------------------
export async function processTicketPurchase(formData: PurchaseData) {
  const logger = createSimpleLogger('ticket-purchase');
  const validationResults: ValidationResult[] = [];
  
  // Payment method mapping to AzamPay providers
  const paymentMethodMapping: Record<string, string> = {
    'mpesa': 'Mpesa',
    'tigopesa': 'Tigo',
    'airtel': 'Airtel',
    'halopesa': 'Halopesa'
  };

  try {
    logger.info(`Starting purchase for ${formData.fullName} (${formData.phone})`, formData);

    // ---------------------------------------------------------
    // VALIDATION PHASE
    // ---------------------------------------------------------

    // 1. Validate Day
    const day = await db.select()
      .from(eventDays)
      .where(and(
        eq(eventDays.id, formData.dayId),
        eq(eventDays.isActive, true)
      ))
      .then(rows => rows[0]);

    if (!day) {
      return {
        success: false,
        error: 'Selected day is not available',
        validationResults: [{
          passed: false,
          step: 'DAY_VALIDATION',
          message: 'Day not found or inactive',
          details: { dayId: formData.dayId }
        }]
      };
    }

    // 2. Validate Session (exists for the day)
    const session = await db.select()
      .from(eventSessions)
      .where(and(
        eq(eventSessions.id, formData.sessionId),
        eq(eventSessions.dayId, formData.dayId)
      ))
      .then(rows => rows[0]);

    if (!session) {
      return {
        success: false,
        error: 'Selected session not found',
        validationResults: [{
          passed: false,
          step: 'SESSION_VALIDATION',
          message: 'Session not found for selected day',
          details: { sessionId: formData.sessionId, dayId: formData.dayId }
        }]
      };
    }

    // 3. Validate Ticket Price
    const price = await db.select()
      .from(ticketPrices)
      .where(eq(ticketPrices.id, formData.priceId))
      .then(rows => rows[0]);

    if (!price) {
      return {
        success: false,
        error: 'Selected ticket price not found',
        validationResults: [{
          passed: false,
          step: 'PRICE_VALIDATION',
          message: 'Price not found',
          details: { priceId: formData.priceId }
        }]
      };
    }

    // 4. Validate Payment Method
    const paymentMethod = await db.select()
      .from(paymentMethods)
      .where(eq(paymentMethods.id, formData.paymentMethodId))
      .then(rows => rows[0]);

    if (!paymentMethod) {
      return {
        success: false,
        error: 'Selected payment method not available',
        validationResults: [{
          passed: false,
          step: 'PAYMENT_METHOD_VALIDATION',
          message: 'Payment method not found',
          details: { paymentMethodId: formData.paymentMethodId }
        }]
      };
    }

    // 5. Validate amount matches price
    const calculatedAmount = parseFloat(price.price) * formData.quantity;
    if (formData.totalAmount !== calculatedAmount) {
      return {
        success: false,
        error: 'Amount mismatch',
        validationResults: [{
          passed: false,
          step: 'AMOUNT_VALIDATION',
          message: 'Total amount does not match price calculation',
          details: { 
            provided: formData.totalAmount, 
            calculated: calculatedAmount,
            unitPrice: price.price,
            quantity: formData.quantity
          }
        }]
      };
    }

    // All validations passed
    validationResults.push(
      {
        passed: true,
        step: 'DAY_VALIDATION',
        message: `Day: ${day.name} (${new Date(day.date).toLocaleDateString()})`,
        details: day
      },
      {
        passed: true,
        step: 'SESSION_VALIDATION',
        message: `Session: ${session.name} (${session.startTime} - ${session.endTime})`,
        details: session
      },
      {
        passed: true,
        step: 'PRICE_VALIDATION',
        message: `Price: ${price.name} - TZS ${price.price}`,
        details: price
      },
      {
        passed: true,
        step: 'PAYMENT_METHOD_VALIDATION',
        message: `Payment Method: ${paymentMethod.name}`,
        details: paymentMethod
      }
    );

    // ---------------------------------------------------------
    // CREATE TICKET RECORD (PENDING STATE)
    // ---------------------------------------------------------
    const ticketCode = randomUUID();
    
    logger.info('Creating ticket record...');
    
    const [ticketResult] = await db.insert(tickets).values({
      sessionId: formData.sessionId,
      ticketCode: ticketCode,
      purchaserName: formData.fullName,
      purchaserPhone: formData.phone,
      ticketType: formData.ticketType,
      totalAmount: formData.totalAmount.toString(),
      status: 'PENDING', // Will update to ACTIVE after payment
      paymentStatus: 'UNPAID',
      paymentMethodId: formData.paymentMethodId,
    }).$returningId();

    const ticketId = ticketResult.id;
    
    validationResults.push({
      passed: true,
      step: 'TICKET_CREATION',
      message: `Ticket created (ID: ${ticketId})`,
      details: { ticketId, ticketCode }
    });

    // ---------------------------------------------------------
    // CREATE ATTENDEE RECORD(S)
    // ---------------------------------------------------------
    const attendeeTable = formData.ticketType === 'ADULT' ? adults :
                         formData.ticketType === 'STUDENT' ? students :
                         formData.ticketType === 'CHILD' ? children : null;

    if (attendeeTable) {
      for (let i = 0; i < formData.quantity; i++) {
        await db.insert(attendeeTable).values({
          ticketId: ticketId,
          fullName: `${formData.fullName} ${i + 1}`,
          ...(formData.ticketType === 'STUDENT' && { 
            studentId: `STU-${ticketCode.slice(0, 8)}-${i + 1}`,
            institution: 'Not specified' 
          }),
          ...(formData.ticketType === 'ADULT' && { 
            phoneNumber: formData.phone 
          }),
          ...(formData.ticketType === 'CHILD' && { 
            parentName: formData.fullName 
          })
        });
      }
      
      validationResults.push({
        passed: true,
        step: 'ATTENDEE_CREATION',
        message: `Created ${formData.quantity} attendee record(s)`,
        details: { quantity: formData.quantity, type: formData.ticketType }
      });
    }

    // ---------------------------------------------------------
    // PROCESS PAYMENT
    // ---------------------------------------------------------
    let paymentResult: any;
    
    if (formData.paymentMethodId === 'cash') {
      // CASH PAYMENT - Mark as paid immediately
      await db.insert(transactions).values({
        ticketId: ticketId,
        externalId: `CASH-${ticketCode.slice(0, 8)}`,
        provider: 'CASH',
        accountNumber: 'CASH_DESK',
        amount: formData.totalAmount.toString(),
        status: 'COMPLETED',
        currency: 'TZS'
      });

      // Update ticket status
      await db.update(tickets)
        .set({ 
          paymentStatus: 'PAID',
          status: 'ACTIVE',
          updatedAt: new Date()
        })
        .where(eq(tickets.id, ticketId));
      
      paymentResult = { 
        success: true, 
        method: 'CASH',
        transactionId: `CASH-${ticketCode.slice(0, 8)}`
      };
      
      validationResults.push({
        passed: true,
        step: 'PAYMENT_PROCESSING',
        message: 'Cash payment recorded',
        details: paymentResult
      });

    } else {
      // DIGITAL PAYMENT via AzamPay
      try {
        logger.info('Initiating digital payment via AzamPay...');
        
        // Prepare payment parameters
        const provider = paymentMethodMapping[formData.paymentMethodId] || 'Mpesa';
        const externalId = `TICKET-${ticketCode}`;
        
        // Make payment request to AzamPay
        const azamPayResult = await AzamPayService.checkout({
          accountNumber: formData.phone,
          amount: formData.totalAmount.toString(),
          currency: 'TZS',
          provider: provider as any,
          externalId: externalId
        });

        logger.info('AzamPay response:', azamPayResult);

        if (azamPayResult.success) {
          // Payment initiated successfully - create pending transaction
          await db.insert(transactions).values({
            ticketId: ticketId,
            externalId: externalId,
            provider: formData.paymentMethodId.toUpperCase(),
            accountNumber: formData.phone,
            amount: formData.totalAmount.toString(),
            status: 'PENDING', // Will be updated via webhook
            currency: 'TZS',
            metadata: JSON.stringify(azamPayResult.data)
          });

          paymentResult = {
            success: true,
            method: formData.paymentMethodId,
            provider: provider,
            transactionId: azamPayResult.transactionId,
            externalId: externalId,
            data: azamPayResult.data
          };

          validationResults.push({
            passed: true,
            step: 'PAYMENT_PROCESSING',
            message: 'Payment initiated successfully',
            details: paymentResult
          });

        } else {
          // Payment failed
          await db.insert(transactions).values({
            ticketId: ticketId,
            externalId: externalId,
            provider: formData.paymentMethodId.toUpperCase(),
            accountNumber: formData.phone,
            amount: formData.totalAmount.toString(),
            status: 'FAILED',
            currency: 'TZS',
            errorMessage: azamPayResult.message
          });

          // Update ticket status
          await db.update(tickets)
            .set({ 
              paymentStatus: 'FAILED',
              status: 'FAILED',
              updatedAt: new Date()
            })
            .where(eq(tickets.id, ticketId));

          paymentResult = {
            success: false,
            method: formData.paymentMethodId,
            error: azamPayResult.message,
            data: azamPayResult
          };

          validationResults.push({
            passed: false,
            step: 'PAYMENT_PROCESSING',
            message: 'Payment initiation failed',
            details: paymentResult
          });

          return {
            success: false,
            error: `Payment failed: ${azamPayResult.message}`,
            ticketId: ticketId,
            ticketCode: ticketCode,
            validationResults,
            paymentResult
          };
        }

      } catch (paymentError: any) {
        logger.error('Payment processing error:', paymentError);

        await db.insert(transactions).values({
          ticketId: ticketId,
          externalId: `ERROR-${ticketCode.slice(0, 8)}`,
          provider: formData.paymentMethodId.toUpperCase(),
          accountNumber: formData.phone,
          amount: formData.totalAmount.toString(),
          status: 'ERROR',
          currency: 'TZS',
          errorMessage: paymentError.message
        });

        validationResults.push({
          passed: false,
          step: 'PAYMENT_PROCESSING',
          message: 'Payment processing error',
          details: { error: paymentError.message }
        });

        return {
          success: false,
          error: `Payment processing error: ${paymentError.message}`,
          ticketId: ticketId,
          ticketCode: ticketCode,
          validationResults
        };
      }
    }

    // ---------------------------------------------------------
    // SEND CONFIRMATION SMS (if payment successful)
    // ---------------------------------------------------------
    if (paymentResult.success) {
      try {
        const smsMessage = `Hello ${formData.fullName}! Your ticket for ${day.name} - ${session.name} has been ${formData.paymentMethodId === 'cash' ? 'purchased' : 'reserved'}. Ticket Code: ${ticketCode.slice(0, 8)}. Amount: TZS ${formData.totalAmount.toLocaleString()}.`;
        
        // Uncomment when SMS service is ready
        // await SMSService.sendSMS(formData.phone, smsMessage);
        
        logger.info('SMS notification prepared', { phone: formData.phone, message: smsMessage });
        
        validationResults.push({
          passed: true,
          step: 'NOTIFICATION',
          message: 'Confirmation prepared',
          details: { smsMessage }
        });
      } catch (smsError: any) {
        logger.warn('SMS notification failed:', smsError);
        validationResults.push({
          passed: false,
          step: 'NOTIFICATION',
          message: 'Failed to send SMS',
          details: { error: smsError.message }
        });
      }
    }

    // ---------------------------------------------------------
    // FINAL RESPONSE
    // ---------------------------------------------------------
    const finalResult = {
      success: true,
      ticketId: ticketId,
      ticketCode: ticketCode,
      validationResults,
      paymentResult,
      summary: {
        purchaser: formData.fullName,
        phone: formData.phone,
        event: `${day.name} - ${session.name}`,
        date: new Date(day.date).toLocaleDateString(),
        time: `${session.startTime} - ${session.endTime}`,
        ticketType: formData.ticketType,
        quantity: formData.quantity,
        amount: formData.totalAmount,
        paymentMethod: formData.paymentMethodId,
        paymentStatus: formData.paymentMethodId === 'cash' ? 'PAID' : 'PENDING',
        note: formData.paymentMethodId === 'cash' ? 
          'Ticket purchased successfully with cash' : 
          'Payment initiated. Ticket will be activated once payment is confirmed.'
      }
    };

    logger.info('Purchase process completed', finalResult.summary);
    
    return finalResult;

  } catch (error: any) {
    logger.error('Critical error in processTicketPurchase:', error);
    
    validationResults.push({
      passed: false,
      step: 'SYSTEM_ERROR',
      message: 'System error occurred',
      details: { error: error.message }
    });

    return {
      success: false,
      error: 'Internal server error',
      validationResults
    };
  }
}

// ----------------------------------------------------------------------
// HELPER: Check Payment Status (for pending transactions)
// ----------------------------------------------------------------------
export async function checkPaymentStatus(externalId: string) {
  const logger = createSimpleLogger('payment-status');
  
  try {
    logger.info('Checking payment status', { externalId });
    
    const transaction = await db.select()
      .from(transactions)
      .where(eq(transactions.externalId, externalId))
      .then(rows => rows[0]);

    if (!transaction) {
      return {
        success: false,
        error: 'Transaction not found',
        externalId
      };
    }

    // If already completed or failed, return current status
    if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(transaction.status)) {
      return {
        success: transaction.status === 'COMPLETED',
        status: transaction.status,
        transaction,
        externalId
      };
    }

    // Check with AzamPay for PENDING transactions
    const azamPayStatus = await AzamPayService.checkPaymentStatus(externalId);
    
    if (azamPayStatus.success) {
      const newStatus = azamPayStatus.data?.status || 'UNKNOWN';
      
      // Update transaction status
      await db.update(transactions)
        .set({ 
          status: newStatus.toUpperCase(),
          updatedAt: new Date(),
          metadata: JSON.stringify(azamPayStatus.data)
        })
        .where(eq(transactions.externalId, externalId));

      // If payment completed, update ticket status
      if (newStatus.toUpperCase() === 'COMPLETED') {
        await db.update(tickets)
          .set({ 
            paymentStatus: 'PAID',
            status: 'ACTIVE',
            updatedAt: new Date()
          })
          .where(eq(tickets.id, transaction.ticketId));
      }

      return {
        success: newStatus.toUpperCase() === 'COMPLETED',
        status: newStatus,
        transaction: { ...transaction, status: newStatus },
        azamPayResponse: azamPayStatus,
        externalId
      };
    }

    return {
      success: false,
      status: transaction.status,
      error: azamPayStatus.message,
      transaction,
      externalId
    };

  } catch (error: any) {
    logger.error('Error checking payment status:', error);
    return {
      success: false,
      error: error.message,
      externalId
    };
  }
}

// ----------------------------------------------------------------------
// HELPER: Complete Cash Payment (for POS)
// ----------------------------------------------------------------------
export async function completeCashPayment(ticketId: number) {
  const logger = createSimpleLogger('cash-payment');
  
  try {
    logger.info('Completing cash payment', { ticketId });
    
    const ticket = await db.select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .then(rows => rows[0]);

    if (!ticket) {
      return { success: false, error: 'Ticket not found' };
    }

    if (ticket.paymentStatus === 'PAID') {
      return { success: true, message: 'Ticket already paid' };
    }

    const externalId = `CASH-${ticket.ticketCode.slice(0, 8)}`;
    
    // Create transaction
    await db.insert(transactions).values({
      ticketId: ticketId,
      externalId: externalId,
      provider: 'CASH',
      accountNumber: 'CASH_DESK',
      amount: ticket.totalAmount,
      status: 'COMPLETED',
      currency: 'TZS'
    });

    // Update ticket
    await db.update(tickets)
      .set({ 
        paymentStatus: 'PAID',
        status: 'ACTIVE',
        updatedAt: new Date()
      })
      .where(eq(tickets.id, ticketId));

    return {
      success: true,
      ticketId,
      externalId,
      message: 'Cash payment completed successfully'
    };

  } catch (error: any) {
    logger.error('Error completing cash payment:', error);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------------------------
// ACTION: Verify Ticket with Detailed Step-by-Step Validation
// ----------------------------------------------------------------------
export async function verifyTicket(rawCode: string) {
  const logger = createSimpleLogger('ticket-verification');
  const verificationSteps: Array<{
    step: string;
    passed: boolean;
    message: string;
    details?: any;
    timestamp: Date;
  }> = [];
  
  const startTime = new Date();
  
  try {
    // Step 1: Input Sanitization
    const sanitizationStart = new Date();
    const code = rawCode.includes('/') ? rawCode.split('/').pop()?.trim() : rawCode.trim();
    
    if (!code || code.length < 8) {
      verificationSteps.push({
        step: 'INPUT_SANITIZATION',
        passed: false,
        message: 'Invalid ticket code format',
        details: { input: rawCode, sanitized: code },
        timestamp: sanitizationStart
      });
      return { 
        success: false, 
        error: 'Invalid ticket code format',
        verificationSteps 
      };
    }
    
    verificationSteps.push({
      step: 'INPUT_SANITIZATION',
      passed: true,
      message: 'Ticket code sanitized successfully',
      details: { input: rawCode, sanitized: code },
      timestamp: sanitizationStart
    });

    // Step 2: Database Lookup
    const lookupStart = new Date();
    
    // Using direct query instead of relational query
    const ticket = await db.select()
      .from(tickets)
      .where(eq(tickets.ticketCode, code))
      .then(rows => rows[0]);

    if (!ticket) {
      verificationSteps.push({
        step: 'DATABASE_LOOKUP',
        passed: false,
        message: 'Ticket not found in database',
        details: { code },
        timestamp: lookupStart
      });
      return { 
        success: false, 
        error: 'Ticket not found',
        verificationSteps 
      };
    }
    
    // Get session and day info
    const session = await db.select()
      .from(eventSessions)
      .where(eq(eventSessions.id, ticket.sessionId))
      .then(rows => rows[0]);
    
    if (!session) {
      verificationSteps.push({
        step: 'DATABASE_LOOKUP',
        passed: false,
        message: 'Session not found for ticket',
        details: { sessionId: ticket.sessionId },
        timestamp: lookupStart
      });
      return { 
        success: false, 
        error: 'Session not found',
        verificationSteps 
      };
    }
    
    const day = await db.select()
      .from(eventDays)
      .where(eq(eventDays.id, session.dayId))
      .then(rows => rows[0]);
    
    if (!day) {
      verificationSteps.push({
        step: 'DATABASE_LOOKUP',
        passed: false,
        message: 'Day not found for session',
        details: { dayId: session.dayId },
        timestamp: lookupStart
      });
      return { 
        success: false, 
        error: 'Day not found',
        verificationSteps 
      };
    }
    
    // Get transaction info
    const ticketTransactions = await db.select()
      .from(transactions)
      .where(eq(transactions.ticketId, ticket.id))
      .then(rows => rows);

    // Get attendee info based on ticket type
    let attendeeInfo = null;
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
          institution: studentAttendees[0].institution,
          studentId: studentAttendees[0].studentId
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
    
    verificationSteps.push({
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

    const now = getCurrentTimeEAT();

    // Step 3: Payment Verification
    const paymentCheckStart = new Date();
    const isPaid = ticket.paymentStatus === 'PAID' || 
                   ticket.paymentStatus === 'COMPLIMENTARY' ||
                   ticketTransactions.some(t => t.status === 'COMPLETED' || t.status === 'SUCCESS');

    if (!isPaid) {
      verificationSteps.push({
        step: 'PAYMENT_VERIFICATION',
        passed: false,
        message: 'Ticket payment not verified',
        details: {
          paymentStatus: ticket.paymentStatus,
          transactions: ticketTransactions.map(t => ({
            provider: t.provider,
            status: t.status,
            amount: t.amount
          }))
        },
        timestamp: paymentCheckStart
      });
      
      return {
        success: false,
        step: 'PAYMENT',
        error: 'Payment Not Verified',
        details: 'Ticket has not been paid for',
        verificationSteps
      };
    }
    
    verificationSteps.push({
      step: 'PAYMENT_VERIFICATION',
      passed: true,
      message: 'Payment verified successfully',
      details: {
        paymentStatus: ticket.paymentStatus,
        transactionCount: ticketTransactions.length,
        latestTransaction: ticketTransactions[0] ? {
          provider: ticketTransactions[0].provider,
          status: ticketTransactions[0].status,
          amount: ticketTransactions[0].amount
        } : null
      },
      timestamp: paymentCheckStart
    });

    // Step 4: Date Validation
    const dateCheckStart = new Date();
    const eventDate = new Date(day.date);
    const isToday = isSameDay(now, eventDate);

    if (!isToday) {
      verificationSteps.push({
        step: 'DATE_VALIDATION',
        passed: false,
        message: 'Ticket is not valid for today',
        details: {
          today: now.toDateString(),
          eventDate: eventDate.toDateString(),
          difference: Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        },
        timestamp: dateCheckStart
      });
      
      return {
        success: false,
        step: 'DAY',
        error: 'Wrong Day',
        details: `Valid on ${eventDate.toDateString()} only`,
        verificationSteps
      };
    }
    
    verificationSteps.push({
      step: 'DATE_VALIDATION',
      passed: true,
      message: 'Date validation passed - ticket is valid for today',
      details: {
        today: now.toDateString(),
        eventDate: eventDate.toDateString()
      },
      timestamp: dateCheckStart
    });

    // Step 5: Session Time Validation
    const timeCheckStart = new Date();
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
      verificationSteps.push({
        step: 'TIME_VALIDATION',
        passed: false,
        message: 'Ticket is not valid at this time',
        details: {
          currentTime: now.toLocaleTimeString(),
          sessionTime: `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`,
          entryWindow: `${new Date(entryStart).toLocaleTimeString()} - ${new Date(sessionEnd).toLocaleTimeString()}`
        },
        timestamp: timeCheckStart
      });
      
      return {
        success: false,
        step: 'SESSION',
        error: 'Invalid Session Time',
        details: `Allowed entry: ${formatTime(session.startTime)} (opens 2 hours before)`,
        verificationSteps
      };
    }
    
    verificationSteps.push({
      step: 'TIME_VALIDATION',
      passed: true,
      message: 'Time validation passed',
      details: {
        currentTime: now.toLocaleTimeString(),
        sessionTime: `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`,
        status: now < sessionStart ? 'Entry allowed (early arrival)' : 'Entry allowed (during session)'
      },
      timestamp: timeCheckStart
    });

    // Step 6: Usage Validation
    const usageCheckStart = new Date();
    if (ticket.status === 'USED' || ticket.status === 'ALL_USED') {
      verificationSteps.push({
        step: 'USAGE_VALIDATION',
        passed: false,
        message: 'Ticket has already been used',
        details: {
          currentStatus: ticket.status,
          lastUpdated: ticket.updatedAt
        },
        timestamp: usageCheckStart
      });
      
      return {
        success: false,
        step: 'USAGE',
        error: 'Ticket Already Used',
        details: 'This ticket was scanned previously',
        verificationSteps
      };
    }
    
    verificationSteps.push({
      step: 'USAGE_VALIDATION',
      passed: true,
      message: 'Ticket has not been used yet',
      details: {
        currentStatus: ticket.status,
        lastUpdated: ticket.updatedAt
      },
      timestamp: usageCheckStart
    });

    // Step 7: Attendee Validation
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
      attendeeInfo = { type: 'General', name: ticket.purchaserName };
    }

    // ---------------------------------------------------------
    // FINAL SUCCESS: UPDATE TICKET STATUS
    // ---------------------------------------------------------
    const updateStart = new Date();
    await db.update(tickets)
      .set({ 
        status: 'USED',
        updatedAt: now
      })
      .where(eq(tickets.id, ticket.id));
    
    verificationSteps.push({
      step: 'STATUS_UPDATE',
      passed: true,
      message: 'Ticket status updated to USED',
      details: {
        oldStatus: ticket.status,
        newStatus: 'USED',
        timestamp: now.toISOString()
      },
      timestamp: updateStart
    });

    const endTime = new Date();
    const totalDuration = endTime.getTime() - startTime.getTime();

    // Summary of verification
    const passedSteps = verificationSteps.filter(step => step.passed).length;
    const totalSteps = verificationSteps.length;

    logger.info('Verification completed successfully', {
      ticketId: ticket.id,
      durationMs: totalDuration,
      stepsPassed: `${passedSteps}/${totalSteps}`
    });

    return {
      success: true,
      message: 'Access Granted',
      data: {
        verificationId: randomUUID(),
        timestamp: now.toISOString(),
        durationMs: totalDuration,
        summary: {
          purchaser: ticket.purchaserName,
          phone: ticket.purchaserPhone,
          ticketType: ticket.ticketType,
          session: session.name,
          time: `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`,
          day: day.name,
          date: new Date(day.date).toLocaleDateString(),
          verificationScore: `${passedSteps}/${totalSteps} steps passed`
        },
        attendee: attendeeInfo
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