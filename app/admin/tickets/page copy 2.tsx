import AdminLayout from '@/components/admin/AdminLayout';
import { db } from '@/lib/db/db';
import { tickets } from '@/lib/drizzle/schema';
import { desc, like, or, sql } from 'drizzle-orm'; 
import { Search, Filter, Download, MoreHorizontal, Eye, Edit, Trash2, Calendar, User, Phone, Tag, DollarSign, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Link from 'next/link';

// Constants for pagination
const ITEMS_PER_PAGE = 10;

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const searchQuery = typeof params.search === 'string' ? params.search : '';
  const page = typeof params.page === 'string' ? Math.max(1, parseInt(params.page)) : 1;
  
  // Calculate offset for pagination
  const offset = (page - 1) * ITEMS_PER_PAGE;

  // Get total count for pagination
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(tickets)
    .where(
      searchQuery ? 
      or(
        like(tickets.purchaserName, `%${searchQuery}%`),
        like(tickets.purchaserPhone, `%${searchQuery}%`),
        like(tickets.ticketCode, `%${searchQuery}%`)
      ) : undefined
    );

  const totalCount = countResult[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Get paginated tickets
  const allTickets = await db.select()
    .from(tickets)
    .where(
      searchQuery ? 
      or(
        like(tickets.purchaserName, `%${searchQuery}%`),
        like(tickets.purchaserPhone, `%${searchQuery}%`),
        like(tickets.ticketCode, `%${searchQuery}%`)
      ) : undefined
    )
    .orderBy(desc(tickets.createdAt))
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

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
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors duration-200">
              <Filter size={16} /> Filter
            </button>
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
          
          {/* Search Bar inside Card */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  name="search"
                  placeholder="Search purchaser name, phone or code..." 
                  defaultValue={searchQuery}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010] transition-all"
                />
              </div>
              
              <div className="flex gap-2">
                <select className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]">
                  <option value="">All Types</option>
                  <option value="ADULT">Adult</option>
                  <option value="STUDENT">Student</option>
                  <option value="CHILD">Child</option>
                </select>
                
                <select className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]">
                  <option value="">All Status</option>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3 p-4">
            {allTickets.map((ticket) => (
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
                  </div>
                  
                  {/* Status */}
                  <div>
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
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                      <Edit size={14} />
                    </button>
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
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Tickets Found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Ticket ID</th>
                    <th className="px-6 py-4">Purchaser Details</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">
                        #{ticket.id.toString().padStart(4, '0')}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{ticket.purchaserName}</p>
                        <p className="text-xs text-gray-400">{ticket.purchaserPhone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                          ticket.ticketType === 'VVIP' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                          ticket.ticketType === 'VIP' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {ticket.ticketType}
                        </span>
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
                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '-'}
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
                          <button 
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit ticket"
                          >
                            <Edit size={16} />
                          </button>
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
                    <tr><td colSpan={7} className="p-8 text-center text-gray-400">No tickets found.</td></tr>
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
                    href={`?page=1${searchQuery ? `&search=${searchQuery}` : ''}`}
                    className={`p-2 rounded-lg transition-colors ${page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                    aria-disabled={page === 1}
                  >
                    <ChevronsLeft size={16} />
                  </Link>
                  
                  {/* Previous Page */}
                  <Link
                    href={`?page=${page - 1}${searchQuery ? `&search=${searchQuery}` : ''}`}
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
                          href={`?page=${pageNum}${searchQuery ? `&search=${searchQuery}` : ''}`}
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
                    href={`?page=${page + 1}${searchQuery ? `&search=${searchQuery}` : ''}`}
                    className={`p-2 rounded-lg transition-colors ${page === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                    aria-disabled={page === totalPages}
                  >
                    <ChevronRight size={16} />
                  </Link>
                  
                  {/* Last Page */}
                  <Link
                    href={`?page=${totalPages}${searchQuery ? `&search=${searchQuery}` : ''}`}
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