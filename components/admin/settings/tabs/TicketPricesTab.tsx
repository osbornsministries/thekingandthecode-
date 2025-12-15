'use client';

import { useState, useEffect } from 'react';
import { getTicketPrices, createTicketPrice, updateTicketPrice, deleteTicketPrice, TicketPrice } from  '@/lib/actions/setting/admin-actions';
import { Plus, Edit, Trash2, Ticket, CheckCircle, XCircle } from 'lucide-react';

export default function TicketPricesTab() {
  const [ticketPrices, setTicketPrices] = useState<TicketPrice[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // New ticket form state
  const [newTicket, setNewTicket] = useState({
    name: '',
    type: '',
    price: '',
    description: '',
    isActive: true,
  });

  // Edit form state
  const [editForm, setEditForm] = useState<Partial<TicketPrice>>({});

  useEffect(() => {
    loadTicketPrices();
  }, []);

  const loadTicketPrices = async () => {
    setLoading(true);
    try {
      const data = await getTicketPrices();
      setTicketPrices(data);
    } catch (error) {
      console.error('Failed to load ticket prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTicket.name || !newTicket.type || !newTicket.price) {
      alert('Please fill in all required fields');
      return;
    }

    const result = await createTicketPrice({
      ...newTicket,
      price: newTicket.price,
    });

    if (result.success) {
      setNewTicket({
        name: '',
        type: '',
        price: '',
        description: '',
        isActive: true,
      });
      setShowCreateForm(false);
      await loadTicketPrices();
    } else {
      alert(result.error || 'Failed to create ticket');
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editForm.name || !editForm.type || !editForm.price) {
      alert('Please fill in all required fields');
      return;
    }

    const result = await updateTicketPrice(id, editForm);
    if (result.success) {
      setEditingId(null);
      await loadTicketPrices();
    } else {
      alert(result.error || 'Failed to update ticket');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this ticket type?')) {
      const result = await deleteTicketPrice(id);
      if (result.success) {
        await loadTicketPrices();
      } else {
        alert(result.error || 'Failed to delete ticket');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A81010]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          Ticket Prices
        </h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-[#A81010] text-white rounded-lg hover:bg-[#8a0d0d] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {showCreateForm ? 'Cancel' : 'Add Ticket Type'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Ticket Type</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ticket Name *
                </label>
                <input
                  type="text"
                  value={newTicket.name}
                  onChange={(e) => setNewTicket({ ...newTicket, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="e.g., Adult, Student, VIP"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type Code *
                </label>
                <input
                  type="text"
                  value={newTicket.type}
                  onChange={(e) => setNewTicket({ ...newTicket, type: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="e.g., ADULT, STUDENT, VIP"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (TZS) *
                </label>
                <input
                  type="number"
                  value={newTicket.price}
                  onChange={(e) => setNewTicket({ ...newTicket, price: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="50000"
                  min="0"
                  step="1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="e.g., Standard entry for adults"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActiveNew"
                checked={newTicket.isActive}
                onChange={(e) => setNewTicket({ ...newTicket, isActive: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="isActiveNew" className="text-sm text-gray-700">
                Active (available for purchase)
              </label>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleCreate}
                className="px-6 py-3 bg-[#A81010] text-white rounded-lg hover:bg-[#8a0d0d] font-medium"
              >
                Create Ticket Type
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Prices List */}
      <div className="space-y-4">
        {ticketPrices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No ticket prices found. Create your first ticket type.
          </div>
        ) : (
          ticketPrices.map((ticket) => (
            <div key={ticket.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-6">
                {editingId === ticket.id ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Ticket Type</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ticket Name *
                          </label>
                          <input
                            type="text"
                            value={editForm.name || ticket.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type Code *
                          </label>
                          <input
                            type="text"
                            value={editForm.type || ticket.type}
                            onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price (TZS) *
                          </label>
                          <input
                            type="number"
                            value={editForm.price || ticket.price}
                            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                            min="0"
                            step="1000"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <input
                            type="text"
                            value={editForm.description || ticket.description || ''}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isActiveEdit"
                          checked={editForm.isActive !== undefined ? editForm.isActive : ticket.isActive}
                          onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                          className="rounded"
                        />
                        <label htmlFor="isActiveEdit" className="text-sm text-gray-700">
                          Active (available for purchase)
                        </label>
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(ticket.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4 inline mr-2" />
                          Delete
                        </button>
                        <button
                          onClick={() => handleUpdate(ticket.id)}
                          className="px-4 py-2 bg-[#A81010] text-white rounded-lg hover:bg-[#8a0d0d]"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900">{ticket.name}</h3>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {ticket.type}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          ticket.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {ticket.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </span>
                      </div>
                      <p className="text-gray-600">{ticket.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          TZS {parseFloat(ticket.price).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">Per ticket</div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingId(ticket.id);
                            setEditForm({ ...ticket });
                          }}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ticket.id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}