import { NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { transactions } from '@/lib/drizzle/schema/transactions';
import { tickets } from '@/lib/drizzle/schema/tickets';
import { eq, and } from 'drizzle-orm';
import { SMSService } from '@/lib/services/sms';
import { updateSessionCountsAfterPurchase } from '@/lib/utils/session-limits';
import { sql } from 'drizzle-orm'

// --------------------------------------------------------------------------
// SMS UTILITIES
// --------------------------------------------------------------------------

/**
 * Builds the SMS message based on the transaction status.
 */
function buildSmsMessage(status: 'SUCCESS'| 'FAIL'  | 'FAILED' | 'PENDING' | 'UNKNOWN', raw: any): string {
  // Use the AzamPay message if it clearly indicates failure/success, otherwise use defaults.
  if (raw.message && raw.transactionstatus?.toLowerCase() !== 'success') {
      return raw.message;
  }
  
  const transId = raw.transid || raw.reference;

  switch (status) {
    case 'SUCCESS':
      return `Hongera malipo yako ya ticket yamepokelewa kikamilifu .Kwa taarifa zaidi wasiliana nasi 0753085789.`;
    case 'FAILED':
      return `Samahani, malipo yako ya Ticket YAMEKATALIWA. Tafadhali jaribu tena au wasiliana na support kwa msaada. Ref: ${transId}.`;
    case 'FAIL':
      return `Samahani, malipo yako ya Ticket YAMEKATALIWA. Tafadhali jaribu tena au wasiliana na support kwa msaada. Ref: ${transId}.`;
    case 'PENDING':
      return `Malipo yako ya Ticket yanashughulikiwa (PENDING). Utapokea confirmation SMS punde. Ref: ${transId}.`;
    case 'UNKNOWN':
    default:
      return `Tumepokea ujumbe wa muamala (Ref: ${transId}) , Tafadhali subiri uthibitisho au wasiliana nasi.`;
  }
}

/**
 * Finds the ticket and sends a non-blocking SMS.
 */
async function getTicketAndSendSMS(ticketId: number | null, status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'UNKNOWN', raw: any) {
    if (!ticketId) return;

    try {
        const ticket = await db.query.tickets.findFirst({
            where: eq(tickets.id, ticketId),
        });

        if (ticket?.purchaserPhone) {
            const smsMsg = buildSmsMessage(status, raw);
            SMSService.sendSMS(ticket.purchaserPhone, smsMsg).catch(err => 
                console.error(`SMS for ${status} failed:`, err)
            );
        }
    } catch (error) {
        console.error("Failed to fetch ticket or send SMS:", error);
    }
}


// --------------------------------------------------------------------------
// WEBHOOK POST HANDLER
// --------------------------------------------------------------------------

export async function POST(req: Request) {
  let rawData: any = null;

  try {
    rawData = await req.json();
    console.log('[AzamPay Webhook Received]:', JSON.stringify(rawData));

    const transId = rawData.transid || rawData.reference || rawData.externalreference;

    if (!transId) {
      return NextResponse.json({ success: false, message: 'Missing reference' }, { status: 400 });
    }

    // 1. DATABASE LOOKUP 
    const transaction = await db.query.transactions.findFirst({
        where: sql`trans_id = ${transId}`, 
    });

    if (!transaction) {
      console.error(`[Webhook Error]: Transaction ID ${transId} not found.`);
      return NextResponse.json({ success: false, message: 'Transaction not found' }, { status: 404 });
    }

    // 2. IDEMPOTENCY check (if already final, return success)
    if (
        (rawData.transactionstatus?.toLowerCase() === 'success' && transaction.status === 'success') ||
        ((rawData.transactionstatus?.toLowerCase() === 'failure' || rawData.transactionstatus?.toLowerCase() === 'failed') && transaction.status === 'failed')
    ) {
        return NextResponse.json({ success: true, message: 'Already processed' });
    }

    // 3. NORMALIZE STATUS and call handler
    const azamStatus = rawData.transactionstatus?.toLowerCase();
    let status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'UNKNOWN';

    if (azamStatus === 'success') {
      await handleSuccess(transaction, rawData);
      status = 'SUCCESS';
    } else if (azamStatus === 'failure' || azamStatus === 'failed') {
      await handleFailure(transaction, rawData);
      status = 'FAILED';
    } else if (azamStatus === 'pending') {
      await handlePending(transaction, rawData);
      status = 'PENDING';
    } else {
      // Default case for unknown status
      await handleUnknown(transaction, rawData);
      status = 'UNKNOWN';
    }

    // 4. Send SMS after DB update
    await getTicketAndSendSMS(transaction.ticketId, status, rawData);
    
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[CRITICAL WEBHOOK ERROR]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// --------------------------------------------------------------------------
// CASE HANDLERS
// --------------------------------------------------------------------------

async function handleSuccess(transaction: any, raw: any) {
    // 1. Update Transaction
    await db.update(transactions)
      .set({ status: 'success', message: raw.message || 'Payment Successful', rawResponse: raw })
      .where(eq(transactions.id, transaction.id));

    if (!transaction.ticketId) return;

    // 2. Update Ticket
    await db.update(tickets)
      .set({ paymentStatus: 'PAID', status: 'CONFIRMED' })
      .where(eq(tickets.id, transaction.ticketId));

    // 3. Update Session Counts
    const ticket = await db.query.tickets.findFirst({
        where: eq(tickets.id, transaction.ticketId),
    });
    
    if (ticket) {
      try {
        await updateSessionCountsAfterPurchase(
          ticket.sessionId,
          ticket.ticketType === 'ADULT' ? ticket.totalQuantity : 0,
          ticket.ticketType === 'STUDENT' ? ticket.totalQuantity : 0,
          ticket.ticketType === 'CHILD' ? ticket.totalQuantity : 0
        );
      } catch (e) {
        console.error("Session count update failed:", e);
      }
    }
}

async function handleFailure(transaction: any, raw: any) {
    // 1. Update Transaction
    await db.update(transactions)
      .set({ status: 'failed', message: raw.message || 'Payment Failed', rawResponse: raw })
      .where(eq(transactions.id, transaction.id));

    // 2. Update Ticket
    if (transaction.ticketId) {
      await db.update(tickets)
        .set({ paymentStatus: 'FAILED', status: 'CANCELLED' })
        .where(eq(tickets.id, transaction.ticketId));
    }
}

async function handlePending(transaction: any, raw: any) {
    // 1. Only update if the transaction was not already pending to avoid unnecessary DB write
    if (transaction.status !== 'pending') {
        await db.update(transactions)
          .set({ status: 'pending', message: raw.message || 'Payment Pending', rawResponse: raw })
          .where(eq(transactions.id, transaction.id));
        
        // Note: We don't change ticket status here, it remains 'PENDING_PAYMENT' or similar.
    }
}

async function handleUnknown(transaction: any, raw: any) {
    // 1. Update Transaction with unknown status details
    await db.update(transactions)
        .set({ status: 'unknown', message: raw.message || 'Unknown status received', rawResponse: raw })
        .where(eq(transactions.id, transaction.id));
    
    // Note: Do not change ticket status or session counts on unknown status.
}