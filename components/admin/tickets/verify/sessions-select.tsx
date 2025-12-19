// components/sessions-select.tsx
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/db/db';
import { eventSessions, eventDays } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

interface Session {
  id: number;
  name: string;
  dayId: number;
  dayName: string;
}

export function SessionsSelect({ value, onChange }: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const results = await db
        .select({
          id: eventSessions.id,
          name: eventSessions.name,
          dayId: eventSessions.dayId,
          dayName: eventDays.name
        })
        .from(eventSessions)
        .innerJoin(eventDays, eq(eventSessions.dayId, eventDays.id))
        .orderBy(eventDays.date, 'asc');

      setSessions(results);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <select
        value={value}
        disabled
        className="w-full p-2 border border-gray-300 rounded-lg"
      >
        <option>Loading sessions...</option>
      </select>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2 border border-gray-300 rounded-lg"
    >
      <option value="">All Sessions</option>
      {sessions.map(session => (
        <option key={session.id} value={session.id}>
          {session.name} ({session.dayName})
        </option>
      ))}
    </select>
  );
}