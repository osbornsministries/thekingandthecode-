// components/admin/DeleteTicketButton.tsx
'use client';

import { useState } from 'react';
import { Trash2, Loader2, X } from 'lucide-react';
import { deleteTicket } from '@/lib/actions/ticket/tickets';
import { useRouter } from 'next/navigation';

interface DeleteTicketButtonProps {
  ticketId: number;
  ticketCode: string;
}

export default function DeleteTicketButton({ ticketId, ticketCode }: DeleteTicketButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteTicket(ticketId);
      if (result.success) {
        router.refresh();
        setShowConfirm(false);
      } else {
        alert(result.error || 'Failed to delete ticket');
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert('An error occurred while deleting the ticket');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Delete ticket"
      >
        <Trash2 size={16} />
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Confirm Deletion</h3>
              <button
                onClick={() => setShowConfirm(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-center text-gray-700 mb-2">
                Are you sure you want to delete ticket <span className="font-bold">{ticketCode}</span>?
              </p>
              <p className="text-center text-sm text-gray-500">
                This action cannot be undone. All ticket data will be permanently removed.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Ticket'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}