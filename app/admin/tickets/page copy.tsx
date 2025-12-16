// app/admin/tickets/page.tsx
import AdminLayout from '@/components/admin/AdminLayout';
import { db } from '@/lib/db/db';
import { tickets, transactions, eventSessions, eventDays } from '@/lib/drizzle/schema';
import { desc, like, or, sql, eq, and } from 'drizzle-orm'; 
import StatsCards from '@/components/admin/tickets/partial/StatsCards';
import Filters from '@/components/admin/tickets/partial/filters';
import TicketsTable from '@/components/admin/tickets/partial/TicketsTable';
import Pagination from '@/components/admin/tickets/partial/pagination';
import MobileTicketsList from '@/components/admin/tickets/partial/MobileTicketsList';
import HeaderActions from '@/components/admin/tickets/partial/HeaderActions';

// Constants for pagination
const ITEMS_PER_PAGE = 10;

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const searchQuery = typeof params.search === 'string' ? params.search : '';
  const purchaserName = typeof params.purchaserName === 'string' ? params.purchaserName : '';
  const purchaserPhone = typeof params.purchaserPhone === 'string' ? params.purchaserPhone : '';
  const ticketCode = typeof params.ticketCode === 'string' ? params.ticketCode : '';
  const externalId = typeof params.externalId === 'string' ? params.externalId : '';
  const reference = typeof params.reference === 'string' ? params.reference : '';
  const ticketType = typeof params.ticketType === 'string' ? params.ticketType : '';
  const paymentStatus = typeof params.paymentStatus === 'string' ? params.paymentStatus : '';
  const provider = typeof params.provider === 'string' ? params.provider : '';
  const sessionId = typeof params.session === 'string' ? parseInt(params.session) : undefined;
  const sortBy = typeof params.sortBy === 'string' ? params.sortBy : 'createdAt';
  const sortOrder = typeof params.sortOrder === 'string' ? params.sortOrder : 'desc';
  const page = typeof params.page === 'string' ? Math.max(1, parseInt(params.page)) : 1;
  
  // Calculate offset for pagination
  const offset = (page - 1) * ITEMS_PER_PAGE;

  // Build where conditions
  const whereConditions = [];
  
  // Individual column search conditions
  if (searchQuery) {
    whereConditions.push(
      or(
        like(tickets.purchaserName, `%${searchQuery}%`),
        like(tickets.purchaserPhone, `%${searchQuery}%`),
        like(tickets.ticketCode, `%${searchQuery}%`),
        like(transactions.externalId, `%${searchQuery}%`),
        like(transactions.reference, `%${searchQuery}%`)
      )
    );
  } else {
    // Individual column searches
    if (purchaserName) {
      whereConditions.push(like(tickets.purchaserName, `%${purchaserName}%`));
    }
    if (purchaserPhone) {
      whereConditions.push(like(tickets.purchaserPhone, `%${purchaserPhone}%`));
    }
    if (ticketCode) {
      whereConditions.push(like(tickets.ticketCode, `%${ticketCode}%`));
    }
    if (externalId) {
      whereConditions.push(like(transactions.externalId, `%${externalId}%`));
    }
    if (reference) {
      whereConditions.push(like(transactions.reference, `%${reference}%`));
    }
  }
  
  if (ticketType) {
    whereConditions.push(eq(tickets.ticketType, ticketType));
  }
  
  if (paymentStatus) {
    whereConditions.push(eq(tickets.paymentStatus, paymentStatus));
  }
  
  if (provider) {
    whereConditions.push(eq(transactions.provider, provider));
  }
  
  if (sessionId) {
    whereConditions.push(eq(tickets.sessionId, sessionId));
  }

  // Get total count for pagination
  const countResult = await db
    .select({ count: sql<number>`count(distinct ${tickets.id})` })
    .from(tickets)
    .leftJoin(transactions, eq(tickets.id, transactions.ticketId))
    .leftJoin(eventSessions, eq(tickets.sessionId, eventSessions.id))
    .leftJoin(eventDays, eq(eventSessions.dayId, eventDays.id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  const totalCount = countResult[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Build order by clause
  let orderByClause;
  switch (sortBy) {
    case 'totalAmount':
      orderByClause = sortOrder === 'asc' ? sql`${tickets.totalAmount} asc` : sql`${tickets.totalAmount} desc`;
      break;
    case 'purchaserName':
      orderByClause = sortOrder === 'asc' ? sql`${tickets.purchaserName} asc` : sql`${tickets.purchaserName} desc`;
      break;
    case 'createdAt':
      orderByClause = sortOrder === 'asc' ? sql`${tickets.createdAt} asc` : sql`${tickets.createdAt} desc`;
      break;
    case 'day':
      orderByClause = sortOrder === 'asc' ? sql`${eventDays.date} asc` : sql`${eventDays.date} desc`;
      break;
    default:
      orderByClause = sql`${tickets.createdAt} desc`;
  }

  // Get paginated tickets with related data
  const allTickets = await db
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
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(orderByClause)
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  // Get sessions for filter dropdown
  const sessions = await db
    .select({
      id: eventSessions.id,
      name: eventSessions.name,
      dayName: eventDays.name,
      date: eventDays.date,
    })
    .from(eventSessions)
    .leftJoin(eventDays, eq(eventSessions.dayId, eventDays.id))
    .orderBy(eventDays.date, eventSessions.startTime);

  // Get unique providers for filter
  const providers = await db
    .selectDistinct({ provider: transactions.provider })
    .from(transactions)
    .where(sql`${transactions.provider} is not null`);

  // Calculate stats
  const paidCount = allTickets.filter(t => t.ticket.paymentStatus === 'PAID').length;
  const totalAmount = allTickets.reduce((sum, t) => {
    return sum + (Number(t.ticket.totalAmount) || 0);
  }, 0);
  const avgTicketValue = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;

  // Build query string helper
  const buildQueryString = (updates: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    
    // Keep existing params
    if (searchQuery) params.set('search', searchQuery);
    if (purchaserName) params.set('purchaserName', purchaserName);
    if (purchaserPhone) params.set('purchaserPhone', purchaserPhone);
    if (ticketCode) params.set('ticketCode', ticketCode);
    if (externalId) params.set('externalId', externalId);
    if (reference) params.set('reference', reference);
    if (ticketType) params.set('ticketType', ticketType);
    if (paymentStatus) params.set('paymentStatus', paymentStatus);
    if (provider) params.set('provider', provider);
    if (sessionId) params.set('session', sessionId.toString());
    if (sortBy !== 'createdAt' || sortOrder !== 'desc') {
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
    }
    
    // Apply updates
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, value.toString());
      }
    });
    
    return params.toString() ? `?${params.toString()}` : '';
  };

  // Check if any search or filter is active
  const hasIndividualSearch = purchaserName || purchaserPhone || ticketCode || externalId || reference;
  const hasAnySearch = searchQuery || hasIndividualSearch;
  const hasAnyFilter = ticketType || paymentStatus || provider || sessionId;

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Header & Actions */}
        <HeaderActions />

        {/* Stats Cards */}
        <StatsCards 
          totalCount={totalCount}
          paidCount={paidCount}
          totalAmount={totalAmount}
          avgTicketValue={avgTicketValue}
        />

        {/* Search & Filter Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Filters Component with AutoSearch */}
          <Filters
            searchQuery={searchQuery}
            purchaserName={purchaserName}
            purchaserPhone={purchaserPhone}
            ticketCode={ticketCode}
            externalId={externalId}
            reference={reference}
            ticketType={ticketType}
            paymentStatus={paymentStatus}
            provider={provider}
            sessionId={sessionId}
            sortBy={sortBy}
            sortOrder={sortOrder}
            sessions={sessions}
            providers={providers}
            buildQueryString={buildQueryString}
            hasIndividualSearch={hasIndividualSearch}
            hasAnySearch={hasAnySearch}
            hasAnyFilter={hasAnyFilter}
          />

          {/* Mobile View */}
          <MobileTicketsList 
            tickets={allTickets}
            hasAnySearch={hasAnySearch}
            hasAnyFilter={hasAnyFilter}
          />

          {/* Desktop Table View */}
          <TicketsTable tickets={allTickets} />

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              ITEMS_PER_PAGE={ITEMS_PER_PAGE}
              buildQueryString={buildQueryString}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}