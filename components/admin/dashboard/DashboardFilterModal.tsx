// components/admin/dashboard/DashboardFilterModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  X, 
  Calendar, 
  Filter as FilterIcon, 
  Users, 
  Ticket, 
  CalendarDays,
  Clock,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface DashboardFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
    onFilterChange?: () => void; 
  initialFilters?: {
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
  sessions?: Array<{
    id: number;
    name: string;
    dayName: string;
    date: string;
  }>;
  eventDays?: Array<{
    id: number;
    name: string;
    date: string;
  }>;
}

const DEFAULT_DAYS_OPTIONS = [7, 14, 30, 60, 90, 180, 365];
const TICKET_TYPES = ['ADULT', 'STUDENT', 'CHILD', 'VIP', 'VVIP', 'REGULAR'];
const PAYMENT_STATUSES = ['PAID', 'PENDING', 'FAILED'];

export default function DashboardFilterModal({ 
  isOpen, 
  onClose, 
  initialFilters = {},
  sessions = [],
  eventDays = []
}: DashboardFilterModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState({
    days: initialFilters.days || 30,
    startDate: initialFilters.startDate || '',
    endDate: initialFilters.endDate || '',
    ticketTypes: initialFilters.ticketTypes || [],
    paymentStatus: initialFilters.paymentStatus || [],
    sessionId: initialFilters.sessionId || undefined,
    dayId: initialFilters.dayId || undefined,
    minAmount: initialFilters.minAmount || undefined,
    maxAmount: initialFilters.maxAmount || undefined,
  });

  const [dateRangeType, setDateRangeType] = useState<'days' | 'custom'>('days');
  const [expandedSections, setExpandedSections] = useState({
    date: true,
    categories: true,
    sessions: true,
    amount: false,
  });

  // Initialize from URL params on mount
  useEffect(() => {
    if (isOpen) {
      const params = Object.fromEntries(searchParams.entries());
      const newFilters = { ...filters };
      
      if (params.days) newFilters.days = parseInt(params.days);
      if (params.startDate) {
        newFilters.startDate = params.startDate;
        setDateRangeType('custom');
      }
      if (params.endDate) newFilters.endDate = params.endDate;
      if (params.ticketTypes) newFilters.ticketTypes = params.ticketTypes.split(',');
      if (params.paymentStatus) newFilters.paymentStatus = params.paymentStatus.split(',');
      if (params.sessionId) newFilters.sessionId = parseInt(params.sessionId);
      if (params.dayId) newFilters.dayId = parseInt(params.dayId);
      if (params.minAmount) newFilters.minAmount = parseFloat(params.minAmount);
      if (params.maxAmount) newFilters.maxAmount = parseFloat(params.maxAmount);
      
      setFilters(newFilters);
    }
  }, [isOpen, searchParams]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleTicketTypeToggle = (type: string) => {
    setFilters(prev => ({
      ...prev,
      ticketTypes: prev.ticketTypes.includes(type)
        ? prev.ticketTypes.filter(t => t !== type)
        : [...prev.ticketTypes, type]
    }));
  };

  const handlePaymentStatusToggle = (status: string) => {
    setFilters(prev => ({
      ...prev,
      paymentStatus: prev.paymentStatus.includes(status)
        ? prev.paymentStatus.filter(s => s !== status)
        : [...prev.paymentStatus, status]
    }));
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    
    if (dateRangeType === 'days' && filters.days !== 30) {
      params.set('days', filters.days.toString());
    } else if (dateRangeType === 'custom') {
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
    }
    
    if (filters.ticketTypes.length > 0) {
      params.set('ticketTypes', filters.ticketTypes.join(','));
    }
    
    if (filters.paymentStatus.length > 0) {
      params.set('paymentStatus', filters.paymentStatus.join(','));
    }
    
    if (filters.sessionId) {
      params.set('sessionId', filters.sessionId.toString());
    }
    
    if (filters.dayId) {
      params.set('dayId', filters.dayId.toString());
    }
    
    if (filters.minAmount !== undefined) {
      params.set('minAmount', filters.minAmount.toString());
    }
    
    if (filters.maxAmount !== undefined) {
      params.set('maxAmount', filters.maxAmount.toString());
    }
    
    const queryString = params.toString();
    router.push(`/admin/dashboard${queryString ? `?${queryString}` : ''}`);
    onClose();
  };

  const handleResetFilters = () => {
    setFilters({
      days: 30,
      startDate: '',
      endDate: '',
      ticketTypes: [],
      paymentStatus: [],
      sessionId: undefined,
      dayId: undefined,
      minAmount: undefined,
      maxAmount: undefined,
    });
    setDateRangeType('days');
  };

  const handleClearFilters = () => {
    router.push('/admin/dashboard');
    onClose();
  };

  // Count active filters
  const activeFilterCount = 
    (dateRangeType === 'days' && filters.days !== 30 ? 1 : 0) +
    (dateRangeType === 'custom' && (filters.startDate || filters.endDate) ? 1 : 0) +
    filters.ticketTypes.length +
    filters.paymentStatus.length +
    (filters.sessionId ? 1 : 0) +
    (filters.dayId ? 1 : 0) +
    (filters.minAmount !== undefined ? 1 : 0) +
    (filters.maxAmount !== undefined ? 1 : 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <FilterIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Dashboard Filters</h3>
              <p className="text-sm text-gray-500">
                {activeFilterCount > 0 ? `${activeFilterCount} active filter(s)` : 'No filters applied'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Date Range Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('date')}
              className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-900">Date Range</span>
              </div>
              {expandedSections.date ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {expandedSections.date && (
              <div className="mt-3 p-4 border border-gray-200 rounded-lg">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <button
                    onClick={() => setDateRangeType('days')}
                    className={`flex-1 py-3 px-4 rounded-lg text-center transition-colors ${
                      dateRangeType === 'days'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Last X Days
                  </button>
                  <button
                    onClick={() => setDateRangeType('custom')}
                    className={`flex-1 py-3 px-4 rounded-lg text-center transition-colors ${
                      dateRangeType === 'custom'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Custom Range
                  </button>
                </div>
                
                {dateRangeType === 'days' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Show data from last
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                      {DEFAULT_DAYS_OPTIONS.map(days => (
                        <button
                          key={days}
                          onClick={() => setFilters(prev => ({ ...prev, days }))}
                          className={`py-2 px-3 rounded-lg text-sm transition-colors ${
                            filters.days === days
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {days} days
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ticket Categories Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('categories')}
              className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-900">Ticket Categories</span>
              </div>
              {expandedSections.categories ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {expandedSections.categories && (
              <div className="mt-3 p-4 border border-gray-200 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Ticket Types</h4>
                    <div className="flex flex-wrap gap-2">
                      {TICKET_TYPES.map(type => (
                        <button
                          key={type}
                          onClick={() => handleTicketTypeToggle(type)}
                          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                            filters.ticketTypes.includes(type)
                              ? 'bg-blue-100 text-blue-700 border border-blue-300'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                          }`}
                        >
                          {type}
                          {filters.ticketTypes.includes(type) && (
                            <span className="ml-1">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Status</h4>
                    <div className="flex flex-wrap gap-2">
                      {PAYMENT_STATUSES.map(status => (
                        <button
                          key={status}
                          onClick={() => handlePaymentStatusToggle(status)}
                          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                            filters.paymentStatus.includes(status)
                              ? status === 'PAID'
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                : 'bg-red-100 text-red-700 border border-red-300'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                          }`}
                        >
                          {status}
                          {filters.paymentStatus.includes(status) && (
                            <span className="ml-1">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sessions & Days Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('sessions')}
              className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-900">Sessions & Days</span>
              </div>
              {expandedSections.sessions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {expandedSections.sessions && (
              <div className="mt-3 p-4 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Day
                    </label>
                    <select
                      value={filters.dayId || ''}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        dayId: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Days</option>
                      {eventDays.map(day => (
                        <option key={day.id} value={day.id}>
                          {day.name} ({new Date(day.date).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session
                    </label>
                    <select
                      value={filters.sessionId || ''}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        sessionId: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Sessions</option>
                      {sessions.map(session => (
                        <option key={session.id} value={session.id}>
                          {session.name} ({session.dayName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Amount Range Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('amount')}
              className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Ticket className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-900">Amount Range</span>
              </div>
              {expandedSections.amount ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {expandedSections.amount && (
              <div className="mt-3 p-4 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Amount (TZS)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={filters.minAmount || ''}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        minAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                      }))}
                      placeholder="0"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Amount (TZS)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={filters.maxAmount || ''}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        maxAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                      }))}
                      placeholder="1000000"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-700 mb-2">Active Filters</h4>
              <div className="flex flex-wrap gap-2">
                {dateRangeType === 'days' && filters.days !== 30 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    Last {filters.days} days
                    <button 
                      onClick={() => setFilters(prev => ({ ...prev, days: 30 }))}
                      className="hover:text-blue-900"
                    >
                      <X size={10} />
                    </button>
                  </span>
                )}
                
                {dateRangeType === 'custom' && filters.startDate && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    From: {filters.startDate}
                    <button 
                      onClick={() => setFilters(prev => ({ ...prev, startDate: '' }))}
                      className="hover:text-blue-900"
                    >
                      <X size={10} />
                    </button>
                  </span>
                )}
                
                {dateRangeType === 'custom' && filters.endDate && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    To: {filters.endDate}
                    <button 
                      onClick={() => setFilters(prev => ({ ...prev, endDate: '' }))}
                      className="hover:text-blue-900"
                    >
                      <X size={10} />
                    </button>
                  </span>
                )}
                
                {filters.ticketTypes.map(type => (
                  <span key={type} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                    Type: {type}
                    <button 
                      onClick={() => handleTicketTypeToggle(type)}
                      className="hover:text-purple-900"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                
                {filters.paymentStatus.map(status => (
                  <span key={status} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                    Status: {status}
                    <button 
                      onClick={() => handlePaymentStatusToggle(status)}
                      className="hover:text-green-900"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                
                {filters.sessionId && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">
                    Session: {sessions.find(s => s.id === filters.sessionId)?.name}
                    <button 
                      onClick={() => setFilters(prev => ({ ...prev, sessionId: undefined }))}
                      className="hover:text-amber-900"
                    >
                      <X size={10} />
                    </button>
                  </span>
                )}
                
                {filters.dayId && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">
                    Day: {eventDays.find(d => d.id === filters.dayId)?.name}
                    <button 
                      onClick={() => setFilters(prev => ({ ...prev, dayId: undefined }))}
                      className="hover:text-amber-900"
                    >
                      <X size={10} />
                    </button>
                  </span>
                )}
                
                {filters.minAmount !== undefined && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    Min: TZS {filters.minAmount.toLocaleString()}
                    <button 
                      onClick={() => setFilters(prev => ({ ...prev, minAmount: undefined }))}
                      className="hover:text-gray-900"
                    >
                      <X size={10} />
                    </button>
                  </span>
                )}
                
                {filters.maxAmount !== undefined && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    Max: TZS {filters.maxAmount.toLocaleString()}
                    <button 
                      onClick={() => setFilters(prev => ({ ...prev, maxAmount: undefined }))}
                      className="hover:text-gray-900"
                    >
                      <X size={10} />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw size={16} /> Reset
            </button>
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={16} /> Clear All
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyFilters}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FilterIcon size={16} /> Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}