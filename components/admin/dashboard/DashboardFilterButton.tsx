// components/admin/dashboard/DashboardFilterButton.tsx
'use client';

import { Filter } from 'lucide-react';

interface DashboardFilterButtonProps {
  activeFilterCount: number;
  onClick: () => void;
}

export default function DashboardFilterButton({ 
  activeFilterCount, 
  onClick 
}: DashboardFilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className="relative w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
      title={activeFilterCount > 0 ? `${activeFilterCount} active filters` : 'Open filters'}
    >
      <Filter size={22} />
      
      {activeFilterCount > 0 && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white shadow-md">
          {activeFilterCount}
        </div>
      )}
    </button>
  );
}