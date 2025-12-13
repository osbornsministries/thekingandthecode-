import { NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { tickets, transactions } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { SMSService } from '@/lib/services/sms';

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

/** Normalize & clean callback for internal use */
function normalizeCallback(data: AzamPayCallbackData) {
  const statusMap: Record<string, NormalizedStatus> = {
    success: "SUCCESS",
    succeeded: "SUCCESS",
    failure: "FAILED",
    failed: "FAILED",
    pending: "PENDING",
  };

  const normalizedStatus =
    statusMap[data.transactionstatus.toLowerCase()] ?? "UNKNOWN";

  return {
    raw: data,                     // full original data
    reference: data.utilityref,    // externalId
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

    // --- CLEAN INITIAL RESPONSE (NO DEBUGGING) ---
    const callback = normalizeCallback(data);

    // Validate
    if (!callback.reference) {
      return NextResponse.json(
        { success: false, message: "Missing reference (utilityref)" },
        { status: 400 }
      );
    }

    // Get transaction
    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.externalId, callback.reference),
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: "Transaction not found" },
        { status: 404 }
      );
    }

    // Save raw callback always
    await db.update(transactions)
      .set({
        rawResponse: callback.raw,
        message: callback.message,
      })
      .where(eq(transactions.id, transaction.id));

    // Process based on decoded status
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

      default:
        // UNKNOWN, do nothing except store raw data
        break;
    }

    // --- CLEAN FINAL RESPONSE ---
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
  await db.update(transactions)
    .set({ status: "success" })
    .where(eq(transactions.id, transaction.id));

  // Update ticket
  await db.update(tickets)
    .set({ paymentStatus: "PAID", status: "CONFIRMED" })
    .where(eq(tickets.id, transaction.ticketId));

  // Fetch ticket
  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.id, transaction.ticketId),
  });

  if (ticket) {
    const msg = `Hello ${ticket.purchaserName}, your payment is received. Ticket Ref: ${cb.transId}`;
     await SMSService.sendSMS(ticket.purchaserPhone, msg);
  }
}

async function handleFailure(transaction: any, cb: ReturnType<typeof normalizeCallback>) {
  await db.update(transactions)
    .set({ status: "failed" })
    .where(eq(transactions.id, transaction.id));

  await db.update(tickets)
    .set({ paymentStatus: "FAILED", status: "CANCELLED" })
    .where(eq(tickets.id, transaction.ticketId));

  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.id, transaction.ticketId),
  });

  if (ticket) {
    const reason = cb.message || "Payment failed";
    const msg = `Hello ${ticket.purchaserName}, payment failed. Reason: ${reason}.`;
    await SMSService.sendSMS(ticket.purchaserPhone, msg);
  }
}

async function handlePending(transaction: any) {
  await db.update(transactions)
    .set({ status: "pending" })
    .where(eq(transactions.id, transaction.id));
}
