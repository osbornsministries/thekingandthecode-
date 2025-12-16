// app/api/admin/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { transactions } from '@/lib/drizzle/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      );
    }

    const [transaction] = await db
      .insert(transactions)
      .values({
        ticketId: parseInt(body.ticketId),
        externalId: body.externalId || null,
        reference: body.reference || null,
        transId: body.transId || null,
        provider: body.provider || null,
        accountNumber: body.accountNumber || null,
        amount: body.amount ? body.amount.toString() : null,
        currency: body.currency || 'TZS',
        status: body.status || 'PENDING',
        message: body.message || null,
      });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}