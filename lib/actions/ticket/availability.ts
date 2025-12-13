// /lib/actions/ticket/availability.ts (New Utility Function)

// Assuming you have a function to access your DB, e.g., 'db'
// and the following Drizzle schemas:
// sessions: { id, dayId, limit_adult, limit_student, limit_kid, ... }
// tickets: { id, sessionId, type (ADULT/STUDENT/KID), status, ... }

export async function getSessionAvailability(dayId: number) {
    // 1. Fetch all sessions for the given day, including their limits
    const sessionsWithLimits = await db.query.sessions.findMany({
        where: eq(sessions.dayId, dayId),
        // Select only necessary fields for performance
        columns: {
            id: true,
            name: true,
            dayId: true,
            limit_adult: true,
            limit_student: true,
            limit_kid: true,
        }
    });

    // 2. Fetch all tickets for those sessions that are NOT cancelled
    // (You might want to filter by PENDING/PAID status depending on your business rules)
    const currentTickets = await db.query.tickets.findMany({
        where: inArray(
            tickets.sessionId, 
            sessionsWithLimits.map(s => s.id)
        ),
        columns: {
            sessionId: true,
            type: true, // ADULT, STUDENT, KID
        }
    });

    // 3. Process the data to calculate counts and remaining slots
    const availabilityMap = sessionsWithLimits.map(session => {
        const soldCounts = currentTickets.reduce((acc, ticket) => {
            if (ticket.sessionId === session.id) {
                const typeKey = ticket.type.toLowerCase() as 'adult' | 'student' | 'kid';
                acc[typeKey] = (acc[typeKey] || 0) + 1;
            }
            return acc;
        }, {} as Record<'adult' | 'student' | 'kid', number>);
        
        return {
            ...session,
            sold_adult: soldCounts.adult || 0,
            sold_student: soldCounts.student || 0,
            sold_kid: soldCounts.kid || 0,
            // Calculate remaining slots
            remaining_adult: session.limit_adult - (soldCounts.adult || 0),
            remaining_student: session.limit_student - (soldCounts.student || 0),
            remaining_kid: session.limit_kid - (soldCounts.kid || 0),
        };
    });

    return availabilityMap;
}