import type { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db/db';
import { tickets } from '@/lib/drizzle/schema';
import { eq, or } from 'drizzle-orm';
import TicketClient from './TicketClient';
import { cache } from 'react';
import { unstable_noStore as noStore } from 'next/cache';


 


type Props = {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

// Cached fetch with relations
const getTicketData = async (identifier: string) => {
    noStore();  

  if (!identifier) return null;

  try {
    const idAsNumber = Number(identifier);
    const isNumber = !isNaN(idAsNumber);

    const whereClause = isNumber
      ? or(eq(tickets.id, idAsNumber), eq(tickets.ticketCode, identifier))
      : eq(tickets.ticketCode, identifier);

    // Fetch Ticket WITH Relations
    const ticket = await db.query.tickets.findFirst({
      where: whereClause,
      with: {
        adults: true,
        students: true,
        children: true
      }
    });

    return ticket;
  } catch (error) {
    console.error("DB Fetch Error:", error);
    return null;
  }
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const ticket = await getTicketData(params.id);
  if (!ticket) return { title: "Ticket Not Found" };

  return {
    title: `${ticket.purchaserName || 'Guest'}'s Ticket`,
    description: `Official Ticket. Status: ${ticket.paymentStatus || 'UNPAID'}`
  };
}

export default async function TicketPage({ params }: Props) {
  const ticket = await getTicketData(params.id);

  if (!ticket) return notFound();

  // Calculate totals
  const adultCount = ticket.adults.length;
  const studentCount = ticket.students.length;
  const childCount = ticket.children.length;

  const totalPeople = adultCount + studentCount + childCount;
  const totalUsed = 
    ticket.adults.filter(a => a.isUsed).length + 
    ticket.students.filter(s => s.isUsed).length + 
    ticket.children.filter(c => c.isUsed).length;

  // Determine overall status
  let displayStatus = ticket.status || 'PENDING';
  if (totalPeople > 0 && totalUsed === totalPeople) {
    displayStatus = 'ALL_USED';
  } else if (totalUsed > 0) {
    displayStatus = 'PARTIALLY_USED';
  }

  // ✅ FIX: Handle Nullable Fields with Fallbacks (?? or ||)
  const sanitized = {
    id: ticket.id,
    ticketCode: ticket.ticketCode,
    
    // The Fix: Provide default strings if DB returns null
    guestName: ticket.purchaserName || 'Guest', 
    guestPhone: ticket.purchaserPhone || '',
    
    ticketType: ticket.ticketType || 'REGULAR',
    totalAmount: ticket.totalAmount,
    status: displayStatus,
    paymentStatus: ticket.paymentStatus || 'UNPAID',
    
    adultCount,
    studentCount,
    childCount,

    attendees: [
      ...ticket.adults.map(a => ({ name: a.fullName, type: 'ADULT', isUsed: a.isUsed || false })),
      ...ticket.students.map(s => ({ name: s.fullName, type: 'STUDENT', isUsed: s.isUsed || false })),
      ...ticket.children.map(c => ({ name: c.fullName, type: 'CHILD', isUsed: c.isUsed || false })),
    ]
  };

  return <TicketClient ticket={sanitized} />;
}