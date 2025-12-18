// app/api/dashboard/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { tickets, transactions, eventSessions, eventDays } from '@/lib/drizzle/schema';
import { eq, and, sql, gte, lte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse all filter parameters (same as dashboard page)
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 30;
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const ticketTypes = searchParams.get('ticketTypes')?.split(',') || [];
    const paymentStatus = searchParams.get('paymentStatus')?.split(',') || [];
    const sessionId = searchParams.get('sessionId') ? parseInt(searchParams.get('sessionId')!) : undefined;
    const dayId = searchParams.get('dayId') ? parseInt(searchParams.get('dayId')!) : undefined;
    const minAmount = searchParams.get('minAmount') ? parseFloat(searchParams.get('minAmount')!) : undefined;
    const maxAmount = searchParams.get('maxAmount') ? parseFloat(searchParams.get('maxAmount')!) : undefined;
    
    // Calculate date range (same logic as dashboard)
    let dateFilterStart: Date;
    let dateFilterEnd: Date = new Date();
    
    if (startDate && endDate) {
      dateFilterStart = new Date(startDate);
      dateFilterEnd = new Date(endDate);
    } else {
      dateFilterStart = new Date();
      dateFilterStart.setDate(dateFilterStart.getDate() - days);
    }

    // Build where conditions (same as dashboard)
    const whereConditions: any[] = [
      gte(tickets.createdAt, dateFilterStart),
      lte(tickets.createdAt, dateFilterEnd),
      eq(transactions.status, 'SUCCESS'),
    ];

    // Add other filters...
    
    // Fetch data for export
    const exportData = await db
      .select({
        ticketId: tickets.id,
        ticketCode: tickets.ticketCode,
        purchaserName: tickets.purchaserName,
        purchaserPhone: tickets.purchaserPhone,
        ticketType: tickets.ticketType,
        adultQuantity: tickets.adultQuantity,
        studentQuantity: tickets.studentQuantity,
        childQuantity: tickets.childQuantity,
        totalQuantity: tickets.totalQuantity,
        totalAmount: tickets.totalAmount,
        paymentStatus: tickets.paymentStatus,
        sessionName: eventSessions.name,
        dayName: eventDays.name,
        dayDate: eventDays.date,
        sessionTime: sql<string>`CONCAT(${eventSessions.startTime}, ' - ', ${eventSessions.endTime})`,
        createdAt: tickets.createdAt,
        transactionStatus: transactions.status,
        transactionExternalId: transactions.externalId,
      })
      .from(tickets)
      .leftJoin(transactions, eq(tickets.id, transactions.ticketId))
      .leftJoin(eventSessions, eq(tickets.sessionId, eventSessions.id))
      .leftJoin(eventDays, eq(eventSessions.dayId, eventDays.id))
      .where(and(...whereConditions))
      .orderBy(desc(tickets.createdAt));

    // Convert to CSV
    const csvRows = [];
    // Add headers
    csvRows.push([
      'Ticket ID',
      'Ticket Code',
      'Purchaser Name',
      'Purchaser Phone',
      'Ticket Type',
      'Adult Qty',
      'Student Qty',
      'Child Qty',
      'Total Qty',
      'Total Amount',
      'Payment Status',
      'Session',
      'Day',
      'Date',
      'Session Time',
      'Created At',
      'Transaction Status',
      'Transaction ID',
    ].join(','));

    // Add data rows
    for (const row of exportData) {
      csvRows.push([
        row.ticketId,
        row.ticketCode,
        `"${row.purchaserName || ''}"`,
        row.purchaserPhone,
        row.ticketType,
        row.adultQuantity,
        row.studentQuantity,
        row.childQuantity,
        row.totalQuantity,
        row.totalAmount,
        row.paymentStatus,
        row.sessionName,
        row.dayName,
        row.dayDate,
        row.sessionTime,
        row.createdAt,
        row.transactionStatus,
        row.transactionExternalId,
      ].join(','));
    }

    const csvContent = csvRows.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `dashboard-export-${timestamp}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}