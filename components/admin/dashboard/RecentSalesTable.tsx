'use client';

import { CheckCircle, XCircle, Clock, MoreVertical } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/utils';
import { useState } from 'react';

interface Ticket {
  id: string;
  guestName: string;
  guestPhone: string;
  ticketType: string;
  totalAmount: string | number | null;
  isUsed: boolean;
  status: string;
  paymentStatus: string;
  createdAt: string | Date | null;
  reference?: string;
}

interface RecentSalesTableProps {
  tickets: Ticket[];
}

export default function RecentSalesTable({ tickets }: RecentSalesTableProps) {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  const getStatusIcon = (ticket: Ticket) => {
    if (ticket.isUsed) {
      return <CheckCircle size={14} className="text-green-600" />;
    } else if (ticket.paymentStatus === 'PAID') {
      return <CheckCircle size={14} className="text-green-600" />;
    } else {
      return <Clock size={14} className="text-orange-500" />;
    }
  };

  const getStatusText = (ticket: Ticket) => {
    if (ticket.isUsed) {
      return 'Checked In';
    } else if (ticket.paymentStatus === 'PAID') {
      return 'Paid';
    } else {
      return 'Pending';
    }
  };

  const getStatusColor = (ticket: Ticket) => {
    if (ticket.isUsed) {
      return 'bg-green-100 text-green-700 border-green-200';
    } else if (ticket.paymentStatus === 'PAID') {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    } else {
      return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  const getTicketTypeColor = (type: string) => {
    switch (type) {
      case 'VVIP':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'VIP':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'REGULAR':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleRowClick = (ticketId: string) => {
    setSelectedTicket(selectedTicket === ticketId ? null : ticketId);
    // In a real app, you might navigate to the ticket detail page
    // router.push(`/admin/tickets/${ticketId}`);
  };

  const handleQuickAction = (action: string, ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`Action: ${action} on ticket ${ticketId}`);
    // Implement actions like mark as used, resend ticket, refund, etc.
  };

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Sales</h3>
        <p className="text-gray-500">Ticket sales will appear here once they are made.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Ticket Details
            </th>
            <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Date & Time
            </th>
            <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {tickets.map((ticket) => (
            <tr 
              key={ticket.id}
              onClick={() => handleRowClick(ticket.id)}
              className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                selectedTicket === ticket.id ? 'bg-blue-50' : ''
              }`}
            >
              <td className="p-4">
                <div>
                  <div className="font-medium text-gray-900">{ticket.guestName}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{ticket.guestPhone}</div>
                  {ticket.reference && (
                    <div className="text-xs text-gray-400 mt-1 font-mono">Ref: {ticket.reference}</div>
                  )}
                </div>
              </td>
              
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getTicketTypeColor(ticket.ticketType)}`}>
                    {ticket.ticketType}
                  </span>
                </div>
              </td>
              
              <td className="p-4">
                <div className="font-bold text-gray-900">
                  {formatCurrency(ticket.totalAmount)}
                </div>
              </td>
              
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(ticket)} inline-flex items-center gap-1.5`}>
                    {getStatusIcon(ticket)}
                    {getStatusText(ticket)}
                  </span>
                </div>
              </td>
              
              <td className="p-4">
                <div className="space-y-0.5">
                  <div className="text-sm text-gray-900">
                    {ticket.createdAt ? formatDate(new Date(ticket.createdAt)) : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) : ''}
                  </div>
                </div>
              </td>
              
              <td className="p-4">
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTicket(selectedTicket === ticket.id ? null : ticket.id);
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical size={18} className="text-gray-500" />
                  </button>
                  
                  {selectedTicket === ticket.id && (
                    <div className="absolute right-0 top-full mt-1 z-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                      <button
                        onClick={(e) => handleQuickAction('view', ticket.id, e)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        View Details
                      </button>
                      {!ticket.isUsed && ticket.paymentStatus === 'PAID' && (
                        <button
                          onClick={(e) => handleQuickAction('checkin', ticket.id, e)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Mark as Checked In
                        </button>
                      )}
                      <button
                        onClick={(e) => handleQuickAction('resend', ticket.id, e)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Resend Ticket
                      </button>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={(e) => handleQuickAction('refund', ticket.id, e)}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Refund
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>
            Showing <span className="font-semibold">{tickets.length}</span> recent sales
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300"></div>
              <span>Checked In</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300"></div>
              <span>Paid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-100 border border-orange-300"></div>
              <span>Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}