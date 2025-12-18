// components/admin/dashboard/DashboardFilterWrapper.tsx
'use client';

import { useState } from 'react';
import DashboardFilterButton from './DashboardFilterButton';
import DashboardFilterModal from './DashboardFilterModal';

interface DashboardFilterWrapperProps {
  children: React.ReactNode;
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
}

export default function DashboardFilterWrapper({
  children,
  initialFilters,
  sessions,
  eventDays,
  activeFilterCount,
}: DashboardFilterWrapperProps) {
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Function to handle filter changes from modal
  const handleFilterChange = () => {
    // The filter modal will update the URL directly
    // This function can be extended if you need to do anything else
    setShowFilterModal(false);
  };

  // Function to refresh dashboard data
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <>
      {/* Main content */}
      {children}
      
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {/* Mobile filter badge */}
        {activeFilterCount > 0 && (
          <div className="sm:hidden flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-full shadow-lg">
            <span className="text-sm font-medium">{activeFilterCount} active</span>
            <button
              onClick={() => window.location.href = '/admin/dashboard'}
              className="w-5 h-5 rounded-full bg-white text-blue-600 flex items-center justify-center text-xs font-bold hover:bg-blue-50"
            >
              ×
            </button>
          </div>
        )}
        
        {/* Desktop filter info */}
        {activeFilterCount > 0 && (
          <div className="hidden sm:block bg-white border border-gray-200 rounded-xl p-3 shadow-lg max-w-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">{activeFilterCount}</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900">Active Filters</p>
                  <p className="text-xs text-gray-500">Click to modify</p>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/admin/dashboard'}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-gray-100 rounded"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
        
        {/* Action buttons container */}
        <div className="flex flex-col gap-2">
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            className="w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors group"
            title="Refresh dashboard"
          >
            <svg 
              className="w-5 h-5 text-gray-600 group-hover:text-gray-800" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </button>
          
          {/* Main filter button */}
          <DashboardFilterButton
            activeFilterCount={activeFilterCount}
            onClick={() => setShowFilterModal(true)}
          />
        </div>
      </div>
      
      {/* Filter Modal */}
      <DashboardFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onFilterChange={handleFilterChange}
        initialFilters={initialFilters}
        sessions={sessions}
        eventDays={eventDays}
      />
    </>
  );
}