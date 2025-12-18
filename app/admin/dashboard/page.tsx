// app/admin/dashboard/page.tsx (Server Component - No changes to existing code)
import AdminLayout from '@/components/admin/AdminLayout';
import { db } from '@/lib/db/db';
import { tickets, transactions, eventSessions, eventDays } from '@/lib/drizzle/schema';
import { desc, eq, and, sql, gte, lte, count, sum } from 'drizzle-orm';
import DashboardClientWrapper from '@/components/admin/dashboard/DashboardClientWrapper';

// Constants
const DEFAULT_DAYS_RANGE = 30;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  // Parse all filter parameters
  const daysParam = typeof params.days === 'string' ? parseInt(params.days) : DEFAULT_DAYS_RANGE;
  const startDateParam = typeof params.startDate === 'string' ? params.startDate : '';
  const endDateParam = typeof params.endDate === 'string' ? params.endDate : '';
  const ticketTypesParam = typeof params.ticketTypes === 'string' ? params.ticketTypes.split(',') : [];
  const paymentStatusParam = typeof params.paymentStatus === 'string' ? params.paymentStatus.split(',') : [];
  const sessionIdParam = typeof params.sessionId === 'string' ? parseInt(params.sessionId) : undefined;
  const dayIdParam = typeof params.dayId === 'string' ? parseInt(params.dayId) : undefined;
  const minAmountParam = typeof params.minAmount === 'string' ? parseFloat(params.minAmount) : undefined;
  const maxAmountParam = typeof params.maxAmount === 'string' ? parseFloat(params.maxAmount) : undefined;
  
  // Calculate date range based on filters
  let dateFilterStart: Date;
  let dateFilterEnd: Date = new Date();
  
  if (startDateParam && endDateParam) {
    dateFilterStart = new Date(startDateParam);
    dateFilterEnd = new Date(endDateParam);
  } else {
    dateFilterStart = new Date();
    dateFilterStart.setDate(dateFilterStart.getDate() - daysParam);
  }

  // Get sessions and event days for filter dropdowns
  const [sessions, eventDaysData] = await Promise.all([
    db
      .select({
        id: eventSessions.id,
        name: eventSessions.name,
        dayName: eventDays.name,
        date: eventDays.date,
      })
      .from(eventSessions)
      .leftJoin(eventDays, eq(eventSessions.dayId, eventDays.id))
      .orderBy(eventDays.date, eventSessions.startTime),
    
    db
      .select()
      .from(eventDays)
      .orderBy(eventDays.date),
  ]);

  // Build dynamic where conditions
  const whereConditions: any[] = [
    gte(tickets.createdAt, dateFilterStart),
    lte(tickets.createdAt, dateFilterEnd),
    eq(transactions.status, 'SUCCESS'),
  ];

  if (ticketTypesParam.length > 0) {
    whereConditions.push(sql`${tickets.ticketType} IN (${sql.raw(ticketTypesParam.map(() => '?').join(','))})`);
  }

  if (paymentStatusParam.length > 0) {
    whereConditions.push(sql`${tickets.paymentStatus} IN (${sql.raw(paymentStatusParam.map(() => '?').join(','))})`);
  }

  if (sessionIdParam) {
    whereConditions.push(eq(tickets.sessionId, sessionIdParam));
  }

  if (dayIdParam) {
    whereConditions.push(eq(tickets.sessionId, dayIdParam));
  }

  if (minAmountParam !== undefined) {
    whereConditions.push(sql`CAST(${tickets.totalAmount} AS DECIMAL(10,2)) >= ${minAmountParam}`);
  }
  
  if (maxAmountParam !== undefined) {
    whereConditions.push(sql`CAST(${tickets.totalAmount} AS DECIMAL(10,2)) <= ${maxAmountParam}`);
  }

  // Get all data
  const [statsResult] = await db
    .select({
      totalTickets: count(tickets.id),
      totalRevenue: sum(tickets.totalAmount),
      avgTicketValue: sql<number>`COALESCE(AVG(CAST(${tickets.totalAmount} AS DECIMAL(10,2))), 0)`,
    })
    .from(tickets)
    .leftJoin(transactions, eq(tickets.id, transactions.ticketId))
    .where(and(...whereConditions));

  const [categoryCounts] = await db
    .select({
      totalAdult: sum(tickets.adultQuantity),
      totalStudent: sum(tickets.studentQuantity),
      totalChild: sum(tickets.childQuantity),
      totalQuantity: sum(tickets.totalQuantity),
    })
    .from(tickets)
    .leftJoin(transactions, eq(tickets.id, transactions.ticketId))
    .where(and(...whereConditions));

  const [statusCounts] = await db
    .select({
      paidTickets: sql<number>`COUNT(CASE WHEN ${tickets.paymentStatus} = 'PAID' THEN 1 END)`,
      pendingTickets: sql<number>`COUNT(CASE WHEN ${tickets.paymentStatus} = 'PENDING' THEN 1 END)`,
      failedTickets: sql<number>`COUNT(CASE WHEN ${tickets.paymentStatus} = 'FAILED' THEN 1 END)`,
    })
    .from(tickets)
    .leftJoin(transactions, eq(tickets.id, transactions.ticketId))
    .where(and(...whereConditions));

  const dailyPurchases = await db
    .select({
      date: sql<string>`DATE(${tickets.createdAt})`,
      count: count(tickets.id),
      amount: sum(tickets.totalAmount),
    })
    .from(tickets)
    .leftJoin(transactions, eq(tickets.id, transactions.ticketId))
    .where(and(...whereConditions))
    .groupBy(sql`DATE(${tickets.createdAt})`)
    .orderBy(sql`DATE(${tickets.createdAt})`);

  const sessionAnalytics = await db
    .select({
      sessionName: eventSessions.name,
      dayName: eventDays.name,
      dayDate: eventDays.date,
      sessionTime: sql<string>`CONCAT(${eventSessions.startTime}, ' - ', ${eventSessions.endTime})`,
      ticketCount: count(tickets.id),
      totalRevenue: sum(tickets.totalAmount),
      adultCount: sum(tickets.adultQuantity),
      studentCount: sum(tickets.studentQuantity),
      childCount: sum(tickets.childQuantity),
    })
    .from(tickets)
    .leftJoin(transactions, eq(tickets.id, transactions.ticketId))
    .leftJoin(eventSessions, eq(tickets.sessionId, eventSessions.id))
    .leftJoin(eventDays, eq(eventSessions.dayId, eventDays.id))
    .where(and(...whereConditions))
    .groupBy(
      eventSessions.id, 
      eventDays.id, 
      eventDays.date, 
      eventSessions.name, 
      eventSessions.startTime, 
      eventSessions.endTime
    )
    .orderBy(eventDays.date, eventSessions.startTime);

  const recentPurchases = await db
    .select({
      ticket: tickets,
      transaction: transactions,
      session: eventSessions,
      day: eventDays,
    })
    .from(tickets)
    .leftJoin(transactions, eq(tickets.id, transactions.ticketId))
    .leftJoin(eventSessions, eq(tickets.sessionId, eventSessions.id))
    .leftJoin(eventDays, eq(eventSessions.dayId, eventDays.id))
    .where(and(...whereConditions))
    .orderBy(desc(tickets.createdAt))
    .limit(10);

  // Calculate active filter count
  const activeFilterCount = 
    (daysParam !== DEFAULT_DAYS_RANGE ? 1 : 0) +
    (startDateParam || endDateParam ? 1 : 0) +
    ticketTypesParam.length +
    paymentStatusParam.length +
    (sessionIdParam ? 1 : 0) +
    (dayIdParam ? 1 : 0) +
    (minAmountParam !== undefined ? 1 : 0) +
    (maxAmountParam !== undefined ? 1 : 0);

  // Prepare data for client component
  const dashboardData = {
    stats: {
      totalTickets: statsResult.totalTickets,
      totalRevenue: Number(statsResult.totalRevenue) || 0,
      paidTickets: Number(statusCounts.paidTickets) || 0,
      avgTicketValue: Number(statsResult.avgTicketValue) || 0,
      pendingTickets: Number(statusCounts.pendingTickets) || 0,
      failedTickets: Number(statusCounts.failedTickets) || 0,
    },
    categories: [
      {
        name: 'Adult',
        count: Number(categoryCounts.totalAdult) || 0,
        amount: 0,
      },
      {
        name: 'Student',
        count: Number(categoryCounts.totalStudent) || 0,
        amount: 0,
      },
      {
        name: 'Child',
        count: Number(categoryCounts.totalChild) || 0,
        amount: 0,
      },
    ],
    dailyData: dailyPurchases.map(item => ({
      date: item.date,
      tickets: item.count,
      revenue: Number(item.amount) || 0,
    })),
    sessionData: sessionAnalytics.map(session => ({
      sessionName: session.sessionName || 'No Session',
      dayName: session.dayName || 'No Day',
      dayDate: session.dayDate ? new Date(session.dayDate).toISOString().split('T')[0] : '',
      sessionTime: session.sessionTime || '',
      ticketCount: session.ticketCount,
      totalRevenue: Number(session.totalRevenue) || 0,
      categories: {
        adult: Number(session.adultCount) || 0,
        student: Number(session.studentCount) || 0,
        child: Number(session.childCount) || 0,
      },
    })),
    recentPurchases,
    totalQuantities: {
      adult: Number(categoryCounts.totalAdult) || 0,
      student: Number(categoryCounts.totalStudent) || 0,
      child: Number(categoryCounts.totalChild) || 0,
      total: Number(categoryCounts.totalQuantity) || 0,
    },
    dateRangeText: startDateParam && endDateParam
      ? `${new Date(startDateParam).toLocaleDateString()} - ${new Date(endDateParam).toLocaleDateString()}`
      : `Last ${daysParam} days`,
  };

  const filterParams = {
    days: daysParam,
    startDate: startDateParam,
    endDate: endDateParam,
    ticketTypes: ticketTypesParam,
    paymentStatus: paymentStatusParam,
    sessionId: sessionIdParam,
    dayId: dayIdParam,
    minAmount: minAmountParam,
    maxAmount: maxAmountParam,
  };

  return (
    <AdminLayout>
      <DashboardClientWrapper
        dashboardData={dashboardData}
        filterParams={filterParams}
        sessions={sessions}
        eventDays={eventDaysData}
        activeFilterCount={activeFilterCount}
      />
    </AdminLayout>
  );
}