// /components/tickets/TicketPagination.tsx
'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TicketType, PaymentStatus, TicketStatus } from '@/lib/types/ticketTypes';
import { useState } from 'react';

interface TicketPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  offset: number;
  limit: number;
  filters: {
    search?: string;
    type?: TicketType;
    status?: TicketStatus;
    paymentStatus?: PaymentStatus;
  };
}

const PAGINATION_OPTIONS = [
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
  { value: '0', label: 'All' }
];

export function TicketPagination({
  currentPage,
  totalPages,
  totalCount,
  offset,
  limit,
  filters
}: TicketPaginationProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [pageSize, setPageSize] = useState(limit.toString());

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    
    setIsLoading(true);
    const params = new URLSearchParams();
    
    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, value);
      }
    });
    
    // Add pagination
    params.set('page', page.toString());
    params.set('limit', pageSize);
    
    router.push(`?${params.toString()}`);
  };

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(newSize);
    setIsLoading(true);
    
    const params = new URLSearchParams();
    
    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, value);
      }
    });
    
    // Reset to page 1 and set new limit
    params.set('page', '1');
    params.set('limit', newSize);
    
    router.push(`?${params.toString()}`);
  };

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="border-t border-gray-100 px-6 py-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">{offset + 1}</span> to{' '}
          <span className="font-medium">{Math.min(offset + limit, totalCount)}</span> of{' '}
          <span className="font-medium">{totalCount}</span> tickets
        </div>
        
        <div className="flex items-center gap-4">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Items per page:</span>
            <select 
              value={pageSize}
              onChange={(e) => handlePageSizeChange(e.target.value)}
              disabled={isLoading}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010] bg-white disabled:opacity-50"
            >
              {PAGINATION_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className={`p-2 rounded-lg border ${
                currentPage <= 1 || isLoading
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            
            <div className="flex items-center gap-1">
              {getPageNumbers().map((pageNum, index) => (
                pageNum === -1 ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-gray-400">...</span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    disabled={isLoading}
                    className={`w-8 h-8 text-sm rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-[#A81010] text-white'
                        : 'text-gray-700 hover:bg-gray-100 disabled:opacity-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              ))}
            </div>
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              className={`p-2 rounded-lg border ${
                currentPage >= totalPages || isLoading
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ChevronRight size={16} />
            </button>
            
            {/* Page Info */}
            <span className="text-sm text-gray-500 ml-2">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}