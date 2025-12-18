// components/admin/tickets/TicketsTable/BulkActionsWrapper.tsx
'use client';

import { useState } from 'react';
import { tickets } from '@/lib/drizzle/schema';
import BulkActions from './BulkActions';
import type { InferSelectModel } from 'drizzle-orm';

type Ticket = InferSelectModel<typeof tickets>;

interface BulkActionsWrapperProps {
  initialTickets: Ticket[];
  onSelectionChange?: (selectedIds: number[]) => void;
}

export default function BulkActionsWrapper({ 
  initialTickets,
  onSelectionChange 
}: BulkActionsWrapperProps) {
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);

  const handleSelectionChange = (selectedIds: number[]) => {
    setSelectedTickets(selectedIds);
    onSelectionChange?.(selectedIds);
  };

  return (
    <BulkActions 
      selectedTickets={selectedTickets}
      ticketCount={initialTickets.length}
    />
  );
}