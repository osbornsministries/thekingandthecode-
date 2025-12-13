import AdminLayout from '@/components/admin/AdminLayout';
import { db } from '@/lib/db/db';
import { users } from '@/lib/drizzle/schema';
import { desc } from 'drizzle-orm';
import { UserPlus, Shield, Mail } from 'lucide-react';

export default async function UsersPage() {
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

  return (
    <AdminLayout>
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Users</h1>
          <p className="text-sm text-gray-500">Manage access to the dashboard.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 shadow-lg">
          <UserPlus size={16} /> Add New Admin
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allUsers.map((user) => (
          <div key={user.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#A81010] to-black flex items-center justify-center text-white font-serif font-bold text-xl">
                {user.name ? user.name.charAt(0) : 'A'}
              </div>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg uppercase tracking-wider flex items-center gap-1">
                <Shield size={10} /> {user.role}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900">{user.name || 'Admin User'}</h3>
            
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <Mail size={14} />
              {user.email}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
              <span>Added:</span>
              <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
    </AdminLayout>
  );
}