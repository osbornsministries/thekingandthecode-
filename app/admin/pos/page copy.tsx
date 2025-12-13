'use client';

import { useState, useEffect } from 'react';
import { getPosDropdownData, generatePosTickets, getPosHistory } from '@/lib/actions/pos-actions';
import { QRCodeSVG } from 'qrcode.react'; // KEEP QR CODE
import { 
  Loader2, Printer, Layout, List, Download, 
  History, RefreshCw, Filter, CheckCircle2, 
  QrCode, Ticket, DollarSign, Calendar, Clock 
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { ThemedTicketPdfA3,SimpleQrGridPdfA3} from '@/components/pdf/TicketPdfTemplates';
import AdminLayout from '@/components/admin/AdminLayout';
// In your PDF component file, export the IMAGE_MAP and getImageKey:

// Then in your POS component, import them:
// import { IMAGE_MAP, getImageKey } from '@/components/pdf/TicketPdfTemplates';
// Dynamic PDF Import
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <span className="text-xs text-gray-400">Loading PDF...</span> }
);

// --- TICKET TYPE INTERFACE ---
export interface TicketType {
  id: number;
  code: string;
  qrValue: string;
  qrImageStr: string; // This should contain the QR code image data
  type: 'ADULT' | 'STUDENT' | 'CHILD';
  price: number;
  createdAt: string;
  sessionId?: number;
  dayId?: number;
  transactionId?: number;
}

// Import or define the same IMAGE_MAP as in PDF component
const IMAGE_MAP: Record<string, string> = {
  // Day 1
  'Day_01_AS_ADULT': '/images/tickets/Day_01/AS/ADULT.png',
  'Day_01_AS_STUDENT': '/images/tickets/Day_01/AS/STUDENT.png',
  'Day_01_AS_KIDS': '/images/tickets/Day_01/AS/KIDS.png',
  'Day_01_ES_ADULT': '/images/tickets/Day_01/ES/ADULT.png',
  'Day_01_ES_STUDENT': '/images/tickets/Day_01/ES/STUDENT.png',
  'Day_01_ES_KIDS': '/images/tickets/Day_01/ES/KIDS.png',
  'Day_01_NS_ADULT': '/images/tickets/Day_01/NS/ADULT.png',
  'Day_01_NS_STUDENT': '/images/tickets/Day_01/NS/STUDENT.png',
  'Day_01_NS_KIDS': '/images/tickets/Day_01/NS/KIDS.png',
  
  // Day 2
  'Day_02_AS_ADULT': '/images/tickets/Day_02/AS/ADULT.png',
  'Day_02_AS_STUDENT': '/images/tickets/Day_02/AS/STUDENT.png',
  'Day_02_AS_KIDS': '/images/tickets/Day_02/AS/KIDS.png',
  'Day_02_ES_ADULT': '/images/tickets/Day_02/ES/ADULT.png',
  'Day_02_ES_STUDENT': '/images/tickets/Day_02/ES/STUDENT.png',
  'Day_02_ES_KIDS': '/images/tickets/Day_02/ES/KIDS.png',
  'Day_02_NS_ADULT': '/images/tickets/Day_02/NS/ADULT.png',
  'Day_02_NS_STUDENT': '/images/tickets/Day_02/NS/STUDENT.png',
  'Day_02_NS_KIDS': '/images/tickets/Day_02/NS/KIDS.png',
  
  // Day 3
  'Day_03_AS_ADULT': '/images/tickets/Day_03/AS/ADULT.png',
  'Day_03_AS_STUDENT': '/images/tickets/Day_03/AS/STUDENT.png',
  'Day_03_AS_KIDS': '/images/tickets/Day_03/AS/KIDS.png',
  'Day_03_ES_ADULT': '/images/tickets/Day_03/ES/ADULT.png',
  'Day_03_ES_STUDENT': '/images/tickets/Day_03/ES/STUDENT.png',
  'Day_03_ES_KIDS': '/images/tickets/Day_03/ES/KIDS.png',
  'Day_03_NS_ADULT': '/images/tickets/Day_03/NS/ADULT.png',
  'Day_03_NS_STUDENT': '/images/tickets/Day_03/NS/STUDENT.png',
  'Day_03_NS_KIDS': '/images/tickets/Day_03/NS/KIDS.png',
  
  // Default fallbacks (if needed)
  'ADULT': '/images/tickets/ADULT.png',
  'STUDENT': '/images/tickets/STUDENT.png',
  'KIDS': '/images/tickets/KIDS.png',
  'CHILD': '/images/tickets/KIDS.png',
};

// --- TICKET PREVIEW CARD COMPONENT ---
interface TicketPreviewCardProps {
  ticket: any;
  viewMode: 'simple' | 'card';
  days?: any[];
  sessions?: any[];
}

// EXACT SAME HELPER FUNCTION AS IN PDF COMPONENT
const getImageKey = (ticket: any, days: any[] = [], sessions: any[] = []) => {
  if (!ticket.dayId || !ticket.sessionId) return ticket.type || 'ADULT';
  
  const day = days.find(d => d.id === ticket.dayId);
  const session = sessions.find(s => s.id === ticket.sessionId);
  
  if (!day || !session) return ticket.type || 'ADULT';
  
  // Extract day number (e.g., "Day 1" -> "01") - EXACT SAME LOGIC
  const dayNumber = day.name.match(/\d+/)?.[0]?.padStart(2, '0') || '01';
  
  // Map session name to AS/ES/NS - EXACT SAME LOGIC
  let sessionCode = 'AS';
  if (session.name.includes('Evening') || session.name.includes('ES')) sessionCode = 'ES';
  if (session.name.includes('Night') || session.name.includes('NS')) sessionCode = 'NS';
  
  // Map ticket type - EXACT SAME LOGIC
  let ticketType = 'ADULT';
  if (ticket.type === 'STUDENT') ticketType = 'STUDENT';
  if (ticket.type === 'CHILD') ticketType = 'KIDS';
  
  const key = `Day_${dayNumber}_${sessionCode}_${ticketType}`;
  return IMAGE_MAP[key] ? key : ticket.type || 'ADULT';
};

// Helper to get the image path
const getTicketBackgroundImage = (ticket: any, days: any[] = [], sessions: any[] = []) => {
  const imageKey = getImageKey(ticket, days, sessions);
  const imagePath = IMAGE_MAP[imageKey];
  
  return {
    path: imagePath,
    fallback: IMAGE_MAP[ticket.type] || IMAGE_MAP.ADULT
  };
};

const TicketPreviewCard = ({ ticket, viewMode, days = [], sessions = [] }: TicketPreviewCardProps) => {
  const { path: bgImage, fallback: fallbackImage } = getTicketBackgroundImage(ticket, days, sessions);
  const dateStr = ticket.createdAt ? new Date(ticket.createdAt).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  }) : '';

  // Handler for image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = fallbackImage;
  };

  if (viewMode === 'simple') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col items-center text-center p-3 hover:shadow-md transition-shadow duration-200 w-full">
        <div className="mb-2">
          {ticket.qrImageStr ? (
            <img 
              src={ticket.qrImageStr} 
              alt="QR Code" 
              className="w-20 h-20 object-contain"
            />
          ) : (
            <QRCodeSVG 
              value={ticket.qrValue} 
              size={80} 
              level="M" 
              bgColor="#FFFFFF"
              fgColor="#000000"
              className="w-20 h-20"
            />
          )}
        </div>
        
        <div className="w-full space-y-1">
          <div className="text-sm font-bold text-gray-800">{ticket.type}</div>
          <div className="text-xs text-gray-600 font-mono">{ticket.code?.slice(0, 12)}</div>
        </div>
      </div>
    );
  }

  // Card view - EXACTLY matching PDF structure
  return (
    <div className="relative flex flex-row w-full max-w-2xl border border-gray-300 rounded-lg overflow-hidden shadow-sm bg-white">
      
      {/* FRONT TICKET (14.5cm equivalent) */}
      <div className="relative w-[calc(14.5cm)] h-[160px] flex-shrink-0">
        <img 
          src={bgImage} 
          alt={`${ticket.type} Ticket`} 
          className="absolute inset-0 w-full h-full object-cover"
          onError={handleImageError}
        />
        
        {/* Ticket Type - Top Right */}
        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded">
          {ticket.type || 'TICKET'}
        </div>
        
        {/* Time Stamp - Top Center */}
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded">
          {dateStr}
        </div>
        
        {/* QR Code - Left Side, Vertical Center (EXACT POSITIONING AS PDF) */}
        <div className="absolute top-1/2 left-[1%] transform -translate-y-1/2">
          {ticket.qrImageStr ? (
            <img 
              src={ticket.qrImageStr} 
              alt="QR Code" 
              className="w-14 h-20" // Same proportions as PDF (40x66)
            />
          ) : (
            <QRCodeSVG 
              value={ticket.qrValue} 
              size={56} 
              level="M"
              bgColor="transparent"
              fgColor="#000000"
              className="w-14 h-20"
            />
          )}
        </div>
        
        {/* Display the image key for debugging */}
        <div className="absolute bottom-2 left-2 text-[8px] bg-black/50 text-white px-1 py-0.5 rounded opacity-70">
          {getImageKey(ticket, days, sessions)}
        </div>
      </div>
      
      {/* BACK TICKET (5.5627cm equivalent) */}
      <div className="relative w-[calc(5.5627cm)] h-[160px] flex-shrink-0 ml-2">
        <img 
          src="/images/tickets/back.png" 
          alt="Ticket Back" 
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E";
          }}
        />
      </div>
    </div>
  );
};

// Export the helper function for reuse
export { getImageKey, IMAGE_MAP };
// --- MAIN COMPONENT ---
export default function PosTerminalPage() {
  // [ALL YOUR EXISTING STATE AND EFFECTS REMAIN THE SAME...]
  // Loading States
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  
  // Data State
  const [days, setDays] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  
  // History & Filter State
  const [historyItems, setHistoryItems] = useState<TicketType[]>([]);
  const [filterDay, setFilterDay] = useState<string>('');
  const [filterSession, setFilterSession] = useState<string>('');
  const [filterGroup, setFilterGroup] = useState<string>('');
  const [filteredHistory, setFilteredHistory] = useState<TicketType[]>([]);

  // Form State
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<'ADULT' | 'STUDENT' | 'CHILD'>('ADULT');
  const [quantity, setQuantity] = useState(1);
  
  // View State
  const [viewMode, setViewMode] = useState<'simple' | 'card'>('simple');
  const [generatedTickets, setGeneratedTickets] = useState<TicketType[] | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    totalTickets: 0,
    totalRevenue: 0,
    todayCount: 0
  });

  // Initialize
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load history when tab changes
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  // Apply filters to history
  useEffect(() => {
    if (historyItems.length > 0) {
      const filtered = historyItems.filter(item => {
        if (!item) return false;
        if (filterDay && item.dayId && item.dayId.toString() !== filterDay) return false;
        if (filterSession && item.sessionId && item.sessionId.toString() !== filterSession) return false;
        if (filterGroup && item.type && item.type !== filterGroup) return false;
        return true;
      });
      setFilteredHistory(filtered);
    }
  }, [historyItems, filterDay, filterSession, filterGroup]);

  const loadInitialData = async () => {
    try {
      const data = await getPosDropdownData();
      if (data.success && data.data) {
        setDays(data.data.days);
        setSessions(data.data.sessions);
        setPrices(data.data.prices);
        
        const adultPrice = data.data.prices.find((p: any) => p.type === 'ADULT');
        if (adultPrice) {
          // Optionally set initial state
        }
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await getPosHistory();
      if (res.success && res.tickets) {
        const tickets = res.tickets;
        
        setHistoryItems(tickets);
        updateStats(tickets);
      } else {
        console.error('Failed to load history:', res.error);
        setHistoryItems([]);
        updateStats([]);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      setHistoryItems([]);
      updateStats([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const updateStats = (tickets: TicketType[]) => {
    const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.price, 0);
    const today = new Date().toISOString().split('T')[0];
    const todayCount = tickets.filter(ticket => 
      ticket.createdAt.startsWith(today)
    ).length;
    
    setStats({
      totalTickets: tickets.length,
      totalRevenue,
      todayCount
    });
  };

  const handleGenerate = async () => {
    if (!selectedDay || !selectedSession) {
      alert("Please select Day and Session");
      return;
    }
    
    setLoading(true);
    setGeneratedTickets(null);

    const currentPriceObj = prices.find(p => p.type === selectedGroup);
    const unitPrice = currentPriceObj ? Number(currentPriceObj.price) : 0;

    try {
      const result = await generatePosTickets({
        dayId: Number(selectedDay),
        sessionId: Number(selectedSession),
        ticketGroup: selectedGroup,
        quantity: Number(quantity),
        unitPrice: unitPrice
      });

      if (result.success) {
        setGeneratedTickets(result.tickets || []);
        // Reload history to update stats
        loadHistory();
      } else {
        alert(result.error || "Failed to generate tickets");
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert("An error occurred while generating tickets");
    } finally {
      setLoading(false);
    }
  };

  const loadFilteredToView = () => {
    if (filteredHistory.length > 0) {
      setGeneratedTickets([...filteredHistory]);
      setViewMode('simple');
    }
  };

  const loadSingleTicket = (ticket: TicketType) => {
    setGeneratedTickets([ticket]);
    setViewMode('card');
  };

  const safeDate = (dateVal: string | Date | null | undefined) => {
    if (!dateVal) return '';
    return new Date(dateVal).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimestamp = () => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const unitPrice = prices.find(p => p.type === selectedGroup)?.price || 0;
  const totalPrice = Number(unitPrice) * quantity;

  // Get sessions filtered by selected day
  const filteredSessions = selectedDay 
    ? sessions.filter(s => s.dayId.toString() === selectedDay)
    : [];

  if (isInitializing) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Loader2 className="animate-spin w-12 h-12 mx-auto text-gray-400" />
            <p className="mt-4 text-gray-500">Loading POS Terminal...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Point of Sale Terminal</h1>
          <p className="text-gray-500 mt-2">Generate and manage walk-in ticket sales</p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalTickets}</p>
                </div>
                <Ticket className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalRevenue.toLocaleString()} TZS</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Today's Sales</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.todayCount}</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* --- LEFT SIDEBAR --- */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-xl border border-gray-100 h-fit flex flex-col max-h-[85vh]">
            
            {/* Tab Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6 shrink-0">
              <button 
                onClick={() => setActiveTab('generate')} 
                className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'generate' ? 'bg-white shadow text-black' : 'text-gray-500'}`}
              >
                <Printer size={16}/> New Sale
              </button>
              <button 
                onClick={() => setActiveTab('history')} 
                className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'history' ? 'bg-white shadow text-black' : 'text-gray-500'}`}
              >
                <History size={16}/> Recent
              </button>
            </div>

            {/* --- TAB: GENERATE --- */}
            {activeTab === 'generate' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-left-4 overflow-y-auto">
                {/* Day Selection */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-2">
                    <Calendar size={12} /> Select Day
                  </label>
                  <select 
                    className="w-full p-3 bg-gray-50 rounded-xl font-medium outline-none border border-transparent focus:border-black transition-colors" 
                    value={selectedDay} 
                    onChange={(e) => { 
                      setSelectedDay(e.target.value); 
                      setSelectedSession(''); 
                    }}
                  >
                    <option value="">-- Choose Day --</option>
                    {days.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({safeDate(d.date)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Session Selection */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-2">
                    <Clock size={12} /> Select Session
                  </label>
                  <select 
                    className="w-full p-3 bg-gray-50 rounded-xl font-medium outline-none border border-transparent focus:border-black transition-colors" 
                    value={selectedSession} 
                    onChange={(e) => setSelectedSession(e.target.value)} 
                    disabled={!selectedDay}
                  >
                    <option value="">-- Choose Time --</option>
                    {filteredSessions.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.startTime})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ticket Type Selection */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2">Ticket Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['ADULT', 'STUDENT', 'CHILD'].map(type => {
                      const typePrice = prices.find(p => p.type === type)?.price || 0;
                      return (
                        <button 
                          key={type}
                          onClick={() => setSelectedGroup(type as any)} 
                          className={`py-3 text-xs font-bold rounded-lg border flex flex-col items-center justify-center transition-all ${selectedGroup === type ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                        >
                          <span>{type}</span>
                          <span className="text-[10px] mt-1 opacity-75">{typePrice.toLocaleString()} TZS</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-1">Quantity</label>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      min={1} 
                      max={50} 
                      value={quantity} 
                      onChange={(e) => setQuantity(Math.max(1, Math.min(50, Number(e.target.value))))} 
                      className="flex-1 p-3 bg-gray-50 rounded-xl font-bold text-lg text-center" 
                    />
                    <button 
                      onClick={() => setQuantity(prev => Math.min(50, prev + 1))}
                      className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Price Summary */}
                <div className="bg-green-50 p-5 rounded-xl text-center border border-green-100">
                  <p className="text-sm text-gray-600 mb-2">Total Amount</p>
                  <div className="text-3xl font-black text-green-800">
                    {totalPrice.toLocaleString()} 
                    <span className="text-base font-normal ml-2">TZS</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {quantity} × {unitPrice.toLocaleString()} TZS
                  </p>
                </div>

                {/* Generate Button */}
                <button 
                  onClick={handleGenerate} 
                  disabled={loading || !selectedDay || !selectedSession} 
                  className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Printer size={18} /> GENERATE TICKETS
                    </>
                  )}
                </button>
              </div>
            )}

            {/* --- TAB: HISTORY & FILTERING --- */}
            {activeTab === 'history' && (
              <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4">
                {/* FILTERS */}
                <div className="bg-gray-50 p-4 rounded-xl mb-4 space-y-3 border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Filter size={14} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-400 uppercase">Filter History</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <select 
                      className="p-2.5 text-xs rounded-lg border border-gray-200 outline-none focus:border-black bg-white" 
                      value={filterDay} 
                      onChange={(e) => setFilterDay(e.target.value)}
                    >
                      <option value="">All Days</option>
                      {days.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    
                    <select 
                      className="p-2.5 text-xs rounded-lg border border-gray-200 outline-none focus:border-black bg-white" 
                      value={filterSession} 
                      onChange={(e) => setFilterSession(e.target.value)}
                    >
                      <option value="">All Sessions</option>
                      {sessions.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    
                    <select 
                      className="col-span-2 p-2.5 text-xs rounded-lg border border-gray-200 outline-none focus:border-black bg-white" 
                      value={filterGroup} 
                      onChange={(e) => setFilterGroup(e.target.value)}
                    >
                      <option value="">All Ticket Types</option>
                      <option value="ADULT">Adult</option>
                      <option value="STUDENT">Student</option>
                      <option value="CHILD">Child</option>
                    </select>
                  </div>
                </div>

                {/* LIST HEADER */}
                <div className="flex justify-between items-center mb-3 px-1">
                  <h3 className="text-xs font-bold text-gray-400 uppercase">
                    Found {filteredHistory.length} Tickets
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={loadFilteredToView} 
                      disabled={filteredHistory.length === 0}
                      className="text-xs font-bold bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle2 size={12}/> Load All
                    </button>
                    <button 
                      onClick={loadHistory} 
                      className="text-gray-400 hover:text-black transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
                    >
                      <RefreshCw size={14}/>
                    </button>
                  </div>
                </div>

                {/* LIST */}
                {loadingHistory ? (
                  <div className="py-10 text-center">
                    <Loader2 className="animate-spin mx-auto text-gray-300 w-6 h-6" />
                    <p className="text-gray-400 text-sm mt-2">Loading history...</p>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 text-sm">
                    No tickets match your filters.
                  </div>
                ) : (
                  <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                    {filteredHistory.map((item) => (
                      <div 
                        key={item.id} 
                        className="group bg-white border border-gray-100 hover:border-black p-4 rounded-xl transition-all flex justify-between items-center cursor-pointer shadow-sm hover:shadow-md"
                        onClick={() => loadSingleTicket(item)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            item.type === 'ADULT' ? 'bg-red-100 text-red-600' :
                            item.type === 'STUDENT' ? 'bg-blue-100 text-blue-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            <Ticket size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">{item.type} TICKET</p>
                            <p className="text-[11px] text-gray-400 font-mono">
                              {new Date(item.createdAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-bold text-green-700">
                            {item.price.toLocaleString()} TZS
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {item.code.slice(0, 6)}...
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* --- RIGHT: OUTPUT DISPLAY --- */}
          <div className="lg:col-span-8 bg-gray-50 border border-gray-200 rounded-3xl p-6 min-h-[600px] flex flex-col">
            
            {/* Header with Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-700">
                  {generatedTickets 
                    ? `${activeTab === 'history' ? 'Selected' : 'Generated'} Batch (${generatedTickets.length} tickets)`
                    : activeTab === 'history' ? 'Batch View' : 'Generated Batch'
                  }
                </h2>
                {generatedTickets && (
                  <p className="text-sm text-gray-500 mt-1">
                    Total: {(generatedTickets.reduce((sum, t) => sum + t.price, 0)).toLocaleString()} TZS
                  </p>
                )}
              </div>
              
              {generatedTickets && generatedTickets.length > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                  {/* View Mode Toggle */}
                  <div className="bg-white rounded-lg p-1 border border-gray-200 flex">
                    <button 
                      onClick={() => setViewMode('simple')} 
                      className={`p-2 rounded flex items-center gap-1.5 text-xs font-medium transition-all ${
                        viewMode === 'simple' 
                          ? 'bg-gray-100 text-black' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <QrCode size={16}/> QR Codes
                    </button>
                    <button 
                      onClick={() => setViewMode('card')} 
                      className={`p-2 rounded flex items-center gap-1.5 text-xs font-medium transition-all ${
                        viewMode === 'card' 
                          ? 'bg-gray-100 text-black' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Ticket size={16}/> Tickets
                    </button>
                  </div>

                  {/* Download Buttons */}
                  <div className="flex gap-2">
                    {/* QR Grid Download (visible in QR mode) */}
                    {viewMode === 'simple' && (
                     <PDFDownloadLink 
                        document={<SimpleQrGridPdfA3 tickets={generatedTickets} />} 
                        fileName={`pos_qr_codes_a3_${getTimestamp()}.pdf`}
                        className="px-4 py-2.5 bg-blue-600 text-white border border-blue-600 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-all duration-200"
                      >
                        {({ loading }) => loading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="animate-spin w-3 h-3" /> Preparing A3...
                          </span>
                        ) : (
                          <>
                            <Download size={14}/> Download A3 QR Grid
                          </>
                        )}
                      </PDFDownloadLink>
                    )}
                    
                    {/* Full Tickets Download (visible in Ticket mode) */}
                    {viewMode === 'card' && (
                     <PDFDownloadLink 
                      document={<ThemedTicketPdfA3 tickets={generatedTickets} days={days} sessions={sessions} />} 
                      fileName={`full_tickets_a3_${getTimestamp()}.pdf`}
                      className="px-4 py-2.5 bg-black text-white border border-black rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-800 shadow-sm transition-all duration-200"
                    >
                      {({ loading }) => loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="animate-spin w-3 h-3" /> Preparing A3...
                        </span>
                      ) : (
                        <>
                          <Download size={14}/> Download A3 Tickets
                        </>
                      )}
                    </PDFDownloadLink>
                                        )}
                  </div>
                </div>
              )}
            </div>

            {/* Content Display */}
            {generatedTickets ? (
              <div className={`grid gap-4 animate-in fade-in slide-in-from-bottom-4 flex-1 ${
                viewMode === 'card' 
                  ? 'grid-cols-1 md:grid-cols-2' 
                  : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              }`}>
                {generatedTickets.map((ticket, i) => (
                  <TicketPreviewCard 
                    key={`${ticket.id}-${i}`} 
                    ticket={ticket} 
                    viewMode={viewMode} 
                  />
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300 p-10">
                <div className="text-center">
                  <Printer size={80} className="mx-auto mb-6 opacity-20" />
                  <p className="text-gray-400 text-lg font-medium mb-2">
                    {activeTab === 'history' 
                      ? 'Select tickets from history or click "Load All"' 
                      : 'Configure your ticket options and click "GENERATE TICKETS"'
                    }
                  </p>
                  <p className="text-gray-300 text-sm">
                    {activeTab === 'history' 
                      ? 'Your selected tickets will appear here' 
                      : 'Generated tickets will appear here'
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Footer Stats */}
            {generatedTickets && generatedTickets.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Ticket size={14} />
                      {generatedTickets.length} tickets
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign size={14} />
                      {generatedTickets.reduce((sum, t) => sum + t.price, 0).toLocaleString()} TZS
                    </span>
                  </div>
                  <div className="text-xs">
                    Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}