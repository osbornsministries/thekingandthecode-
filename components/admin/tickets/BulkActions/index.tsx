"use client";

import { useState } from 'react';
import BulkActionsBar from './BulkActionsBar';
import MessageModal from './MessageModal';
import SuccessToast from './SuccessToast';
// import { sendBulkMessages } from '@/lib/api/tickets';

interface Ticket {
  id: number;
  purchaserName: string;
  purchaserPhone: string;
  paymentStatus: string;
  ticketCode: string;
}

interface BulkActionsProps {
  tickets: Array<{ ticket: Ticket }>;
  selectedIds: number[];
  onClearSelection: () => void;
}

export default function BulkActions({
  tickets,
  selectedIds,
  onClearSelection,
}: BulkActionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Get selected tickets data
  const selectedTickets = tickets.filter(t => selectedIds.includes(t.ticket.id));
  const selectedCount = selectedTickets.length;
  
  // Calculate stats
  const uniquePhones = new Set(selectedTickets.map(t => t.ticket.purchaserPhone));
  const paidCount = selectedTickets.filter(t => t.ticket.paymentStatus === 'PAID').length;
  const unpaidCount = selectedCount - paidCount;

//   const handleSendMessage = async (message: string) => {
//     setIsSending(true);
//     try {
//       const result = await sendBulkMessages({
//         tickets: selectedTickets.map(t => ({
//           id: t.ticket.id,
//           phone: t.ticket.purchaserPhone,
//           name: t.ticket.purchaserName,
//           ticketCode: t.ticket.ticketCode
//         })),
//         message,
//       });

//       if (result.success) {
//         setSuccessMessage(`Message sent to ${selectedCount} ticket(s)`);
//         setIsModalOpen(false);
//         setTimeout(() => {
//           setSuccessMessage('');
//           onClearSelection();
//         }, 3000);
//       } else {
//         throw new Error('Failed to send messages');
//       }
//     } catch (error) {
//       console.error('Error sending messages:', error);
//       alert('Failed to send messages. Please try again.');
//     } finally {
//       setIsSending(false);
//     }
//   };

  if (selectedCount === 0) return null;

  return (
    <>
      <SuccessToast 
        message={successMessage} 
        isVisible={!!successMessage} 
      />
      
      <BulkActionsBar
        selectedCount={selectedCount}
        uniquePhoneCount={uniquePhones.size}
        paidCount={paidCount}
        onSendMessage={() => setIsModalOpen(true)}
        onClearSelection={onClearSelection}
      />
      
      {/* <MessageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        // onSend={handleSendMessage}
        selectedCount={selectedCount}
        unpaidCount={unpaidCount}
      /> */}
    </>
  );
}