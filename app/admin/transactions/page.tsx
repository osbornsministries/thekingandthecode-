import AdminLayout from '@/components/admin/AdminLayout';
import { db } from '@/lib/db/db';
import { transactions, tickets } from '@/lib/drizzle/schema';
import { desc, eq } from 'drizzle-orm';
import { ArrowDownLeft, Smartphone } from 'lucide-react';

export default async function TransactionsPage() {
  // Fetch transactions joined with ticket data
  const data = await db.select({
    id: transactions.id,
    externalId: transactions.externalId,
    provider: transactions.provider,
    accountNumber: transactions.accountNumber,
    amount: transactions.amount,
    status: transactions.status,
    createdAt: transactions.createdAt,
    // FIX: Use purchaserName instead of guestName
    purchaserName: tickets.purchaserName, 
  })
  .from(transactions)
  .leftJoin(tickets, eq(transactions.ticketId, tickets.id))
  .orderBy(desc(transactions.createdAt));

  return (
    <AdminLayout>
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500">Monitor incoming payments from AzamPay.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Ref ID</th>
                <th className="px-6 py-4">Purchaser / Payer</th>
                <th className="px-6 py-4">Provider</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">
                    {tx.externalId ? tx.externalId.substring(0, 12) : 'N/A'}...
                  </td>
                  <td className="px-6 py-4">
                    {/* FIX: Use purchaserName here */}
                    <p className="font-bold text-gray-900">{tx.purchaserName || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{tx.accountNumber}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Smartphone size={14} className="text-gray-500" />
                      </div>
                      <span className="font-medium text-gray-700 capitalize">{tx.provider}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    TZS {Number(tx.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {tx.status === 'success' || tx.status === 'PAID' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                        <ArrowDownLeft size={12} /> Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                 <tr><td colSpan={6} className="p-8 text-center text-gray-400">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
}