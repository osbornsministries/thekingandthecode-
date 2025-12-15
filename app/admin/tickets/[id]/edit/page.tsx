// app/admin/tickets/[id]/edit/page.tsx
'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import TicketForm from '@/components/frontend/tickets/TicketForm';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getTicketById } from '@/lib/actions/ticket/tickets';

export default function EditTicketPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [ticketExists, setTicketExists] = useState(true);
  
  const ticketId = params.id ? parseInt(params.id as string) : null;

  useEffect(() => {
    const checkTicket = async () => {
      if (!ticketId) {
        setTicketExists(false);
        setLoading(false);
        return;
      }

      try {
        const ticket = await getTicketById(ticketId);
        if (!ticket) {
          setTicketExists(false);
        }
      } catch (error) {
        console.error('Error checking ticket:', error);
        setTicketExists(false);
      } finally {
        setLoading(false);
      }
    };

    checkTicket();
  }, [ticketId]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#A81010]" />
        </div>
      </AdminLayout>
    );
  }

  if (!ticketExists || !ticketId) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/tickets"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Ticket</h1>
              </div>
            </div>
          </div>
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Ticket Not Found</h3>
            <p className="text-gray-500 mb-6">The ticket you're trying to edit doesn't exist.</p>
            <Link
              href="/admin/tickets"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#A81010] text-white rounded-lg font-medium hover:bg-[#8a0d0d] transition-colors"
            >
              <ArrowLeft size={16} /> Back to Tickets
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/tickets"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Ticket</h1>
              <p className="text-sm text-gray-500">Update ticket information</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <TicketForm mode="edit" ticketId={ticketId} />
      </div>
    </AdminLayout>
  );
}