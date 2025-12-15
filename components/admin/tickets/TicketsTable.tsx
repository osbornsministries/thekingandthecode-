// components/admin/TicketsTable.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Eye, 
  Edit, 
  ArrowUpDown,
  SortAsc,
  SortDesc 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { TicketWithRelations } from '@/lib/actions/tickets';
import DeleteTicketButton from './DeleteTicketButton';

interface TicketsTableProps {
  tickets: TicketWithRelations[];
  sessions: Array<{
    id: number;
    name: string;
    dayName: string;
    dayDate: Date;
  }>;
  days: Array<{
    id: number;
    name: string;
    date: Date;
  }>;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  searchQuery: string;
  sessionFilter: string;
  ticketTypeFilter: string;
  dayFilter: string;
  statusFilter: string;
  sortField?: string;
  sortOrder?: string;
}

export default function TicketsTable({
  tickets,
  sessions,
  days,
  totalCount,
  currentPage,
  totalPages,
  searchQuery,
  sessionFilter,
  ticketTypeFilter,
  dayFilter,
  statusFilter,
  sortField = 'createdAt',
  sortOrder = 'desc'
}: TicketsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const buildUrl = (params: Record<string, string | number>) => {
    if (!isClient) return '#';
    
    const urlParams = new URLSearchParams(searchParams.toString());
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        urlParams.set(key, String(value));
      } else {
        urlParams.delete(key);
      }
    });
    
    return `?${urlParams.toString()}`;
  };

  const handleItemsPerPageChange = (value: string) => {
    if (!isClient) return;
    
    const urlParams = new URLSearchParams(searchParams.toString());
    urlParams.set('limit', value);
    urlParams.set('page', '1'); // Reset to first page
    
    router.push(`?${urlParams.toString()}`);
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
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

  const SortableHeader = ({ 
    field, 
    label, 
    className = '' 
  }: { 
    field: string; 
    label: string; 
    className?: string;
  }) => {
    const isActive = sortField === field;
    const nextOrder = isActive && sortOrder === 'desc' ? 'asc' : 'desc';
    const nextSort = isActive ? `${field}:${nextOrder}` : `${field}:desc`;
    
    return (
      <th className={`px-6 py-4 ${className}`}>
        <Link 
          href={buildUrl({ sort: nextSort, page: 1 })}
          className="flex items-center gap-2 hover:text-[#A81010] transition-colors"
        >
          <span>{label}</span>
          {isActive ? (
            sortOrder === 'asc' ? (
              <SortAsc size={14} className="text-[#A81010]" />
            ) : (
              <SortDesc size={14} className="text-[#A81010]" />
            )
          ) : (
            <ArrowUpDown size={12} className="text-gray-400" />
          )}
        </Link>
      </th>
    );
  };

  // Remove the pagination items per page select from here

  return (
    <>
      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3 p-4">
        {tickets.map((ticket) => (
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
                {ticket.session && ticket.day && (
                  <p className="text-xs text-gray-500 mt-1">
                    {ticket.day.name} • {ticket.session.name}
                  </p>
                )}
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
                  <span>{ticket.purchaserPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <span className="font-medium">TZS {Number(ticket.totalAmount).toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-500">
                  <span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <span className="font-mono text-xs">{ticket.ticketCode.slice(0, 8)}...</span>
                </div>
              </div>
            </div>

            {/* Quantity Info */}
            <div className="flex gap-4 text-xs">
              <span className="text-gray-600">Adults: <strong>{ticket.adultQuantity}</strong></span>
              <span className="text-gray-600">Students: <strong>{ticket.studentQuantity}</strong></span>
              <span className="text-gray-600">Children: <strong>{ticket.childQuantity}</strong></span>
              <span className="text-gray-600 ml-auto">Total: <strong>{ticket.totalQuantity}</strong></span>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-3 border-t border-gray-200">
              <Link 
                href={`/admin/tickets/${ticket.id}`}
                className="flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium"
              >
                <Eye size={14} /> View Details
              </Link>
              <div className="flex gap-2">
                <Link
                  href={`/admin/tickets/${ticket.id}/edit`}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Edit size={14} />
                </Link>
                <DeleteTicketButton ticketId={ticket.id} ticketCode={ticket.ticketCode} />
              </div>
            </div>
          </div>
        ))}
        
        {tickets.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📭</span>
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
                <SortableHeader field="createdAt" label="Ticket ID" />
                <SortableHeader field="purchaserName" label="Purchaser Details" />
                <SortableHeader field="ticketType" label="Type" />
                <SortableHeader field="totalAmount" label="Amount" />
                <th className="px-6 py-4">Day/Session</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs text-gray-400">
                      #{ticket.id.toString().padStart(4, '0')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{ticket.purchaserName}</p>
                    <p className="text-xs text-gray-400">{ticket.purchaserPhone}</p>
                    <p className="text-xs text-gray-500 mt-1">{ticket.ticketCode}</p>
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
                    {ticket.day && ticket.session ? (
                      <div>
                        <div className="font-medium text-gray-900">{ticket.day.name}</div>
                        <div className="text-xs text-gray-500">{ticket.session.name}</div>
                        <div className="text-xs text-gray-400">
                          {ticket.session.startTime} - {ticket.session.endTime}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">No session</span>
                    )}
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
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex gap-2">
                        <span className="text-gray-600">Adult: <strong>{ticket.adultQuantity}</strong></span>
                        <span className="text-gray-600">Student: <strong>{ticket.studentQuantity}</strong></span>
                        <span className="text-gray-600">Child: <strong>{ticket.childQuantity}</strong></span>
                      </div>
                      <div className="text-gray-900 font-medium">
                        Total: {ticket.totalQuantity}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Link 
                        href={`/admin/tickets/${ticket.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View ticket details"
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
                      <DeleteTicketButton ticketId={ticket.id} ticketCode={ticket.ticketCode} />
                    </div>
                  </td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    No tickets found. Try adjusting your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Component - Moved to separate client component */}
      <PaginationControls 
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        buildUrl={buildUrl}
        generatePageNumbers={generatePageNumbers}
        handleItemsPerPageChange={handleItemsPerPageChange}
      />
    </>
  );
}

// Create a separate PaginationControls client component
function PaginationControls({
  totalCount,
  currentPage,
  totalPages,
  buildUrl,
  generatePageNumbers,
  handleItemsPerPageChange
}: {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  buildUrl: (params: Record<string, string | number>) => string;
  generatePageNumbers: () => (number | string)[];
  handleItemsPerPageChange: (value: string) => void;
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (totalPages <= 1) return null;

  const ITEMS_PER_PAGE = 10;
  const startItem = Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalCount);
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

  return (
    <div className="border-t border-gray-100 p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Results Info */}
        <div className="text-sm text-gray-500">
          Showing <span className="font-bold text-gray-900">{startItem}</span> to{' '}
          <span className="font-bold text-gray-900">{endItem}</span> of{' '}
          <span className="font-bold text-gray-900">{totalCount}</span> results
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center gap-1">
          {/* First Page */}
          <Link
            href={buildUrl({ page: 1 })}
            className={`p-2 rounded-lg transition-colors ${
              currentPage === 1 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            aria-disabled={currentPage === 1}
          >
            &laquo;
          </Link>
          
          {/* Previous Page */}
          <Link
            href={buildUrl({ page: currentPage - 1 })}
            className={`p-2 rounded-lg transition-colors ${
              currentPage === 1 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            aria-disabled={currentPage === 1}
          >
            &lsaquo;
          </Link>
          
          {/* Page Numbers */}
          <div className="flex gap-1 mx-2">
            {generatePageNumbers().map((pageNum, index) => (
              pageNum === '...' ? (
                <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">...</span>
              ) : (
                <Link
                  key={pageNum}
                  href={buildUrl({ page: pageNum })}
                  className={`min-w-[40px] h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    currentPage === pageNum
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
            href={buildUrl({ page: currentPage + 1 })}
            className={`p-2 rounded-lg transition-colors ${
              currentPage === totalPages 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            aria-disabled={currentPage === totalPages}
          >
            &rsaquo;
          </Link>
          
          {/* Last Page */}
          <Link
            href={buildUrl({ page: totalPages })}
            className={`p-2 rounded-lg transition-colors ${
              currentPage === totalPages 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            aria-disabled={currentPage === totalPages}
          >
            &raquo;
          </Link>
        </div>
        
        {/* Page Size Selector */}
        {isClient && (
          <div className="text-sm text-gray-500">
            <span>Show </span>
            <select 
              className="bg-transparent border-none focus:outline-none text-gray-900 font-medium"
              defaultValue={ITEMS_PER_PAGE}
              onChange={(e) => handleItemsPerPageChange(e.target.value)}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span> per page</span>
          </div>
        )}
      </div>
    </div>
  );
}