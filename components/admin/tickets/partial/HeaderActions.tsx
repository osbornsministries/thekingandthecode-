// app/admin/tickets/components/HeaderActions.tsx
import Link from 'next/link';
import { Edit, Download } from 'lucide-react';

export default function HeaderActions() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Live Tickets</h1>
        <p className="text-sm text-gray-500">Manage all generated tickets and orders.</p>
      </div>
      <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
        <Link
          href="/admin/tickets/create"
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
        >
          <Edit size={16} /> Create Ticket
        </Link>
        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#A81010] text-white rounded-xl text-sm font-medium hover:bg-[#8a0d0d] shadow-lg shadow-red-900/20 transition-colors duration-200">
          <Download size={16} /> Export CSV
        </button>
      </div>
    </div>
  );
}