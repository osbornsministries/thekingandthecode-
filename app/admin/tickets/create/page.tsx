// app/admin/tickets/create/page.tsx
'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import TicketForm from '@/components/frontend/tickets/TicketForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateTicketPage() {
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
              <h1 className="text-2xl font-bold text-gray-900">Create New Ticket</h1>
              <p className="text-sm text-gray-500">Add a new ticket to the system</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <TicketForm mode="create" />
      </div>
    </AdminLayout>
  );
}