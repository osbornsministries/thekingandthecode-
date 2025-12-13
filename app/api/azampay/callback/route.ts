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

  const normalizedStatus = statusMap[data.transactionstatus.toLowerCase()] ?? "UNKNOWN";

  return {
    raw: data,
    reference: data.utilityref,
    transId: data.transid,
    phone: data.msisdn,
    amount: Number(data.amount),
    operator: data.operator,
    message: data.message,
    status: normalizedStatus,
  };
}

export async function POST(req: Request) {
  try {
    const data: AzamPayCallbackData = await req.json();
    const callback = normalizeCallback(data);

    if (!callback.reference) {
      return NextResponse.json(
        { success: false, message: "Missing reference (utilityref)" },
        { status: 400 }
      );
    }

    // Find existing transaction
    let transaction = await db.query.transactions.findFirst({
      where: eq(transactions.externalId, callback.reference),
    });

    // Insert transaction if not found
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

      // Fetch the inserted transaction
      const [inserted] = await db.query.transactions.findMany({
        where: eq(transactions.id, insertResult.insertId),
        limit: 1,
      });
      transaction = inserted;
    } else {
      // Update existing transaction with new callback data
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

    // Safely call handlers
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
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ------------------- HANDLERS ------------------- */

async function handleSuccess(transaction: any, cb: ReturnType<typeof normalizeCallback>) {
  // Update transaction
  await db.update(transactions).set({ status: "success" }).where(eq(transactions.id, transaction.id));

  // Only update ticket if ticketId exists
  if (transaction.ticketId) {
    await db.update(tickets)
      .set({ paymentStatus: "PAID", status: "CONFIRMED" })
      .where(eq(tickets.id, transaction.ticketId));

    const ticket = await db.query.tickets.findFirst({ where: eq(tickets.id, transaction.ticketId) });
    if (ticket) {
      await SMSService.sendSMS(ticket.purchaserPhone, `Hello ${ticket.purchaserName}, your payment is received. Ticket Ref: ${cb.transId}`);

      // Update session counts
      await updateSessionCountsAfterPurchase(
        ticket.sessionId,
        ticket.ticketType === 'ADULT' ? ticket.totalQuantity : 0,
        ticket.ticketType === 'STUDENT' ? ticket.totalQuantity : 0,
        ticket.ticketType === 'CHILD' ? ticket.totalQuantity : 0
      );
    }
  }
}

async function handleFailure(transaction: any, cb: ReturnType<typeof normalizeCallback>) {
  await db.update(transactions).set({ status: "failed" }).where(eq(transactions.id, transaction.id));

  if (transaction.ticketId) {
    await db.update(tickets)
      .set({ paymentStatus: "FAILED", status: "CANCELLED" })
      .where(eq(tickets.id, transaction.ticketId));

    const ticket = await db.query.tickets.findFirst({ where: eq(tickets.id, transaction.ticketId) });
    if (ticket) {
      const msg = `Hello ${ticket.purchaserName}, payment failed. Reason: ${cb.message || "Payment failed"}.`;
      await SMSService.sendSMS(ticket.purchaserPhone, msg);
    }
  }
}

async function handlePending(transaction: any) {
  await db.update(transactions).set({ status: "pending" }).where(eq(transactions.id, transaction.id));
}
