// components/admin/tickets/TicketsTableComplete.tsx
'use client';

import { useState,useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, Edit, Trash2, Calendar, Clock, CreditCard, X } from 'lucide-react';
import type { InferSelectModel } from 'drizzle-orm';
import { tickets, transactions, eventSessions, eventDays } from '@/lib/drizzle/schema';

type TicketWithRelations = {
  ticket: InferSelectModel<typeof tickets>;
  transaction: InferSelectModel<typeof transactions> | null;
  session: InferSelectModel<typeof eventSessions> | null;
  day: InferSelectModel<typeof eventDays> | null;
};

type Session = {
  id: number;
  name: string;
  dayName: string | null;
  date: Date | null;
};

interface TicketsTableCompleteProps {
  tickets: TicketWithRelations[];
  sessions: Session[];
  hasAnySearch: boolean;
  hasAnyFilter: boolean;
  onSelectionChange?: (selectedIds: number[]) => void;
  onTicketsDataChange?: (ticketsData: Array<{
    id: number;
    purchaserName: string;
    purchaserPhone: string;
    ticketCode: string;
    ticketType: string;
  }>) => void;
}



export default function TicketsTableComplete({ 
  tickets, 
  sessions, 
  hasAnySearch, 
  hasAnyFilter,
  onSelectionChange
}: TicketsTableCompleteProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Client-side version of buildQueryString
  const buildQueryString = (updates: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    const extractTicketsData = () => {
  return tickets.map(t => ({
    id: t.ticket.id,
    purchaserName: t.ticket.purchaserName,
    purchaserPhone: t.ticket.purchaserPhone,
    ticketCode: t.ticket.ticketCode,
    ticketType: t.ticket.ticketType
  }));
};

useEffect(() => {
  onTicketsDataChange?.(extractTicketsData());
}, [tickets]);

    
    // Apply updates
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, value.toString());
      }
    });
    
    return params.toString() ? `?${params.toString()}` : '';
  };

  const handleSelectAll = () => {
    const newSelected = selectAll ? [] : tickets.map(t => t.ticket.id);
    setSelectedTickets(newSelected);
    setSelectAll(!selectAll);
    onSelectionChange?.(newSelected);
  };

  const handleToggleTicket = (id: number) => {
    let newSelected;
    if (selectedTickets.includes(id)) {
      newSelected = selectedTickets.filter(ticketId => ticketId !== id);
    } else {
      newSelected = [...selectedTickets, id];
    }
    setSelectedTickets(newSelected);
    setSelectAll(newSelected.length === tickets.length && tickets.length > 0);
    onSelectionChange?.(newSelected);
  };

  const isSelected = (id: number) => selectedTickets.includes(id);

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this ticket?')) {
      try {
        // Server action for deletion
        const response = await fetch(`/api/tickets/${id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          router.refresh(); // Refresh the page to show updated data
        } else {
          alert('Failed to delete ticket');
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert('Error deleting ticket');
      }
    }
  };

  if (tickets.length === 0) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
            <tr>
              <th className="px-4 py-4 w-10 text-center">
                <input
                  type="checkbox"
                  disabled
                  className="w-4 h-4 rounded border-gray-300 text-[#A81010] focus:ring-[#A81010] focus:ring-offset-0"
                />
              </th>
              <th className="px-6 py-4">Ticket ID</th>
              <th className="px-6 py-4">Purchaser Details</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Session & Day</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Payment Status</th>
              <th className="px-6 py-4">External ID</th>
              <th className="px-6 py-4">Provider</th>
              <th className="px-6 py-4">Tx Status</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={12} className="p-8 text-center text-gray-400">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No Tickets Found</h3>
                  <p className="text-gray-500 mb-4">
                    {hasAnySearch || hasAnyFilter 
                      ? "Try adjusting your search or filters" 
                      : "No tickets have been created yet"}
                  </p>
                  {!(hasAnySearch || hasAnyFilter) && (
                    <Link
                      href="/admin/tickets/create"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#A81010] text-white rounded-lg text-sm font-medium hover:bg-[#8a0d0d]"
                    >
                      <Edit size={16} /> Create Your First Ticket
                    </Link>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
          <tr>
            <th className="px-4 py-4 w-10 text-center">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-[#A81010] focus:ring-[#A81010] focus:ring-offset-0 cursor-pointer"
              />
            </th>
            <th className="px-6 py-4">Ticket ID</th>
            <th className="px-6 py-4">Purchaser Details</th>
            <th className="px-6 py-4">Type</th>
            <th className="px-6 py-4">Session & Day</th>
            <th className="px-6 py-4">Amount</th>
            <th className="px-6 py-4">Payment Status</th>
            <th className="px-6 py-4">External ID</th>
            <th className="px-6 py-4">Provider</th>
            <th className="px-6 py-4">Tx Status</th>
            <th className="px-6 py-4">Date</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {tickets.map(({ ticket, transaction, session, day }) => (
            <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4 text-center">
                <input
                  type="checkbox"
                  checked={isSelected(ticket.id)}
                  onChange={() => handleToggleTicket(ticket.id)}
                  className="w-4 h-4 rounded border-gray-300 text-[#A81010] focus:ring-[#A81010] focus:ring-offset-0 cursor-pointer"
                />
              </td>
              <td className="px-6 py-4 font-mono text-xs text-gray-400">
                #{ticket.id.toString().padStart(4, '0')}
              </td>
              <td className="px-6 py-4">
                <p className="font-bold text-gray-900">{ticket.purchaserName}</p>
                <p className="text-xs text-gray-400">{ticket.purchaserPhone}</p>
                <p className="text-xs text-gray-500 mt-1 font-mono">{ticket.ticketCode}</p>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                  ticket.ticketType === 'VVIP' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                  ticket.ticketType === 'VIP' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                  'bg-blue-50 text-blue-700 border-blue-100'
                }`}>
                  {ticket.ticketType}
                </span>
                <div className="text-xs text-gray-500 mt-1">
                  Qty: {ticket.totalQuantity}
                </div>
              </td>
              <td className="px-6 py-4">
                {session && day ? (
                  <>
                    <p className="font-medium text-gray-900">{session.name}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar size={12} />
                      <span>{day.date ? new Date(day.date).toLocaleDateString() : '-'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>{session.startTime} - {session.endTime}</span>
                    </div>
                  </>
                ) : (
                  <span className="text-gray-400">Not assigned</span>
                )}
              </td>
              <td className="px-6 py-4 font-medium text-gray-900">
                TZS {Number(ticket.totalAmount).toLocaleString()}
              </td>
              <td className="px-6 py-4">
                {ticket.paymentStatus === 'PAID' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Paid
                  </span>
                ) : ticket.paymentStatus === 'FAILED' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                    Failed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-100">
                    Pending
                  </span>
                )}
              </td>
              <td className="px-6 py-4">
                {transaction?.externalId ? (
                  <div className="font-mono text-xs text-gray-500 truncate max-w-[120px]" title={transaction.externalId}>
                    {transaction.externalId}
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4">
                {transaction?.provider ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                    <CreditCard size={12} />
                    {transaction.provider}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4">
                {transaction?.status ? (
                  <span className={`text-xs px-2 py-1 rounded-md ${
                    transaction.status === 'SUCCESS' ? 'bg-green-50 text-green-700' :
                    transaction.status === 'FAILED' ? 'bg-red-50 text-red-700' :
                    'bg-yellow-50 text-yellow-700'
                  }`}>
                    {transaction.status}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '-'}</span>
                  <span className="text-xs text-gray-400">
                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleTimeString() : ''}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-1">
                  <Link 
                    href={`/admin/tickets/${ticket.id}`}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View ticket"
                  >
                    <Eye size={16} />
                  </Link>
                  <Link
                    href={`/admin/tickets/${ticket.id}/edit`}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit ticket"
                  >
                    <Edit size={16} />
                  </Link>
                  <button 
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete ticket"
                    onClick={() => handleDelete(ticket.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}