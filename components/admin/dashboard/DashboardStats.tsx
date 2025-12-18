// components/admin/dashboard/DashboardStats.tsx
'use client';

import { Ticket, DollarSign, Users, BarChart3, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
  totalTickets: number;
  totalRevenue: number;
  paidTickets: number;
  avgTicketValue: number;
  ticketChange: number;
  revenueChange: number;
  pendingTickets: number;
  failedTickets: number;
}

export default function DashboardStats({
  totalTickets,
  totalRevenue,
  paidTickets,
  avgTicketValue,
  ticketChange,
  revenueChange,
  pendingTickets,
  failedTickets,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Tickets</p>
            <p className="text-2xl font-bold text-gray-900">{totalTickets}</p>
            <div className={`flex items-center gap-1 text-sm ${ticketChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp size={14} />
              <span>{ticketChange >= 0 ? '+' : ''}{ticketChange.toFixed(1)}%</span>
              <span className="text-gray-400">vs previous</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <Ticket className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              TZS {totalRevenue.toLocaleString()}
            </p>
            <div className={`flex items-center gap-1 text-sm ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp size={14} />
              <span>{revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}%</span>
              <span className="text-gray-400">vs previous</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Paid Tickets</p>
            <p className="text-2xl font-bold text-gray-900">{paidTickets}</p>
            <p className="text-sm text-gray-500">
              {pendingTickets} pending • {failedTickets} failed
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Avg. Ticket Value</p>
            <p className="text-2xl font-bold text-gray-900">
              TZS {avgTicketValue.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Per successful transaction</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-amber-600" />
          </div>
        </div>
      </div>
    </div>
  );
}