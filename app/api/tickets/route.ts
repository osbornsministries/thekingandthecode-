// app/api/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { tickets } from '@/lib/drizzle/schema';
import { and, eq, like } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const status = searchParams.get('status');
    const sessionId = searchParams.get('sessionId');
    const phone = searchParams.get('phone');
    const name = searchParams.get('name');
    const ticketCode = searchParams.get('ticketCode');

    // Build query conditions
    const conditions = [];

    if (status && status !== 'all') {
      conditions.push(eq(tickets.status, status));
    }

    if (sessionId && sessionId !== 'all') {
      const parsedSessionId = parseInt(sessionId);
      if (!isNaN(parsedSessionId)) {
        conditions.push(eq(tickets.sessionId, parsedSessionId));
      }
    }

    if (phone) {
      conditions.push(like(tickets.purchaserPhone, `%${phone}%`));
    }

    if (name) {
      conditions.push(like(tickets.purchaserName, `%${name}%`));
    }

    if (ticketCode) {
      conditions.push(like(tickets.ticketCode, `%${ticketCode}%`));
    }

    // Fetch tickets with only existing fields
    const ticketsData = await db
      .select({
        id: tickets.id,
        ticketCode: tickets.ticketCode,
        purchaserName: tickets.purchaserName,
        purchaserPhone: tickets.purchaserPhone,
        ticketType: tickets.ticketType,
        status: tickets.status,
        paymentStatus: tickets.paymentStatus,
        sessionId: tickets.sessionId,
        adultQuantity: tickets.adultQuantity,
        studentQuantity: tickets.studentQuantity,
        childQuantity: tickets.childQuantity,
        totalQuantity: tickets.totalQuantity,
        totalAmount: tickets.totalAmount,
        createdAt: tickets.createdAt,
      })
      .from(tickets)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(tickets.createdAt)
      .limit(Math.min(limit, 500))
      .execute();

    // Format the response
    const formattedTickets = ticketsData.map(ticket => ({
      id: ticket.id,
      ticketCode: ticket.ticketCode || '',
      purchaserName: ticket.purchaserName || 'Unknown',
      purchaserPhone: ticket.purchaserPhone || '',
      ticketType: (ticket.ticketType || 'REGULAR') as 'ADULT' | 'STUDENT' | 'CHILD' | 'REGULAR',
      status: ticket.status || 'PENDING',
      paymentStatus: ticket.paymentStatus || 'UNPAID',
      sessionId: ticket.sessionId,
      adultQuantity: ticket.adultQuantity || 0,
      studentQuantity: ticket.studentQuantity || 0,
      childQuantity: ticket.childQuantity || 0,
      totalQuantity: ticket.totalQuantity || 1,
      totalAmount: ticket.totalAmount ? Number(ticket.totalAmount) : 0,
      createdAt: ticket.createdAt?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json(formattedTickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch tickets',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}