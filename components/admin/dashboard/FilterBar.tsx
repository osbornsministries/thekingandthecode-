// components/admin/dashboard/FilterBar.tsx
'use client';

import { X, Filter } from 'lucide-react';

interface FilterChip {
  label: string;
  value: string;
  onRemove: () => void;
  color?: string;
}

interface FilterBarProps {
  filters: FilterChip[];
  onClearAll: () => void;
}

export default function FilterBar({ filters, onClearAll }: FilterBarProps) {
  if (filters.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Filter size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Active Filters</p>
            <p className="text-sm text-gray-500">{filters.length} filter{filters.length !== 1 ? 's' : ''} applied</p>
          </div>
        </div>
        
        <button
          onClick={onClearAll}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={14} /> Clear All
        </button>
      </div>
      
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((filter, index) => (
          <div
            key={index}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
              filter.color || 'bg-blue-50 text-blue-700'
            }`}
          >
            <span className="font-medium">{filter.label}:</span>
            <span>{filter.value}</span>
            <button
              onClick={filter.onRemove}
              className="ml-1 hover:opacity-70 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}