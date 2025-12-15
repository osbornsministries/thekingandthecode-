// app/admin/tickets/page.tsx
import AdminLayout from '@/components/admin/AdminLayout';
import TicketsTable from '@/components/admin/tickets/TicketsTable';
import TicketsFilters from '@/components/admin/tickets/TicketsFilters';
import { getTickets } from '@/lib/actions/ticket/tickets';
import { 
  Filter, 
  Download, 
  Calendar, 
  User, 
  Tag, 
  DollarSign,
  Plus
} from 'lucide-react';
import Link from 'next/link';

const ITEMS_PER_PAGE = 10;

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  // Parse parameters
  const searchQuery = typeof params.search === 'string' ? params.search : '';
  const page = typeof params.page === 'string' ? Math.max(1, parseInt(params.page)) : 1;
  const sessionFilter = typeof params.session === 'string' ? params.session : '';
  const ticketTypeFilter = typeof params.ticketType === 'string' ? params.ticketType : '';
  const dayFilter = typeof params.day === 'string' ? params.day : '';
  const statusFilter = typeof params.status === 'string' ? params.status : '';
  const sortParam = typeof params.sort === 'string' ? params.sort : 'createdAt:desc';
  const limit = typeof params.limit === 'string' ? parseInt(params.limit) : ITEMS_PER_PAGE;
  
  // Parse sort parameter
  const [sortField, sortOrder] = sortParam.split(':') as [string, string];

  // Fetch tickets with filters
  const { tickets, totalCount, sessions, days, currentPage, totalPages } = await getTickets({
    search: searchQuery,
    session: sessionFilter,
    ticketType: ticketTypeFilter,
    day: dayFilter,
    status: statusFilter,
    sortField: sortField as any,
    sortOrder: sortOrder as any,
    page,
    limit
  });

  // Helper function to build URL (server-side only)
  const buildUrl = (params: Record<string, string | number>) => {
    const urlParams = new URLSearchParams();
    
    // Preserve existing params
    if (searchQuery) urlParams.set('search', searchQuery);
    if (sessionFilter) urlParams.set('session', sessionFilter);
    if (ticketTypeFilter) urlParams.set('ticketType', ticketTypeFilter);
    if (dayFilter) urlParams.set('day', dayFilter);
    if (statusFilter) urlParams.set('status', statusFilter);
    if (sortParam) urlParams.set('sort', sortParam);
    if (limit !== ITEMS_PER_PAGE) urlParams.set('limit', limit.toString());
    
    // Add new params
    Object.entries(params).forEach(([key, value]) => {
      urlParams.set(key, String(value));
    });
    
    return `?${urlParams.toString()}`;
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
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#A81010] text-white rounded-xl text-sm font-medium hover:bg-[#8a0d0d] shadow-lg shadow-red-900/20 transition-colors duration-200"
            >
              <Plus size={16} /> Create Ticket
            </Link>
            <Link 
              href={buildUrl({})}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
            >
              <Filter size={16} /> Clear Filters
            </Link>
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#A81010] text-white rounded-xl text-sm font-medium hover:bg-[#8a0d0d] shadow-lg shadow-red-900/20 transition-colors duration-200">
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Paid Tickets</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalCount > 0 ? Math.floor(totalCount * 0.85).toLocaleString() : '0'}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Sales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalCount > 0 ? Math.floor(totalCount * 0.1).toLocaleString() : '0'}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg. Ticket Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalCount > 0 ? '25,000' : '0'} TZS
                </p>
              </div>
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Filters (Client Component) */}
          <TicketsFilters 
            sessions={sessions}
            days={days}
            searchQuery={searchQuery}
            sessionFilter={sessionFilter}
            ticketTypeFilter={ticketTypeFilter}
            dayFilter={dayFilter}
            statusFilter={statusFilter}
          />

          {/* Tickets Table (Client Component) */}
          <TicketsTable 
            tickets={tickets}
            sessions={sessions}
            days={days}
            totalCount={totalCount}
            currentPage={currentPage}
            totalPages={totalPages}
            searchQuery={searchQuery}
            sessionFilter={sessionFilter}
            ticketTypeFilter={ticketTypeFilter}
            dayFilter={dayFilter}
            statusFilter={statusFilter}
            sortField={sortField}
            sortOrder={sortOrder}
          />
        </div>
      </div>
    </AdminLayout>
  );
}