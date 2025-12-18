// components/admin/tickets/TicketsWithBulkActions.tsx
'use client';

import { useState } from 'react';
import TicketsTableComplete from './TicketsTableComplete';
import BulkActions from './BulkActions';
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

interface TicketsWithBulkActionsProps {
  tickets: TicketWithRelations[];
  sessions: Session[];
  hasAnySearch: boolean;
  hasAnyFilter: boolean;
}

export default function TicketsWithBulkActions({
  tickets,
  sessions,
  hasAnySearch,
  hasAnyFilter
}: TicketsWithBulkActionsProps) {
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [ticketsData, setTicketsData] = useState<Array<{
    id: number;
    purchaserName: string;
    purchaserPhone: string;
    ticketCode: string;
    ticketType: string;
  }>>([]);

  // Extract tickets data for SMS
  const extractTicketsData = () => {
    return tickets.map(t => ({
      id: t.ticket.id,
      purchaserName: t.ticket.purchaserName,
      purchaserPhone: t.ticket.purchaserPhone,
      ticketCode: t.ticket.ticketCode,
      ticketType: t.ticket.ticketType
    }));
  };

  // Update tickets data when tickets change
  useState(() => {
    setTicketsData(extractTicketsData());
  });

  // Get selected tickets details
  const getSelectedTicketsData = () => {
    return ticketsData.filter(ticket => selectedTickets.includes(ticket.id));
  };

  return (
    <>
      <BulkActions 
        selectedTickets={selectedTickets}
        ticketCount={tickets.length}
        ticketsData={getSelectedTicketsData()}
      />
      
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mt-6">
        <div className="hidden lg:block">
          <TicketsTableComplete
            tickets={tickets}
            sessions={sessions}
            hasAnySearch={hasAnySearch}
            hasAnyFilter={hasAnyFilter}
            onSelectionChange={setSelectedTickets}
          />
        </div>
      </div>
    </>
  );
}