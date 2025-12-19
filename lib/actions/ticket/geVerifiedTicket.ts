'use server';

import { db } from '@/lib/db/db';
import { randomUUID } from 'crypto'; 
import { 
  tickets, adults, students, children, 
  eventSessions, eventDays, transactions
} from '@/lib/drizzle/schema';
import { eq, count } from 'drizzle-orm';
import { createSimpleLogger } from '@/lib/utils/logger';



export interface VerificationStep {
  step: string;
  passed: boolean;
  message: string;
  details?: any;
  timestamp: Date;
  
}

export interface VerificationResult {
  success: boolean;
  error?: string;
  step?: string;
  details?: string;
  data?: any;
  verificationSteps: VerificationStep[];
}


// ----------------------------------------------------------------------
// ACTION: Get Detailed List of Verified Tickets
// ----------------------------------------------------------------------
export interface VerifiedTicketDetails {
  id: number;
  ticketCode: string;
  purchaserName: string;
  purchaserPhone: string | null;
  ticketType: string;
  sessionId: number;
  sessionName: string;
  dayName: string;
  eventDate: Date;
  verificationTime: Date;
  paymentStatus: string;
  paymentMethod: string | null;
  attendeeInfo?: {
    name: string;
    type: string;
    phone?: string;
    studentId?: string;
    institution?: string;
    parentName?: string;
  };
  scanDetails: {
    scannedAt: Date;
    updatedAt: Date;
  };
}

export async function getVerifiedTicketsList(options?: {
  startDate?: Date;
  endDate?: Date;
  ticketType?: string;
  sessionId?: number;
  limit?: number;
  offset?: number;
  includeAttendeeInfo?: boolean;
}): Promise<{
  success: boolean;
  data?: VerifiedTicketDetails[];
  total?: number;
  error?: string;
}> {
  const logger = createSimpleLogger('verified-tickets-list');
  
  try {
    const {
      startDate,
      endDate,
      ticketType,
      sessionId,
      limit = 100,
      offset = 0,
      includeAttendeeInfo = true
    } = options || {};

    // Build the base query for verified tickets
    const baseQuery = db.select({
      ticket: tickets,
      session: eventSessions,
      day: eventDays
    })
    .from(tickets)
    .innerJoin(eventSessions, eq(tickets.sessionId, eventSessions.id))
    .innerJoin(eventDays, eq(eventSessions.dayId, eventDays.id))
    .where(eq(tickets.status, 'USED'))
    .orderBy(tickets.updatedAt, 'desc');

    // Apply filters
    let filteredQuery = baseQuery;
    
    if (startDate) {
      filteredQuery = filteredQuery.where(eq(eventDays.date, startDate));
    }
    
    if (endDate) {
      filteredQuery = filteredQuery.where(eq(eventDays.date, endDate));
    }
    
    if (ticketType) {
      filteredQuery = filteredQuery.where(eq(tickets.ticketType, ticketType));
    }
    
    if (sessionId) {
      filteredQuery = filteredQuery.where(eq(tickets.sessionId, sessionId));
    }

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(filteredQuery.as('filtered'))
      .then(rows => rows[0]?.count || 0);

    // Get paginated results
    const verifiedTickets = await filteredQuery
      .limit(limit)
      .offset(offset);

    // Fetch attendee information for each ticket if requested
    const ticketsWithDetails: VerifiedTicketDetails[] = [];

    for (const record of verifiedTickets) {
      const { ticket, session, day } = record;
      
      let attendeeInfo: VerifiedTicketDetails['attendeeInfo'] | undefined;

      if (includeAttendeeInfo) {
        switch (ticket.ticketType) {
          case 'ADULT':
            const adult = await db.select()
              .from(adults)
              .where(eq(adults.ticketId, ticket.id))
              .limit(1)
              .then(rows => rows[0]);
            
            if (adult) {
              attendeeInfo = {
                name: adult.fullName,
                type: 'Adult',
                phone: adult.phoneNumber
              };
            }
            break;

          case 'STUDENT':
            const student = await db.select()
              .from(students)
              .where(eq(students.ticketId, ticket.id))
              .limit(1)
              .then(rows => rows[0]);
            
            if (student) {
              attendeeInfo = {
                name: student.fullName,
                type: 'Student',
                phone: student.phoneNumber,
                studentId: student.studentId,
                institution: student.institutionName
              };
            }
            break;

          case 'CHILD':
            const child = await db.select()
              .from(children)
              .where(eq(children.ticketId, ticket.id))
              .limit(1)
              .then(rows => rows[0]);
            
            if (child) {
              attendeeInfo = {
                name: child.fullName,
                type: 'Child',
                parentName: child.parentName
              };
            }
            break;
        }
      }

      // If no specific attendee found, use purchaser info
      if (!attendeeInfo) {
        attendeeInfo = {
          name: ticket.purchaserName,
          type: 'General',
          phone: ticket.purchaserPhone
        };
      }

      // Get transaction info
      const transaction = await db.select()
        .from(transactions)
        .where(eq(transactions.ticketId, ticket.id))
        .orderBy(transactions.createdAt, 'desc')
        .limit(1)
        .then(rows => rows[0]);

      ticketsWithDetails.push({
        id: ticket.id,
        ticketCode: ticket.ticketCode,
        purchaserName: ticket.purchaserName,
        purchaserPhone: ticket.purchaserPhone,
        ticketType: ticket.ticketType,
        sessionId: ticket.sessionId,
        sessionName: session.name,
        dayName: day.name,
        eventDate: day.date,
        verificationTime: ticket.updatedAt,
        paymentStatus: ticket.paymentStatus,
        paymentMethod: transaction?.provider || ticket.paymentMethodId,
        attendeeInfo,
        scanDetails: {
          scannedAt: ticket.updatedAt,
          updatedAt: ticket.updatedAt
        }
      });
    }

    logger.info('Retrieved verified tickets list', {
      count: ticketsWithDetails.length,
      total: totalResult,
      filters: { startDate, endDate, ticketType, sessionId }
    });

    return {
      success: true,
      data: ticketsWithDetails,
      total: totalResult
    };

  } catch (error: any) {
    logger.error('Failed to fetch verified tickets list:', error);
    return {
      success: false,
      error: 'Failed to fetch verified tickets list: ' + error.message
    };
  }
}

// ----------------------------------------------------------------------
// ACTION: Get Verified Tickets Count by Day/Session
// ----------------------------------------------------------------------
export async function getVerifiedTicketsStats(options?: {
  byDay?: boolean;
  bySession?: boolean;
  byTicketType?: boolean;
}): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  const logger = createSimpleLogger('verified-tickets-stats');
  
  try {
    const { byDay = true, bySession = false, byTicketType = false } = options || {};

    // Base query
    const baseQuery = db.select({
      ticket: tickets,
      session: eventSessions,
      day: eventDays
    })
    .from(tickets)
    .innerJoin(eventSessions, eq(tickets.sessionId, eventSessions.id))
    .innerJoin(eventDays, eq(eventSessions.dayId, eventDays.id))
    .where(eq(tickets.status, 'USED'));

    const results = await baseQuery;

    const stats: any = {
      totalVerified: results.length,
      breakdowns: {}
    };

    if (byDay) {
      stats.breakdowns.byDay = {};
      results.forEach(record => {
        const dayName = record.day.name;
        const dateStr = record.day.date.toISOString().split('T')[0];
        
        if (!stats.breakdowns.byDay[dateStr]) {
          stats.breakdowns.byDay[dateStr] = {
            dayName,
            count: 0,
            byType: {}
          };
        }
        
        stats.breakdowns.byDay[dateStr].count++;
        
        if (byTicketType) {
          const type = record.ticket.ticketType;
          stats.breakdowns.byDay[dateStr].byType[type] = 
            (stats.breakdowns.byDay[dateStr].byType[type] || 0) + 1;
        }
      });
    }

    if (bySession) {
      stats.breakdowns.bySession = {};
      results.forEach(record => {
        const sessionName = record.session.name;
        
        if (!stats.breakdowns.bySession[sessionName]) {
          stats.breakdowns.bySession[sessionName] = {
            count: 0,
            byType: {}
          };
        }
        
        stats.breakdowns.bySession[sessionName].count++;
        
        if (byTicketType) {
          const type = record.ticket.ticketType;
          stats.breakdowns.bySession[sessionName].byType[type] = 
            (stats.breakdowns.bySession[sessionName].byType[type] || 0) + 1;
        }
      });
    }

    if (byTicketType) {
      stats.breakdowns.byTicketType = {};
      results.forEach(record => {
        const type = record.ticket.ticketType;
        stats.breakdowns.byTicketType[type] = 
          (stats.breakdowns.byTicketType[type] || 0) + 1;
      });
    }

    // Add hourly distribution
    stats.hourlyDistribution = {};
    results.forEach(record => {
      const hour = record.ticket.updatedAt.getHours();
      const hourKey = `${hour}:00-${hour + 1}:00`;
      stats.hourlyDistribution[hourKey] = (stats.hourlyDistribution[hourKey] || 0) + 1;
    });

    logger.info('Retrieved verification statistics', {
      totalVerified: stats.totalVerified
    });

    return {
      success: true,
      data: stats
    };

  } catch (error: any) {
    logger.error('Failed to fetch verification statistics:', error);
    return {
      success: false,
      error: 'Failed to fetch verification statistics: ' + error.message
    };
  }
}

// ----------------------------------------------------------------------
// ACTION: Export Verified Tickets to CSV/Excel
// ----------------------------------------------------------------------
export async function exportVerifiedTickets(format: 'csv' | 'json' = 'json'): Promise<{
  success: boolean;
  data?: string;
  filename?: string;
  error?: string;
}> {
  try {
    // Get all verified tickets with details
    const result = await getVerifiedTicketsList({ limit: 10000 });
    
    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to fetch data for export'
      };
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (format === 'json') {
      return {
        success: true,
        data: JSON.stringify(result.data, null, 2),
        filename: `verified-tickets-${timestamp}.json`
      };
    } else if (format === 'csv') {
      // Convert to CSV
      const headers = [
        'Ticket Code',
        'Purchaser Name',
        'Purchaser Phone',
        'Ticket Type',
        'Attendee Name',
        'Attendee Type',
        'Student/Child Info',
        'Session',
        'Day',
        'Event Date',
        'Verification Time',
        'Payment Status',
        'Payment Method'
      ];
      
      const rows = result.data.map(ticket => [
        ticket.ticketCode,
        ticket.purchaserName,
        ticket.purchaserPhone || '',
        ticket.ticketType,
        ticket.attendeeInfo?.name || '',
        ticket.attendeeInfo?.type || '',
        ticket.ticketType === 'STUDENT' 
          ? `Student ID: ${ticket.attendeeInfo?.studentId}, Institution: ${ticket.attendeeInfo?.institution}`
          : ticket.ticketType === 'CHILD'
          ? `Parent: ${ticket.attendeeInfo?.parentName}`
          : '',
        ticket.sessionName,
        ticket.dayName,
        ticket.eventDate.toISOString().split('T')[0],
        ticket.verificationTime.toISOString(),
        ticket.paymentStatus,
        ticket.paymentMethod || ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');
      
      return {
        success: true,
        data: csvContent,
        filename: `verified-tickets-${timestamp}.csv`
      };
    }

    return {
      success: false,
      error: 'Unsupported export format'
    };

  } catch (error: any) {
    return {
      success: false,
      error: 'Export failed: ' + error.message
    };
  }
}