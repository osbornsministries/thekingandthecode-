// lib/actions/purchase-processor.ts
'use server';

import { db } from '@/lib/db/db';
import { SMSService } from '@/lib/services/sms';
import { Logger } from '@/lib/logger/logger';
import { 
  tickets, transactions, adults, students, children, 
  eventSessions, eventDays, ticketPrices, paymentMethods
} from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------
export interface PurchaseData {
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
}

export interface ValidationResult {
  passed: boolean;
  step: string;
  message: string;
  details?: any;
}

export interface PaymentResult {
  success: boolean;
  method: string;
  transactionId?: string;
  provider?: string;
  externalId?: string;
  data?: any;
  message?: string;
  status?: 'PENDING' | 'COMPLETED' | 'FAILED';
  apiResponse?: any;
}

export interface PaymentSubmissionResult {
  success: boolean;
  message: string;
  requiresPinConfirmation?: boolean;
  ticketId?: number;
  ticketCode?: string;
  transactionId?: string;
  externalId?: string;
  validationResults?: ValidationResult[];
  paymentResult?: PaymentResult;
  error?: string;
  summary?: any;
}

// ----------------------------------------------------------------------
// VALIDATION FUNCTIONS
// ----------------------------------------------------------------------
async function validatePurchaseData(formData: PurchaseData): Promise<{
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
  const logger = new Logger('validation');
  const validationResults: ValidationResult[] = [];
  
  try {
    logger.info('Starting purchase validation', { 
      dayId: formData.dayId, 
      sessionId: formData.sessionId,
      ticketType: formData.ticketType 
    });

    // 1. Validate Day
    const day = await db.select()
      .from(eventDays)
      .where(and(
        eq(eventDays.id, formData.dayId),
        eq(eventDays.isActive, true)
      ))
      .then(rows => rows[0]);

    if (!day) {
      logger.error('Day validation failed', { dayId: formData.dayId });
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

    // 2. Validate Session
    const session = await db.select()
      .from(eventSessions)
      .where(and(
        eq(eventSessions.id, formData.sessionId),
        eq(eventSessions.dayId, formData.dayId)
      ))
      .then(rows => rows[0]);

    if (!session) {
      logger.error('Session validation failed', { 
        sessionId: formData.sessionId, 
        dayId: formData.dayId 
      });
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
      logger.error('Price validation failed', { priceId: formData.priceId });
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
      logger.error('Payment method validation failed', { 
        paymentMethodId: formData.paymentMethodId 
      });
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

    // 5. Validate student data if ticket type is STUDENT
    if (formData.ticketType === 'STUDENT') {
      if (!formData.studentId || !formData.studentId.trim()) {
        logger.error('Student validation failed - missing student ID');
        return {
          success: false,
          error: 'Student ID is required for student tickets',
          validationResults: [{
            passed: false,
            step: 'STUDENT_VALIDATION',
            message: 'Student ID is required',
            details: { ticketType: 'STUDENT' }
          }]
        };
      }
      
      if (!formData.institution) {
        logger.error('Student validation failed - missing institution type');
        return {
          success: false,
          error: 'Institution type is required for student tickets',
          validationResults: [{
            passed: false,
            step: 'STUDENT_VALIDATION',
            message: 'Institution type is required',
            details: { ticketType: 'STUDENT' }
          }]
        };
      }
      
      if (formData.institution === 'OTHER' && (!formData.institutionName || !formData.institutionName.trim())) {
        logger.error('Student validation failed - missing institution name for "Other"');
        return {
          success: false,
          error: 'Institution name is required when "Other" is selected',
          validationResults: [{
            passed: false,
            step: 'STUDENT_VALIDATION',
            message: 'Institution name required for "Other" institution',
            details: { institution: 'OTHER' }
          }]
        };
      }
    }

    // 6. Validate amount matches price
    const calculatedAmount = parseFloat(price.price) * formData.quantity;
    if (Math.abs(formData.totalAmount - calculatedAmount) > 0.01) {
      logger.error('Amount validation failed', { 
        provided: formData.totalAmount, 
        calculated: calculatedAmount 
      });
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
    logger.info('All validations passed successfully');
    
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
    
    // Add student validation result if applicable
    if (formData.ticketType === 'STUDENT') {
      validationResults.push({
        passed: true,
        step: 'STUDENT_VALIDATION',
        message: `Student validated: ${formData.studentId} - ${formData.institution}`,
        details: {
          studentId: formData.studentId,
          institutionType: formData.institution,
          institutionName: formData.institution === 'OTHER' ? formData.institutionName : formData.institution
        }
      });
    }

    return {
      success: true,
      validationResults,
      data: { day, session, price, paymentMethod }
    };

  } catch (error: any) {
    logger.critical('Validation system error', error);
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
// PAYMENT SUBMISSION - Only initiates payment
// ----------------------------------------------------------------------
const PAYMENT_API_URL = 'https://payment.osbornsexhibition.co.tz/api/v1/checkout/mno';

async function submitPayment(
  ticketId: number,
  ticketCode: string,
  formData: PurchaseData,
  validationResults: ValidationResult[]
): Promise<{
  success: boolean;
  paymentResult?: PaymentResult;
  error?: string;
  validationResults: ValidationResult[];
  requiresPinConfirmation: boolean;
}> {
  const logger = new Logger('payment-submission');
  
  try {
    const externalId = `TICKET-${ticketCode}`;
    
    // Prepare payload for Laravel API
    const apiPayload = {
      accountNumber: formData.phone,
      amount: formData.totalAmount,
      currency: 'TZS',
      provider: formData.paymentMethodId,
      reference: ticketCode,
      customerName: formData.fullName,
      description: `Ticket Purchase - ${ticketCode}`
    };
    
    logger.request('Submitting payment to external API', { 
      url: PAYMENT_API_URL, 
      payload: apiPayload 
    });

    // Call the external Laravel API
    const response = await fetch(PAYMENT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(apiPayload),
      cache: 'no-store'
    });

    const apiResponse = await response.json();
    logger.response('Payment API response received', apiResponse);
    
    // Check for API success
    if (response.ok && apiResponse.status === 'success') {
      
      // Successful Initiation - Create PENDING transaction
      await db.insert(transactions).values({
        ticketId: ticketId,
        externalId: apiResponse.externalId || externalId,
        provider: apiResponse.provider || formData.paymentMethodId.toUpperCase(),
        accountNumber: formData.phone,
        amount: formData.totalAmount.toString(),
        status: 'PENDING',
        currency: 'TZS',
        metadata: JSON.stringify({
          apiResponse: apiResponse,
          submittedAt: new Date().toISOString(),
          paymentMethod: formData.paymentMethodId
        })
      });

      const paymentResult: PaymentResult = {
        success: true,
        method: formData.paymentMethodId,
        provider: apiResponse.provider || formData.paymentMethodId.toUpperCase(),
        transactionId: apiResponse.externalId || externalId,
        externalId: apiResponse.externalId || externalId,
        data: apiResponse.azampay_data || apiResponse.data,
        status: 'PENDING',
        message: apiResponse.message || 'Payment submitted successfully.',
        apiResponse: apiResponse
      };

      validationResults.push({
        passed: true,
        step: 'PAYMENT_SUBMISSION',
        message: `Payment submitted via ${formData.paymentMethodId}`,
        details: { status: 'SUBMITTED', requiresPin: true }
      });

      return {
        success: true,
        paymentResult,
        validationResults,
        requiresPinConfirmation: true
      };

    } else {
      // Payment Submission Failed
      const errorMessage = apiResponse.message || 
                          apiResponse.error || 
                          `Payment submission failed with status ${response.status}`;
      
      const errorDetails = apiResponse.errors || 
                          apiResponse.azampay_response || 
                          { status: response.status, response: apiResponse };

      // Create FAILED transaction
      await db.insert(transactions).values({
        ticketId: ticketId,
        externalId: externalId,
        provider: formData.paymentMethodId.toUpperCase(),
        accountNumber: formData.phone,
        amount: formData.totalAmount.toString(),
        status: 'FAILED',
        currency: 'TZS',
        errorMessage: errorMessage,
        metadata: JSON.stringify({
          errorDetails: errorDetails,
          submittedAt: new Date().toISOString()
        })
      });

      // Update ticket status to FAILED
      await db.update(tickets)
        .set({ 
          paymentStatus: 'FAILED',
          status: 'FAILED',
          updatedAt: new Date()
        })
        .where(eq(tickets.id, ticketId));

      const paymentResult: PaymentResult = {
        success: false,
        method: formData.paymentMethodId,
        status: 'FAILED',
        message: errorMessage,
        apiResponse: apiResponse
      };

      logger.error('Payment submission failed', { errorDetails, paymentResult });
      
      validationResults.push({
        passed: false,
        step: 'PAYMENT_SUBMISSION',
        message: `Payment submission failed: ${errorMessage}`,
        details: { errorDetails, paymentResult }
      });

      return {
        success: false,
        error: errorMessage,
        paymentResult,
        validationResults,
        requiresPinConfirmation: false
      };
    }

  } catch (paymentError: any) {
    // Network or uncaught server error
    logger.critical('Error contacting external payment API', paymentError);
    
    const externalId = `ERROR-${ticketCode}`;
    
    // Create ERROR transaction
    await db.insert(transactions).values({
      ticketId: ticketId,
      externalId: externalId,
      provider: formData.paymentMethodId.toUpperCase(),
      accountNumber: formData.phone,
      amount: formData.totalAmount.toString(),
      status: 'ERROR',
      currency: 'TZS',
      errorMessage: paymentError.message,
      metadata: JSON.stringify({
        error: paymentError.message,
        timestamp: new Date().toISOString()
      })
    });

    // Update ticket status
    await db.update(tickets)
      .set({ 
        paymentStatus: 'FAILED',
        status: 'FAILED',
        updatedAt: new Date()
      })
      .where(eq(tickets.id, ticketId));

    const paymentResult: PaymentResult = {
      success: false,
      method: formData.paymentMethodId,
      status: 'FAILED',
      message: `Payment system error: ${paymentError.message}`
    };

    validationResults.push({
      passed: false,
      step: 'PAYMENT_SUBMISSION',
      message: 'Network or server error during payment submission',
      details: { error: paymentError.message, paymentResult }
    });

    return {
      success: false,
      error: `Payment system error: ${paymentError.message}`,
      paymentResult,
      validationResults,
      requiresPinConfirmation: false
    };
  }
}

// ----------------------------------------------------------------------
// CREATE ATTENDEES
// ----------------------------------------------------------------------
async function createAttendees(
  ticketId: number,
  ticketCode: string,
  formData: PurchaseData,
  validationResults: ValidationResult[]
): Promise<void> {
  const logger = new Logger('attendee-creation');
  
  const attendeeTable = formData.ticketType === 'ADULT' ? adults :
                       formData.ticketType === 'STUDENT' ? students :
                       formData.ticketType === 'CHILD' ? children : null;

  if (!attendeeTable) {
    logger.warn('No attendee table found for ticket type', { ticketType: formData.ticketType });
    return;
  }

  try {
    for (let i = 0; i < formData.quantity; i++) {
      await db.insert(attendeeTable).values({
        ticketId: ticketId,
        fullName: `${formData.fullName} ${i + 1}`,
        phoneNumber: formData.phone,
        ...(formData.ticketType === 'STUDENT' && { 
          studentId: formData.studentId || `STU-${ticketCode.slice(0, 8)}-${i + 1}`,
          institutionType: formData.institution || 'UNKNOWN',
          institutionName: formData.institution === 'OTHER' 
            ? (formData.institutionName || 'Other Institution')
            : formData.institution || 'Unknown Institution'
        }),
        ...(formData.ticketType === 'CHILD' && { 
          parentName: formData.fullName 
        })
      });
    }
    
    logger.info(`Created ${formData.quantity} attendee record(s)`, { 
      ticketId, 
      ticketType: formData.ticketType 
    });
    
    validationResults.push({
      passed: true,
      step: 'ATTENDEE_CREATION',
      message: `Created ${formData.quantity} attendee record(s)`,
      details: { 
        quantity: formData.quantity, 
        type: formData.ticketType,
        ...(formData.ticketType === 'STUDENT' && {
          studentId: formData.studentId,
          institution: formData.institution
        })
      }
    });
    
  } catch (error: any) {
    logger.error('Error creating attendees', error);
    validationResults.push({
      passed: false,
      step: 'ATTENDEE_CREATION',
      message: 'Failed to create attendee records',
      details: { error: error.message }
    });
  }
}

// ----------------------------------------------------------------------
// SEND SUBMISSION NOTIFICATION (Only for successful submission)
// ----------------------------------------------------------------------
async function sendSubmissionNotification(
  formData: PurchaseData,
  ticketCode: string,
  day: any,
  session: any,
  paymentResult: PaymentResult | undefined,
  validationResults: ValidationResult[]
): Promise<void> {
  const logger = new Logger('notification');
  
  try {
    let smsMessage = '';
    let smsStatus = 'pending';
    const paymentMethodName = formData.paymentMethodId.toUpperCase();
    
    if (formData.ticketType === 'ADULT') {
      // Payment submitted successfully - PIN confirmation required
     smsMessage = `Hello ${formData.fullName}!\n\n`;
      smsMessage += `Your ticket purchase for ${day.name} - ${session.name} has been submitted.\n`;
      smsMessage += `Please wait while  we confirm your transaction.`;
     
    }

      if (formData.ticketType === 'CHILD') {
      // Payment submitted successfully - PIN confirmation required
     smsMessage = `Hello ${formData.fullName}!\n\n`;
      smsMessage += `Your ticket purchase for ${day.name} - ${session.name} has been submitted.\n`;
      smsMessage += `Please wait while  we confirm your transaction.`;
     
    }
    
    // // Add student reminder if applicable
    if (formData.ticketType === 'STUDENT' && formData.studentId) {
      smsMessage = `Hello ${formData.fullName}!\n\n`;
      smsMessage += `Your ticket purchase for ${day.name} - ${session.name} has been submitted.\n`;
      smsMessage += `Please wait while we confirm your transaction.`;
    
    }
    
    // Send SMS
    if (smsMessage) {
      const smsResult = await SMSService.sendSMS(formData.phone, smsMessage);
      
      if (smsResult.success) {
        logger.info('SMS notification sent successfully', { 
          recipient: formData.phone, 
          status: smsStatus 
        });
      } else {
        logger.error('Failed to send SMS notification', { 
          recipient: formData.phone,
          error: smsResult.error 
        });
      }
      
      validationResults.push({
        passed: smsResult.success,
        step: 'SUBMISSION_NOTIFICATION',
        message: smsResult.success ? `SMS sent (${smsStatus})` : 'Failed to send SMS',
        details: { 
          smsMessage,
          smsStatus,
          recipient: formData.phone,
          ...(smsResult.error && { error: smsResult.error })
        }
      });
    } else {
      logger.warn('No SMS message to send');
      validationResults.push({
        passed: true,
        step: 'SUBMISSION_NOTIFICATION',
        message: 'No notification needed at this stage',
        details: { reason: 'Only sending SMS for successful submissions' }
      });
    }
    
  } catch (smsError: any) {
    logger.error('Error in notification process', smsError);
    validationResults.push({
      passed: false,
      step: 'NOTIFICATION',
      message: 'Failed to send notification',
      details: { error: smsError.message }
    });
  }
}

// ----------------------------------------------------------------------
// MAIN ACTION: Submit Ticket Purchase (Payment only - no verification)
// ----------------------------------------------------------------------
export async function submitTicketPurchase(formData: PurchaseData): Promise<PaymentSubmissionResult> {
  const logger = new Logger('ticket-purchase-submission');
  const validationResults: ValidationResult[] = [];

  try {
    logger.info(`Starting purchase submission for ${formData.fullName}`, { 
      phone: formData.phone,
      amount: formData.totalAmount,
      paymentMethod: formData.paymentMethodId
    });

    // ---------------------------------------------------------
    // VALIDATION PHASE
    // ---------------------------------------------------------
    const validation = await validatePurchaseData(formData);
    if (!validation.success) {
      logger.error('Purchase validation failed', validation.validationResults);
      return {
        success: false,
        error: validation.error,
        message: validation.error || 'Validation failed',
        validationResults: validation.validationResults
      };
    }

    validationResults.push(...validation.validationResults);
    logger.info('Purchase validation passed', validation.validationResults);

    const { day, session, price, paymentMethod } = validation.data!;

    // ---------------------------------------------------------
    // CREATE TICKET RECORD
    // ---------------------------------------------------------
    const ticketCode = `TK${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;

    logger.info('Creating ticket record...', { ticketCode });
    
    const [ticketResult] = await db.insert(tickets).values({
      sessionId: formData.sessionId,
      ticketCode: ticketCode,
      purchaserName: formData.fullName,
      purchaserPhone: formData.phone,
      ticketType: formData.ticketType,
      totalAmount: formData.totalAmount.toString(),
      status: 'PENDING',
      paymentStatus: 'PENDING',
      paymentMethodId: formData.paymentMethodId,
      metadata: JSON.stringify({
        studentId: formData.studentId,
        institution: formData.institution,
        institutionName: formData.institutionName,
        dayName: day.name,
        sessionName: session.name,
        submittedAt: new Date().toISOString()
      })
    }).$returningId();

    const ticketId = ticketResult.id;
    
    logger.info('Ticket record created', { ticketId, ticketCode });
    
    validationResults.push({
      passed: true,
      step: 'TICKET_CREATION',
      message: `Ticket created successfully`,
      details: { ticketId, ticketCode }
    });

    // ---------------------------------------------------------
    // CREATE ATTENDEES
    // ---------------------------------------------------------
    await createAttendees(ticketId, ticketCode, formData, validationResults);

    // ---------------------------------------------------------
    // SUBMIT PAYMENT (Only initiation - no verification)
    // ---------------------------------------------------------
    const payment = await submitPayment(ticketId, ticketCode, formData, validationResults);
    
    // Send submission notification only
    await sendSubmissionNotification(formData, ticketCode, day, session, payment.paymentResult, validationResults);

    // if (!payment.success) {
    //   logger.error('Payment submission failed', { 
    //     ticketId, 
    //     error: payment.error 
    //   });
      
    //   return {
    //     success: false,
    //     error: payment.error,
    //     message: payment.error || 'Payment submission failed',
    //     ticketId: ticketId,
    //     ticketCode: ticketCode,
    //     validationResults,
    //     paymentResult: payment.paymentResult,
    //     summary: {
    //       purchaser: formData.fullName,
    //       phone: formData.phone,
    //       event: `${day.name} - ${session.name}`,
    //       date: new Date(day.date).toLocaleDateString(),
    //       time: `${session.startTime} - ${session.endTime}`,
    //       ticketType: formData.ticketType,
    //       ...(formData.ticketType === 'STUDENT' && {
    //         studentId: formData.studentId,
    //         institution: formData.institution,
    //         institutionName: formData.institutionName
    //       }),
    //       quantity: formData.quantity,
    //       amount: formData.totalAmount,
    //       paymentMethod: formData.paymentMethodId,
    //       paymentMethodName: paymentMethod.name,
    //       paymentStatus: 'FAILED',
    //       ticketStatus: 'FAILED',
    //       message: payment.error || 'Payment submission failed',
    //       note: 'Please try again or contact support.'
    //     }
    //   };
    // }

    validationResults.push(...payment.validationResults);
    
    logger.info('Payment submitted successfully', { 
      ticketId, 
      ticketCode,
      requiresPinConfirmation: payment.requiresPinConfirmation 
    });

    // ---------------------------------------------------------
    // FINAL RESPONSE FOR SUCCESSFUL SUBMISSION
    // ---------------------------------------------------------
    const finalResult: PaymentSubmissionResult = {
      success: true,
      message: payment.paymentResult?.message || 'Payment submitted successfully. Please check your phone to enter PIN.',
      requiresPinConfirmation: payment.requiresPinConfirmation,
      ticketId: ticketId,
      ticketCode: ticketCode,
      transactionId: payment.paymentResult?.transactionId,
      externalId: payment.paymentResult?.externalId,
      validationResults,
      paymentResult: payment.paymentResult,
      summary: {
        purchaser: formData.fullName,
        phone: formData.phone,
        event: `${day.name} - ${session.name}`,
        date: new Date(day.date).toLocaleDateString(),
        time: `${session.startTime} - ${session.endTime}`,
        ticketType: formData.ticketType,
        ...(formData.ticketType === 'STUDENT' && {
          studentId: formData.studentId,
          institution: formData.institution,
          institutionName: formData.institutionName
        }),
        quantity: formData.quantity,
        amount: formData.totalAmount,
        paymentMethod: formData.paymentMethodId,
        paymentMethodName: paymentMethod.name,
        paymentStatus: 'SUBMITTED',
        ticketStatus: 'PENDING',
        transactionId: payment.paymentResult?.transactionId,
        externalId: payment.paymentResult?.externalId,
        message: payment.paymentResult?.message || 'Payment submitted',
        note: 'Please check your phone and enter your PIN to complete the payment.',
        nextSteps: [
          'Check your phone for payment request',
          'Enter your PIN to confirm payment',
          'Payment will be verified automatically',
        ],
        importantNote: 'Enter your PIN on your phone when prompted to complete the payment.'
      }
    };

    logger.info('Purchase submission process completed', finalResult.summary);
    
    return finalResult;

  } catch (error: any) {
    logger.critical('Critical error in submitTicketPurchase', error);
    
    validationResults.push({
      passed: false,
      step: 'SYSTEM_ERROR',
      message: 'System error occurred',
      details: { error: error.message }
    });

    return {
      success: false,
      error: 'Internal server error. Please try again or contact support.',
      message: 'An unexpected error occurred. Please try again.',
      validationResults
    };
  }
}

// ----------------------------------------------------------------------
// HELPER: Check Payment Status (Separate action)
// ----------------------------------------------------------------------
export async function checkPaymentStatus(externalId: string) {
  const logger = new Logger('payment-status-check');
  
  try {
    logger.info('Checking payment status', { externalId });
    
    const transaction = await db.select()
      .from(transactions)
      .where(eq(transactions.externalId, externalId))
      .then(rows => rows[0]);

    if (!transaction) {
      logger.error('Transaction not found', { externalId });
      return {
        success: false,
        error: 'Transaction not found',
        message: 'Transaction not found. Please check the transaction ID.',
        externalId
      };
    }

    logger.info('Transaction found', { 
      externalId, 
      status: transaction.status 
    });

    // If already completed/failed, return status
    if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(transaction.status)) {
      const isSuccess = transaction.status === 'COMPLETED';
      
      if (isSuccess) {
        logger.info('Payment already completed', { externalId });
      } else {
        logger.warn('Payment failed or cancelled', { 
          externalId, 
          status: transaction.status 
        });
      }
      
      return {
        success: isSuccess,
        status: transaction.status,
        transaction,
        externalId,
        message: isSuccess 
          ? 'Payment completed successfully. Ticket is now active.'
          : `Payment ${transaction.status.toLowerCase()}. Please try again.`
      };
    }

    // For PENDING transactions, we'll check with Laravel API later
    // This should be called separately after PIN confirmation
    
    logger.info('Payment still pending', { 
      externalId, 
      status: transaction.status 
    });
    
    return {
      success: false,
      status: transaction.status,
      transaction,
      externalId,
      message: 'Payment still pending. Please complete the transaction on your phone.'
    };

  } catch (error: any) {
    logger.critical('Error checking payment status', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to check payment status. Please try again.',
      externalId
    };
  }
}

// ----------------------------------------------------------------------
// HELPER: Verify Payment with Laravel API (Separate action)
// ----------------------------------------------------------------------
export async function verifyPayment(transactionId: string) {
  const logger = new Logger('payment-verification');
  
  try {
    // This endpoint should be implemented in your Laravel API
    const verificationUrl = `https://payment.osbornsexhibition.co.tz/api/v1/checkout/verify/${transactionId}`;
    
    logger.request('Verifying payment with Laravel API', { 
      url: verificationUrl, 
      transactionId 
    });
    
    const response = await fetch(verificationUrl, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      logger.error('Verification API error', { 
        status: response.status,
        transactionId 
      });
      throw new Error(`API returned ${response.status}`);
    }
    
    const verificationData = await response.json();
    logger.response('Verification API response', verificationData);
    
    if (verificationData.status === 'success' && verificationData.data?.status === 'COMPLETED') {
      // Update transaction status
      const transaction = await db.select()
        .from(transactions)
        .where(eq(transactions.externalId, transactionId))
        .then(rows => rows[0]);
      
      if (transaction) {
        await db.update(transactions)
          .set({ 
            status: 'COMPLETED',
            updatedAt: new Date(),
            metadata: JSON.stringify({
              ...JSON.parse(transaction.metadata || '{}'),
              verifiedAt: new Date().toISOString(),
              verificationData: verificationData
            })
          })
          .where(eq(transactions.externalId, transactionId));

        // Update ticket status
        await db.update(tickets)
          .set({ 
            paymentStatus: 'PAID',
            status: 'ACTIVE',
            updatedAt: new Date()
          })
          .where(eq(tickets.id, transaction.ticketId));

        logger.info('Payment verified and updated successfully', { 
          transactionId, 
          ticketId: transaction.ticketId 
        });

        // Send success SMS (separate from submission SMS)
        const ticket = await db.select()
          .from(tickets)
          .where(eq(tickets.id, transaction.ticketId))
          .then(rows => rows[0]);
        
        if (ticket) {
          const day = await db.select()
            .from(eventDays)
            .innerJoin(eventSessions, eq(eventSessions.dayId, eventDays.id))
            .where(eq(eventSessions.id, ticket.sessionId))
            .then(rows => rows[0]?.eventDays);
          
          const session = await db.select()
            .from(eventSessions)
            .where(eq(eventSessions.id, ticket.sessionId))
            .then(rows => rows[0]);
          
          if (day && session) {
            const smsMessage = `Hello ${ticket.purchaserName}!\n\nYour payment for ticket ${ticket.ticketCode} has been confirmed.\nEvent: ${day.name} - ${session.name}\nYour ticket is now active.`;
            
            const smsResult = await SMSService.sendSMS(ticket.purchaserPhone, smsMessage);
            
            if (smsResult.success) {
              logger.info('Payment confirmation SMS sent', { 
                ticketCode: ticket.ticketCode,
                phone: ticket.purchaserPhone 
              });
            } else {
              logger.error('Failed to send payment confirmation SMS', {
                ticketCode: ticket.ticketCode,
                error: smsResult.error
              });
            }
          }
        }

        return {
          success: true,
          status: 'COMPLETED',
          transaction: { ...transaction, status: 'COMPLETED' },
          verificationData: verificationData,
          message: 'Payment verified successfully. Ticket is now active.'
        };
      }
    }
    
    logger.warn('Payment verification failed or still pending', { 
      transactionId, 
      verificationData 
    });
    
    return {
      success: false,
      status: verificationData.data?.status || 'PENDING',
      verificationData: verificationData,
      message: verificationData.message || 'Payment still pending or verification failed.'
    };
    
  } catch (error: any) {
    logger.critical('Error verifying payment', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to verify payment. Please try again.'
    };
  }
}