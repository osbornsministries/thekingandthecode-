import { db } from '@/lib/db/db';
import { tickets, adults, students, children } from '@/lib/drizzle/schema';
import { count, sum, eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { 
  Ticket, 
  TrendingUp, 
  Activity, 
  CheckCircle, 
  BarChart3, 
  Download,
  RefreshCw 
} from 'lucide-react';
import StatsCard from '@/components/admin/dashboard/StatsCard';
import TicketTypeBreakdown from '@/components/admin/dashboard/TicketTypeBreakdown'; 
import RecentSalesTable from '@/components/admin/dashboard/RecentSalesTable'; 
import AdminLayout from '@/components/admin/AdminLayout';

// --- HELPER FUNCTIONS ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getPercentageChange = (previous: number, current: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

// --- TYPES ---
interface DashboardData {
  totalRevenue: number;
  totalOrders: number;   // Count of Ticket Invoices
  totalHeadcount: number; // Count of Actual People (Adults + Students + Kids)
  totalAttended: number; // Count of Scanned People
  averageOrderValue: number;
  weeklyComparison: {
    revenueChange: number;
    ordersChange: number;
    attendanceChange: number;
  };
  ticketTypeBreakdown: Record<string, number>; // Grouped by Ticket Category (VIP/Regular)
  recentTickets: any[];
  topTickets: Array<{ type: string; count: number; revenue: number }>;
}

// --- DATA FETCHING ---
async function fetchDashboardData(dateRange?: { start: Date; end: Date }): Promise<DashboardData> {
  const today = new Date();
  const startDate = dateRange?.start || new Date(new Date().setDate(today.getDate() - 30));
  const endDate = dateRange?.end || new Date();
  
  // Previous Period (for comparisons)
  const lastWeekStart = new Date(startDate);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(endDate);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

  try {
    const [
      // 1. REVENUE & ORDERS (Current)
      currentRevenueRes,
      currentOrdersRes,

      // 2. HEADCOUNT (Current - Sum of all types)
      adultsCount, studentsCount, childrenCount,

      // 3. ATTENDANCE (Current - Sum of isUsed=true)
      adultsUsed, studentsUsed, childrenUsed,

      // 4. PREVIOUS PERIOD STATS (For comparison)
      lastRevenueRes,
      lastOrdersRes,
      // (Simplified: We compare orders vs orders for trend, calculating separate headcount history is heavy)
      
      // 5. BREAKDOWNS
      ticketTypeRes, // Group by Ticket Category (VIP, REGULAR)
      recentTicketsRes,
      topTicketsRes
    ] = await Promise.all([
      // Current Revenue
      db.select({ value: sum(tickets.totalAmount) }).from(tickets)
        .where(and(eq(tickets.paymentStatus, 'PAID'), gte(tickets.createdAt, startDate), lte(tickets.createdAt, endDate))),
      
      // Current Orders
      db.select({ value: count() }).from(tickets)
        .where(and(eq(tickets.paymentStatus, 'PAID'), gte(tickets.createdAt, startDate), lte(tickets.createdAt, endDate))),
      
      // Current Headcount (People)
      db.select({ value: count() }).from(adults),   // Add date filter if adults table has createdAt, otherwise implies total
      db.select({ value: count() }).from(students),
      db.select({ value: count() }).from(children),

      // Current Attendance (Scanned)
      db.select({ value: count() }).from(adults).where(eq(adults.isUsed, true)),
      db.select({ value: count() }).from(students).where(eq(students.isUsed, true)),
      db.select({ value: count() }).from(children).where(eq(children.isUsed, true)),

      // Last Period Revenue
      db.select({ value: sum(tickets.totalAmount) }).from(tickets)
        .where(and(eq(tickets.paymentStatus, 'PAID'), gte(tickets.createdAt, lastWeekStart), lte(tickets.createdAt, lastWeekEnd))),
      
      // Last Period Orders
      db.select({ value: count() }).from(tickets)
        .where(and(eq(tickets.paymentStatus, 'PAID'), gte(tickets.createdAt, lastWeekStart), lte(tickets.createdAt, lastWeekEnd))),

      // Breakdown by Ticket Type (VIP/Regular)
      // Note: This relies on 'ticketType' existing in your tickets table schema
      db.select({ type: tickets.ticketType, count: count() }).from(tickets)
        .where(and(eq(tickets.paymentStatus, 'PAID'), gte(tickets.createdAt, startDate), lte(tickets.createdAt, endDate)))
        .groupBy(tickets.ticketType),

      // Recent Sales
      db.select().from(tickets)
        .where(and(eq(tickets.paymentStatus, 'PAID'), gte(tickets.createdAt, startDate), lte(tickets.createdAt, endDate)))
        .orderBy(desc(tickets.createdAt)).limit(10),

      // Top Revenue Categories
      db.select({ type: tickets.ticketType, count: count(), revenue: sum(tickets.totalAmount) }).from(tickets)
        .where(and(eq(tickets.paymentStatus, 'PAID'), gte(tickets.createdAt, startDate), lte(tickets.createdAt, endDate)))
        .groupBy(tickets.ticketType).orderBy(desc(sum(tickets.totalAmount))).limit(3)
    ]);

    // CALCULATIONS
    const totalRevenue = Number(currentRevenueRes[0]?.value || 0);
    const totalOrders = currentOrdersRes[0]?.value || 0;
    
    // Summing up the separate tables for Headcount
    const totalHeadcount = (adultsCount[0]?.value || 0) + (studentsCount[0]?.value || 0) + (childrenCount[0]?.value || 0);
    
    // Summing up separate tables for Attendance
    const totalAttended = (adultsUsed[0]?.value || 0) + (studentsUsed[0]?.value || 0) + (childrenUsed[0]?.value || 0);

    const lastRevenue = Number(lastRevenueRes[0]?.value || 0);
    const lastOrders = lastOrdersRes[0]?.value || 0;

    return {
      totalRevenue,
      totalOrders,
      totalHeadcount,
      totalAttended,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      weeklyComparison: {
        revenueChange: getPercentageChange(lastRevenue, totalRevenue),
        ordersChange: getPercentageChange(lastOrders, totalOrders),
        // Simplification: Using Orders change as proxy for attendance trend to avoid complex historical queries on sub-tables
        attendanceChange: getPercentageChange(lastOrders, totalOrders) 
      },
      ticketTypeBreakdown: ticketTypeRes.reduce((acc, curr) => {
        acc[curr.type || 'Unknown'] = curr.count;
        return acc;
      }, {} as Record<string, number>),
      recentTickets: recentTicketsRes,
      topTickets: topTicketsRes.map(t => ({ 
        type: t.type || 'Standard', 
        count: t.count, 
        revenue: Number(t.revenue || 0) 
      }))
    };

  } catch (error) {
    console.error("❌ Dashboard Fetch Error:", error);
    return {
      totalRevenue: 0, totalOrders: 0, totalHeadcount: 0, totalAttended: 0, averageOrderValue: 0,
      weeklyComparison: { revenueChange: 0, ordersChange: 0, attendanceChange: 0 },
      ticketTypeBreakdown: {}, recentTickets: [], topTickets: []
    };
  }
}

// --- MAIN PAGE ---
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  let dateRange;
  if (params?.startDate && params?.endDate) {
    dateRange = {
      start: new Date(params.startDate as string),
      end: new Date(params.endDate as string)
    };
  }

  const data = await fetchDashboardData(dateRange);

  const stats = [
    { 
      title: 'Total Revenue', 
      value: formatCurrency(data.totalRevenue), 
      change: `${data.weeklyComparison.revenueChange > 0 ? '+' : ''}${data.weeklyComparison.revenueChange}%`, 
      isPositive: data.weeklyComparison.revenueChange >= 0, 
      icon: TrendingUp, 
      color: 'bg-green-600'
    },
    { 
      title: 'Total Guests (Headcount)', 
      value: data.totalHeadcount.toString(), 
      change: `${data.weeklyComparison.ordersChange > 0 ? '+' : ''}${data.weeklyComparison.ordersChange}%`, 
      isPositive: data.weeklyComparison.ordersChange >= 0, 
      icon: Ticket, 
      color: 'bg-[#A81010]'
    },
    { 
      title: 'Checked In', 
      value: data.totalAttended.toString(), 
      change: `Live Count`, 
      isPositive: true, 
      icon: CheckCircle, 
      color: 'bg-blue-600'
    },
    { 
      title: 'Avg. Order Value', 
      value: formatCurrency(data.averageOrderValue), 
      change: 'TZS', 
      isPositive: true, 
      icon: Activity, 
      color: 'bg-orange-500'
    },
  ];

  return (
    <AdminLayout>
        <div className="space-y-8">
        
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full animate-pulse flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-600"></span> Live
                </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Real-time sales and attendance analytics</p>
            </div>
            
            <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                <Download size={16} /> Export Report
            </button>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
            <StatsCard key={i} {...stat} />
            ))}
        </div>

        {/* Charts / Data Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-lg text-gray-900">Ticket Breakdown</h2>
                <BarChart3 size={20} className="text-gray-400" />
            </div>
            <TicketTypeBreakdown 
                breakdown={data.ticketTypeBreakdown} 
                totalTickets={data.totalHeadcount} // Use Headcount for percentages
                topTickets={data.topTickets} 
            />
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-lg text-gray-900">Top Packages</h2>
                <TrendingUp size={20} className="text-gray-400" />
            </div>
            <div className="space-y-4">
                {data.topTickets.length > 0 ? data.topTickets.map((t, idx) => (
                <div key={t.type} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-sm shadow-sm border border-gray-100 text-gray-700">
                        {idx + 1}
                        </div>
                        <div>
                        <p className="font-bold text-gray-900">{t.type}</p>
                        <p className="text-xs text-gray-500">{t.count} Sales</p>
                        </div>
                    </div>
                    <p className="font-bold text-[#A81010]">{formatCurrency(t.revenue)}</p>
                </div>
                )) : <p className="text-sm text-gray-400 text-center py-4">No sales data recorded yet.</p>}
            </div>
            </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-lg text-gray-900">Recent Sales</h2>
            <button className="text-gray-600 text-sm font-medium flex items-center gap-2 hover:text-[#A81010] transition-colors">
                <RefreshCw size={14} /> Refresh
            </button>
            </div>
            <RecentSalesTable tickets={data.recentTickets} />
        </div>

        </div>
    </AdminLayout>
  );
}