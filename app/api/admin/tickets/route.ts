// app/api/admin/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { tickets } from '@/lib/drizzle/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.purchaserName || !body.purchaserPhone || !body.totalAmount || !body.sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate ticket code
    const ticketCode = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    
    // Calculate total quantity
    const totalQuantity = (body.adultQuantity || 0) + (body.studentQuantity || 0) + (body.childQuantity || 0);

    const [ticket] = await db
      .insert(tickets)
      .values({
        sessionId: parseInt(body.sessionId),
        purchaserName: body.purchaserName,
        purchaserPhone: body.purchaserPhone,
        ticketType: body.ticketType || 'REGULAR',
        totalAmount: body.totalAmount.toString(),
        paymentStatus: body.paymentStatus || 'UNPAID',
        adultQuantity: body.adultQuantity || 0,
        studentQuantity: body.studentQuantity || 0,
        childQuantity: body.childQuantity || 0,
        totalQuantity,
        studentId: body.studentId || null,
        institution: body.institution || null,
        ticketCode,
        status: body.paymentStatus === 'PAID' ? 'ACTIVE' : 'PENDING',
      });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}