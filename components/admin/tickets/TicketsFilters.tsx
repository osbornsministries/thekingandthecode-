// components/admin/TicketsFilters.tsx
'use client';

import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

interface TicketsFiltersProps {
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
  searchQuery: string;
  sessionFilter: string;
  ticketTypeFilter: string;
  dayFilter: string;
  statusFilter: string;
}

export default function TicketsFilters({
  sessions,
  days,
  searchQuery,
  sessionFilter,
  ticketTypeFilter,
  dayFilter,
  statusFilter
}: TicketsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    if (!isClient) return;
    
    const urlParams = new URLSearchParams(searchParams.toString());
    
    if (value) {
      urlParams.set(key, value);
    } else {
      urlParams.delete(key);
    }
    
    // Reset to page 1 when filters change
    urlParams.set('page', '1');
    
    router.push(`?${urlParams.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isClient) return;
    handleFilterChange('search', localSearch);
  };

  if (!isClient) {
    return (
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              value={localSearch}
              readOnly
              placeholder="Search purchaser name, phone or code..." 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Placeholder select elements */}
            <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm w-32"></div>
            <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm w-32"></div>
            <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm w-32"></div>
            <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm w-32"></div>
            <div className="px-4 py-2.5 bg-gray-200 rounded-lg text-sm w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-b border-gray-100">
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search purchaser name, phone or code..." 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010] transition-all"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select 
            value={dayFilter}
            onChange={(e) => handleFilterChange('day', e.target.value)}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
          >
            <option value="">All Days</option>
            {days.map((day) => (
              <option key={day.id} value={day.id}>
                {day.name} ({new Date(day.date).toLocaleDateString()})
              </option>
            ))}
          </select>
          
          <select 
            value={sessionFilter}
            onChange={(e) => handleFilterChange('session', e.target.value)}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
          >
            <option value="">All Sessions</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.dayName} - {session.name}
              </option>
            ))}
          </select>
          
          <select 
            value={ticketTypeFilter}
            onChange={(e) => handleFilterChange('ticketType', e.target.value)}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
          >
            <option value="">All Types</option>
            <option value="VVIP">VVIP</option>
            <option value="VIP">VIP</option>
            <option value="REGULAR">Regular</option>
            <option value="STUDENT">Student</option>
            <option value="CHILD">Child</option>
          </select>
          
          <select 
            value={statusFilter}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
          >
            <option value="">All Status</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
          
          <button 
            type="submit"
            className="px-4 py-2.5 bg-[#A81010] text-white rounded-lg text-sm font-medium hover:bg-[#8a0d0d] transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </form>
    </div>
  );
}