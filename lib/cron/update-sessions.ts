// lib/cron/update-sessions.ts
import { db } from '@/lib/db/db';
import { eventSessions } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { checkSessionAvailability } from '@/lib/utils/session-limits';

export async function updateAllSessionStatuses() {
  try {
    console.log('🔄 Updating all session statuses...');
    
    // Get all sessions
    const allSessions = await db.query.eventSessions.findMany();
    
    for (const session of allSessions) {
      await checkSessionAvailability(session.id);
    }
    
    console.log(`✅ Updated ${allSessions.length} session statuses`);
  } catch (error) {
    console.error('Error updating session statuses:', error);
  }
}