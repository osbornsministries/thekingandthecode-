// app/api/tickets/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { tickets, transactions, eventSessions, eventDays } from '@/lib/drizzle/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { Parser } from 'json2csv';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    
    // Parse ticket IDs from query params
    let ticketIds: number[] = [];
    if (idsParam) {
      ticketIds = idsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
    }

    // Build where conditions
    const whereConditions = [];
    if (ticketIds.length > 0) {
      whereConditions.push(inArray(tickets.id, ticketIds));
    }

    // Fetch tickets with related data
    const allTickets = await db
      .select({
        ticket: tickets,
        transaction: transactions,
        session: eventSessions,
        day: eventDays,
      })
      .from(tickets)
      .leftJoin(transactions, eq(tickets.id, transactions.ticketId))
      .leftJoin(eventSessions, eq(tickets.sessionId, eventSessions.id))
      .leftJoin(eventDays, eq(eventSessions.dayId, eventDays.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(tickets.createdAt, 'desc');

    // Transform data for CSV
    const csvData = allTickets.map(({ ticket, transaction, session, day }) => ({
      'Ticket ID': ticket.id,
      'Ticket Code': ticket.ticketCode,
      'Purchaser Name': ticket.purchaserName,
      'Purchaser Phone': ticket.purchaserPhone,
      'Purchaser Email': ticket.purchaserEmail || '',
      'Ticket Type': ticket.ticketType,
      'Quantity': ticket.totalQuantity,
      'Unit Price': Number(ticket.unitPrice) || 0,
      'Total Amount': Number(ticket.totalAmount) || 0,
      'Payment Status': ticket.paymentStatus,
      'Payment Method': ticket.paymentMethod || '',
      'Session': session?.name || '',
      'Session Date': day?.date ? new Date(day.date).toISOString().split('T')[0] : '',
      'Session Time': session ? `${session.startTime} - ${session.endTime}` : '',
      'Day Name': day?.name || '',
      'Transaction ID': transaction?.id || '',
      'Transaction External ID': transaction?.externalId || '',
      'Transaction Reference': transaction?.reference || '',
      'Transaction Provider': transaction?.provider || '',
      'Transaction Status': transaction?.status || '',
      'Transaction Amount': Number(transaction?.amount) || 0,
      'Created At': ticket.createdAt ? new Date(ticket.createdAt).toISOString() : '',
      'Updated At': ticket.updatedAt ? new Date(ticket.updatedAt).toISOString() : '',
      'Checked In': ticket.checkedIn ? 'Yes' : 'No',
      'Checked In At': ticket.checkedInAt ? new Date(ticket.checkedInAt).toISOString() : '',
      'Checked In By': ticket.checkedInBy || '',
      'Notes': ticket.notes || '',
    }));

    // Define CSV fields
    const fields = [
      { label: 'Ticket ID', value: 'Ticket ID' },
      { label: 'Ticket Code', value: 'Ticket Code' },
      { label: 'Purchaser Name', value: 'Purchaser Name' },
      { label: 'Purchaser Phone', value: 'Purchaser Phone' },
      { label: 'Purchaser Email', value: 'Purchaser Email' },
      { label: 'Ticket Type', value: 'Ticket Type' },
      { label: 'Quantity', value: 'Quantity' },
      { label: 'Unit Price', value: 'Unit Price' },
      { label: 'Total Amount', value: 'Total Amount' },
      { label: 'Payment Status', value: 'Payment Status' },
      { label: 'Payment Method', value: 'Payment Method' },
      { label: 'Session', value: 'Session' },
      { label: 'Session Date', value: 'Session Date' },
      { label: 'Session Time', value: 'Session Time' },
      { label: 'Day Name', value: 'Day Name' },
      { label: 'Transaction ID', value: 'Transaction ID' },
      { label: 'Transaction External ID', value: 'Transaction External ID' },
      { label: 'Transaction Reference', value: 'Transaction Reference' },
      { label: 'Transaction Provider', value: 'Transaction Provider' },
      { label: 'Transaction Status', value: 'Transaction Status' },
      { label: 'Transaction Amount', value: 'Transaction Amount' },
      { label: 'Created At', value: 'Created At' },
      { label: 'Updated At', value: 'Updated At' },
      { label: 'Checked In', value: 'Checked In' },
      { label: 'Checked In At', value: 'Checked In At' },
      { label: 'Checked In By', value: 'Checked In By' },
      { label: 'Notes', value: 'Notes' },
    ];

    // Generate CSV
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(csvData);

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = ticketIds.length > 0 
      ? `tickets-export-${timestamp}-${ticketIds.length}-tickets.csv`
      : `tickets-export-${timestamp}-all.csv`;

    // Create response
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    
    // Return error as JSON
    return NextResponse.json(
      { 
        error: 'Failed to export tickets',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}