// components/admin/dashboard/DashboardClientWrapper.tsx
'use client';

import { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import DashboardStats from './DashboardStats';
import TicketTrendsChart from './TicketTrendsChart';
import TicketCategoryChart from './TicketCategoryChart';
import SessionAnalytics from './SessionAnalytics';
import RecentPurchases from './RecentPurchases';
import DashboardFilterModal from './DashboardFilterModal';
import DashboardFilterButton from './DashboardFilterButton';

interface DashboardClientWrapperProps {
  dashboardData: {
    stats: {
      totalTickets: number;
      totalRevenue: number;
      paidTickets: number;
      avgTicketValue: number;
      pendingTickets: number;
      failedTickets: number;
    };
    categories: Array<{
      name: string;
      count: number;
      amount: number;
    }>;
    dailyData: Array<{
      date: string;
      tickets: number;
      revenue: number;
    }>;
    sessionData: Array<{
      sessionName: string;
      dayName: string;
      dayDate: string;
      sessionTime: string;
      ticketCount: number;
      totalRevenue: number;
      categories: {
        adult: number;
        student: number;
        child: number;
      };
    }>;
    recentPurchases: any[];
    totalQuantities: {
      adult: number;
      student: number;
      child: number;
      total: number;
    };
    dateRangeText: string;
  };
  filterParams: {
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

export default function DashboardClientWrapper({
  dashboardData,
  filterParams,
  sessions,
  eventDays,
  activeFilterCount,
}: DashboardClientWrapperProps) {
  const [showFilterModal, setShowFilterModal] = useState(false);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (filterParams.days !== undefined && filterParams.days !== 30) {
      params.set('days', filterParams.days.toString());
    }
    if (filterParams.startDate) params.set('startDate', filterParams.startDate);
    if (filterParams.endDate) params.set('endDate', filterParams.endDate);
    if (filterParams.ticketTypes && filterParams.ticketTypes.length > 0) {
      params.set('ticketTypes', filterParams.ticketTypes.join(','));
    }
    if (filterParams.paymentStatus && filterParams.paymentStatus.length > 0) {
      params.set('paymentStatus', filterParams.paymentStatus.join(','));
    }
    if (filterParams.sessionId) params.set('sessionId', filterParams.sessionId.toString());
    if (filterParams.dayId) params.set('dayId', filterParams.dayId.toString());
    if (filterParams.minAmount !== undefined) params.set('minAmount', filterParams.minAmount.toString());
    if (filterParams.maxAmount !== undefined) params.set('maxAmount', filterParams.maxAmount.toString());
    
    window.open(`/api/dashboard/export?${params.toString()}`, '_blank');
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">
              Analytics for successful ticket purchases
              {activeFilterCount > 0 && ` (${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active)`}
              <span className="ml-2 text-blue-600">• {dashboardData.dateRangeText}</span>
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Adult: {dashboardData.totalQuantities.adult}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Student: {dashboardData.totalQuantities.student}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Child: {dashboardData.totalQuantities.child}
              </span>
              <span className="text-gray-400">•</span>
              <span className="font-medium">Total: {dashboardData.totalQuantities.total} tickets</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={16} /> Refresh
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <DashboardStats 
          totalTickets={dashboardData.stats.totalTickets}
          totalRevenue={dashboardData.stats.totalRevenue}
          paidTickets={dashboardData.stats.paidTickets}
          avgTicketValue={dashboardData.stats.avgTicketValue}
          ticketChange={0} // You can calculate this if needed
          revenueChange={0} // You can calculate this if needed
          pendingTickets={dashboardData.stats.pendingTickets}
          failedTickets={dashboardData.stats.failedTickets}
        />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ticket Trends Chart */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Ticket Purchases Trend</h3>
                <p className="text-sm text-gray-500">Daily successful ticket purchases</p>
              </div>
              <div className="text-sm text-gray-500">
                {dashboardData.dailyData.length} {dashboardData.dailyData.length === 1 ? 'day' : 'days'}
              </div>
            </div>
            <div className="h-80">
              <TicketTrendsChart data={dashboardData.dailyData} />
            </div>
          </div>

          {/* Ticket Categories Chart */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Ticket Categories</h3>
                <p className="text-sm text-gray-500">Breakdown by ticket type</p>
              </div>
              <div className="text-sm text-gray-500">
                {dashboardData.categories.filter(c => c.count > 0).length} categories
              </div>
            </div>
            <div className="h-80">
              <TicketCategoryChart data={dashboardData.categories.filter(c => c.count > 0)} />
            </div>
          </div>
        </div>

        {/* Session Analytics */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Session Analytics</h3>
              <p className="text-sm text-gray-500">Ticket purchases by event day and session</p>
            </div>
            <div className="text-sm text-gray-500">
              {dashboardData.sessionData.length} {dashboardData.sessionData.length === 1 ? 'session' : 'sessions'}
            </div>
          </div>
          <div className="overflow-x-auto">
            <SessionAnalytics data={dashboardData.sessionData} />
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Recent Purchases</h3>
              <p className="text-sm text-gray-500">Latest successful ticket purchases</p>
            </div>
            <div className="text-sm text-gray-500">
              Last {dashboardData.recentPurchases.length} transactions
            </div>
          </div>
          <div>
            <RecentPurchases purchases={dashboardData.recentPurchases} />
          </div>
        </div>

        {/* Filter Info Footer */}
        {activeFilterCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold">{activeFilterCount}</span>
                </div>
                <div>
                  <p className="font-medium text-blue-700">Active Filters Applied</p>
                  <p className="text-sm text-blue-600">
                    Data is filtered based on your selection. Click the filter button to modify.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => window.location.href = '/admin/dashboard'}
                className="px-4 py-2 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors text-sm"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Floating Filter Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <DashboardFilterButton
          activeFilterCount={activeFilterCount}
          onClick={() => setShowFilterModal(true)}
        />
      </div>
      
      {/* Filter Modal */}
      <DashboardFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        initialFilters={filterParams}
        sessions={sessions}
        eventDays={eventDays}
      />
    </>
  );
}