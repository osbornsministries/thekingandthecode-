// components/admin/dashboard/RecentPurchases.tsx
'use client';

import Link from 'next/link';
import { Eye, Calendar, Clock, User, DollarSign, CheckCircle } from 'lucide-react';
import type { InferSelectModel } from 'drizzle-orm';
import { tickets, transactions, eventSessions, eventDays } from '@/lib/drizzle/schema';

type PurchaseWithRelations = {
  ticket: InferSelectModel<typeof tickets>;
  transaction: InferSelectModel<typeof transactions> | null;
  session: InferSelectModel<typeof eventSessions> | null;
  day: InferSelectModel<typeof eventDays> | null;
};

interface RecentPurchasesProps {
  purchases: PurchaseWithRelations[];
}

export default function RecentPurchases({ purchases }: RecentPurchasesProps) {
  if (purchases.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No recent purchases found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {purchases.map(({ ticket, transaction, session, day }) => (
        <div key={ticket.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-900">{ticket.purchaserName}</p>
                <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                  ticket.ticketType === 'VVIP' ? 'bg-purple-50 text-purple-700' :
                  ticket.ticketType === 'VIP' ? 'bg-amber-50 text-amber-700' :
                  ticket.ticketType === 'STUDENT' ? 'bg-blue-50 text-blue-700' :
                  ticket.ticketType === 'KIDS' ? 'bg-pink-50 text-pink-700' :
                  'bg-green-50 text-green-700'
                }`}>
                  {ticket.ticketType}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <div className="flex items-center gap-1">
                  <User size={12} />
                  <span>{ticket.purchaserPhone}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '-'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                </div>
                {session && day && (
                  <div className="text-xs">
                    {day.name} • {session.name}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-1 text-green-600">
                <DollarSign size={14} />
                <span className="font-bold">TZS {Number(ticket.totalAmount).toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500">
                Qty: {ticket.totalQuantity}
              </p>
            </div>
            <Link 
              href={`/admin/tickets/${ticket.id}`}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="View ticket"
            >
              <Eye size={16} />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}