// app/admin/tickets/create/page.tsx
import CreateTicketForm from '@/components/admin/tickets/CreateTicketForm';
import { db } from '@/lib/db/db';
import { eventSessions, eventDays } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export default async function CreateTicketPage() {
  // Fetch all sessions for the dropdown
  const sessions = await db
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

  const formattedSessions = sessions.map(session => ({
    ...session,
    date: session.date ? session.date.toISOString() : null,
  }));

  return <CreateTicketForm sessions={formattedSessions} />;
}