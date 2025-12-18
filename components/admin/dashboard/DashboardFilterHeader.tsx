// components/admin/dashboard/DashboardFilterHeader.tsx
'use client';

import { useState } from 'react';
import { Filter, X, RefreshCw } from 'lucide-react';
import DashboardFilterModal from './DashboardFilterModal';

interface DashboardFilterHeaderProps {
  initialFilters: {
    days?: number;
    startDate?: string;
    endDate?: string;
    ticketTypes?: string[];
    paymentStatus?: string[];
    sessionId?: number;
    dayId?: number;
    minAmount?: number;
    maxAmount?: number;
  };
  sessions: Array<{
    id: number;
    name: string;
    dayName: string;
    date: string;
  }>;
  eventDays: Array<{
    id: number;
    name: string;
    date: string;
  }>;
  activeFilterCount: number;
  onRefresh?: () => void;
  onExport?: () => void;
}

export default function DashboardFilterHeader({
  initialFilters,
  sessions,
  eventDays,
  activeFilterCount,
  onRefresh,
  onExport,
}: DashboardFilterHeaderProps) {
  const [showFilterModal, setShowFilterModal] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500">
              Analytics for successful ticket purchases
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={() => setShowFilterModal(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100"
              >
                <Filter size={10} />
                {activeFilterCount} active
              </button>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Active filters chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-1 mr-2">
              <button
                onClick={() => window.location.href = '/admin/dashboard'}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200"
              >
                <X size={12} /> Clear all
              </button>
            </div>
          )}
          
          {/* Action buttons */}
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          
          <button
            onClick={() => setShowFilterModal(true)}
            className="relative flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Filter size={16} /> 
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-blue-600 text-xs rounded-full flex items-center justify-center border border-blue-600">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Filter Modal */}
      <DashboardFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        initialFilters={initialFilters}
        sessions={sessions}
        eventDays={eventDays}
      />
    </>
  );
}