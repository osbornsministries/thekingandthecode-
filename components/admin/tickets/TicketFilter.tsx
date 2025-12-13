// /components/tickets/TicketFilters.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Search, Filter, Download } from 'lucide-react';
import { TicketType, PaymentStatus, TicketStatus } from '@/lib/types/ticketTypes';
import { useState } from 'react';

interface TicketFiltersProps {
  initialFilters: {
    search?: string;
    type?: TicketType;
    status?: TicketStatus;
    paymentStatus?: PaymentStatus;
    limit?: string;
  };
  totalCount: number;
}

const PAGINATION_OPTIONS = [
  { value: '10', label: '10 per page' },
  { value: '25', label: '25 per page' },
  { value: '50', label: '50 per page' },
  { value: '100', label: '100 per page' },
  { value: '0', label: 'Show All' }
];

export function TicketFilters({ initialFilters, totalCount }: TicketFiltersProps) {
  const router = useRouter();
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(false);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, value);
      }
    });
    
    // Reset to page 1 when filters change
    params.set('page', '1');
    
    router.push(`?${params.toString()}`);
    // Loading state will reset on navigation
  };

  const clearFilters = () => {
    setIsLoading(true);
    router.push(window.location.pathname);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Filter size={18} /> Filters
        </h3>
        <div className="flex gap-3">
          <button 
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-[#A81010] text-white rounded-xl text-sm font-medium hover:bg-[#8a0d0d] shadow-lg shadow-red-900/20 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Search Bar */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder="Search purchaser name, phone or code..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
            />
          </div>
        </div>
        
        {/* Ticket Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ticket Type
          </label>
          <select 
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010] bg-white"
          >
            <option value="">All Types</option>
            <option value="ADULT">Adult</option>
            <option value="STUDENT">Student</option>
            <option value="CHILD">Child</option>
            <option value="VIP">VIP</option>
            <option value="VVIP">VVIP</option>
            <option value="GROUP">Group</option>
          </select>
        </div>
        
        {/* Payment Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Status
          </label>
          <select 
            value={filters.paymentStatus || ''}
            onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010] bg-white"
          >
            <option value="">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>

        {/* Ticket Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ticket Status
          </label>
          <select 
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010] bg-white"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
        {/* Pagination Limit Selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 font-medium">Show:</span>
          <select 
            value={filters.limit || '50'}
            onChange={(e) => {
              handleFilterChange('limit', e.target.value);
              applyFilters(); // Auto-apply when limit changes
            }}
            disabled={isLoading}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010] bg-white disabled:opacity-50"
          >
            {PAGINATION_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-500">
            of {totalCount.toLocaleString()} tickets
          </span>
        </div>

        {/* Filter Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={clearFilters}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={applyFilters}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-[#A81010] hover:bg-[#8a0d0d] rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Applying...' : 'Apply Filters'}
          </button>
        </div>
      </div>
    </div>
  );
}