import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  icon: LucideIcon;
  color: string; // Tailwind gradient class like 'from-blue-500 to-blue-600'
  trendDescription?: string;
  loading?: boolean;
  className?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  change, 
  isPositive, 
  icon: Icon, 
  color,
  trendDescription = 'vs last week',
  loading = false,
  className = ''
}: StatsCardProps) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 flex items-start justify-between ${className}`}>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
          {loading ? (
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            title
          )}
        </p>
        
        {loading ? (
          <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse mb-3"></div>
        ) : (
          <h3 className="text-3xl font-bold text-gray-900 mb-3">{value}</h3>
        )}
        
        {loading ? (
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
        ) : (
          <div className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'} flex items-center gap-2`}>
            <div className={`flex items-center justify-center w-6 h-6 rounded-full ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
              {isPositive ? (
                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
            </div>
            <span className="font-bold">{isPositive ? '+' : ''}{change}</span>
            <span className="text-gray-500 font-normal text-xs">{trendDescription}</span>
          </div>
        )}
      </div>
      
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center shadow-lg ml-4 flex-shrink-0 ${loading ? 'opacity-50' : ''}`}>
        {loading ? (
          <div className="w-6 h-6 bg-white/30 rounded animate-pulse"></div>
        ) : (
          <Icon size={28} className="opacity-90" />
        )}
      </div>
    </div>
  );
}

// Optional: Export a skeleton loader component for consistency
export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start justify-between">
      <div className="flex-1">
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse mb-4"></div>
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg ml-4 flex-shrink-0">
        <div className="w-6 h-6 bg-white/30 rounded animate-pulse"></div>
      </div>
    </div>
  );
}