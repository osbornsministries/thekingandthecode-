// components/admin/dashboard/SessionAnalytics.tsx
'use client';

import { CalendarDays, Clock, Users, DollarSign, School, User, Baby } from 'lucide-react';

interface SessionData {
  sessionName: string;
  dayName: string;
  dayDate: string;
  sessionTime: string;
  ticketCount: number;
  totalRevenue: number;
  categories: {
    student?: number;
    adult?: number;
    kids?: number;
  };
}

interface SessionAnalyticsProps {
  data: SessionData[];
}

export default function SessionAnalytics({ data }: SessionAnalyticsProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CalendarDays className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No Session Data</h3>
        <p className="text-gray-500">No successful ticket purchases for sessions in this period.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4">Event Day</th>
            <th className="px-6 py-4">Session</th>
            <th className="px-6 py-4">Time</th>
            <th className="px-6 py-4">Tickets</th>
            <th className="px-6 py-4">Categories</th>
            <th className="px-6 py-4">Revenue</th>
            <th className="px-6 py-4">Avg. Ticket</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((session, index) => {
            const avgTicket = session.ticketCount > 0 
              ? session.totalRevenue / session.ticketCount 
              : 0;
            
            const totalCategories = 
              (session.categories.student || 0) + 
              (session.categories.adult || 0) + 
              (session.categories.kids || 0);

            return (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={14} className="text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{session.dayName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(session.dayDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {session.sessionName}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <span>{session.sessionTime}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-gray-400" />
                    <span className="font-bold">{session.ticketCount}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {session.categories.student && session.categories.student > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                        <School size={12} />
                        <span>{session.categories.student} Student</span>
                      </div>
                    )}
                    {session.categories.adult && session.categories.adult > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs">
                        <User size={12} />
                        <span>{session.categories.adult} Adult</span>
                      </div>
                    )}
                    {session.categories.kids && session.categories.kids > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs">
                        <Baby size={12} />
                        <span>{session.categories.kids} Kids</span>
                      </div>
                    )}
                    {totalCategories === 0 && (
                      <span className="text-xs text-gray-400">No category data</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <DollarSign size={14} className="text-gray-400" />
                    <span className="font-bold text-gray-900">
                      TZS {Math.round(session.totalRevenue).toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">
                      TZS {Math.round(avgTicket).toLocaleString()}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}