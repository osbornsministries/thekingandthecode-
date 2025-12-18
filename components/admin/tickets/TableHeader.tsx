// components/admin/tickets/TableHeader.tsx
'use client';

interface TableHeaderProps {
  selectAll: boolean;
  onSelectAll: () => void;
}

export default function TableHeader({ selectAll, onSelectAll }: TableHeaderProps) {
  return (
    <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
      <tr>
        <th className="px-4 py-4 w-10 text-center">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={onSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-[#A81010] focus:ring-[#A81010] focus:ring-offset-0 cursor-pointer"
          />
        </th>
        <th className="px-6 py-4">Ticket ID</th>
        <th className="px-6 py-4">Purchaser Details</th>
        <th className="px-6 py-4">Type</th>
        <th className="px-6 py-4">Session & Day</th>
        <th className="px-6 py-4">Amount</th>
        <th className="px-6 py-4">Payment Status</th>
        <th className="px-6 py-4">External ID</th>
        <th className="px-6 py-4">Provider</th>
        <th className="px-6 py-4">Tx Status</th>
        <th className="px-6 py-4">Date</th>
        <th className="px-6 py-4 text-right">Actions</th>
      </tr>
    </thead>
  );
}