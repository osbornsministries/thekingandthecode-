import { NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { tickets, transactions } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { SMSService } from '@/lib/services/sms';
import { updateSessionCountsAfterPurchase } from '@/lib/utils/session-limits';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface AzamPayCallbackData {
  msisdn: string;
  amount: string;
  message: string;
  utilityref: string;
  operator: string;
  reference: string;
  transactionstatus: string;
  submerchantAcc: string;
  transid: string;
}

type NormalizedStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'UNKNOWN';

/* -------------------------------------------------------------------------- */
/*                                  LOGGER                                    */
/* -------------------------------------------------------------------------- */

function log(area: string, message: string, payload?: any) {
  console.log(
    `[AzamPay][${area}] ${message}`,
    payload ? JSON.stringify(payload, null, 2) : ''
  );
}

function logError(area: string, message: string, error?: any) {
  console.error(
    `[AzamPay][${area}][ERROR] ${message}`,
    error instanceof Error ? error.message : error
  );
}

/* -------------------------------------------------------------------------- */
/*                             NORMALIZE CALLBACK                              */
/* -------------------------------------------------------------------------- */

function normalizeCallback(data: AzamPayCallbackData) {
  const statusMap: Record<string, NormalizedStatus> = {
    success: 'SUCCESS',
    succeeded: 'SUCCESS',
    failure: 'FAILED',
    failed: 'FAILED',
    pending: 'PENDING',
  };

  return {
    raw: data,
    reference: data.utilityref,
    transId: data.transid,
    phone: data.msisdn,
    amount: Number(data.amount),
    operator: data.operator,
    message: data.message,
    status:
      statusMap[data.transactionstatus?.toLowerCase()] ?? 'UNKNOWN',
  };
}

/* -------------------------------------------------------------------------- */
/*                                  WEBHOOK                                   */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
  const requestMeta = {
    method: req.method,
    url: req.url,
    ip:
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown',
    userAgent: req.headers.get('user-agent'),
    time: new Date().toISOString(),
  };

  log('HIT', 'Callback endpoint hit', requestMeta);

  let rawData: AzamPayCallbackData | null = null;

  try {
    /* --------------------------- RAW PAYLOAD --------------------------- */
    rawData = await req.json();
    log('RAW_PAYLOAD', 'Received raw payload', {
      ...rawData,
      msisdn: '***masked***',
    });

    /* ------------------------- NORMALIZED DATA -------------------------- */
    const callback = normalizeCallback(rawData);
    log('NORMALIZED', 'Normalized callback data', callback);

    if (!callback.reference) {
      logError('VALIDATION', 'Missing utilityref/reference', callback);
      return NextResponse.json(
        { success: false, message: 'Missing reference (utilityref)' },
        { status: 400 }
      );
    }

    /* ---------------------- TRANSACTION LOOKUP ------------------------- */
    let transaction = await db.query.transactions.findFirst({
      where: eq(transactions.externalId, callback.reference),
    });

    if (!transaction) {
      log('DB_CREATE', 'Creating new transaction', {
        reference: callback.reference,
      });

      const insertResult = await db.insert(transactions).values({
        ticketId: null,
        externalId: callback.reference,
        reference: callback.reference,
        transId: callback.transId,
        provider: callback.operator || 'UNKNOWN',
        accountNumber: callback.phone,
        amount: callback.amount,
        status: callback.status.toLowerCase(),
        message: callback.message,
        rawResponse: callback.raw,
      });

      const [inserted] = await db.query.transactions.findMany({
        where: eq(transactions.id, insertResult.insertId),
        limit: 1,
      });

      transaction = inserted;
    } else {
      log('DB_UPDATE', 'Updating existing transaction', {
        id: transaction.id,
        status: callback.status,
      });

      await db.update(transactions)
        .set({
          status: callback.status.toLowerCase(),
          message: callback.message,
          transId: callback.transId,
          rawResponse: callback.raw,
        })
        .where(eq(transactions.id, transaction.id));
    }

    /* -------------------------- STATUS HANDLING -------------------------- */
    switch (callback.status) {
      case 'SUCCESS':
        log('STATUS_SUCCESS', 'Processing success case', callback.reference);
        await handleSuccess(transaction, callback);
        break;

      case 'FAILED':
        log('STATUS_FAILED', 'Processing failure case', callback.reference);
        await handleFailure(transaction, callback);
        break;

      case 'PENDING':
        log('STATUS_PENDING', 'Processing pending case', callback.reference);
        await handlePending(transaction);
        break;

      default:
        log('STATUS_UNKNOWN', 'Unknown transaction status', callback);
    }

    const response = {
      success: true,
      status: callback.status,
      reference: callback.reference,
      message: 'Callback processed',
    };

    log('RESPONSE', 'Response sent to AzamPay', response);
    return NextResponse.json(response);
  } catch (error) {
    logError('FATAL', 'Unhandled webhook error', {
      error,
      rawData,
    });

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                               CASE HANDLERS                                */
/* -------------------------------------------------------------------------- */

async function handleSuccess(
  transaction: any,
  cb: ReturnType<typeof normalizeCallback>
) {
  log('SUCCESS', 'Start success handler', transaction.id);

  try {
    await db.update(transactions)
      .set({ status: 'success' })
      .where(eq(transactions.id, transaction.id));
    log('SUCCESS_DB', 'Transaction marked as success', transaction.id);
  } catch (err) {
    logError('SUCCESS_DB', 'Failed updating transaction', err);
  }

  if (!transaction.ticketId) {
    log('SUCCESS_SKIP', 'No ticket linked to transaction', transaction.id);
    return;
  }

  try {
    await db.update(tickets)
      .set({ paymentStatus: 'PAID', status: 'CONFIRMED' })
      .where(eq(tickets.id, transaction.ticketId));
    log('SUCCESS_TICKET', 'Ticket confirmed', transaction.ticketId);
  } catch (err) {
    logError('SUCCESS_TICKET', 'Ticket update failed', err);
  }

  let ticket;
  try {
    ticket = await db.query.tickets.findFirst({
      where: eq(tickets.id, transaction.ticketId),
    });
  } catch (err) {
    logError('SUCCESS_FETCH', 'Failed fetching ticket', err);
    return;
  }

  try {
    const sms = await SMSService.sendSMS(
      ticket.purchaserPhone,
      `Hello ${ticket.purchaserName}, payment received. Ref: ${cb.transId}`
    );
    log('SUCCESS_SMS', 'SMS sent', sms);
  } catch (err) {
    logError('SUCCESS_SMS', 'SMS failed', err);
  }

  try {
    await updateSessionCountsAfterPurchase(
      ticket.sessionId,
      ticket.ticketType === 'ADULT' ? ticket.totalQuantity : 0,
      ticket.ticketType === 'STUDENT' ? ticket.totalQuantity : 0,
      ticket.ticketType === 'CHILD' ? ticket.totalQuantity : 0
    );
    log('SUCCESS_LIMITS', 'Session limits updated', ticket.sessionId);
  } catch (err) {
    logError('SUCCESS_LIMITS', 'Session limit update failed', err);
  }
}

async function handleFailure(
  transaction: any,
  cb: ReturnType<typeof normalizeCallback>
) {
  log('FAILURE', 'Start failure handler', transaction.id);

  await db.update(transactions)
    .set({ status: 'failed' })
    .where(eq(transactions.id, transaction.id));

  if (!transaction.ticketId) {
    log('FAILURE_SKIP', 'No ticket linked', transaction.id);
    return;
  }

  await db.update(tickets)
    .set({ paymentStatus: 'FAILED', status: 'CANCELLED' })
    .where(eq(tickets.id, transaction.ticketId));

  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.id, transaction.ticketId),
  });

  if (ticket) {
    try {
      await SMSService.sendSMS(
        ticket.purchaserPhone,
        `Payment failed. Reason: ${cb.message || 'Unknown error'}`
      );
      log('FAILURE_SMS', 'Failure SMS sent', ticket.id);
    } catch (err) {
      logError('FAILURE_SMS', 'Failure SMS failed', err);
    }
  }
}

async function handlePending(transaction: any) {
  log('PENDING', 'Marking transaction pending', transaction.id);
  await db.update(transactions)
    .set({ status: 'pending' })
    .where(eq(transactions.id, transaction.id));
}
