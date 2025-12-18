// app/admin/tickets/page.tsx

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { db } from '@/lib/db/db';
import { tickets, transactions, eventSessions, eventDays } from '@/lib/drizzle/schema';
import { desc, like, or, sql, eq, and } from 'drizzle-orm'; 
import { Download, Eye, Edit, Trash2, Calendar, User, Phone, Tag, DollarSign, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Ticket, Clock, Database, CreditCard, X } from 'lucide-react';
import Link from 'next/link';
import AutoSearchForm from '@/components/admin/tickets/AutoSearchForm';
import BulkActions from '@/components/admin/tickets/BulkActions';

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
   const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Calculate offset for pagination
  const offset = (page - 1) * ITEMS_PER_PAGE;

  const getIsSelected = (id: number) => selectedTickets.includes(id);
  const handleToggleTicket = (id: number) => {
    if (selectedTickets.includes(id)) {
      setSelectedTickets(selectedTickets.filter(ticketId => ticketId !== id));
      setSelectAll(false);
    } else {
      setSelectedTickets([...selectedTickets, id]);
    }
  };

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

  // Pagination helper function
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);
      
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }
      
      if (start > 1) pages.push(1, '...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages) pages.push('...', totalPages);
    }
    
    return pages;
  };

  // Build query string for pagination/filters
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

  // Check if any individual column search is active
  const hasIndividualSearch = purchaserName || purchaserPhone || ticketCode || externalId || reference;
  const hasAnySearch = searchQuery || hasIndividualSearch;
  const hasAnyFilter = ticketType || paymentStatus || provider || sessionId;

  // Clear all search function
  const clearAllSearch = () => {
    const params = new URLSearchParams();
    if (ticketType) params.set('ticketType', ticketType);
    if (paymentStatus) params.set('paymentStatus', paymentStatus);
    if (provider) params.set('provider', provider);
    if (sessionId) params.set('session', sessionId.toString());
    if (sortBy !== 'createdAt' || sortOrder !== 'desc') {
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
    }
    return params.toString() ? `?${params.toString()}` : '';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Live Tickets</h1>
            <p className="text-sm text-gray-500">Manage all generated tickets and orders.</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
            <Link
              href="/admin/tickets/create"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
            >
              <Edit size={16} /> Create Ticket
            </Link>
            {/* <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#A81010] text-white rounded-xl text-sm font-medium hover:bg-[#8a0d0d] shadow-lg shadow-red-900/20 transition-colors duration-200">
              <Download size={16} /> Export CSV
            </button> */}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Ticket className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div> */}
          
          {/* <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Paid Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{paidCount}</p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div> */}
          
          {/* <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  TZS {totalAmount.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div> */}
          
          {/* <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg. Ticket Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  TZS {avgTicketValue.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div> */}
        </div>

           {/* Bulk Actions Component */}
        <BulkActions tickets={allTickets} />
        

        {/* Search & Filter Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Search & Filters Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-col lg:flex-row gap-4">
              <AutoSearchForm />
            </div>
          </div>

          {/* Active filters display */}
          {(hasAnyFilter || hasIndividualSearch) && (
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Active filters:</span>
                
                {ticketType && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                    Type: {ticketType}
                    <Link href={buildQueryString({ ticketType: '' })} className="hover:text-blue-900">
                      <X size={12} />
                    </Link>
                  </span>
                )}
                
                {paymentStatus && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                    Status: {paymentStatus}
                    <Link href={buildQueryString({ paymentStatus: '' })} className="hover:text-green-900">
                      <X size={12} />
                    </Link>
                  </span>
                )}
                
                {provider && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                    Provider: {provider}
                    <Link href={buildQueryString({ provider: '' })} className="hover:text-purple-900">
                      <X size={12} />
                    </Link>
                  </span>
                )}
                
                {sessionId && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs">
                    Session: {sessions.find(s => s.id === sessionId)?.name || sessionId}
                    <Link href={buildQueryString({ session: '' })} className="hover:text-amber-900">
                      <X size={12} />
                    </Link>
                  </span>
                )}
                
                {purchaserName && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    Name: {purchaserName}
                    <Link href={buildQueryString({ purchaserName: '' })} className="hover:text-gray-900">
                      <X size={12} />
                    </Link>
                  </span>
                )}
                
                {purchaserPhone && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    Phone: {purchaserPhone}
                    <Link href={buildQueryString({ purchaserPhone: '' })} className="hover:text-gray-900">
                      <X size={12} />
                    </Link>
                  </span>
                )}
                
                {ticketCode && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    Code: {ticketCode}
                    <Link href={buildQueryString({ ticketCode: '' })} className="hover:text-gray-900">
                      <X size={12} />
                    </Link>
                  </span>
                )}
                
                {externalId && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    External ID: {externalId}
                    <Link href={buildQueryString({ externalId: '' })} className="hover:text-gray-900">
                      <X size={12} />
                    </Link>
                  </span>
                )}
                
                {reference && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    Reference: {reference}
                    <Link href={buildQueryString({ reference: '' })} className="hover:text-gray-900">
                      <X size={12} />
                    </Link>
                  </span>
                )}
                
                {(hasAnyFilter || hasIndividualSearch) && (
                  <Link
                    href={clearAllSearch()}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                  >
                    <X size={12} /> Clear all filters
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3 p-4">
            {allTickets.map(({ ticket, transaction, session, day }) => (
              <div key={ticket.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-gray-400">
                        #{ticket.id.toString().padStart(4, '0')}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                        ticket.ticketType === 'VVIP' ? 'bg-purple-50 text-purple-700' :
                        ticket.ticketType === 'VIP' ? 'bg-amber-50 text-amber-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {ticket.ticketType}
                      </span>
                    </div>
                    <p className="font-bold text-gray-900 text-sm">{ticket.purchaserName}</p>
                    {session && day && (
                      <p className="text-xs text-gray-500 mt-1">
                        {day.name} - {session.name}
                      </p>
                    )}
                  </div>
                  
                  {/* Status */}
                  <div className="flex flex-col items-end gap-1">
                    {ticket.paymentStatus === 'PAID' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Paid
                      </span>
                    ) : ticket.paymentStatus === 'FAILED' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700">
                        Failed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700">
                        Pending
                      </span>
                    )}
                    {transaction?.provider && (
                      <span className="text-xs text-gray-500">
                        via {transaction.provider}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Phone size={14} />
                      <span>{ticket.purchaserPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <DollarSign size={14} />
                      <span className="font-medium">TZS {Number(ticket.totalAmount).toLocaleString()}</span>
                    </div>
                    {transaction?.externalId && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Database size={14} />
                        <span className="font-mono text-xs truncate">{transaction.externalId.slice(0, 12)}...</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar size={14} />
                      <span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Tag size={14} />
                      <span className="font-mono text-xs">{ticket.ticketCode.slice(0, 8)}...</span>
                    </div>
                    {transaction?.status && transaction.status !== ticket.paymentStatus && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <CreditCard size={14} />
                        <span className="text-xs">Tx: {transaction.status}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <Link 
                    href={`/admin/tickets/${ticket.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium"
                  >
                    <Eye size={14} /> View
                  </Link>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/tickets/${ticket.id}/edit`}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit size={14} />
                    </Link>
                    <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {allTickets.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Tickets Found</h3>
                <p className="text-gray-500">
                  {hasAnySearch || hasAnyFilter 
                    ? "Try adjusting your search or filters" 
                    : "No tickets have been created yet"}
                </p>
                {!(hasAnySearch || hasAnyFilter) && (
                  <Link
                    href="/admin/tickets/create"
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#A81010] text-white rounded-lg text-sm font-medium hover:bg-[#8a0d0d]"
                  >
                    <Edit size={16} /> Create Your First Ticket
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
                  <tr>
                      {/* Add Select All column */}
                    <th className="px-4 py-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-[#A81010] focus:ring-[#A81010] focus:ring-offset-0"
                      />
                    </th>
                    <th className="px-6 py-4">Ticket ID</th>
                    <th className="px-6 py-4">Purchaser Details</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Session & Day</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Payment Status</th>
                    <th className="px-6 py-4">External ID</th>
                    <th className="px-6 py-4">Provider</th>
                    <th className="px-6 py-4">Tx Status</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allTickets.map(({ ticket, transaction, session, day }) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">
                        #{ticket.id.toString().padStart(4, '0')}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{ticket.purchaserName}</p>
                        <p className="text-xs text-gray-400">{ticket.purchaserPhone}</p>
                        <p className="text-xs text-gray-500 mt-1 font-mono">{ticket.ticketCode}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                          ticket.ticketType === 'VVIP' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                          ticket.ticketType === 'VIP' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {ticket.ticketType}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          Qty: {ticket.totalQuantity}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {session && day ? (
                          <>
                            <p className="font-medium text-gray-900">{session.name}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar size={12} />
                              <span>{new Date(day.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock size={12} />
                              <span>{session.startTime} - {session.endTime}</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        TZS {Number(ticket.totalAmount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {ticket.paymentStatus === 'PAID' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Paid
                          </span>
                        ) : ticket.paymentStatus === 'FAILED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                            Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-100">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {transaction?.externalId ? (
                          <div className="font-mono text-xs text-gray-500 truncate max-w-[120px]" title={transaction.externalId}>
                            {transaction.externalId}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {transaction?.provider ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                            <CreditCard size={12} />
                            {transaction.provider}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {transaction?.status ? (
                          <span className={`text-xs px-2 py-1 rounded-md ${
                            transaction.status === 'SUCCESS' ? 'bg-green-50 text-green-700' :
                            transaction.status === 'FAILED' ? 'bg-red-50 text-red-700' :
                            'bg-yellow-50 text-yellow-700'
                          }`}>
                            {transaction.status}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '-'}</span>
                          <span className="text-xs text-gray-400">
                            {ticket.createdAt ? new Date(ticket.createdAt).toLocaleTimeString() : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Link 
                            href={`/admin/tickets/${ticket.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View ticket"
                          >
                            <Eye size={16} />
                          </Link>
                          <Link
                            href={`/admin/tickets/${ticket.id}/edit`}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit ticket"
                          >
                            <Edit size={16} />
                          </Link>
                          <button 
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete ticket"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {allTickets.length === 0 && (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <X className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">No Tickets Found</h3>
                          <p className="text-gray-500 mb-4">
                            {hasAnySearch || hasAnyFilter 
                              ? "Try adjusting your search or filters" 
                              : "No tickets have been created yet"}
                          </p>
                          {!(hasAnySearch || hasAnyFilter) && (
                            <Link
                              href="/admin/tickets/create"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#A81010] text-white rounded-lg text-sm font-medium hover:bg-[#8a0d0d]"
                            >
                              <Edit size={16} /> Create Your First Ticket
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-100 p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Results Info */}
                <div className="text-sm text-gray-500">
                  Showing <span className="font-bold text-gray-900">
                    {Math.min((page - 1) * ITEMS_PER_PAGE + 1, totalCount)}
                  </span> to <span className="font-bold text-gray-900">
                    {Math.min(page * ITEMS_PER_PAGE, totalCount)}
                  </span> of <span className="font-bold text-gray-900">{totalCount}</span> results
                </div>
                
                {/* Pagination Controls */}
                <div className="flex items-center gap-1">
                  {/* First Page */}
                  <Link
                    href={`${buildQueryString({ page: 1 })}`}
                    className={`p-2 rounded-lg transition-colors ${page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                    aria-disabled={page === 1}
                  >
                    <ChevronsLeft size={16} />
                  </Link>
                  
                  {/* Previous Page */}
                  <Link
                    href={`${buildQueryString({ page: page - 1 })}`}
                    className={`p-2 rounded-lg transition-colors ${page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                    aria-disabled={page === 1}
                  >
                    <ChevronLeft size={16} />
                  </Link>
                  
                  {/* Page Numbers */}
                  <div className="flex gap-1 mx-2">
                    {generatePageNumbers().map((pageNum, index) => (
                      pageNum === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">...</span>
                      ) : (
                        <Link
                          key={pageNum}
                          href={`${buildQueryString({ page: pageNum })}`}
                          className={`min-w-[40px] h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                            page === pageNum
                              ? 'bg-[#A81010] text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </Link>
                      )
                    ))}
                  </div>
                  
                  {/* Next Page */}
                  <Link
                    href={`${buildQueryString({ page: page + 1 })}`}
                    className={`p-2 rounded-lg transition-colors ${page === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                    aria-disabled={page === totalPages}
                  >
                    <ChevronRight size={16} />
                  </Link>
                  
                  {/* Last Page */}
                  <Link
                    href={`${buildQueryString({ page: totalPages })}`}
                    className={`p-2 rounded-lg transition-colors ${page === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                    aria-disabled={page === totalPages}
                  >
                    <ChevronsRight size={16} />
                  </Link>
                </div>
                
                {/* Page Size Selector */}
                <div className="text-sm text-gray-500">
                  <span>Show </span>
                  <select 
                    className="bg-transparent border-none focus:outline-none text-gray-900 font-medium"
                    defaultValue={ITEMS_PER_PAGE}
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                  <span> per page</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}