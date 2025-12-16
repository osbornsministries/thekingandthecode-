// app/admin/tickets/components/MobileTicketsList.tsx
import Link from 'next/link';
import { Eye, Edit, Trash2, Calendar, Phone, DollarSign, Database, CreditCard, Tag, X } from 'lucide-react';

interface TicketData {
  ticket: any;
  transaction: any;
  session: any;
  day: any;
}

interface MobileTicketsListProps {
  tickets: TicketData[];
  hasAnySearch: boolean;
  hasAnyFilter: boolean;
}

export default function MobileTicketsList({ tickets, hasAnySearch, hasAnyFilter }: MobileTicketsListProps) {
  if (tickets.length === 0) {
    return (
      <div className="lg:hidden space-y-3 p-4">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Tickets Found</h3>
          <p className="text-gray-500">
            {hasAnySearch || hasAnyFilter 
              ? "Try adjusting your search or filters" 
              : "No tickets have been created yet"}
          </p>
          {!(hasAnySearch || hasAnyFilter) && (
            <Link
              href="/admin/tickets/create"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#A81010] text-white rounded-lg text-sm font-medium hover:bg-[#8a0d0d]"
            >
              <Edit size={16} /> Create Your First Ticket
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="lg:hidden space-y-3 p-4">
      {tickets.map(({ ticket, transaction, session, day }) => (
        <div key={ticket.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-gray-400">
                  #{ticket.id.toString().padStart(4, '0')}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                  ticket.ticketType === 'VVIP' ? 'bg-purple-50 text-purple-700' :
                  ticket.ticketType === 'VIP' ? 'bg-amber-50 text-amber-700' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  {ticket.ticketType}
                </span>
              </div>
              <p className="font-bold text-gray-900 text-sm">{ticket.purchaserName}</p>
              {session && day && (
                <p className="text-xs text-gray-500 mt-1">
                  {day.name} - {session.name}
                </p>
              )}
            </div>
            
            {/* Status */}
            <div className="flex flex-col items-end gap-1">
              {ticket.paymentStatus === 'PAID' ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Paid
                </span>
              ) : ticket.paymentStatus === 'FAILED' ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700">
                  Failed
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700">
                  Pending
                </span>
              )}
              {transaction?.provider && (
                <span className="text-xs text-gray-500">
                  via {transaction.provider}
                </span>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-500">
                <Phone size={14} />
                <span>{ticket.purchaserPhone}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <DollarSign size={14} />
                <span className="font-medium">TZS {Number(ticket.totalAmount).toLocaleString()}</span>
              </div>
              {transaction?.externalId && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Database size={14} />
                  <span className="font-mono text-xs truncate">{transaction.externalId.slice(0, 12)}...</span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar size={14} />
                <span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Tag size={14} />
                <span className="font-mono text-xs">{ticket.ticketCode.slice(0, 8)}...</span>
              </div>
              {transaction?.status && transaction.status !== ticket.paymentStatus && (
                <div className="flex items-center gap-2 text-gray-500">
                  <CreditCard size={14} />
                  <span className="text-xs">Tx: {transaction.status}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-3 border-t border-gray-200">
            <Link 
              href={`/admin/tickets/${ticket.id}`}
              className="flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium"
            >
              <Eye size={14} /> View
            </Link>
            <div className="flex gap-2">
              <Link
                href={`/admin/tickets/${ticket.id}/edit`}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Edit size={14} />
              </Link>
              <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}