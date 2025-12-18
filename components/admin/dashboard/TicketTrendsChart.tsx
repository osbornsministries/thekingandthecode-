// components/admin/dashboard/TicketTrendsChart.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DailyData {
  date: string;
  tickets: number;
  revenue: number;
}

interface TicketTrendsChartProps {
  data: DailyData[];
}

export default function TicketTrendsChart({ data }: TicketTrendsChartProps) {
  // Format data for chart
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    tickets: item.tickets,
    revenue: Math.round(item.revenue / 1000), // Convert to thousands for better scaling
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          stroke="#6b7280"
          fontSize={12}
        />
        <YAxis 
          yAxisId="left"
          stroke="#6b7280"
          fontSize={12}
          label={{ value: 'Tickets', angle: -90, position: 'insideLeft' }}
        />
        <YAxis 
          yAxisId="right"
          orientation="right"
          stroke="#6b7280"
          fontSize={12}
          label={{ value: 'Revenue (x1000 TZS)', angle: 90, position: 'insideRight' }}
        />
        <Tooltip 
          formatter={(value, name) => {
            if (name === 'revenue') return [`${Number(value) * 1000} TZS`, 'Revenue'];
            return [value, name === 'tickets' ? 'Tickets' : name];
          }}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend />
        <Line 
          yAxisId="left"
          type="monotone"
          dataKey="tickets"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          name="Tickets"
        />
        <Line 
          yAxisId="right"
          type="monotone"
          dataKey="revenue"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          name="Revenue"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}