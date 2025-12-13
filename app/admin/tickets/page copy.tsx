import AdminLayout from '@/components/admin/AdminLayout';
import { db } from '@/lib/db/db';
import { tickets } from '@/lib/drizzle/schema';
import { desc, like, or, and, sql } from 'drizzle-orm'; 
import { MoreHorizontal, Search } from 'lucide-react';
import { TicketType, PaymentStatus, TicketStatus } from '@/lib/types/ticketTypes';
import { TicketFilters } from '@/components/admin/tickets/TicketFilter';
import { TicketPagination } from '@/components/admin/tickets/TicketPagination';

// Define props interface
interface TicketsPageProps {
  searchParams: Promise<{ 
    search?: string;
    type?: TicketType;
    status?: TicketStatus;
    paymentStatus?: PaymentStatus;
    page?: string;
    limit?: string;
  }>;
}

// Helper function to get status badge colors
const getStatusBadgeStyles = (paymentStatus: PaymentStatus) => {
  switch (paymentStatus) {
    case 'PAID':
      return 'bg-green-50 text-green-700 border-green-100';
    case 'FAILED':
      return 'bg-red-50 text-red-700 border-red-100';
    case 'REFUNDED':
      return 'bg-purple-50 text-purple-700 border-purple-100';
    case 'PENDING':
      return 'bg-yellow-50 text-yellow-700 border-yellow-100';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-100';
  }
};

// Helper function to get type badge colors
const getTypeBadgeStyles = (ticketType: TicketType) => {
  switch (ticketType) {

    case 'ADULT':
      return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'STUDENT':
      return 'bg-green-50 text-green-700 border-green-100';
    case 'CHILD':
      return 'bg-pink-50 text-pink-700 border-pink-100';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-100';
  }
};

// Helper to format currency
const formatCurrency = (amount: string | number): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `TZS ${numAmount.toLocaleString('en-US')}`;
};

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const params = await searchParams;
  const searchQuery = typeof params.search === 'string' ? params.search : '';
  const typeFilter = params.type as TicketType | undefined;
  const statusFilter = params.status as TicketStatus | undefined;
  const paymentStatusFilter = params.paymentStatus as PaymentStatus | undefined;
  const page = parseInt(params.page || '1');
  const limitParam = params.limit || '50';
  const limit = limitParam === '0' ? 999999 : parseInt(limitParam);
  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions = [];
  
  // Search condition
  if (searchQuery) {
    conditions.push(
      or(
        like(tickets.purchaserName, `%${searchQuery}%`),
        like(tickets.purchaserPhone, `%${searchQuery}%`),
        like(tickets.ticketCode, `%${searchQuery}%`)
      )
    );
  }
  
  // Type filter
  if (typeFilter) {
    conditions.push(sql`${tickets.ticketType} = ${typeFilter}`);
  }
  
  // Status filter
  if (statusFilter) {
    conditions.push(sql`${tickets.status} = ${statusFilter}`);
  }
  
  // Payment status filter
  if (paymentStatusFilter) {
    conditions.push(sql`${tickets.paymentStatus} = ${paymentStatusFilter}`);
  }
  
  // Combine conditions
  const whereCondition = conditions.length > 0 
    ? and(...conditions)
    : undefined;

try {
  // Get total count for pagination - SIMPLE APPROACH
  // const allTicketsForCount = await db.select({ id: tickets.id })
  //   .from(tickets)
  //   .where(whereCondition);
  
  // const totalCount = allTicketsForCount.length;
  // const totalPages = limit === 999999 ? 1 : Math.ceil(totalCount / limit);
  


    // Get tickets with filters and pagination
    const allTickets = await db.select()
      .from(tickets)
      .where(whereCondition)
      .orderBy(desc(tickets.createdAt))
      .limit(limit)
      .offset(offset);

    // Calculate statistics
    const paidTickets = allTickets.filter(t => t.paymentStatus === 'PAID');
    const totalRevenue = paidTickets.reduce((sum, ticket) => {
      return sum + parseFloat(ticket.totalAmount);
    }, 0);

    // Calculate additional statistics
    const ticketTypeCounts: Record<TicketType, number> = {
       'ADULT': 0, 'STUDENT': 0, 'CHILD': 0, 
     
    };

    const paymentStatusCounts: Record<PaymentStatus, number> = {
      'UNPAID': 0, 'PAID': 0, 'FAILED': 0, 'REFUNDED': 0, 'PENDING': 0
    };

    allTickets.forEach(ticket => {
      if (ticket.ticketType in ticketTypeCounts) {
        ticketTypeCounts[ticket.ticketType as TicketType]++;
      }
      if (ticket.paymentStatus in paymentStatusCounts) {
        paymentStatusCounts[ticket.paymentStatus as PaymentStatus]++;
      }
    });

    // Format date helper
    const formatDate = (date: Date | null): string => {
      if (!date) return '-';
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    };

    // Format time helper
    const formatTime = (date: Date | null): string => {
      if (!date) return '';
      return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return (
      <AdminLayout>
        <div className="space-y-6">
          
          {/* Header & Stats */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Live Tickets</h1>
              <p className="text-sm text-gray-500">Manage all generated tickets and orders.</p>
            </div>
            
            {/* Stats Summary */}
            <div className="flex gap-6">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Tickets</p>
                {/* <p className="text-xl font-bold text-gray-900">{totalCount.toLocaleString()}</p> */}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Showing</p>
                <p className="text-xl font-bold text-blue-600">
                  {/* {Math.min(offset + 1, totalCount)}-{Math.min(offset + limit, totalCount)} */}
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Ticket Types Summary */}
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Ticket Types</h3>
              <div className="space-y-2">
                {Object.entries(ticketTypeCounts)
                  .filter(([, count]) => count > 0)
                  .map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${getTypeBadgeStyles(type as TicketType)}`}>
                        {type}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Payment Status Summary */}
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Payment Status</h3>
              <div className="space-y-2">
                {Object.entries(paymentStatusCounts)
                  .filter(([, count]) => count > 0)
                  .map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusBadgeStyles(status as PaymentStatus)}`}>
                        {status}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Revenue Summary */}
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Revenue Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Paid Tickets</span>
                  <span className="text-sm font-medium text-green-600">
                    {paidTickets.length} × {paidTickets.length > 0 ? 
                      formatCurrency(parseFloat(paidTickets[0].totalAmount)) : 
                      'TZS 0'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending Revenue</span>
                  <span className="text-sm font-medium text-yellow-600">
                    {formatCurrency(
                      allTickets
                        .filter(t => t.paymentStatus === 'PENDING')
                        .reduce((sum, t) => sum + parseFloat(t.totalAmount), 0)
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">Total Revenue</span>
                    <span className="text-lg font-bold text-green-700">
                      {formatCurrency(totalRevenue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FILTERS SECTION - Client Component */}
          <TicketFilters 
            initialFilters={{
              search: searchQuery,
              type: typeFilter,
              status: statusFilter,
              paymentStatus: paymentStatusFilter,
              limit: limitParam
            }}
            totalCount={3}
          />

          {/* Table Card */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Ticket ID</th>
                    <th className="px-6 py-4">Purchaser Details</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Payment Status</th>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allTickets.map((ticket) => (
                    <tr 
                      key={ticket.id} 
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="px-6 py-4 font-mono text-xs">
                        <span className="text-gray-400">#</span>
                        <span className="text-gray-900 font-medium">
                          {ticket.id.toString().padStart(4, '0')}
                        </span>
                        <div className="text-[10px] text-gray-400 font-mono mt-1">
                          {ticket.ticketCode.slice(0, 8)}...
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">
                          {ticket.purchaserName || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {ticket.purchaserPhone || 'No phone'}
                        </p>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-md text-xs font-bold border ${getTypeBadgeStyles(ticket.ticketType as TicketType)}`}>
                          {ticket.ticketType}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {formatCurrency(ticket.totalAmount)}
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusBadgeStyles(ticket.paymentStatus as PaymentStatus)}`}>
                          <span className={`w-2 h-2 rounded-full ${
                            ticket.paymentStatus === 'PAID' ? 'bg-green-500' :
                            ticket.paymentStatus === 'FAILED' ? 'bg-red-500' :
                            ticket.paymentStatus === 'PENDING' ? 'bg-yellow-500' :
                            'bg-gray-400'
                          }`}></span>
                          {ticket.paymentStatus}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDate(ticket.createdAt)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatTime(ticket.createdAt)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                            title="View details"
                          >
                            View
                          </button>
                          <button 
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                            title="More actions"
                          >
                            <MoreHorizontal size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {allTickets.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Search className="text-gray-400" size={24} />
                          </div>
                          <p className="text-gray-400 font-medium">No tickets found</p>
                          <p className="text-gray-300 text-sm mt-1">
                            {searchQuery || typeFilter || statusFilter || paymentStatusFilter 
                              ? 'Try adjusting your filters' 
                              : 'No tickets have been created yet'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION - Client Component */}
            {/* {totalPages > 1 && ( */}
              <TicketPagination
                currentPage={page}
                totalPages={3}
                totalCount={3}
                offset={offset}
                limit={limit}
                filters={{
                  search: searchQuery,
                  type: typeFilter,
                  status: statusFilter,
                  paymentStatus: paymentStatusFilter
                }}
              />
            {/* )} */}
          </div>
        </div>
      </AdminLayout>
    );

  } catch (error) {
    console.error('Database error:', error);
    
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Live Tickets</h1>
              <p className="text-sm text-gray-500">Manage all generated tickets and orders.</p>
            </div>
          </div>
          
          <div className="bg-white border border-red-200 rounded-2xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Search className="text-red-400" size={24} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Database Error</h2>
            <p className="text-gray-500 mb-4">
              Unable to load tickets from the database. Please try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-medium text-white bg-[#A81010] hover:bg-[#8a0d0d] rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }
}