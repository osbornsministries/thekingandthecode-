// components/frontend/tickets/steps/StepSessionSelection.tsx
import { Clock, Users, Check, X } from 'lucide-react';

interface Session {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  dayId: number;
  isActive: boolean;
}

interface Props {
  sessions: Session[];
  selectedSessionId: number | null;
  onSelect: (sessionId: number) => void;
  selectedDayId?: number;
}

export default function StepSessionSelection({
  sessions,
  selectedSessionId,
  onSelect,
  selectedDayId
}: Props) {

  // Filter by selected day
  const filteredSessions = selectedDayId
    ? sessions.filter(session => session.dayId === selectedDayId)
    : sessions;

  // Format time
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

  // Duration helper
  const calculateDuration = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    const h = Math.floor(duration / 60);
    const m = duration % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} hr`;
    return `${h} hr ${m} min`;
  };

  // Handle select
  const handleSessionSelect = (session: Session) => {
    if (!session.isActive) return; // SOLD OUT
    onSelect(session.id);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-serif font-bold text-gray-800 mb-2">
          Select Time Slot
        </h3>
        <p className="text-gray-600">
          Choose your preferred session time
        </p>
      </div>

      {/* Sessions */}
      <div className="grid gap-4">
        {filteredSessions.map((session) => {
          const soldOut = !session.isActive;

          return (
            <button
              key={session.id}
              onClick={() => handleSessionSelect(session)}
              disabled={soldOut}
              className={`relative p-5 rounded-xl border-2 flex justify-between items-start transition-all duration-300 ${
                selectedSessionId === session.id
                  ? 'border-[#A81010] bg-[#A81010]/5 shadow-lg scale-[1.02]'
                  : soldOut
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-300 hover:border-gray-400 bg-white hover:shadow-md'
              }`}
            >
              {/* SOLD OUT badge */}
              {soldOut && (
                <div className="absolute top-3 right-3 z-10">
                  <span className="bg-gray-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                    <X size={12} />
                    SOLD OUT
                  </span>
                </div>
              )}

              {/* Left content */}
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-lg ${
                    selectedSessionId === session.id
                      ? 'bg-[#A81010]/10'
                      : soldOut
                      ? 'bg-gray-200'
                      : 'bg-gray-100'
                  }`}
                >
                  <Clock
                    size={24}
                    className={
                      selectedSessionId === session.id
                        ? 'text-[#A81010]'
                        : soldOut
                        ? 'text-gray-400'
                        : 'text-gray-600'
                    }
                  />
                </div>

                <div className="text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <p
                      className={`font-bold text-lg ${
                        soldOut
                          ? 'text-gray-500 line-through'
                          : 'text-gray-800'
                      }`}
                    >
                      {session.name}
                    </p>

                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${
                        soldOut
                          ? 'bg-gray-200 text-gray-500'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {calculateDuration(session.startTime, session.endTime)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm mt-2">
                    <div className={`flex items-center gap-1 ${soldOut ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Clock size={14} />
                      <span>{formatTime(session.startTime)}</span>
                    </div>
                    <span className="text-gray-400">→</span>
                    <div className={`flex items-center gap-1 ${soldOut ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Clock size={14} />
                      <span>{formatTime(session.endTime)}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Users size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {soldOut ? 'No spots available' : 'Limited spots available'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right indicator */}
              <div
                className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                  selectedSessionId === session.id
                    ? 'bg-[#A81010] border-[#A81010]'
                    : soldOut
                    ? 'border-gray-300 bg-gray-300'
                    : 'border-gray-400'
                }`}
              >
                {selectedSessionId === session.id && (
                  <Check size={14} className="text-white" />
                )}
                {soldOut && (
                  <X size={14} className="text-gray-500" />
                )}
              </div>
            </button>
          );
        })}

        {/* Empty state */}
        {filteredSessions.length === 0 && (
          <div className="text-center p-8 border border-gray-300 rounded-xl bg-gray-50">
            <Clock size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 font-medium">
              {selectedDayId
                ? 'No sessions available for this day'
                : 'No sessions available'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {selectedDayId
                ? 'Please select a different day'
                : 'Please check back later'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
