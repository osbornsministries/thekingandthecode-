// components/frontend/tickets/steps/StepDaySelection.tsx
import { Calendar, Check } from 'lucide-react';

interface Props {
  days: any[]; // Array of eventDays from DB
  selectedDayId: number | null;
  onSelect: (dayId: number) => void;
}

export default function StepDaySelection({ days, selectedDayId, onSelect }: Props) {
  // Filter to show only active days
  const activeDays = days.filter(day => day.isActive);

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

  return (
    <div className="space-y-4">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-serif font-bold text-gray-800 mb-2">Select Event Day</h3>
        <p className="text-gray-600">Choose the day you want to attend</p>
      </div>
      
      <div className="grid gap-4">
        {activeDays.map((day) => (
          <button
            key={day.id}
            onClick={() => onSelect(day.id)}
            className={`relative p-5 rounded-xl border-2 flex justify-between items-start transition-all duration-300 hover:shadow-md ${
              selectedDayId === day.id 
                ? 'border-[#A81010] bg-[#A81010]/5 shadow-lg scale-[1.02]' 
                : 'border-gray-300 hover:border-gray-400 bg-white'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${
                selectedDayId === day.id ? 'bg-[#A81010]/10' : 'bg-gray-100'
              }`}>
                <Calendar className={`${selectedDayId === day.id ? 'text-[#A81010]' : 'text-gray-600'}`} size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-lg text-gray-800">{day.name}</p>
                <p className="text-sm text-gray-500 mt-1">{formatDate(day.date)}</p>
                <div className="mt-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    day.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {day.isActive ? 'Available' : 'Closed'}
                  </span>
                </div>
              </div>
            </div>
            <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
              selectedDayId === day.id ? 'bg-[#A81010] border-[#A81010]' : 'border-gray-400'
            }`}>
              {selectedDayId === day.id && <Check size={14} className="text-white" />}
            </div>
          </button>
        ))}
        
        {activeDays.length === 0 && (
          <div className="text-center p-8 border border-gray-300 rounded-xl bg-gray-50">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 font-medium">No event days available</p>
            <p className="text-gray-400 text-sm mt-1">Please check back later</p>
          </div>
        )}
      </div>
    </div>
  );
}