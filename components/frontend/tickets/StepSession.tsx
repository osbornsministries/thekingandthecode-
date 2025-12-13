import { Calendar, Clock, Check } from 'lucide-react';

interface Day {
  id: number;
  name: string; // e.g. "Christmas Eve"
  date: string; // e.g. "2024-12-24"
}

interface Session {
  id: number;
  dayId: number;
  name: string; // e.g. "Morning Session"
  startTime: string; // e.g. "08:00"
  endTime: string;   // e.g. "12:00"
}

interface Props {
  days: Day[];
  sessions: Session[];
  selectedDayId: number | null;
  selectedSessionId: number | null;
  onSelectDay: (id: number) => void;
  onSelectSession: (id: number) => void;
}

export default function StepSession({ 
  days, 
  sessions, 
  selectedDayId, 
  selectedSessionId, 
  onSelectDay, 
  onSelectSession 
}: Props) {

  // Filter sessions based on the selected day
  const availableSessions = sessions.filter(s => s.dayId === selectedDayId);

  // Helper to format date nicely (e.g. "Wed, Dec 25")
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* --- SECTION 1: SELECT DAY --- */}
      <div>
        <h3 className="text-xl font-serif font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="text-[#A81010]" size={20} />
          Select Date
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {days.map((day) => (
            <button
              key={day.id}
              onClick={() => {
                onSelectDay(day.id);
                // Optional: Reset session if day changes
                // if (selectedDayId !== day.id) onSelectSession(null); 
              }}
              className={`relative p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                selectedDayId === day.id 
                  ? 'border-[#A81010] bg-[#A81010]/5 shadow-lg scale-[1.02]' 
                  : 'border-gray-300 hover:border-gray-400 bg-white/50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg text-gray-900">{day.name}</p>
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mt-1">
                    {formatDate(day.date)}
                  </p>
                </div>
                {selectedDayId === day.id && (
                  <div className="bg-[#A81010] rounded-full p-1">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* --- SECTION 2: SELECT SESSION --- */}
      {/* Only show this section if a day is selected to keep UI clean */}
      <div className={`transition-all duration-500 ${selectedDayId ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none blur-[1px]'}`}>
        <h3 className="text-xl font-serif font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="text-[#A81010]" size={20} />
          Select Session
        </h3>

        {availableSessions.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {availableSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`relative p-4 rounded-xl border-2 flex justify-between items-center transition-all duration-300 ${
                  selectedSessionId === session.id 
                    ? 'border-[#A81010] bg-[#A81010]/5 shadow-lg' 
                    : 'border-gray-300 hover:border-gray-400 bg-white/50'
                }`}
              >
                <div className="text-left">
                  <p className="font-bold text-gray-800">{session.name}</p>
                  <p className="text-xs text-gray-500 font-medium">
                    {session.startTime} - {session.endTime}
                  </p>
                </div>

                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                  selectedSessionId === session.id 
                    ? 'bg-[#A81010] border-[#A81010]' 
                    : 'border-gray-400'
                }`}>
                  {selectedSessionId === session.id && <Check size={12} className="text-white" />}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50">
            <p className="text-gray-400 text-sm">No sessions available for this date.</p>
          </div>
        )}
      </div>

    </div>
  );
}