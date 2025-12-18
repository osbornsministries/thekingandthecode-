"use client";

import { useState, useCallback, useMemo } from 'react';

interface UseSelectionProps {
  tickets: Array<{ ticket: { id: number } }>;
}

export function useSelection({ tickets }: UseSelectionProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  const ticketIds = useMemo(() => 
    tickets.map(t => t.ticket.id), 
    [tickets]
  );

  const selectAll = useCallback(() => {
    setSelectedIds(ticketIds);
    setIsAllSelected(true);
  }, [ticketIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setIsAllSelected(false);
  }, []);

  const toggleTicket = useCallback((id: number) => {
    setSelectedIds(prev => {
      const isSelected = prev.includes(id);
      const newSelected = isSelected 
        ? prev.filter(ticketId => ticketId !== id)
        : [...prev, id];
      
      setIsAllSelected(newSelected.length === ticketIds.length);
      return newSelected;
    });
  }, [ticketIds.length]);

  const isSelected = useCallback((id: number) => 
    selectedIds.includes(id), 
    [selectedIds]
  );

  const selectedCount = selectedIds.length;
  const hasSelection = selectedCount > 0;

  return {
    selectedIds,
    selectedCount,
    hasSelection,
    isAllSelected,
    selectAll,
    clearSelection,
    toggleTicket,
    isSelected,
  };
}