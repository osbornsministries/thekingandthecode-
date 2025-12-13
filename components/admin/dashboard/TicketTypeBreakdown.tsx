'use client';

import { Ticket, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/utils';

interface TicketTypeBreakdownProps {
  breakdown: Record<string, number>;
  totalTickets: number;
  topTickets?: Array<{ type: string; count: number; revenue: number }>;
}

export default function TicketTypeBreakdown({ 
  breakdown, 
  totalTickets,
  topTickets = []
}: TicketTypeBreakdownProps) {
  // Define ticket type colors and labels
  const TICKET_TYPES = {
    VVIP: {
      label: 'VVIP',
      color: 'bg-gradient-to-r from-purple-600 to-pink-600',
      textColor: 'text-purple-700',
      bgColor: 'bg-purple-50'
    },
    VIP: {
      label: 'VIP',
      color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50'
    },
    REGULAR: {
      label: 'Regular',
      color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50'
    },
    EARLY_BIRD: {
      label: 'Early Bird',
      color: 'bg-gradient-to-r from-green-500 to-emerald-500',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50'
    },
    STUDENT: {
      label: 'Student',
      color: 'bg-gradient-to-r from-gray-600 to-gray-800',
      textColor: 'text-gray-700',
      bgColor: 'bg-gray-50'
    }
  };

  // Calculate percentages and total revenue from topTickets
  const getRevenueForType = (type: string) => {
    const ticket = topTickets.find(t => t.type === type);
    return ticket?.revenue || 0;
  };

  // Sort ticket types by count (descending)
  const sortedTypes = Object.entries(breakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([type]) => type);

  if (totalTickets === 0) {
    return (
      <div className="text-center py-8">
        <Ticket size={48} className="mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">No ticket sales data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Ticket Types</p>
          <p className="text-2xl font-bold text-gray-900">{Object.keys(breakdown).length}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Best Seller</p>
          <p className="text-2xl font-bold text-gray-900">{sortedTypes[0] || 'None'}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Sales</p>
          <p className="text-2xl font-bold text-gray-900">{totalTickets}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Fill Rate</p>
          <p className="text-2xl font-bold text-gray-900">
            {Object.keys(breakdown).length > 0 ? 'Good' : '--'}
          </p>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4">
        {sortedTypes.map((type) => {
          const count = breakdown[type] || 0;
          const percentage = totalTickets > 0 ? (count / totalTickets) * 100 : 0;
          const typeConfig = TICKET_TYPES[type as keyof typeof TICKET_TYPES] || {
            label: type,
            color: 'bg-gradient-to-r from-gray-500 to-gray-700',
            textColor: 'text-gray-700',
            bgColor: 'bg-gray-50'
          };
          const revenue = getRevenueForType(type);
          const revenuePercentage = revenue > 0 ? ((revenue / topTickets.reduce((sum, t) => sum + t.revenue, 0)) * 100).toFixed(1) : '0';

          return (
            <div key={type} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${typeConfig.color}`}></div>
                  <span className="font-medium text-gray-900">{typeConfig.label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeConfig.bgColor} ${typeConfig.textColor}`}>
                    {count}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{percentage.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">{formatCurrency(revenue)} ({revenuePercentage}% of revenue)</div>
                </div>
              </div>
              
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${typeConfig.color}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insights */}
      {sortedTypes.length > 1 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Performance Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <TrendingUp size={16} className="text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Top Performer</p>
                <p className="text-xs text-gray-600">
                  {sortedTypes[0]} accounts for {((breakdown[sortedTypes[0]] / totalTickets) * 100).toFixed(1)}% of sales
                </p>
              </div>
            </div>
            
            {sortedTypes.length > 2 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <TrendingDown size={16} className="text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Lowest Seller</p>
                  <p className="text-xs text-gray-600">
                    {sortedTypes[sortedTypes.length - 1]} makes up {((breakdown[sortedTypes[sortedTypes.length - 1]] / totalTickets) * 100).toFixed(1)}% of sales
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}