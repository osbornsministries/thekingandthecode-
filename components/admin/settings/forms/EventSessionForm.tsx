'use client';

import { useState, useEffect } from 'react';
import { EventSession, EventDay } from  '@/lib/actions/setting/admin-actions';
import { getEventDays } from '@/lib/actions/setting/admin-actions';
import { Save, X, Trash2 } from 'lucide-react';

interface EventSessionFormProps {
  session?: EventSession & { dayName?: string };
  onSubmit: (data: any) => Promise<{ success: boolean; error?: string }>;
  onDelete?: (id: number) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
}

export default function EventSessionForm({ session, onSubmit, onDelete, onCancel }: EventSessionFormProps) {
  const [eventDays, setEventDays] = useState<EventDay[]>([]);
  const [formData, setFormData] = useState({
    dayId: session?.dayId || 1,
    name: session?.name || '',
    startTime: session?.startTime || '',
    endTime: session?.endTime || '',
    isActive: session?.isActive ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEventDays();
  }, []);

  const loadEventDays = async () => {
    try {
      const days = await getEventDays();
      setEventDays(days);
      if (days.length > 0 && !session) {
        setFormData(prev => ({ ...prev, dayId: days[0].id }));
      }
    } catch (err) {
      console.error('Failed to load event days:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onSubmit(formData);
      if (!result.success) {
        setError(result.error || 'Failed to save session');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Day
          </label>
          <select
            value={formData.dayId}
            onChange={(e) => setFormData({ ...formData, dayId: parseInt(e.target.value) })}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
          >
            {eventDays.map(day => (
              <option key={day.id} value={day.id}>
                {day.name} ({new Date(day.date).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder="e.g., Afternoon Show, Evening Show"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Time
          </label>
          <input
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Time
          </label>
          <input
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="isActive" className="text-sm text-gray-700">
          Active (available for ticket sales)
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={isSubmitting}
          >
            <X className="w-4 h-4 inline mr-2" />
            Cancel
          </button>
        )}

        {session && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(session.id)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            disabled={isSubmitting}
          >
            <Trash2 className="w-4 h-4 inline mr-2" />
            Delete
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-[#A81010] text-white rounded-lg hover:bg-[#8a0d0d] disabled:opacity-50"
        >
          <Save className="w-4 h-4 inline mr-2" />
          {isSubmitting ? 'Saving...' : session ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}