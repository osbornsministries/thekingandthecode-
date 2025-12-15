'use server';

import { db } from '@/lib/db/db';
import * as schema from '@/lib/drizzle/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Types
export type EventDay = typeof schema.eventDays.$inferSelect;
export type EventSession = typeof schema.eventSessions.$inferSelect;
export type TicketPrice = typeof schema.ticketPrices.$inferSelect;
export type PaymentMethod = typeof schema.paymentMethods.$inferSelect;

// ========== EVENT DAYS ==========
export async function getEventDays(): Promise<EventDay[]> {
  return await db.select()
    .from(schema.eventDays)
    .orderBy(asc(schema.eventDays.date));
}

export async function getActiveEventDays(): Promise<EventDay[]> {
  return await db.select()
    .from(schema.eventDays)
    .where(eq(schema.eventDays.isActive, true))
    .orderBy(asc(schema.eventDays.date));
}

export async function createEventDay(data: typeof schema.eventDays.$inferInsert): Promise<{ success: boolean; error?: string }> {
  try {
    await db.insert(schema.eventDays).values(data);
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateEventDay(id: number, data: Partial<typeof schema.eventDays.$inferInsert>): Promise<{ success: boolean; error?: string }> {
  try {
    await db.update(schema.eventDays)
      .set(data)
      .where(eq(schema.eventDays.id, id));
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteEventDay(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(schema.eventDays)
      .where(eq(schema.eventDays.id, id));
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ========== EVENT SESSIONS ==========
export async function getEventSessions(): Promise<(EventSession & { dayName: string })[]> {
  return await db.select({
    id: schema.eventSessions.id,
    dayId: schema.eventSessions.dayId,
    name: schema.eventSessions.name,
    startTime: schema.eventSessions.startTime,
    endTime: schema.eventSessions.endTime,
    isActive: schema.eventSessions.isActive,
    dayName: schema.eventDays.name,
  })
  .from(schema.eventSessions)
  .leftJoin(schema.eventDays, eq(schema.eventSessions.dayId, schema.eventDays.id))
  .orderBy(asc(schema.eventDays.date), asc(schema.eventSessions.startTime));
}

export async function getSessionsByDayId(dayId: number): Promise<EventSession[]> {
  return await db.select()
    .from(schema.eventSessions)
    .where(eq(schema.eventSessions.dayId, dayId))
    .orderBy(asc(schema.eventSessions.startTime));
}

export async function createEventSession(data: typeof schema.eventSessions.$inferInsert): Promise<{ success: boolean; error?: string }> {
  try {
    await db.insert(schema.eventSessions).values(data);
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateEventSession(id: number, data: Partial<typeof schema.eventSessions.$inferInsert>): Promise<{ success: boolean; error?: string }> {
  try {
    await db.update(schema.eventSessions)
      .set(data)
      .where(eq(schema.eventSessions.id, id));
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteEventSession(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(schema.eventSessions)
      .where(eq(schema.eventSessions.id, id));
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ========== TICKET PRICES ==========
export async function getTicketPrices(): Promise<TicketPrice[]> {
  return await db.select()
    .from(schema.ticketPrices)
    .orderBy(asc(schema.ticketPrices.id));
}

export async function getActiveTicketPrices(): Promise<TicketPrice[]> {
  return await db.select()
    .from(schema.ticketPrices)
    .where(eq(schema.ticketPrices.isActive, true))
    .orderBy(asc(schema.ticketPrices.price));
}

export async function createTicketPrice(data: typeof schema.ticketPrices.$inferInsert): Promise<{ success: boolean; error?: string }> {
  try {
    await db.insert(schema.ticketPrices).values({
      ...data,
      type: data.type.toUpperCase().replace(/\s+/g, '_')
    });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTicketPrice(id: number, data: Partial<typeof schema.ticketPrices.$inferInsert>): Promise<{ success: boolean; error?: string }> {
  try {
    if (data.type) {
      data.type = data.type.toUpperCase().replace(/\s+/g, '_');
    }
    await db.update(schema.ticketPrices)
      .set(data)
      .where(eq(schema.ticketPrices.id, id));
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteTicketPrice(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(schema.ticketPrices)
      .where(eq(schema.ticketPrices.id, id));
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ========== PAYMENT METHODS ==========
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  return await db.select()
    .from(schema.paymentMethods)
    .orderBy(asc(schema.paymentMethods.name));
}

export async function getActivePaymentMethods(): Promise<PaymentMethod[]> {
  return await db.select()
    .from(schema.paymentMethods)
    .where(eq(schema.paymentMethods.isActive, true))
    .orderBy(asc(schema.paymentMethods.name));
}

export async function createPaymentMethod(data: typeof schema.paymentMethods.$inferInsert): Promise<{ success: boolean; error?: string }> {
  try {
    await db.insert(schema.paymentMethods).values(data);
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePaymentMethod(id: string, data: Partial<typeof schema.paymentMethods.$inferInsert>): Promise<{ success: boolean; error?: string }> {
  try {
    await db.update(schema.paymentMethods)
      .set(data)
      .where(eq(schema.paymentMethods.id, id));
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePaymentMethod(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(schema.paymentMethods)
      .where(eq(schema.paymentMethods.id, id));
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}