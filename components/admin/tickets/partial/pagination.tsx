// app/admin/tickets/components/Pagination.tsx
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  ITEMS_PER_PAGE: number;
  buildQueryString: (updates: Record<string, string | number | undefined>) => string;
}

export default function Pagination({
  page,
  totalPages,
  totalCount,
  ITEMS_PER_PAGE,
  buildQueryString,
}: PaginationProps) {
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

  const pageNumbers = generatePageNumbers();

  return (
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
            {pageNumbers.map((pageNum, index) => (
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
  );
}