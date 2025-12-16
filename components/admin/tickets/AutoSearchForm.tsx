// app/admin/tickets/AutoSearchForm.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

export default function AutoSearchForm() {
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
      search: searchParams.get('search') || '',
      purchaserName: searchParams.get('purchaserName') || '',
      purchaserPhone: searchParams.get('purchaserPhone') || '',
      ticketCode: searchParams.get('ticketCode') || '',
      externalId: searchParams.get('externalId') || '',
      reference: searchParams.get('reference') || '',
    };
    setSearchValues(params);
  }, [searchParams]);

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
      {/* <div className="border-t border-gray-200 pt-4">
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
      </div> */}
    </div>
  );
}