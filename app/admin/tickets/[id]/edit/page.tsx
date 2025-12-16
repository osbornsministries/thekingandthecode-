// app/admin/tickets/[id]/edit/page.tsx
import { notFound } from 'next/navigation';
import EditTicketForm from '@/components/admin/tickets/EditTicketForm';
import { db } from '@/lib/db/db';
import { tickets, eventSessions, eventDays, transactions } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

interface FormattedTicket {
  id: number;
  sessionId: string;
  purchaserName: string;
  purchaserPhone: string;
  ticketType: string;
  totalAmount: string;
  paymentStatus: string;
  adultQuantity: number;
  studentQuantity: number;
  childQuantity: number;
  studentId: string;
  institution: string;
  ticketCode: string;
}

interface FormattedTransaction {
  id: number;
  externalId: string;
  reference: string;
  transId: string;
  provider: string;
  accountNumber: string;
  amount: string;
  currency: string;
  status: string;
  message: string;
}

interface FormattedSession {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  dayName: string;
  dayDate: string | null;
}

interface SessionOption {
  id: number;
  name: string;
  dayName: string;
  date: string | null;
  startTime: string;
  endTime: string;
}

export default async function EditTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // Validate ticket ID
  const ticketId = Number(id);
  if (!ticketId || isNaN(ticketId) || ticketId <= 0) {
    notFound();
  }

  try {
    // Parallel data fetching for better performance
    const [ticketPromise, transactionPromise, sessionsPromise] = await Promise.allSettled([
      // Fetch ticket with related session and day data
      db
        .select({
          ticket: tickets,
          session: eventSessions,
          day: eventDays,
        })
        .from(tickets)
        .leftJoin(eventSessions, eq(tickets.sessionId, eventSessions.id))
        .leftJoin(eventDays, eq(eventSessions.dayId, eventDays.id))
        .where(eq(tickets.id, ticketId))
        .limit(1),

      // Fetch transaction data
      db
        .select()
        .from(transactions)
        .where(eq(transactions.ticketId, ticketId))
        .limit(1),

      // Fetch all sessions for dropdown
      db
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
        .orderBy(eventDays.date, eventSessions.startTime),
    ]);

    // Handle ticket fetch result
    if (ticketPromise.status === 'rejected') {
      console.error('Error fetching ticket:', ticketPromise.reason);
      notFound();
    }

    const ticketResult = ticketPromise.value;
    if (!ticketResult || ticketResult.length === 0) {
      notFound();
    }

    const [ticketData] = ticketResult;
    if (!ticketData.ticket) {
      notFound();
    }

    // Handle transaction fetch result
    let transactionData = null;
    if (transactionPromise.status === 'fulfilled' && transactionPromise.value.length > 0) {
      [transactionData] = transactionPromise.value;
    }

    // Handle sessions fetch result
    let allSessions: SessionOption[] = [];
    if (sessionsPromise.status === 'fulfilled') {
      allSessions = sessionsPromise.value.map(session => ({
        ...session,
        date: session.date ? session.date.toISOString() : null,
      }));
    }

    // Format ticket data with null safety
    const formattedTicket: FormattedTicket = {
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

    // Format transaction data
    const formattedTransaction: FormattedTransaction | null = transactionData ? {
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

    // Format current session data
    const formattedSession: FormattedSession | null = ticketData.session ? {
      id: ticketData.session.id,
      name: ticketData.session.name || '',
      startTime: ticketData.session.startTime || '',
      endTime: ticketData.session.endTime || '',
      dayName: ticketData.day?.name || '',
      dayDate: ticketData.day?.date ? ticketData.day.date.toISOString() : null,
    } : null;

    return (
      <EditTicketForm 
        initialData={formattedTicket}
        transaction={formattedTransaction}
        currentSession={formattedSession}
        sessions={allSessions} 
      />
    );
  } catch (error) {
    console.error('Unexpected error in EditTicketPage:', error);
    notFound();
  }
}