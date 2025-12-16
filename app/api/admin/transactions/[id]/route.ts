// app/api/admin/transactions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { transactions } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

// GET single transaction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transactionId = parseInt(id);

    if (isNaN(transactionId)) {
      return NextResponse.json(
        { error: 'Invalid transaction ID' },
        { status: 400 }
      );
    }

    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1);

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}

// PUT update transaction
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transactionId = parseInt(id);
    const body = await request.json();

    if (isNaN(transactionId)) {
      return NextResponse.json(
        { error: 'Invalid transaction ID' },
        { status: 400 }
      );
    }

    // Check if transaction exists
    const [existingTransaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1);

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    // Only update fields that are provided
    if (body.externalId !== undefined) updateData.externalId = body.externalId;
    if (body.reference !== undefined) updateData.reference = body.reference;
    if (body.transId !== undefined) updateData.transId = body.transId;
    if (body.provider !== undefined) updateData.provider = body.provider;
    if (body.accountNumber !== undefined) updateData.accountNumber = body.accountNumber;
    if (body.amount !== undefined) updateData.amount = body.amount.toString();
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.message !== undefined) updateData.message = body.message;
    if (body.ticketId !== undefined) {
      updateData.ticketId = body.ticketId ? parseInt(body.ticketId) : null;
    }

    // Update transaction
    await db
      .update(transactions)
      .set(updateData)
      .where(eq(transactions.id, transactionId));

    // Fetch updated transaction
    const [updatedTransaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1);

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

// DELETE transaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transactionId = parseInt(id);

    if (isNaN(transactionId)) {
      return NextResponse.json(
        { error: 'Invalid transaction ID' },
        { status: 400 }
      );
    }

    await db
      .delete(transactions)
      .where(eq(transactions.id, transactionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}