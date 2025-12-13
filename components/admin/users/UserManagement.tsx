'use client';

import { useState } from 'react';
import { createUser, updateUser, deleteUser } from  '@/lib/actions/user-actions';
import { UserPlus, Pencil, Trash2, X, Loader2, Shield, Mail, Calendar, User, MoreVertical } from 'lucide-react';

interface User {
  id: number;
  name: string | null;
  email: string;
  role: string | null;
  createdAt: Date | null;
}

export default function UserManagement({ initialUsers }: { initialUsers: User[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({ name: '', email: '', role: 'admin', password: '' });

  // Open Modal (Reset for Create, Fill for Edit)
  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({ name: user.name || '', email: user.email, role: user.role || 'user', password: '' });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', role: 'admin', password: '' });
    }
    setIsModalOpen(true);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('role', formData.role);
    data.append('password', formData.password);

    if (editingUser) {
      await updateUser(editingUser.id, data);
    } else {
      await createUser(data);
    }

    setIsLoading(false);
    setIsModalOpen(false);
  };

  // Handle Delete
  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      await deleteUser(id);
    }
  };

  // Toggle mobile view for user row
  const toggleMobileView = (id: number) => {
    setExpandedUserId(expandedUserId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Users</h1>
          <p className="text-sm text-gray-500">Manage system access.</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="flex items-center gap-2 px-4 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 shadow-lg w-full sm:w-auto justify-center"
        >
          <UserPlus size={16} /> Add New Admin
        </button>
      </div>

      {/* DESKTOP TABLE (Hidden on mobile) */}
      <div className="hidden lg:block bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Created At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {initialUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{user.name || 'N/A'}</td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full uppercase ${
                      user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      <Shield size={10} /> {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex items-center gap-2 text-gray-500">
                    <Calendar size={14} />
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openModal(user)} 
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit user"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)} 
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete user"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE/TABLET VIEW (Visible on lg and below) */}
      <div className="lg:hidden space-y-3">
        {initialUsers.map((user) => (
          <div 
            key={user.id} 
            className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
          >
            {/* Compact View */}
            <div 
              className="p-4 flex items-center justify-between cursor-pointer"
              onClick={() => toggleMobileView(user.id)}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <User size={20} className="text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{user.name || 'Unnamed User'}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail size={12} />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                  user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                  user.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {user.role}
                </span>
                <MoreVertical size={18} className="text-gray-400" />
              </div>
            </div>

            {/* Expanded View (when clicked) */}
            {expandedUserId === user.id && (
              <div className="border-t border-gray-100 p-4 bg-gray-50 animate-in fade-in">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="font-medium">{user.email}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">Role</div>
                    <div className="font-medium">{user.role}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">Created</div>
                    <div className="font-medium">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <button 
                      onClick={() => openModal(user)} 
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)} 
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {initialUsers.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Users Found</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first admin user.</p>
          <button 
            onClick={() => openModal()} 
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 shadow-lg"
          >
            <UserPlus size={16} /> Add New Admin
          </button>
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-6">
              {editingUser ? 'Edit User' : 'Create New User'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#A81010] focus:border-transparent outline-none"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#A81010] focus:border-transparent outline-none"
                  placeholder="john@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'user'})}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      formData.role === 'user' 
                        ? 'bg-gray-900 text-white border-gray-900' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xs font-bold">User</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'admin'})}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      formData.role === 'admin' 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xs font-bold">Admin</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'superadmin'})}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      formData.role === 'superadmin' 
                        ? 'bg-purple-600 text-white border-purple-600' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xs font-bold">Super</div>
                  </button>
                </div>
                <select 
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl mt-2 bg-white hidden"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {editingUser ? 'New Password (leave blank to keep)' : 'Password'}
                </label>
                <input 
                  type="password" 
                  required={!editingUser}
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#A81010] focus:border-transparent outline-none"
                  placeholder="••••••••"
                />
                {editingUser && (
                  <p className="text-xs text-gray-500 mt-2">
                    Leave password field empty to keep the current password
                  </p>
                )}
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1 bg-[#A81010] text-white font-bold py-3 rounded-xl hover:bg-[#8a0d0d] transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {isLoading && <Loader2 className="animate-spin" size={18} />}
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}