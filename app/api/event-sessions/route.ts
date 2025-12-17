// app/api/event-sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { eventSessions } from '@/lib/drizzle/schema';
import { eventDays } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dayId = searchParams.get('dayId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    // Build query conditions
    const conditions = [];

    if (dayId && dayId !== 'all') {
      const parsedDayId = parseInt(dayId);
      if (!isNaN(parsedDayId)) {
        conditions.push(eq(eventSessions.dayId, parsedDayId));
      }
    }

    if (activeOnly) {
      conditions.push(eq(eventSessions.isActive, true));
    }

    // Fetch sessions with day information - using only existing fields
    const sessions = await db
      .select({
        // Fields from eventSessions that exist in your schema
        id: eventSessions.id,
        name: eventSessions.name,
        startTime: eventSessions.startTime,
        endTime: eventSessions.endTime,
        dayId: eventSessions.dayId,
        isActive: eventSessions.isActive,
        // Get day details
        dayName: eventDays.name,
        dayDate: eventDays.date,
      })
      .from(eventSessions)
      .leftJoin(eventDays, eq(eventSessions.dayId, eventDays.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(eventSessions.dayId, eventSessions.startTime)
      .execute();

    // Format the response - provide defaults for missing fields
    const formattedSessions = sessions.map(session => {
      // Format time safely
      const formatTime = (time: any) => {
        if (!time) return '00:00';
        if (typeof time === 'string') {
          // If time is in HH:MM:SS format, show only HH:MM
          if (time.includes(':')) {
            return time.substring(0, 5); // Get HH:MM
          }
          return time;
        }
        return String(time);
      };

      // Format day info if available
      let dayInfo = null;
      if (session.dayName && session.dayDate) {
        let formattedDate = '';
        let isoDate = '';
        
        if (session.dayDate) {
          try {
            if (session.dayDate instanceof Date) {
              isoDate = session.dayDate.toISOString().split('T')[0];
              formattedDate = session.dayDate.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
            } else if (typeof session.dayDate === 'string') {
              const dateObj = new Date(session.dayDate);
              isoDate = dateObj.toISOString().split('T')[0];
              formattedDate = dateObj.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
            }
          } catch (error) {
            console.warn('Error formatting day date:', session.dayDate, error);
          }
        }

        dayInfo = {
          id: session.dayId,
          name: session.dayName,
          date: isoDate,
          formattedDate,
        };
      }

      return {
        id: session.id,
        name: session.name,
        // Provide defaults for fields that might not exist
        description: '',
        startTime: formatTime(session.startTime),
        endTime: formatTime(session.endTime),
        dayId: session.dayId,
        capacity: 100, // Default capacity
        isActive: Boolean(session.isActive),
        createdAt: new Date().toISOString(),
        day: dayInfo,
      };
    });

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error('Error fetching event sessions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch event sessions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}