// app/admin/tickets/[id]/edit/page.tsx
import { notFound } from 'next/navigation';
import EditTicketForm from '@/components/admin/tickets/EditTicketForm';
import { db } from '@/lib/db/db';
import { tickets, eventSessions, eventDays, transactions } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export default async function EditTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticketId = parseInt(id);

  if (isNaN(ticketId)) {
    notFound();
  }

  try {
    // Fetch ticket with related data
    const [ticketData] = await db
      .select({
        ticket: tickets,
        session: eventSessions,
        day: eventDays,
      })
      .from(tickets)
      .leftJoin(eventSessions, eq(tickets.sessionId, eventSessions.id))
      .leftJoin(eventDays, eq(eventSessions.dayId, eventDays.id))
      .where(eq(tickets.id, ticketId));

    if (!ticketData) {
      notFound();
    }

    // Fetch transaction data
    const [transactionData] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.ticketId, ticketId));

    // Fetch all sessions for the dropdown
    const allSessions = await db
      .select({
        id: eventSessions.id,
        name: eventSessions.name,
        dayName: eventDays.name,
        date: eventDays.date,
        startTime: eventSessions.startTime,
        endTime: eventSessions.endTime,
      })
      .from(eventSessions)
      .leftJoin(eventDays, eq(eventSessions.dayId, eventDays.id))
      .orderBy(eventDays.date, eventSessions.startTime);

    // Prepare data for client component
    const formattedTicket = {
      id: ticketData.ticket.id,
      sessionId: ticketData.ticket.sessionId?.toString() || '',
      purchaserName: ticketData.ticket.purchaserName || '',
      purchaserPhone: ticketData.ticket.purchaserPhone || '',
      ticketType: ticketData.ticket.ticketType || 'REGULAR',
      totalAmount: ticketData.ticket.totalAmount?.toString() || '0',
      paymentStatus: ticketData.ticket.paymentStatus || 'UNPAID',
      adultQuantity: ticketData.ticket.adultQuantity || 0,
      studentQuantity: ticketData.ticket.studentQuantity || 0,
      childQuantity: ticketData.ticket.childQuantity || 0,
      studentId: ticketData.ticket.studentId || '',
      institution: ticketData.ticket.institution || '',
      ticketCode: ticketData.ticket.ticketCode || '',
    };

    const formattedTransaction = transactionData ? {
      id: transactionData.id,
      externalId: transactionData.externalId || '',
      reference: transactionData.reference || '',
      transId: transactionData.transId || '',
      provider: transactionData.provider || '',
      accountNumber: transactionData.accountNumber || '',
      amount: transactionData.amount?.toString() || '',
      currency: transactionData.currency || 'TZS',
      status: transactionData.status || 'PENDING',
      message: transactionData.message || '',
    } : null;

    const formattedSession = ticketData.session ? {
      id: ticketData.session.id,
      name: ticketData.session.name,
      startTime: ticketData.session.startTime,
      endTime: ticketData.session.endTime,
      dayName: ticketData.day?.name || '',
      dayDate: ticketData.day?.date || null,
    } : null;

    const formattedSessions = allSessions.map(session => ({
      ...session,
      date: session.date ? session.date.toISOString() : null,
    }));

    return (
      <EditTicketForm 
        initialData={formattedTicket}
        transaction={formattedTransaction}
        currentSession={formattedSession}
        sessions={formattedSessions} 
      />
    );
  } catch (error) {
    console.error('Error fetching ticket:', error);
    notFound();
  }
}