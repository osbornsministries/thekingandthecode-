// components/admin/tickets/BulkActions.tsx
'use client';

import { useState } from 'react';
import { MessageSquare, Download, Trash2 } from 'lucide-react';
import BulkSMSModal from './message/BulkSMSModal';

interface BulkActionsProps {
  selectedTickets: number[];
  ticketCount: number;
  ticketsData?: Array<{
    id: number;
    purchaserName: string;
    purchaserPhone: string;
    ticketCode: string;
    ticketType: string;
  }>;
}

export default function BulkActions({ selectedTickets, ticketCount, ticketsData = [] }: BulkActionsProps) {
  const [showSMSModal, setShowSMSModal] = useState(false);

 const handleExportCSV = () => {
    // Build export URL
    let exportUrl = '/api/tickets/export';
    if (selectedTickets.length > 0) {
        exportUrl += `?ids=${selectedTickets.join(',')}`;
    }
    
    // Trigger download
    const link = document.createElement('a');
    link.href = exportUrl;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    };

  const handleDeleteSelected = async () => {
    if (selectedTickets.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedTickets.length} selected ticket(s)?`)) {
      return;
    }
    
    try {
      const response = await fetch('/api/tickets/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketIds: selectedTickets })
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        throw new Error('Failed to delete tickets');
      }
    } catch (error) {
      console.error('Failed to delete tickets:', error);
      alert('Failed to delete tickets');
    }
  };

  // Get selected tickets details
  const getSelectedTicketsDetails = () => {
    return ticketsData.filter(ticket => selectedTickets.includes(ticket.id));
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-bold text-gray-900">
                {selectedTickets.length > 0 
                  ? `${selectedTickets.length} ticket(s) selected`
                  : `${ticketCount} total tickets`
                }
              </span>
              {selectedTickets.length > 0 && (
                <span className="text-gray-500 ml-2">
                  of {ticketCount}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowSMSModal(true)}
              disabled={selectedTickets.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 ${
                selectedTickets.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <MessageSquare size={16} /> Send SMS
            </button>
            
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors duration-200"
            >
              <Download size={16} /> Export CSV
            </button>
            
            <button
              onClick={handleDeleteSelected}
              disabled={selectedTickets.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 ${
                selectedTickets.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              <Trash2 size={16} /> Delete Selected
            </button>
          </div>
        </div>
      </div>

      {/* SMS Modal */}
      {showSMSModal && (
        <BulkSMSModal
          selectedTickets={selectedTickets}
          ticketsData={getSelectedTicketsDetails()}
          onClose={() => setShowSMSModal(false)}
        />
      )}
    </>
  );
}