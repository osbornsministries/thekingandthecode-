// components/frontend/tickets/steps/StepDaySelection.tsx
import { Calendar, Check, X } from 'lucide-react';

interface Props {
  days: any[]; // Array of eventDays from DB
  selectedDayId: number | null;
  onSelect: (dayId: number) => void;
}

export default function StepDaySelection({ days, selectedDayId, onSelect }: Props) {
  // Filter to show only active days
  const activeDays = days.filter(day => day.isActive);
  
  // Define sold out days (Day 3 in this case)
  const SOLD_OUT_DAYS = [3];

  // Format date nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Check if a day is sold out
  const isSoldOut = (dayId: number) => {
    return SOLD_OUT_DAYS.includes(dayId);
  };

  // Handle day selection
  const handleDaySelect = (dayId: number) => {
    if (isSoldOut(dayId)) {
      // Don't call onSelect for sold out days
      return;
    }
    onSelect(dayId);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-serif font-bold text-gray-800 mb-2">Select Event Day</h3>
        <p className="text-gray-600">Choose the day you want to attend</p>
      </div>
      
      <div className="grid gap-4">
        {activeDays.map((day) => {
          const soldOut = isSoldOut(day.id);
          
          return (
            <button
              key={day.id}
              onClick={() => handleDaySelect(day.id)}
              disabled={soldOut}
              className={`relative p-5 rounded-xl border-2 flex justify-between items-start transition-all duration-300 ${
                selectedDayId === day.id 
                  ? 'border-[#A81010] bg-[#A81010]/5 shadow-lg scale-[1.02]' 
                  : soldOut
                  ? 'border-gray-200 bg-gray-50/50 cursor-not-allowed'
                  : 'border-gray-300 hover:border-gray-400 bg-white hover:shadow-md'
              }`}
            >
              {soldOut && (
                <div className="absolute top-3 right-3 z-10">
                  <span className="bg-gray-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                    <X size={12} />
                    SOLD OUT
                  </span>
                </div>
              )}
              
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${
                  selectedDayId === day.id 
                    ? 'bg-[#A81010]/10' 
                    : soldOut
                    ? 'bg-gray-200'
                    : 'bg-gray-100'
                }`}>
                  <Calendar className={
                    selectedDayId === day.id 
                      ? 'text-[#A81010]' 
                      : soldOut
                      ? 'text-gray-400'
                      : 'text-gray-600'
                  } size={24} />
                </div>
                <div className="text-left">
                  <p className={`font-bold text-lg ${
                    soldOut ? 'text-gray-500 line-through' : 'text-gray-800'
                  }`}>
                    {day.name}
                  </p>
                  <p className={`text-sm mt-1 ${
                    soldOut ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {formatDate(day.date)}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      soldOut
                        ? 'bg-gray-200 text-gray-500'
                        : day.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500'
                    }`}>
                      {soldOut ? 'Sold Out' : (day.isActive ? 'Available' : 'Closed')}
                    </span>
                    {soldOut && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                        Unavailable
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                selectedDayId === day.id 
                  ? 'bg-[#A81010] border-[#A81010]' 
                  : soldOut
                  ? 'border-gray-300 bg-gray-300 cursor-not-allowed'
                  : 'border-gray-400'
              }`}>
                {selectedDayId === day.id && <Check size={14} className="text-white" />}
                {soldOut && <X size={14} className="text-gray-500" />}
              </div>
            </button>
          );
        })}
        
        {activeDays.length === 0 && (
          <div className="text-center p-8 border border-gray-300 rounded-xl bg-gray-50">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 font-medium">No event days available</p>
            <p className="text-gray-400 text-sm mt-1">Please check back later</p>
          </div>
        )}

        {/* Optional: Show sold out days count */}
        {activeDays.some(day => isSoldOut(day.id)) && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Some days are marked as <span className="font-medium text-gray-600">Sold Out</span> and cannot be selected
            </p>
          </div>
        )}
      </div>
    </div>
  );
}