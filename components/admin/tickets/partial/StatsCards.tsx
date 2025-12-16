// app/admin/tickets/components/StatsCards.tsx
import { Ticket, DollarSign, Calendar, User } from 'lucide-react';

interface StatsCardsProps {
  totalCount: number;
  paidCount: number;
  totalAmount: number;
  avgTicketValue: number;
}

export default function StatsCards({ totalCount, paidCount, totalAmount, avgTicketValue }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Tickets</p>
            <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <Ticket className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Paid Tickets</p>
            <p className="text-2xl font-bold text-gray-900">{paidCount}</p>
          </div>
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              TZS {totalAmount.toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Avg. Ticket Value</p>
            <p className="text-2xl font-bold text-gray-900">
              TZS {avgTicketValue.toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-amber-600" />
          </div>
        </div>
      </div>
    </div>
  );
}