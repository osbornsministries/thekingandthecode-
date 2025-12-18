// components/admin/dashboard/TicketCategoryChart.tsx
'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { School, User, Baby } from 'lucide-react';

interface CategoryData {
  name: string;
  count: number;
  amount: number;
}

interface TicketCategoryChartProps {
  data: CategoryData[];
}

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

export default function TicketCategoryChart({ data }: TicketCategoryChartProps) {
  // Get icon for category
  const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('student')) return <School size={14} />;
    if (lower.includes('adult')) return <User size={14} />;
    if (lower.includes('kids') || lower.includes('child')) return <Baby size={14} />;
    return null;
  };

  // Prepare data for pie chart
  const pieData = data.map(item => ({
    name: item.name,
    value: item.count,
    amount: item.amount,
    icon: getCategoryIcon(item.name),
  }));

  const totalTickets = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name, props) => {
                if (name === 'value') return [value, 'Tickets'];
                return [value, name];
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  const data = payload[0].payload;
                  return `${data.name}`;
                }
                return label;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {pieData.map((item, index) => (
          <div 
            key={item.name} 
            className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
            style={{ borderLeftColor: COLORS[index % COLORS.length], borderLeftWidth: 4 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md flex items-center justify-center"
                     style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}>
                  {item.icon || <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.value} tickets</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">TZS {item.amount.toLocaleString()}</p>
                <p className="text-xs text-gray-500">
                  {totalTickets > 0 ? ((item.value / totalTickets) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}