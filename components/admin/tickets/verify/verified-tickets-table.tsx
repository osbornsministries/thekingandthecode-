// components/verified-tickets-table.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { VerifiedTicketDetails, getVerifiedTicketsList, getVerifiedTicketsStats } from '@/lib/actions/ticket/geVerifiedTicket';
import { format } from 'date-fns';
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Users,
  User,
  GraduationCap,
  Baby,
  Calendar,
  Clock,
  Hash,
  Eye
} from 'lucide-react';

// Types for filters
interface Filters {
  search: string;
  date: string;
  sessionId: string;
  ticketType: string;
  startDate?: string;
  endDate?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export function VerifiedTicketsTable() {
  // State
  const [tickets, setTickets] = useState<VerifiedTicketDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    date: '',
    sessionId: '',
    ticketType: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0
  });
  const [sessions, setSessions] = useState<Array<{ id: number; name: string; day: string }>>([]);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Debounced search
  const debouncedSearch = useDebounce(filters.search, 500);

  // Fetch sessions (you'll need to create this function)
  useEffect(() => {
    fetchSessions();
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    loadData();
    loadStats();
  }, [debouncedSearch, filters.date, filters.sessionId, filters.ticketType, filters.startDate, filters.endDate, pagination.page]);

  const fetchSessions = async () => {
    try {
      // You'll need to implement this based on your database schema
      // Example:
      // const response = await fetch('/api/sessions');
      // const data = await response.json();
      // setSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getVerifiedTicketsList({
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        ticketType: filters.ticketType || undefined,
        sessionId: filters.sessionId ? parseInt(filters.sessionId) : undefined,
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
        includeAttendeeInfo: true
      });

      if (result.success && result.data) {
        setTickets(result.data);
        setPagination(prev => ({ ...prev, total: result.total || 0 }));
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await getVerifiedTicketsStats({
        byDay: true,
        bySession: true,
        byTicketType: true
      });

      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const exportData = async (format: 'csv' | 'json') => {
    try {
      // You'll need to implement an export API endpoint
      // or use the exportVerifiedTickets function directly
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getTicketTypeIcon = (type: string) => {
    switch (type) {
      case 'ADULT': return <User className="w-4 h-4" />;
      case 'STUDENT': return <GraduationCap className="w-4 h-4" />;
      case 'CHILD': return <Baby className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getTicketTypeColor = (type: string) => {
    switch (type) {
      case 'ADULT': return 'bg-blue-100 text-blue-800';
      case 'STUDENT': return 'bg-green-100 text-green-800';
      case 'CHILD': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter tickets based on search
  const filteredTickets = tickets.filter(ticket => {
    if (!debouncedSearch) return true;
    
    const searchLower = debouncedSearch.toLowerCase();
    return (
      ticket.ticketCode.toLowerCase().includes(searchLower) ||
      ticket.purchaserName.toLowerCase().includes(searchLower) ||
      ticket.purchaserPhone?.toLowerCase().includes(searchLower) ||
      ticket.attendeeInfo?.name.toLowerCase().includes(searchLower) ||
      (ticket.attendeeInfo?.studentId && ticket.attendeeInfo.studentId.toLowerCase().includes(searchLower)) ||
      (ticket.attendeeInfo?.institution && ticket.attendeeInfo.institution.toLowerCase().includes(searchLower))
    );
  });

  // Calculate totals for display
  const totals = {
    adult: tickets.filter(t => t.ticketType === 'ADULT').length,
    student: tickets.filter(t => t.ticketType === 'STUDENT').length,
    child: tickets.filter(t => t.ticketType === 'CHILD').length,
    total: tickets.length
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header with stats */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Verified Tickets</h2>
            <p className="text-gray-600">Track all verified entries</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportData('csv')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-semibold text-blue-700">Total</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{totals.total}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-semibold text-blue-700">Adults</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{totals.adult}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-green-600" />
              <span className="text-lg font-semibold text-green-700">Students</span>
            </div>
            <div className="text-2xl font-bold text-green-900">{totals.student}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Baby className="w-5 h-5 text-purple-600" />
              <span className="text-lg font-semibold text-purple-700">Children</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">{totals.child}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-700">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search by name, phone, ticket code..."
                className="pl-10 w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* Ticket Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ticket Type
            </label>
            <select
              value={filters.ticketType}
              onChange={(e) => handleFilterChange('ticketType', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Types</option>
              <option value="ADULT">Adult</option>
              <option value="STUDENT">Student</option>
              <option value="CHILD">Child</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Session Filter (if sessions are loaded) */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session
              </label>
              <select
                value={filters.sessionId}
                onChange={(e) => handleFilterChange('sessionId', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Sessions</option>
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {session.name} ({session.day})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading verified tickets...</p>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <React.Fragment key={ticket.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getTicketTypeColor(ticket.ticketType)}`}>
                              <div className="flex items-center gap-1">
                                {getTicketTypeIcon(ticket.ticketType)}
                                <span>{ticket.ticketType}</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-1">
                            <span className="text-sm font-mono text-gray-600">{ticket.ticketCode}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Purchaser: {ticket.purchaserName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {ticket.attendeeInfo?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ticket.attendeeInfo?.type}
                            {ticket.attendeeInfo?.studentId && (
                              <div className="mt-1">
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  ID: {ticket.attendeeInfo.studentId}
                                </span>
                              </div>
                            )}
                            {ticket.attendeeInfo?.institution && (
                              <div className="text-xs text-gray-600 mt-1">
                                {ticket.attendeeInfo.institution}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-1 text-sm text-gray-900">
                            <Calendar className="w-4 h-4" />
                            {format(ticket.eventDate, 'MMM dd, yyyy')}
                          </div>
                          <div className="text-sm text-gray-600">
                            {ticket.dayName} - {ticket.sessionName}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Session ID: {ticket.sessionId}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-1 text-sm text-gray-900">
                            <Clock className="w-4 h-4" />
                            {format(ticket.verificationTime, 'hh:mm a')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(ticket.verificationTime, 'MMM dd, yyyy')}
                          </div>
                          <div className={`text-xs mt-1 px-2 py-1 rounded-full inline-block ${
                            ticket.paymentStatus === 'PAID' 
                              ? 'bg-green-100 text-green-800'
                              : ticket.paymentStatus === 'COMPLIMENTARY'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {ticket.paymentStatus}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleRowExpansion(ticket.id)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4" />
                          {expandedRows.has(ticket.id) ? 'Less' : 'More'}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded row with additional details */}
                    {expandedRows.has(ticket.id) && (
                      <tr className="bg-blue-50">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-2">Contact Info</h4>
                              <div className="space-y-1 text-sm">
                                <div>
                                  <span className="text-gray-600">Phone: </span>
                                  <span className="text-gray-900">{ticket.purchaserPhone || 'N/A'}</span>
                                </div>
                                {ticket.attendeeInfo?.phone && ticket.attendeeInfo.phone !== ticket.purchaserPhone && (
                                  <div>
                                    <span className="text-gray-600">Attendee Phone: </span>
                                    <span className="text-gray-900">{ticket.attendeeInfo.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-2">Payment Details</h4>
                              <div className="space-y-1 text-sm">
                                <div>
                                  <span className="text-gray-600">Method: </span>
                                  <span className="text-gray-900">{ticket.paymentMethod || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Status: </span>
                                  <span className="text-gray-900">{ticket.paymentStatus}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-2">Additional Info</h4>
                              <div className="space-y-1 text-sm">
                                <div>
                                  <span className="text-gray-600">Ticket ID: </span>
                                  <span className="font-mono text-gray-900">{ticket.id}</span>
                                </div>
                                {ticket.attendeeInfo?.parentName && (
                                  <div>
                                    <span className="text-gray-600">Parent: </span>
                                    <span className="text-gray-900">{ticket.attendeeInfo.parentName}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/* Empty state */}
            {filteredTickets.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <Users className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-600">No verified tickets found</p>
                {filters.search && (
                  <p className="text-sm text-gray-500 mt-1">
                    Try adjusting your search or filters
                  </p>
                )}
              </div>
            )}

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`px-3 py-1 rounded-lg flex items-center gap-1 ${
                      pagination.page === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.ceil(pagination.total / pagination.limit) }, (_, i) => i + 1)
                      .slice(
                        Math.max(0, pagination.page - 3),
                        Math.min(Math.ceil(pagination.total / pagination.limit), pagination.page + 2)
                      )
                      .map(pageNum => (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 rounded-lg ${
                            pageNum === pagination.page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page * pagination.limit >= pagination.total}
                    className={`px-3 py-1 rounded-lg flex items-center gap-1 ${
                      pagination.page * pagination.limit >= pagination.total
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Verification Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.breakdowns?.byDay && Object.entries(stats.breakdowns.byDay).map(([date, data]: [string, any]) => (
              <div key={date} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">{data.dayName}</span>
                  <span className="text-sm text-gray-500">{date}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{data.count} verified</div>
                {data.byType && (
                  <div className="mt-2 space-y-1">
                    {Object.entries(data.byType).map(([type, count]: [string, any]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span className="text-gray-600">{type}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}