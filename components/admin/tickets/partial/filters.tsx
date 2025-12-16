// app/admin/tickets/components/Filters.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, X } from 'lucide-react';

interface Session {
  id: number;
  name: string;
  dayName: string;
  date: Date;
}

interface Provider {
  provider: string | null;
}

interface FiltersProps {
  searchQuery: string;
  purchaserName: string;
  purchaserPhone: string;
  ticketCode: string;
  externalId: string;
  reference: string;
  ticketType: string;
  paymentStatus: string;
  provider: string;
  sessionId: number | undefined;
  sortBy: string;
  sortOrder: string;
  sessions: Session[];
  providers: Provider[];
  buildQueryString: (updates: Record<string, string | number | undefined>) => string;
  hasIndividualSearch: boolean;
  hasAnySearch: boolean;
  hasAnyFilter: boolean;
}

export default function Filters({
  searchQuery,
  purchaserName,
  purchaserPhone,
  ticketCode,
  externalId,
  reference,
  ticketType,
  paymentStatus,
  provider,
  sessionId,
  sortBy,
  sortOrder,
  sessions,
  providers,
  buildQueryString,
  hasIndividualSearch,
  hasAnySearch,
  hasAnyFilter,
}: FiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValues, setSearchValues] = useState({
    search: '',
    purchaserName: '',
    purchaserPhone: '',
    ticketCode: '',
    externalId: '',
    reference: '',
  });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Initialize form values from URL params
  useEffect(() => {
    const params = {
      search: searchQuery,
      purchaserName,
      purchaserPhone,
      ticketCode,
      externalId,
      reference,
    };
    setSearchValues(params);
  }, [searchQuery, purchaserName, purchaserPhone, ticketCode, externalId, reference]);

  // Function to update URL with debounce
  const updateSearchParams = useCallback((updates: Partial<typeof searchValues>) => {
    const newValues = { ...searchValues, ...updates };
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounce
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      
      // Update or delete params
      Object.entries(newValues).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      // Also clear other search params if main search is being used
      if (updates.search && updates.search.length > 0) {
        ['purchaserName', 'purchaserPhone', 'ticketCode', 'externalId', 'reference'].forEach(param => {
          params.delete(param);
        });
      }

      // Remove page param to go back to page 1
      params.delete('page');

      router.push(`?${params.toString()}`);
    }, 500); // 500ms debounce
  }, [searchValues, searchParams, router]);

  // Handle input change
  const handleChange = (field: keyof typeof searchValues, value: string) => {
    setSearchValues(prev => ({ ...prev, [field]: value }));
    
    // Skip debounce on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    updateSearchParams({ [field]: value });
  };

  // Clear specific search field
  const clearField = (field: keyof typeof searchValues) => {
    handleChange(field, '');
  };

  // Clear all searches
  const clearAllSearches = () => {
    setSearchValues({
      search: '',
      purchaserName: '',
      purchaserPhone: '',
      ticketCode: '',
      externalId: '',
      reference: '',
    });
    
    const params = new URLSearchParams(searchParams.toString());
    ['search', 'purchaserName', 'purchaserPhone', 'ticketCode', 'externalId', 'reference'].forEach(param => {
      params.delete(param);
    });
    params.delete('page');
    
    router.push(`?${params.toString()}`);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Search & Filters Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* AutoSearch Form */}
          <div className="flex-1">
            {/* Main Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  value={searchValues.search}
                  onChange={(e) => handleChange('search', e.target.value)}
                  placeholder="Search across all columns (name, phone, code, ID, reference)..." 
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010] transition-all"
                />
                {searchValues.search && (
                  <button
                    onClick={() => clearField('search')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    type="button"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              {searchValues.search && (
                <p className="mt-1 text-xs text-gray-500">
                  Searching across all columns...
                </p>
              )}
            </div>

            {/* Individual Column Searches */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Search size={16} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Search by specific column:</span>
                </div>
                {(searchValues.purchaserName || searchValues.purchaserPhone || searchValues.ticketCode || searchValues.externalId || searchValues.reference) && (
                  <button
                    onClick={clearAllSearches}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    type="button"
                  >
                    <X size={12} /> Clear all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Purchaser Name
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={searchValues.purchaserName}
                      onChange={(e) => handleChange('purchaserName', e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
                    />
                    {searchValues.purchaserName && (
                      <button
                        onClick={() => clearField('purchaserName')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        type="button"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={searchValues.purchaserPhone}
                      onChange={(e) => handleChange('purchaserPhone', e.target.value)}
                      placeholder="255123456789"
                      className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
                    />
                    {searchValues.purchaserPhone && (
                      <button
                        onClick={() => clearField('purchaserPhone')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        type="button"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Ticket Code
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={searchValues.ticketCode}
                      onChange={(e) => handleChange('ticketCode', e.target.value)}
                      placeholder="TKT-ABCD1234"
                      className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
                    />
                    {searchValues.ticketCode && (
                      <button
                        onClick={() => clearField('ticketCode')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        type="button"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    External ID
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={searchValues.externalId}
                      onChange={(e) => handleChange('externalId', e.target.value)}
                      placeholder="EXT-123456"
                      className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
                    />
                    {searchValues.externalId && (
                      <button
                        onClick={() => clearField('externalId')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        type="button"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Reference
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={searchValues.reference}
                      onChange={(e) => handleChange('reference', e.target.value)}
                      placeholder="REF-789012"
                      className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
                    />
                    {searchValues.reference && (
                      <button
                        onClick={() => clearField('reference')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        type="button"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-2">
            <select 
              name="ticketType"
              defaultValue={ticketType}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010] min-w-[120px]"
            >
              <option value="">All Types</option>
              <option value="VVIP">VVIP</option>
              <option value="VIP">VIP</option>
              <option value="REGULAR">Regular</option>
              <option value="ADULT">Adult</option>
              <option value="STUDENT">Student</option>
              <option value="CHILD">Child</option>
            </select>
            
            <select 
              name="paymentStatus"
              defaultValue={paymentStatus}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010] min-w-[120px]"
            >
              <option value="">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="UNPAID">Unpaid</option>
            </select>

            <select 
              name="provider"
              defaultValue={provider}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010] min-w-[120px]"
            >
              <option value="">All Providers</option>
              {providers.map((p) => (
                <option key={p.provider} value={p.provider || ''}>
                  {p.provider}
                </option>
              ))}
            </select>

            <select 
              name="session"
              defaultValue={sessionId}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010] min-w-[140px]"
            >
              <option value="">All Sessions</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.dayName} - {session.name}
                </option>
              ))}
            </select>

            <select 
              name="sortBy"
              defaultValue={sortBy}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010] min-w-[140px]"
            >
              <option value="createdAt">Sort by Date</option>
              <option value="purchaserName">Sort by Name</option>
              <option value="totalAmount">Sort by Amount</option>
              <option value="day">Sort by Day</option>
            </select>

            <select 
              name="sortOrder"
              defaultValue={sortOrder}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010] min-w-[120px]"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>

            {hasAnySearch && (
              <Link
                href={buildQueryString({})}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center"
              >
                <X size={16} className="mr-2" />
                Clear Search
              </Link>
            )}
          </div>
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
                href={buildQueryString({})}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
              >
                <X size={12} /> Clear all filters
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}