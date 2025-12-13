import { NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { tickets, transactions } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { SMSService } from '@/lib/services/sms';
import { updateSessionCountsAfterPurchase } from '@/lib/utils/session-limits';

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

type NormalizedStatus = "SUCCESS" | "FAILED" | "PENDING" | "UNKNOWN";

function normalizeCallback(data: AzamPayCallbackData) {
  const statusMap: Record<string, NormalizedStatus> = {
    success: "SUCCESS",
    succeeded: "SUCCESS",
    failure: "FAILED",
    failed: "FAILED",
    pending: "PENDING",
  };

  return {
    raw: data,
    reference: data.utilityref,
    transId: data.transid,
    phone: data.msisdn,
    amount: Number(data.amount),
    operator: data.operator,
    message: data.message,
    status: statusMap[data.transactionstatus.toLowerCase()] ?? "UNKNOWN",
  };
}

export async function POST(req: Request) {
  try {
    const data: AzamPayCallbackData = await req.json();
    const callback = normalizeCallback(data);

    if (!callback.reference) {
      return NextResponse.json({ success: false, message: "Missing reference (utilityref)" }, { status: 400 });
    }

    // 1️⃣ Find existing transaction
    let transaction = await db.query.transactions.findFirst({
      where: eq(transactions.externalId, callback.reference),
    });

    // 2️⃣ Insert transaction if not found
    if (!transaction) {
      const insertResult = await db.insert(transactions).values({
        ticketId: null, // Nullable
        externalId: callback.reference,
        reference: callback.reference,
        transId: callback.transId,
        provider: callback.operator || "UNKNOWN",
        accountNumber: callback.phone || null,
        amount: callback.amount,
        status: callback.status,
        message: callback.message,
        rawResponse: callback.raw,
      });

      // Fetch inserted transaction
      const [inserted] = await db.query.transactions.findMany({
        where: eq(transactions.id, insertResult.insertId),
        limit: 1,
      });
      transaction = inserted;
    } else {
      // 3️⃣ Update existing transaction
      await db.update(transactions)
        .set({
          status: callback.status.toLowerCase(),
          message: callback.message,
          reference: callback.reference,
          transId: callback.transId,
          rawResponse: callback.raw,
        })
        .where(eq(transactions.id, transaction.id));
    }

    // 4️⃣ Call status handler safely
    if (transaction) {
      switch (callback.status) {
        case "SUCCESS":
          await handleSuccess(transaction, callback);
          break;
        case "FAILED":
          await handleFailure(transaction, callback);
          break;
        case "PENDING":
          await handlePending(transaction);
          break;
      }
    }

    return NextResponse.json({
      success: true,
      status: callback.status,
      reference: callback.reference,
      message: "Callback processed",
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

/* ------------------- HANDLERS ------------------- */

async function handleSuccess(transaction: any, cb: ReturnType<typeof normalizeCallback>) {
  console.log(`[handleSuccess] Start processing transaction ${transaction.id}`);

  // 1️⃣ Update transaction status
  try {
    await db.update(transactions)
      .set({ status: "success" })
      .where(eq(transactions.id, transaction.id));
    console.log(`[handleSuccess] Transaction ${transaction.id} status updated to SUCCESS`);
  } catch (err) {
    console.error(`[handleSuccess] Failed to update transaction ${transaction.id}:`, err);
  }

  // 2️⃣ Ensure ticket exists
  if (!transaction.ticketId) {
    console.warn(`[handleSuccess] Transaction ${transaction.id} has no linked ticketId`);
    return;
  }

  // 3️⃣ Update ticket status
  try {
    await db.update(tickets)
      .set({ paymentStatus: "PAID", status: "CONFIRMED" })
      .where(eq(tickets.id, transaction.ticketId));
    console.log(`[handleSuccess] Ticket ${transaction.ticketId} status updated to PAID/CONFIRMED`);
  } catch (err) {
    console.error(`[handleSuccess] Failed to update ticket ${transaction.ticketId}:`, err);
  }

  // 4️⃣ Fetch ticket info
  let ticket;
  try {
    ticket = await db.query.tickets.findFirst({ where: eq(tickets.id, transaction.ticketId) });
    if (!ticket) {
      console.warn(`[handleSuccess] Ticket ${transaction.ticketId} not found in DB`);
      return;
    }
    console.log(`[handleSuccess] Ticket fetched:`, ticket);
  } catch (err) {
    console.error(`[handleSuccess] Error fetching ticket ${transaction.ticketId}:`, err);
  }

  // 5️⃣ Send SMS notification
  try {
    const smsResult = await SMSService.sendSMS(
      ticket.purchaserPhone,
      `Hello ${ticket.purchaserName}, your payment is received. Ticket Ref: ${cb.transId}`
    );
    console.log(`[handleSuccess] SMS sent result:`, smsResult);
  } catch (smsError) {
    console.error(`[handleSuccess] SMS send failed for ticket ${ticket.id}:`, smsError);
  }

  // 6️⃣ Update session ticket limits
  try {
    console.log(`[handleSuccess] Updating session counts for session ${ticket.sessionId}`);
    await updateSessionCountsAfterPurchase(
      ticket.sessionId,
      ticket.ticketType === 'ADULT' ? ticket.totalQuantity : 0,
      ticket.ticketType === 'STUDENT' ? ticket.totalQuantity : 0,
      ticket.ticketType === 'CHILD' ? ticket.totalQuantity : 0
    );
    console.log(`[handleSuccess] Session counts updated for session ${ticket.sessionId}`);
  } catch (limitError) {
    console.error(`[handleSuccess] Failed to update session counts for ticket ${ticket.id}:`, limitError);
  }

  console.log(`[handleSuccess] Finished processing transaction ${transaction.id}`);
}



async function handleFailure(transaction: any, cb: ReturnType<typeof normalizeCallback>) {
  await db.update(transactions).set({ status: "failed" }).where(eq(transactions.id, transaction.id));

  if (transaction.ticketId) {
    await db.update(tickets).set({ paymentStatus: "FAILED", status: "CANCELLED" }).where(eq(tickets.id, transaction.ticketId));
    const ticket = await db.query.tickets.findFirst({ where: eq(tickets.id, transaction.ticketId) });

    if (ticket) {
      const msg = `Hello ${ticket.purchaserName}, payment failed. Reason: ${cb.message || "Payment failed"}.`;
      try {
        await SMSService.sendSMS(ticket.purchaserPhone, msg);
      } catch (smsError) {
        console.error("SMS send failed for FAILURE:", smsError);
      }
    }
  } else {
    console.warn(`Transaction ${transaction.id} has no linked ticket for FAILURE SMS.`);
  }
}

async function handlePending(transaction: any) {
  await db.update(transactions).set({ status: "pending" }).where(eq(transactions.id, transaction.id));
}
