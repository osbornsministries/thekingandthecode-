// components/frontend/tickets/steps/StepSessionSelection.tsx
import { Clock, Users, Check } from 'lucide-react';

interface Session {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  dayId: number;
}

interface Props {
  sessions: Session[]; // Array of eventSessions from DB
  selectedSessionId: number | null;
  onSelect: (sessionId: number) => void;
  selectedDayId?: number; // Optional: Filter sessions by day
}

export default function StepSessionSelection({ 
  sessions, 
  selectedSessionId, 
  onSelect,
  selectedDayId 
}: Props) {
  // Filter sessions by selected day if provided
  const filteredSessions = selectedDayId
    ? sessions.filter(session => session.dayId === selectedDayId)
    : sessions;

  // Format time to be more readable
const formatTime = (timeString: string) => {
  const [hours, minutes] = timeString.split(':');

  const date = new Date();
  date.setHours(parseInt(hours, 10), parseInt(minutes, 10));

  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};


  // Calculate duration
  const calculateDuration = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startTotal = startHour * 60 + startMinute;
    const endTotal = endHour * 60 + endMinute;
    
    const durationMinutes = endTotal - startTotal;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} hr`;
    return `${hours} hr ${minutes} min`;
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-serif font-bold text-gray-800 mb-2">Select Time Slot</h3>
        <p className="text-gray-600">Choose your preferred session time</p>
      </div>
      
      <div className="grid gap-4">
        {filteredSessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelect(session.id)}
            className={`relative p-5 rounded-xl border-2 flex justify-between items-start transition-all duration-300 hover:shadow-md ${
              selectedSessionId === session.id 
                ? 'border-[#A81010] bg-[#A81010]/5 shadow-lg scale-[1.02]' 
                : 'border-gray-300 hover:border-gray-400 bg-white'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${
                selectedSessionId === session.id ? 'bg-[#A81010]/10' : 'bg-gray-100'
              }`}>
                <Clock className={`${selectedSessionId === session.id ? 'text-[#A81010]' : 'text-gray-600'}`} size={24} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-lg text-gray-800">{session.name}</p>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {calculateDuration(session.startTime, session.endTime)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 mt-2">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{formatTime(session.startTime)}</span>
                  </div>
                  <span className="text-gray-400">→</span>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{formatTime(session.endTime)}</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Users size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-500">Limited spots available</span>
                </div>
              </div>
            </div>
            <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
              selectedSessionId === session.id ? 'bg-[#A81010] border-[#A81010]' : 'border-gray-400'
            }`}>
              {selectedSessionId === session.id && <Check size={14} className="text-white" />}
            </div>
          </button>
        ))}
        
        {filteredSessions.length === 0 && (
          <div className="text-center p-8 border border-gray-300 rounded-xl bg-gray-50">
            <Clock size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 font-medium">
              {selectedDayId 
                ? "No sessions available for this day" 
                : "No sessions available"
              }
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {selectedDayId 
                ? "Please select a different day" 
                : "Please check back later"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}