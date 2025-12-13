'use server';

import { db } from '@/lib/db/db';
import { 
  tickets, transactions, eventDays, eventSessions, ticketPrices,
  adults, students, children 
} from '@/lib/drizzle/schema'; 
import { eq, desc, asc, and, or, like, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode'; 

// --- 1. DATA FETCHING FOR DROPDOWNS ---
export async function getPosDropdownData() {
  try {
    const days = await db.select().from(eventDays).where(eq(eventDays.isActive, true));
    const sessions = await db.select().from(eventSessions);
    const prices = await db.select().from(ticketPrices).where(eq(ticketPrices.isActive, true));
    
    return { 
      success: true, 
      data: { days, sessions, prices } 
    };
  } catch (error) {
    console.error("Dropdown data fetch error:", error);
    return { 
      success: false, 
      error: "Failed to fetch dropdown data" 
    };
  }
}

// --- 2. BULK GENERATION LOGIC ---
type PosTicketInput = {
  dayId: number;
  sessionId: number;
  ticketGroup: 'ADULT' | 'STUDENT' | 'CHILD';
  quantity: number;
  unitPrice: number; 
};

export async function generatePosTickets(data: PosTicketInput) {
  const { sessionId, ticketGroup, quantity, unitPrice, dayId } = data;
  
  // Use public URL for QR codes so they work when scanned by mobile phones
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thekingandthecode.com';

  const generatedTickets: any[] = [];

  try {
    // Get day and session info for the generated tickets
    const [day] = await db.select().from(eventDays).where(eq(eventDays.id, dayId));
    const [session] = await db.select().from(eventSessions).where(eq(eventSessions.id, sessionId));

    // Start Database Transaction
    await db.transaction(async (tx) => {
      
      // Loop for the quantity requested (e.g., Generate 5 tickets)
      for (let i = 0; i < quantity; i++) {
        const uniqueCode = uuidv4(); // Generate unique ID for this specific ticket

        // A. Insert Ticket into DB
       const result = await tx.insert(tickets).values({
            sessionId: sessionId,
            ticketCode: uniqueCode,
            ticketType: ticketGroup,
            purchaserName: 'Walk-in POS',
            purchaserPhone: 'N/A',
            totalAmount: unitPrice.toString(),
            paymentStatus: 'PAID', // Cash sale is always paid
            status: 'PENDING',
            paymentMethodId: 'CASH',
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // Get the inserted ticket ID (MySQL)
          const newTicketId = result.insertId;

          // Optionally, fetch the full ticket row if needed
          const newTicket = await tx.query.tickets.findFirst({
            where: eq(tickets.id, newTicketId),
          });


        // B. Insert Transaction (Linked to Ticket)
        await tx.insert(transactions).values({
          ticketId: ticketId,
          externalId: `POS-${uniqueCode.slice(0, 8)}`,
          provider: 'POS_CASH',
          accountNumber: 'CASH_DESK',
          amount: unitPrice.toString(),
          status: 'COMPLETED',
          currency: 'TZS',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // C. Insert Attendee Record (Based on Group)
        if (ticketGroup === 'ADULT') {
          await tx.insert(adults).values({
            ticketId: ticketId,
            fullName: 'Walk-in Guest (Adult)',
            phoneNumber: 'N/A',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else if (ticketGroup === 'STUDENT') {
          await tx.insert(students).values({
            ticketId: ticketId,
            fullName: 'Walk-in Guest (Student)',
            studentId: 'POS-VERIFIED',
            institution: 'N/A',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else if (ticketGroup === 'CHILD') {
          await tx.insert(children).values({
            ticketId: ticketId,
            fullName: 'Walk-in Guest (Child)',
            parentName: 'Accompanied',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        // D. Generate QR Code Image (Data URI) for PDF
        const qrDataUri = await QRCode.toDataURL(`${baseUrl}/ticket/${uniqueCode}`, {
            errorCorrectionLevel: 'H', // High error correction
            margin: 1,
            width: 300, 
            color: {
                dark: ticketGroup === 'ADULT' ? '#A81010' : '#000000', 
                light: '#FFFFFF'
            }
        });

        // E. Add to results array (to return to frontend)
        generatedTickets.push({
          id: ticketId,
          code: uniqueCode,
          qrValue: `${baseUrl}/ticket/${uniqueCode}`, 
          qrImageStr: qrDataUri, 
          type: ticketGroup,
          price: unitPrice,
          createdAt: new Date().toISOString(),
          sessionId: sessionId,
          dayId: dayId,
          day: day, // Include full day object
          session: session, // Include full session object
        });
      }
    });

    return { 
      success: true, 
      tickets: generatedTickets,
      message: `Successfully generated ${quantity} ${ticketGroup.toLowerCase()} tickets`
    };

  } catch (error) {
    console.error("POS Generation Error:", error);
    return { 
      success: false, 
      error: "Database Transaction Failed" 
    };
  }
}

// --- 3. GET PAGINATED POS HISTORY ---
export async function getPosHistoryPaged({
  page = 1,
  limit = 25,
  dayId,
  sessionId,
  type,
  search,
  sortBy = 'createdAt',
  sortOrder = 'desc'
}: {
  page?: number;
  limit?: number;
  dayId?: string;
  sessionId?: string;
  type?: string;
  search?: string;
  sortBy?: 'createdAt' | 'type' | 'price';
  sortOrder?: 'asc' | 'desc';
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thekingandthecode.com';

  try {
    // Calculate offset
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [eq(transactions.provider, 'POS_CASH')];
    
    if (dayId) {
      whereConditions.push(eq(eventSessions.dayId, Number(dayId)));
    }
    
    if (sessionId) {
      whereConditions.push(eq(tickets.sessionId, Number(sessionId)));
    }
    
    if (type) {
      whereConditions.push(eq(tickets.ticketType, type));
    }
    
    if (search) {
      whereConditions.push(
        or(
          like(tickets.ticketCode, `%${search}%`),
          like(tickets.purchaserName, `%${search}%`)
        )
      );
    }

    // Build order by
    let orderByClause;
    if (sortBy === 'createdAt') {
      orderByClause = sortOrder === 'asc' ? asc(transactions.createdAt) : desc(transactions.createdAt);
    } else if (sortBy === 'type') {
      orderByClause = sortOrder === 'asc' ? asc(tickets.ticketType) : desc(tickets.ticketType);
    } else if (sortBy === 'price') {
      orderByClause = sortOrder === 'asc' ? asc(tickets.totalAmount) : desc(tickets.totalAmount);
    } else {
      orderByClause = desc(transactions.createdAt);
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .innerJoin(tickets, eq(transactions.ticketId, tickets.id))
      .innerJoin(eventSessions, eq(tickets.sessionId, eventSessions.id))
      .where(and(...whereConditions));

    const total = Number(countResult[0]?.count) || 0;
    const totalPages = Math.ceil(total / limit);

    // Get paginated results
    const results = await db
      .select({
        ticketId: tickets.id,
        ticketCode: tickets.ticketCode,
        ticketType: tickets.ticketType,
        totalAmount: tickets.totalAmount,
        createdAt: transactions.createdAt,
        transactionId: transactions.id,
        sessionId: tickets.sessionId,
        dayId: eventSessions.dayId,
        dayName: eventDays.name,
        dayDate: eventDays.date,
        sessionName: eventSessions.name,
        sessionStartTime: eventSessions.startTime,
      })
      .from(transactions)
      .innerJoin(tickets, eq(transactions.ticketId, tickets.id))
      .innerJoin(eventSessions, eq(tickets.sessionId, eventSessions.id))
      .innerJoin(eventDays, eq(eventSessions.dayId, eventDays.id))
      .where(and(...whereConditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    // Generate QR codes and prepare data
    const historyData = await Promise.all(results.map(async (row) => {
      const qrDataUri = await QRCode.toDataURL(`${baseUrl}/ticket/${row.ticketCode}`, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 300,
        color: {
           dark: row.ticketType === 'ADULT' ? '#A81010' : '#000000',
           light: '#FFFFFF'
        }
      });

      return {
        id: row.ticketId,
        code: row.ticketCode,
        qrValue: `${baseUrl}/ticket/${row.ticketCode}`,
        qrImageStr: qrDataUri,
        type: row.ticketType,
        price: Number(row.totalAmount),
        createdAt: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
        transactionId: row.transactionId,
        sessionId: row.sessionId,
        dayId: row.dayId,
        day: {
          id: row.dayId,
          name: row.dayName,
          date: row.dayDate?.toISOString() || new Date().toISOString(),
        },
        session: {
          id: row.sessionId,
          name: row.sessionName,
          startTime: row.sessionStartTime,
        }
      };
    }));

    return { 
      success: true, 
      data: {
        tickets: historyData,
        total,
        page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    };

  } catch (error) {
    console.error("Paginated History Fetch Error:", error);
    return { 
      success: false, 
      error: "Failed to fetch history" 
    };
  }
}

// --- 4. GET ALL POS HISTORY (For backward compatibility) ---
export async function getPosHistory() {
  try {
    const result = await getPosHistoryPaged({ 
      page: 1, 
      limit: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    
    if (result.success && result.data) {
      return {
        success: true,
        tickets: result.data.tickets,
        count: result.data.tickets.length
      };
    }
    
    return result;
    
  } catch (error) {
    console.error("History Fetch Error:", error);
    return { 
      success: false, 
      error: "Failed to fetch history" 
    };
  }
}

// --- 5. GET FILTERED TICKETS ---
export async function getFilteredTickets(filters: {
  dayId?: string;
  sessionId?: string;
  type?: string;
}) {
  try {
    const result = await getPosHistoryPaged({
      page: 1,
      limit: 100,
      dayId: filters.dayId,
      sessionId: filters.sessionId,
      type: filters.type,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    
    if (result.success && result.data) {
      return {
        success: true,
        tickets: result.data.tickets,
        count: result.data.tickets.length
      };
    }
    
    return result;
    
  } catch (error) {
    console.error("Filtered tickets error:", error);
    return {
      success: false,
      error: "Failed to fetch filtered tickets"
    };
  }
}

// --- 6. GET TICKET STATISTICS ---
export async function getPosStatistics() {
  try {
    // Get total tickets count
    const totalTicketsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .innerJoin(tickets, eq(transactions.ticketId, tickets.id))
      .where(eq(transactions.provider, 'POS_CASH'));

    const totalTickets = Number(totalTicketsResult[0]?.count) || 0;

    // Get total revenue
    const revenueResult = await db
      .select({ total: sql<number>`sum(cast(${tickets.totalAmount} as decimal))` })
      .from(transactions)
      .innerJoin(tickets, eq(transactions.ticketId, tickets.id))
      .where(eq(transactions.provider, 'POS_CASH'));

    const totalRevenue = Number(revenueResult[0]?.total) || 0;

    // Get today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .innerJoin(tickets, eq(transactions.ticketId, tickets.id))
      .where(
        and(
          eq(transactions.provider, 'POS_CASH'),
          sql`date(${transactions.createdAt}) = date(${today})`
        )
      );

    const todayCount = Number(todayResult[0]?.count) || 0;

    return {
      success: true,
      data: {
        totalTickets,
        totalRevenue,
        todayCount
      }
    };

  } catch (error) {
    console.error("Statistics fetch error:", error);
    return {
      success: false,
      error: "Failed to fetch statistics"
    };
  }
}

// --- 7. GET TICKETS BY FOLDER ---
export async function getTicketsByFolder(dayName: string, sessionCode: string, type: string) {
  try {
    // Map session code to session name pattern
    let sessionNamePattern = '';
    if (sessionCode === 'AS') {
      sessionNamePattern = '%Afternoon%';
    } else if (sessionCode === 'ES') {
      sessionNamePattern = '%Evening%';
    } else if (sessionCode === 'NS') {
      sessionNamePattern = '%Night%';
    } else {
      sessionNamePattern = `%${sessionCode}%`;
    }

    const results = await db
      .select({
        ticketId: tickets.id,
        ticketCode: tickets.ticketCode,
        ticketType: tickets.ticketType,
        totalAmount: tickets.totalAmount,
        createdAt: transactions.createdAt,
        sessionId: tickets.sessionId,
        dayId: eventSessions.dayId,
        dayName: eventDays.name,
        sessionName: eventSessions.name,
      })
      .from(transactions)
      .innerJoin(tickets, eq(transactions.ticketId, tickets.id))
      .innerJoin(eventSessions, eq(tickets.sessionId, eventSessions.id))
      .innerJoin(eventDays, eq(eventSessions.dayId, eventDays.id))
      .where(
        and(
          eq(transactions.provider, 'POS_CASH'),
          eq(eventDays.name, dayName.replace(/_/g, ' ')),
          like(eventSessions.name, sessionNamePattern),
          eq(tickets.ticketType, type)
        )
      )
      .orderBy(desc(transactions.createdAt));

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thekingandthecode.com';
    
    const ticketsData = await Promise.all(results.map(async (row) => {
      const qrDataUri = await QRCode.toDataURL(`${baseUrl}/ticket/${row.ticketCode}`, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 300,
        color: {
           dark: row.ticketType === 'ADULT' ? '#A81010' : '#000000',
           light: '#FFFFFF'
        }
      });

      return {
        id: row.ticketId,
        code: row.ticketCode,
        qrValue: `${baseUrl}/ticket/${row.ticketCode}`,
        qrImageStr: qrDataUri,
        type: row.ticketType,
        price: Number(row.totalAmount),
        createdAt: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
        sessionId: row.sessionId,
        dayId: row.dayId,
        day: {
          id: row.dayId,
          name: row.dayName,
        },
        session: {
          id: row.sessionId,
          name: row.sessionName,
        }
      };
    }));

    return {
      success: true,
      tickets: ticketsData,
      count: ticketsData.length
    };

  } catch (error) {
    console.error("Folder tickets error:", error);
    return {
      success: false,
      error: "Failed to fetch folder tickets"
    };
  }
}