// 'use client';

// import { useState, useEffect } from 'react';
// import { Calendar, ChevronDown, X } from 'lucide-react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { formatDate } from '@/lib/utils/utils';

// const PRESET_RANGES = [
//   { label: 'Today', days: 0 },
//   { label: 'Last 7 days', days: 7 },
//   { label: 'Last 30 days', days: 30 },
//   { label: 'Last 90 days', days: 90 },
//   { label: 'This Month', custom: true },
//   { label: 'Last Month', custom: true },
//   { label: 'Custom Range', custom: true }
// ] as const;

// interface DateRangePickerProps {
//   initialStart?: Date;
//   initialEnd?: Date;
//   className?: string;
// }

// export default function DateRangePicker({ 
//   initialStart, 
//   initialEnd,
//   className = '' 
// }: DateRangePickerProps) {
//   const router = useRouter();
//   const searchParams = useSearchParams();
  
//   const [isOpen, setIsOpen] = useState(false);
//   const [startDate, setStartDate] = useState<Date>(initialStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
//   const [endDate, setEndDate] = useState<Date>(initialEnd || new Date());
//   const [tempStart, setTempStart] = useState<Date>(startDate);
//   const [tempEnd, setTempEnd] = useState<Date>(endDate);

//   // Sync temp dates with actual dates when they change
//   useEffect(() => {
//     setTempStart(startDate);
//     setTempEnd(endDate);
//   }, [startDate, endDate]);

//   const updateQueryParams = (start: Date, end: Date) => {
//     const params = new URLSearchParams(searchParams.toString());
//     params.set('startDate', start.toISOString().split('T')[0]);
//     params.set('endDate', end.toISOString().split('T')[0]);
    
//     router.push(`?${params.toString()}`, { scroll: false });
//   };

//   const handlePresetSelect = (preset: typeof PRESET_RANGES[number]) => {
//     const now = new Date();
//     let start = new Date();
//     let end = new Date();

//     if (preset.days !== undefined) {
//       start.setDate(now.getDate() - preset.days);
//       start.setHours(0, 0, 0, 0);
//       end.setHours(23, 59, 59, 999);
//     } else if (preset.label === 'This Month') {
//       start = new Date(now.getFullYear(), now.getMonth(), 1);
//       end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
//       end.setHours(23, 59, 59, 999);
//     } else if (preset.label === 'Last Month') {
//       start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
//       end = new Date(now.getFullYear(), now.getMonth(), 0);
//       end.setHours(23, 59, 59, 999);
//     } else {
//       // Custom Range - keep current dates
//       return;
//     }

//     setStartDate(start);
//     setEndDate(end);
//     updateQueryParams(start, end);
//     setIsOpen(false);
//   };

//   const handleApplyCustomRange = () => {
//     let finalStart = tempStart;
//     let finalEnd = tempEnd;

//     // Swap dates if start is after end
//     if (tempStart > tempEnd) {
//       finalStart = tempEnd;
//       finalEnd = tempStart;
//     }

//     setStartDate(finalStart);
//     setEndDate(finalEnd);
//     updateQueryParams(finalStart, finalEnd);
//     setIsOpen(false);
//   };

//   const handleReset = () => {
//     const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
//     const today = new Date();
    
//     setStartDate(thirtyDaysAgo);
//     setEndDate(today);
    
//     const params = new URLSearchParams(searchParams.toString());
//     params.delete('startDate');
//     params.delete('endDate');
//     router.push(`?${params.toString()}`, { scroll: false });
//     setIsOpen(false);
//   };

//   const formatDisplayDate = () => {
//     const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
//     const today = new Date();
    
//     // Check if it's the default "Last 30 days"
//     if (
//       startDate.toDateString() === thirtyDaysAgo.toDateString() && 
//       endDate.toDateString() === today.toDateString()
//     ) {
//       return 'Last 30 days';
//     }
    
//     // Check if it's a single day
//     if (startDate.toDateString() === endDate.toDateString()) {
//       return formatDate(startDate);
//     }
    
//     return `${formatDate(startDate)} - ${formatDate(endDate)}`;
//   };

//   const getDaysDifference = () => {
//     const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
//     return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//   };

//   // Calculate days for temp dates
//   const getTempDaysDifference = () => {
//     const diffTime = Math.abs(tempEnd.getTime() - tempStart.getTime());
//     return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//   };

//   return (
//     <div className={`relative ${className}`}>
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
//       >
//         <Calendar size={16} className="text-gray-500" />
//         <span className="font-medium">{formatDisplayDate()}</span>
//         <ChevronDown 
//           size={16} 
//           className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
//         />
//       </button>

//       {isOpen && (
//         <>
//           {/* Backdrop */}
//           <div 
//             className="fixed inset-0 z-40" 
//             onClick={() => setIsOpen(false)}
//           />
          
//           {/* Dropdown */}
//           <div className="absolute top-full right-0 mt-2 z-50 w-96 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
//             <div className="p-4 border-b border-gray-100">
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="font-bold text-gray-900">Select Date Range</h3>
//                 <button
//                   onClick={() => setIsOpen(false)}
//                   className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
//                 >
//                   <X size={18} className="text-gray-500" />
//                 </button>
//               </div>
              
//               <div className="grid grid-cols-2 gap-2">
//                 {PRESET_RANGES.map((preset) => (
//                   <button
//                     key={preset.label}
//                     onClick={() => handlePresetSelect(preset)}
//                     className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
//                       (preset.label === 'Last 30 days' && formatDisplayDate() === 'Last 30 days') ||
//                       (preset.label !== 'Last 30 days' && preset.label === formatDisplayDate())
//                         ? 'bg-[#A81010] text-white'
//                         : 'text-gray-700 hover:bg-gray-100'
//                     }`}
//                   >
//                     {preset.label}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* Custom Date Picker */}
//             <div className="p-4 border-b border-gray-100">
//               <h4 className="text-sm font-semibold text-gray-700 mb-3">Custom Range</h4>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-xs font-medium text-gray-500 mb-1">
//                     From Date
//                   </label>
//                   <input
//                     type="date"
//                     value={tempStart.toISOString().split('T')[0]}
//                     onChange={(e) => setTempStart(new Date(e.target.value))}
//                     max={tempEnd.toISOString().split('T')[0]}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#A81010] focus:ring-1 focus:ring-[#A81010] outline-none transition-colors"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-xs font-medium text-gray-500 mb-1">
//                     To Date
//                   </label>
//                   <input
//                     type="date"
//                     value={tempEnd.toISOString().split('T')[0]}
//                     onChange={(e) => setTempEnd(new Date(e.target.value))}
//                     min={tempStart.toISOString().split('T')[0]}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#A81010] focus:ring-1 focus:ring-[#A81010] outline-none transition-colors"
//                   />
//                 </div>
//               </div>
//               <div className="mt-3 text-xs text-gray-500">
//                 Selected: {getTempDaysDifference()} days
//               </div>
//             </div>

//             {/* Actions */}
//             <div className="p-4 bg-gray-50 flex justify-between">
//               <button
//                 onClick={handleReset}
//                 className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
//               >
//                 Reset to default
//               </button>
//               <div className="flex gap-2">
//                 <button
//                   onClick={() => setIsOpen(false)}
//                   className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleApplyCustomRange}
//                   className="px-4 py-2 bg-[#A81010] text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
//                 >
//                   Apply Dates
//                 </button>
//               </div>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }