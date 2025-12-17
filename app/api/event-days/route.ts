// app/api/event-days/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { eventDays } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('activeOnly') === 'true';

    // Build query conditions
    const conditions = [];

    if (activeOnly) {
      conditions.push(eq(eventDays.isActive, true));
    }

    // Fetch event days - using only fields that exist in current schema
    const days = await db
      .select({
        id: eventDays.id,
        name: eventDays.name,
        date: eventDays.date,
        isActive: eventDays.isActive,
        // Only include fields that exist in your schema
      })
      .from(eventDays)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(eventDays.date)
      .execute();

    // Format the response - handle missing fields gracefully
    const formattedDays = days.map(day => {
      // Safe date handling
      let formattedDate = '';
      let isoDate = '';
      
      if (day.date) {
        try {
          // If date is already a Date object
          if (day.date instanceof Date) {
            isoDate = day.date.toISOString().split('T')[0];
            formattedDate = day.date.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          } 
          // If date is a string
          else if (typeof day.date === 'string') {
            const dateObj = new Date(day.date);
            isoDate = dateObj.toISOString().split('T')[0];
            formattedDate = dateObj.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          }
        } catch (error) {
          console.warn('Error formatting date:', day.date, error);
          isoDate = String(day.date);
          formattedDate = String(day.date);
        }
      }

      return {
        id: day.id,
        name: day.name,
        date: isoDate,
        isActive: Boolean(day.isActive),
        // Add default values for missing fields that API expects
        description: '',
        venue: '',
        capacity: 0,
        createdAt: new Date().toISOString(),
        formattedDate,
      };
    });

    return NextResponse.json(formattedDays);
  } catch (error) {
    console.error('Error fetching event days:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch event days',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}