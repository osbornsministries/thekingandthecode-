'use client';

import { useState } from 'react';
import { EventDay } from '@/lib/actions/setting/admin-actions';
import { Save, X, Trash2 } from 'lucide-react';

interface EventDayFormProps {
  day?: EventDay;
  onSubmit: (data: any) => Promise<{ success: boolean; error?: string }>;
  onDelete?: (id: number) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
}

export default function EventDayForm({ day, onSubmit, onDelete, onCancel }: EventDayFormProps) {
  const [formData, setFormData] = useState({
    name: day?.name || '',
    date: day?.date ? new Date(day.date).toISOString().split('T')[0] : '',
    isActive: day?.isActive ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onSubmit(formData);
      if (!result.success) {
        setError(result.error || 'Failed to save event day');
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
            Day Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder="e.g., Day 1, Opening Day"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
          Active (visible to users)
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

        {day && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(day.id)}
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
          {isSubmitting ? 'Saving...' : day ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}