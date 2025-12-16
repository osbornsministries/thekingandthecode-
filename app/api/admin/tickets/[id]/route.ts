// app/api/admin/tickets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { tickets } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ticketId = parseInt(id);
    const body = await request.json();

    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: 'Invalid ticket ID' },
        { status: 400 }
      );
    }

    // Calculate total quantity
    const totalQuantity = (body.adultQuantity || 0) + (body.studentQuantity || 0) + (body.childQuantity || 0);

    // Prepare update data
    const updateData: any = {
      ...body,
      totalQuantity,
    };

    // Convert sessionId to number if present
    if (body.sessionId) {
      updateData.sessionId = parseInt(body.sessionId);
    }

    // Convert totalAmount to string if present
    if (body.totalAmount) {
      updateData.totalAmount = body.totalAmount.toString();
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Update ticket - FIXED: Using proper Drizzle syntax
    const result = await db
      .update(tickets)
      .set(updateData)
      .where(eq(tickets.id, ticketId));

    // Fetch updated ticket
    const [updatedTicket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}