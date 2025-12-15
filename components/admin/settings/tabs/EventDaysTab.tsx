'use client';

import { useState, useEffect } from 'react';
import { getEventDays, createEventDay, updateEventDay, deleteEventDay, EventDay } from '@/lib/actions/setting/admin-actions';
import EventDayForm from '../forms/EventDayForm';
import { Plus, Edit, Trash2, Calendar, CheckCircle, XCircle } from 'lucide-react';

export default function EventDaysTab() {
  const [eventDays, setEventDays] = useState<EventDay[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventDays();
  }, []);

  const loadEventDays = async () => {
    setLoading(true);
    try {
      const data = await getEventDays();
      setEventDays(data);
    } catch (error) {
      console.error('Failed to load event days:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    const result = await createEventDay(data);
    if (result.success) {
      setShowCreateForm(false);
      await loadEventDays();
    }
    return result;
  };

  const handleUpdate = async (id: number, data: any) => {
    const result = await updateEventDay(id, data);
    if (result.success) {
      setEditingId(null);
      await loadEventDays();
    }
    return result;
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this event day? This will also delete all associated sessions.')) {
      const result = await deleteEventDay(id);
      if (result.success) {
        await loadEventDays();
      }
      return result;
    }
    return { success: false, error: 'Cancelled' };
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
          <Calendar className="w-5 h-5" />
          Event Days
        </h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-[#A81010] text-white rounded-lg hover:bg-[#8a0d0d] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {showCreateForm ? 'Cancel' : 'Add Event Day'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Event Day</h3>
          <EventDayForm onSubmit={handleCreate} onCancel={() => setShowCreateForm(false)} />
        </div>
      )}

      {/* Event Days List */}
      <div className="space-y-4">
        {eventDays.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No event days found. Create your first event day.
          </div>
        ) : (
          eventDays.map((day) => (
            <div key={day.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-6">
                {editingId === day.id ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Event Day</h3>
                    <EventDayForm
                      day={day}
                      onSubmit={(data) => handleUpdate(day.id, data)}
                      onDelete={() => handleDelete(day.id)}
                      onCancel={() => setEditingId(null)}
                    />
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900">{day.name}</h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          day.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {day.isActive ? (
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
                      <p className="text-gray-600">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingId(day.id)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(day.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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