// lib/actions/tickets.ts
'use server';

import { db } from '@/lib/db/db';
import { tickets, eventSessions, eventDays } from '@/lib/drizzle/schema';
import { 
  desc, 
  asc, 
  like, 
  or, 
  sql, 
  eq,
  and 
} from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';



export type SortField = 'day' | 'session' | 'ticketType' | 'createdAt' | 'totalAmount' | 'purchaserName';
export type SortOrder = 'asc' | 'desc';

export interface TicketFilters {
  search?: string;
  session?: string;
  ticketType?: string;
  day?: string;
  status?: string;
  sortField?: SortField;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}

export interface TicketWithRelations {
  id: number;
  ticketCode: string;
  purchaserName: string | null;
  purchaserPhone: string | null;
  ticketType: string;
  totalAmount: string;
  paymentStatus: string | null;
  adultQuantity: number;
  studentQuantity: number;
  childQuantity: number;
  totalQuantity: number;
  createdAt: Date | null;
  session?: {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
  } | null;
  day?: {
    id: number;
    name: string;
    date: Date;
  } | null;
}

export interface CreateTicketData {
  sessionId: number;
  purchaserName: string;
  purchaserPhone: string;
  ticketType: string;
  adultQuantity: number;
  studentQuantity: number;
  childQuantity: number;
  totalAmount: number;
  paymentStatus?: string;
  paymentMethodId?: string;
  institution?: string;
  studentId?: string;
}

export interface UpdateTicketData {
  sessionId?: number;
  purchaserName?: string;
  purchaserPhone?: string;
  ticketType?: string;
  adultQuantity?: number;
  studentQuantity?: number;
  childQuantity?: number;
  totalAmount?: number;
  paymentStatus?: string;
  paymentMethodId?: string;
  institution?: string;
  studentId?: string;
}

export async function getTickets(filters: TicketFilters = {}) {
  const {
    search = '',
    session,
    ticketType,
    day,
    status,
    sortField = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10
  } = filters;

  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions = [];
  
  if (search) {
    whereConditions.push(
      or(
        like(tickets.purchaserName, `%${search}%`),
        like(tickets.purchaserPhone, `%${search}%`),
        like(tickets.ticketCode, `%${search}%`)
      )
    );
  }
  
  if (session) {
    whereConditions.push(eq(tickets.sessionId, parseInt(session)));
  }
  
  if (ticketType) {
    whereConditions.push(eq(tickets.ticketType, ticketType));
  }
  
  if (status) {
    whereConditions.push(eq(tickets.paymentStatus, status));
  }
  
  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(tickets)
    .where(whereClause);

  const totalCount = countResult[0]?.count || 0;

  // Build order by clause
  let orderByClause;
  switch (sortField) {
    case 'ticketType':
      orderByClause = sortOrder === 'asc' ? asc(tickets.ticketType) : desc(tickets.ticketType);
      break;
    case 'totalAmount':
      orderByClause = sortOrder === 'asc' ? asc(tickets.totalAmount) : desc(tickets.totalAmount);
      break;
    case 'purchaserName':
      orderByClause = sortOrder === 'asc' ? asc(tickets.purchaserName) : desc(tickets.purchaserName);
      break;
    default:
      orderByClause = sortOrder === 'asc' ? asc(tickets.createdAt) : desc(tickets.createdAt);
  }

  // Get tickets with joins
  const ticketsData = await db.select({
    ticket: tickets,
    session: eventSessions,
    day: eventDays
  })
    .from(tickets)
    .leftJoin(eventSessions, eq(tickets.sessionId, eventSessions.id))
    .leftJoin(eventDays, eq(eventSessions.dayId, eventDays.id))
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  // Get unique sessions for filter dropdown
  const sessions = await db.select({
    id: eventSessions.id,
    name: eventSessions.name,
    dayName: eventDays.name,
    dayDate: eventDays.date
  })
    .from(eventSessions)
    .leftJoin(eventDays, eq(eventSessions.dayId, eventDays.id))
    .orderBy(asc(eventDays.date), asc(eventSessions.startTime));

  // Get unique days
  const days = await db.select()
    .from(eventDays)
    .orderBy(asc(eventDays.date));

  return {
    tickets: ticketsData.map(({ ticket, session, day }) => ({
      id: ticket.id,
      ticketCode: ticket.ticketCode,
      purchaserName: ticket.purchaserName,
      purchaserPhone: ticket.purchaserPhone,
      ticketType: ticket.ticketType,
      totalAmount: ticket.totalAmount,
      paymentStatus: ticket.paymentStatus,
      adultQuantity: ticket.adultQuantity,
      studentQuantity: ticket.studentQuantity,
      childQuantity: ticket.childQuantity,
      totalQuantity: ticket.totalQuantity,
      createdAt: ticket.createdAt,
      session: session ? {
        id: session.id,
        name: session.name,
        startTime: session.startTime,
        endTime: session.endTime
      } : null,
      day: day ? {
        id: day.id,
        name: day.name,
        date: day.date
      } : null
    })),
    totalCount,
    sessions,
    days,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit)
  };
}

export async function getTicketById(id: number) {
  const [ticketData] = await db.select({
    ticket: tickets,
    session: eventSessions,
    day: eventDays
  })
    .from(tickets)
    .leftJoin(eventSessions, eq(tickets.sessionId, eventSessions.id))
    .leftJoin(eventDays, eq(eventSessions.dayId, eventDays.id))
    .where(eq(tickets.id, id));

  if (!ticketData.ticket) {
    return null;
  }

  return {
    id: ticketData.ticket.id,
    ticketCode: ticketData.ticket.ticketCode,
    purchaserName: ticketData.ticket.purchaserName,
    purchaserPhone: ticketData.ticket.purchaserPhone,
    ticketType: ticketData.ticket.ticketType,
    totalAmount: ticketData.ticket.totalAmount,
    paymentStatus: ticketData.ticket.paymentStatus,
    paymentMethodId: ticketData.ticket.paymentMethodId,
    adultQuantity: ticketData.ticket.adultQuantity,
    studentQuantity: ticketData.ticket.studentQuantity,
    childQuantity: ticketData.ticket.childQuantity,
    totalQuantity: ticketData.ticket.totalQuantity,
    institution: ticketData.ticket.institution,
    studentId: ticketData.ticket.studentId,
    createdAt: ticketData.ticket.createdAt,
    updatedAt: ticketData.ticket.updatedAt,
    session: ticketData.session ? {
      id: ticketData.session.id,
      name: ticketData.session.name,
      startTime: ticketData.session.startTime,
      endTime: ticketData.session.endTime
    } : null,
    day: ticketData.day ? {
      id: ticketData.day.id,
      name: ticketData.day.name,
      date: ticketData.day.date
    } : null
  };
}

export async function createTicket(data: CreateTicketData) {
  try {
    // Generate unique ticket code
    const ticketCode = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const totalQuantity = (data.adultQuantity || 0) + (data.studentQuantity || 0) + (data.childQuantity || 0);
    
    const [ticket] = await db.insert(tickets).values({
      sessionId: data.sessionId,
      purchaserName: data.purchaserName,
      purchaserPhone: data.purchaserPhone,
      ticketType: data.ticketType,
      adultQuantity: data.adultQuantity || 0,
      studentQuantity: data.studentQuantity || 0,
      childQuantity: data.childQuantity || 0,
      totalQuantity,
      totalAmount: data.totalAmount.toString(),
      paymentStatus: data.paymentStatus || 'PENDING',
      paymentMethodId: data.paymentMethodId,
      institution: data.institution,
      studentId: data.studentId,
      ticketCode,
      status: 'ACTIVE'
    }).returning();

    revalidatePath('/admin/tickets');
    return { success: true, ticketId: ticket.id };
  } catch (error) {
    console.error('Error creating ticket:', error);
    return { success: false, error: 'Failed to create ticket' };
  }
}

export async function updateTicket(id: number, data: UpdateTicketData) {
  try {
    const updateData: any = {};
    
    if (data.sessionId !== undefined) updateData.sessionId = data.sessionId;
    if (data.purchaserName !== undefined) updateData.purchaserName = data.purchaserName;
    if (data.purchaserPhone !== undefined) updateData.purchaserPhone = data.purchaserPhone;
    if (data.ticketType !== undefined) updateData.ticketType = data.ticketType;
    if (data.adultQuantity !== undefined) updateData.adultQuantity = data.adultQuantity;
    if (data.studentQuantity !== undefined) updateData.studentQuantity = data.studentQuantity;
    if (data.childQuantity !== undefined) updateData.childQuantity = data.childQuantity;
    if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount.toString();
    if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
    if (data.paymentMethodId !== undefined) updateData.paymentMethodId = data.paymentMethodId;
    if (data.institution !== undefined) updateData.institution = data.institution;
    if (data.studentId !== undefined) updateData.studentId = data.studentId;
    
    // Recalculate total quantity if quantities changed
    if (data.adultQuantity !== undefined || data.studentQuantity !== undefined || data.childQuantity !== undefined) {
      const currentTicket = await db.select().from(tickets).where(eq(tickets.id, id));
      const adultQty = data.adultQuantity ?? currentTicket[0]?.adultQuantity ?? 0;
      const studentQty = data.studentQuantity ?? currentTicket[0]?.studentQuantity ?? 0;
      const childQty = data.childQuantity ?? currentTicket[0]?.childQuantity ?? 0;
      updateData.totalQuantity = adultQty + studentQty + childQty;
    }
    
    const [updated] = await db.update(tickets)
      .set(updateData)
      .where(eq(tickets.id, id))
      .returning();

    revalidatePath('/admin/tickets');
    revalidatePath(`/admin/tickets/${id}`);
    return { success: true, ticket: updated };
  } catch (error) {
    console.error('Error updating ticket:', error);
    return { success: false, error: 'Failed to update ticket' };
  }
}

export async function deleteTicket(id: number) {
  try {
    await db.delete(tickets).where(eq(tickets.id, id));
    revalidatePath('/admin/tickets');
    return { success: true };
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return { success: false, error: 'Failed to delete ticket' };
  }
}