'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPosDropdownData, generatePosTickets, getPosHistory, getPosHistoryPaged } from '@/lib/actions/pos-actions';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Loader2, Printer, Layout, List, Download, 
  History, RefreshCw, Filter, CheckCircle2, 
  QrCode, Ticket, DollarSign, Calendar, Clock,
  Users, Folder, Package, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Search, SortAsc, SortDesc,
  FolderTree, FileText, FileImage
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { ThemedTicketPdfA3, SimpleQrGridPdfA3 } from '@/components/pdf/TicketPdfTemplates';
import AdminLayout from '@/components/admin/AdminLayout';


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
  qrImageStr: string;
  type: 'ADULT' | 'STUDENT' | 'CHILD';
  price: number;
  createdAt: string;
  sessionId?: number;
  dayId?: number;
  transactionId?: number;
  day?: {
    id: number;
    name: string;
    date: string;
  };
  session?: {
    id: number;
    name: string;
    startTime: string;
  };
}

// IMAGE_MAP
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
  
  // Default fallbacks
  'ADULT': '/images/tickets/ADULT.png',
  'STUDENT': '/images/tickets/STUDENT.png',
  'KIDS': '/images/tickets/KIDS.png',
  'CHILD': '/images/tickets/KIDS.png',
};




// Helper function to get image key
const getImageKey = (ticket: any, days: any[] = [], sessions: any[] = []) => {
  if (!ticket.dayId || !ticket.sessionId) return ticket.type || 'ADULT';
  
  const day = days.find(d => d.id === ticket.dayId) || ticket.day;
  const session = sessions.find(s => s.id === ticket.sessionId) || ticket.session;
  
  if (!day || !session) return ticket.type || 'ADULT';
  
  const dayNumber = day.name?.match(/\d+/)?.[0]?.padStart(2, '0') || '01';
  
  let sessionCode = 'AS';
  const sessionName = session.name || '';
  if (sessionName.includes('Evening') || sessionName.includes('ES')) sessionCode = 'ES';
  if (sessionName.includes('Night') || sessionName.includes('NS')) sessionCode = 'NS';
  
  let ticketType = 'ADULT';
  if (ticket.type === 'STUDENT') ticketType = 'STUDENT';
  if (ticket.type === 'CHILD') ticketType = 'KIDS';
  
  const key = `Day_${dayNumber}_${sessionCode}_${ticketType}`;
  return IMAGE_MAP[key] ? key : ticket.type || 'ADULT';
};

// Get session code from session name
const getSessionCode = (sessionName: string): 'AS' | 'ES' | 'NS' | null => {
  if (!sessionName) return null;
  if (sessionName.toLowerCase().includes('afternoon') || sessionName.toLowerCase().includes('as')) return 'AS';
  if (sessionName.toLowerCase().includes('evening') || sessionName.toLowerCase().includes('es')) return 'ES';
  if (sessionName.toLowerCase().includes('night') || sessionName.toLowerCase().includes('ns')) return 'NS';
  return null;
};

// Generate folder structure
const generateFolderStructure = (tickets: TicketType[], days: any[], sessions: any[]) => {
  const folders: Record<string, Record<string, Record<string, TicketType[]>>> = {};
  
  tickets.forEach(ticket => {
    const day = days.find(d => d.id === ticket.dayId) || ticket.day;
    const session = sessions.find(s => s.id === ticket.sessionId) || ticket.session;
    
    if (!day || !session) return;
    
    const dayName = day.name.replace(/\s+/g, '_');
    const sessionCode = getSessionCode(session.name) || 'Unknown';
    const ticketType = ticket.type;
    
    if (!folders[dayName]) folders[dayName] = {};
    if (!folders[dayName][sessionCode]) folders[dayName][sessionCode] = { ADULT: [], STUDENT: [], CHILD: [] };
    
    folders[dayName][sessionCode][ticketType].push(ticket);
  });
  
  return folders;
};

// Ticket Preview Card Component with improved QR display
const TicketPreviewCard = ({ 
  ticket, 
  viewMode, 
  days = [], 
  sessions = [],
  showFolderInfo = false
}: { 
  ticket: any; 
  viewMode: 'simple' | 'card'; 
  days?: any[]; 
  sessions?: any[];
  showFolderInfo?: boolean;
}) => {
  const imageKey = getImageKey(ticket, days, sessions);
  const bgImage = IMAGE_MAP[imageKey] || IMAGE_MAP[ticket.type] || IMAGE_MAP.ADULT;
  const fallbackImage = IMAGE_MAP[ticket.type] || IMAGE_MAP.ADULT;
  
  const day = days.find(d => d.id === ticket.dayId) || ticket.day;
  const session = sessions.find(s => s.id === ticket.sessionId) || ticket.session;
  const sessionCode = getSessionCode(session?.name || '');
  
  const dateStr = ticket.createdAt ? new Date(ticket.createdAt).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  }) : '';

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = fallbackImage;
  };

  if (viewMode === 'simple') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col items-center text-center p-3 hover:shadow-md transition-shadow duration-200 w-full">
        {/* QR Code with background color and border */}
        <div className="mb-2 p-2 bg-gradient-to-br from-blue-50 to-white rounded-lg border-2 border-blue-100">
          {ticket.qrImageStr ? (
            <img 
              src={ticket.qrImageStr} 
              alt="QR Code" 
              className="w-20 h-20 object-contain"
            />
          ) : (
            <div className="relative">
              <QRCodeSVG 
                value={ticket.qrValue} 
                size={80} 
                level="M" 
                bgColor="#EFF6FF"
                fgColor="#1E40AF"
                className="w-20 h-20"
              />
              {/* Border overlay for QR */}
              <div className="absolute inset-0 border-2 border-blue-200 rounded pointer-events-none"></div>
            </div>
          )}
        </div>
        
        <div className="w-full space-y-1">
          <div className={`text-sm font-bold ${
            ticket.type === 'ADULT' ? 'text-red-600' :
            ticket.type === 'STUDENT' ? 'text-blue-600' :
            'text-green-600'
          }`}>
            {ticket.type}
          </div>
          <div className="text-xs text-gray-600 font-mono">{ticket.code?.slice(0, 12)}</div>
          {showFolderInfo && day && session && (
            <div className="text-[10px] text-gray-400 mt-1">
              {day.name} - {sessionCode}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-row w-full max-w-2xl border border-gray-300 rounded-lg overflow-hidden shadow-sm bg-white">
      
      {/* FRONT TICKET */}
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
        
        {/* QR Code with border - Left Side */}
        <div className="absolute top-1/2 left-[1%] transform -translate-y-1/2">
          {ticket.qrImageStr ? (
            <div className="relative">
              <img 
                src={ticket.qrImageStr} 
                alt="QR Code" 
                className="w-14 h-20 bg-white p-1 rounded border-2 border-blue-300"
              />
              <div className="absolute inset-0 border-2 border-blue-200 rounded pointer-events-none"></div>
            </div>
          ) : (
            <div className="relative">
              <QRCodeSVG 
                value={ticket.qrValue} 
                size={56} 
                level="M"
                bgColor="#FFFFFF"
                fgColor="#1E40AF"
                className="w-14 h-20 p-1"
              />
              <div className="absolute inset-0 border-2 border-blue-200 rounded pointer-events-none"></div>
            </div>
          )}
        </div>
        
        {/* Folder info overlay */}
        {showFolderInfo && day && session && (
          <div className="absolute bottom-2 left-2 text-[8px] bg-black/70 text-white px-2 py-1 rounded">
            {day.name} • {sessionCode}
          </div>
        )}
      </div>
      
      {/* BACK TICKET */}
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

// Export the helper function
export { getImageKey, IMAGE_MAP };

// Pagination component
const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  pageSize,
  onPageSizeChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}) => {
  const pageNumbers = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Show</span>
        <select 
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="text-sm border rounded px-2 py-1"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>
        <span className="text-sm text-gray-500">per page</span>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <ChevronLeft size={16} />
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className={`px-3 py-1 rounded text-sm ${currentPage === 1 ? 'bg-blue-500 text-white' : 'border hover:bg-gray-50'}`}
            >
              1
            </button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}
        
        {pageNumbers.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 rounded text-sm ${currentPage === page ? 'bg-blue-500 text-white' : 'border hover:bg-gray-50'}`}
          >
            {page}
          </button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className={`px-3 py-1 rounded text-sm ${currentPage === totalPages ? 'bg-blue-500 text-white' : 'border hover:bg-gray-50'}`}
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
      
      <div className="text-sm text-gray-500">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function PosTerminalPage() {
  // Loading States
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  
  // Data State
  const [days, setDays] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  
  // History & Filter State
  const [historyItems, setHistoryItems] = useState<TicketType[]>([]);
  const [totalHistoryItems, setTotalHistoryItems] = useState(0);
  const [filterDay, setFilterDay] = useState<string>('');
  const [filterSession, setFilterSession] = useState<string>('');
  const [filterGroup, setFilterGroup] = useState<string>('');
  const [filteredHistory, setFilteredHistory] = useState<TicketType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<'createdAt' | 'type' | 'price'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Ticket Generation State
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [quantities, setQuantities] = useState({
    ADULT: 1,
    STUDENT: 0,
    CHILD: 0
  });
  
  // View State
  const [viewMode, setViewMode] = useState<'simple' | 'card'>('simple');
  const [generatedTickets, setGeneratedTickets] = useState<TicketType[] | null>(null);
  const [folderStructure, setFolderStructure] = useState<Record<string, Record<string, Record<string, TicketType[]>>>>({});
  const [selectedFolder, setSelectedFolder] = useState<{day: string, session: string, type: string} | null>(null);
  
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

  // Load paginated history
  const loadHistory = useCallback(async (page = 1) => {
    setLoadingHistory(true);
    try {
      const res = await getPosHistoryPaged({
        page,
        limit: pageSize,
        dayId: filterDay || undefined,
        sessionId: filterSession || undefined,
        type: filterGroup || undefined,
        search: searchQuery || undefined,
        sortBy: sortField,
        sortOrder
      });
      
      if (res.success && res.data) {
        const { tickets, total, page: currentPage, totalPages } = res.data;
        
        setHistoryItems(tickets);
        setTotalHistoryItems(total);
        setCurrentPage(currentPage);
        setTotalPages(totalPages);
        
        updateStats(tickets);
        
        // Generate folder structure
        const folders = generateFolderStructure(tickets, days, sessions);
        setFolderStructure(folders);
      } else {
        console.error('Failed to load history:', res.error);
        setHistoryItems([]);
        setTotalHistoryItems(0);
        updateStats([]);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      setHistoryItems([]);
      setTotalHistoryItems(0);
      updateStats([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [filterDay, filterSession, filterGroup, searchQuery, sortField, sortOrder, pageSize, days, sessions]);

  // Load initial data
  const loadInitialData = async () => {
    try {
      const data = await getPosDropdownData();
      if (data.success && data.data) {
        setDays(data.data.days);
        setSessions(data.data.sessions);
        setPrices(data.data.prices);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  // Update stats
  const updateStats = (tickets: TicketType[]) => {
    const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.price, 0);
    const today = new Date().toISOString().split('T')[0];
    const todayCount = tickets.filter(ticket => 
      ticket.createdAt.startsWith(today)
    ).length;
    
    setStats({
      totalTickets: totalHistoryItems,
      totalRevenue,
      todayCount
    });
  };

  // Handle page change
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory(currentPage);
    }
  }, [currentPage, pageSize, sortField, sortOrder, activeTab, loadHistory]);

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

  // Generate tickets with multiple types
  const handleGenerate = async () => {
    if (!selectedDay || !selectedSession) {
      alert("Please select Day and Session");
      return;
    }
    
    // Check if at least one ticket type has quantity > 0
    const totalQuantity = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
    if (totalQuantity === 0) {
      alert("Please select at least one ticket");
      return;
    }

    setLoading(true);
    setGeneratedTickets(null);
    setSelectedFolder(null);

    try {
      const selectedDayData = days.find(d => d.id.toString() === selectedDay);
      const selectedSessionData = sessions.find(s => s.id.toString() === selectedSession);
      const sessionCode = getSessionCode(selectedSessionData?.name || '');

      // Generate tickets for each type with quantity > 0
      const allTickets: TicketType[] = [];
      
      for (const [type, quantity] of Object.entries(quantities)) {
        if (quantity > 0) {
          const priceObj = prices.find(p => p.type === type);
          const unitPrice = priceObj ? Number(priceObj.price) : 0;
          
          const result = await generatePosTickets({
            dayId: Number(selectedDay),
            sessionId: Number(selectedSession),
            ticketGroup: type as 'ADULT' | 'STUDENT' | 'CHILD',
            quantity: quantity,
            unitPrice: unitPrice
          });

          if (result.success && result.tickets) {
            // Add day and session info to tickets
            const ticketsWithInfo = result.tickets.map(ticket => ({
              ...ticket,
              day: selectedDayData,
              session: selectedSessionData
            }));
            allTickets.push(...ticketsWithInfo);
          } else {
            alert(`Failed to generate ${type} tickets: ${result.error}`);
          }
        }
      }

      if (allTickets.length > 0) {
        setGeneratedTickets(allTickets);
        
        // Generate folder structure for new tickets
        const folders = generateFolderStructure(allTickets, days, sessions);
        setFolderStructure(folders);
        
        // Set first folder as selected
        const dayName = selectedDayData?.name.replace(/\s+/g, '_') || '';
        const firstType = Object.keys(quantities).find(type => quantities[type as keyof typeof quantities] > 0);
        if (dayName && sessionCode && firstType) {
          setSelectedFolder({
            day: dayName,
            session: sessionCode,
            type: firstType
          });
        }
        
        // Reload history to update stats
        loadHistory(1);
      } else {
        alert("No tickets were generated");
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert("An error occurred while generating tickets");
    } finally {
      setLoading(false);
    }
  };

  // Update quantity for a specific type
  const updateQuantity = (type: keyof typeof quantities, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [type]: Math.max(0, Math.min(100, prev[type] + change))
    }));
  };

  // Set quantity directly for a type
  const setQuantityDirect = (type: keyof typeof quantities, value: string) => {
    const numValue = parseInt(value) || 0;
    setQuantities(prev => ({
      ...prev,
      [type]: Math.max(0, Math.min(100, numValue))
    }));
  };

  // Calculate total price for all selected tickets
  const calculateTotalPrice = () => {
    return Object.entries(quantities).reduce((total, [type, qty]) => {
      const priceObj = prices.find(p => p.type === type);
      const unitPrice = priceObj ? Number(priceObj.price) : 0;
      return total + (unitPrice * qty);
    }, 0);
  };

  // Calculate total quantity
  const calculateTotalQuantity = () => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  };

  // Load tickets from a specific folder
  const loadFolderTickets = (day: string, session: string, type: string) => {
    const tickets = folderStructure[day]?.[session]?.[type] || [];
    if (tickets.length > 0) {
      setGeneratedTickets(tickets);
      setSelectedFolder({ day, session, type });
      setViewMode('simple');
    }
  };

  // Load all tickets from history
  const loadAllTickets = () => {
    setGeneratedTickets([...historyItems]);
    setSelectedFolder(null);
    setViewMode('simple');
  };

  // Load single ticket
  const loadSingleTicket = (ticket: TicketType) => {
    setGeneratedTickets([ticket]);
    setViewMode('card');
    setSelectedFolder(null);
  };

  // Helper functions
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

  // Get sessions filtered by selected day
  const filteredSessions = selectedDay 
    ? sessions.filter(s => s.dayId.toString() === selectedDay)
    : [];

  // Toggle sort order
  const toggleSort = (field: 'createdAt' | 'type' | 'price') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalTickets.toLocaleString()}</p>
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
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Database Items</p>
                  <p className="text-2xl font-bold text-gray-800">{totalHistoryItems.toLocaleString()}</p>
                </div>
                <FolderTree className="w-8 h-8 text-orange-500" />
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
                <History size={16}/> History
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

                {/* Ticket Type Quantities */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                    <Users size={12} /> Ticket Quantities
                  </label>
                  <div className="space-y-3">
                    {['ADULT', 'STUDENT', 'CHILD'].map((type) => {
                      const typePrice = prices.find(p => p.type === type)?.price || 0;
                      const currentQty = quantities[type as keyof typeof quantities];
                      
                      return (
                        <div key={type} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <div className="flex justify-between items-center mb-2">
                            <span className={`font-medium ${
                              type === 'ADULT' ? 'text-red-600' :
                              type === 'STUDENT' ? 'text-blue-600' :
                              'text-green-600'
                            }`}>
                              {type}
                            </span>
                            <span className="text-xs font-bold text-green-600">
                              {typePrice.toLocaleString()} TZS
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => updateQuantity(type as keyof typeof quantities, -1)}
                              className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                              -
                            </button>
                            <input 
                              type="number" 
                              min={0} 
                              max={200} 
                              value={currentQty} 
                              onChange={(e) => setQuantityDirect(type as keyof typeof quantities, e.target.value)} 
                              className="flex-1 p-2 bg-white rounded-lg border border-gray-200 text-center font-bold" 
                            />
                            <button 
                              onClick={() => updateQuantity(type as keyof typeof quantities, 1)}
                              className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                              +
                            </button>
                          </div>
                          {currentQty > 0 && (
                            <div className="text-xs text-gray-500 mt-2 text-right">
                              Subtotal: {(currentQty * typePrice).toLocaleString()} TZS
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Price Summary */}
                <div className="bg-green-50 p-5 rounded-xl text-center border border-green-100">
                  <p className="text-sm text-gray-600 mb-2">Total Amount</p>
                  <div className="text-3xl font-black text-green-800">
                    {calculateTotalPrice().toLocaleString()} 
                    <span className="text-base font-normal ml-2">TZS</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {calculateTotalQuantity()} tickets total
                  </p>
                </div>

                {/* Generate Button */}
                <button 
                  onClick={handleGenerate} 
                  disabled={loading || !selectedDay || !selectedSession || calculateTotalQuantity() === 0} 
                  className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Package size={18} /> GENERATE TICKET BATCH
                    </>
                  )}
                </button>
              </div>
            )}

            {/* --- TAB: HISTORY & FILTERING --- */}
            {activeTab === 'history' && (
              <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4">
                {/* SEARCH */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search tickets by code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:border-black outline-none"
                    />
                  </div>
                </div>

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
                      onChange={(e) => {
                        setFilterDay(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="">All Days</option>
                      {days.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    
                    <select 
                      className="p-2.5 text-xs rounded-lg border border-gray-200 outline-none focus:border-black bg-white" 
                      value={filterSession} 
                      onChange={(e) => {
                        setFilterSession(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="">All Sessions</option>
                      {sessions.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    
                    <select 
                      className="col-span-2 p-2.5 text-xs rounded-lg border border-gray-200 outline-none focus:border-black bg-white" 
                      value={filterGroup} 
                      onChange={(e) => {
                        setFilterGroup(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="">All Ticket Types</option>
                      <option value="ADULT">Adult</option>
                      <option value="STUDENT">Student</option>
                      <option value="CHILD">Child</option>
                    </select>
                  </div>
                </div>

                {/* SORT CONTROLS */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-xs font-bold text-gray-400 uppercase">
                    {filteredHistory.length} of {totalHistoryItems} Tickets
                  </h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleSort('createdAt')}
                      className={`text-xs font-medium px-2 py-1 rounded flex items-center gap-1 ${
                        sortField === 'createdAt' ? 'bg-gray-100 text-black' : 'text-gray-500'
                      }`}
                    >
                      Date
                      {sortField === 'createdAt' && (
                        sortOrder === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />
                      )}
                    </button>
                    <button
                      onClick={() => toggleSort('type')}
                      className={`text-xs font-medium px-2 py-1 rounded flex items-center gap-1 ${
                        sortField === 'type' ? 'bg-gray-100 text-black' : 'text-gray-500'
                      }`}
                    >
                      Type
                      {sortField === 'type' && (
                        sortOrder === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />
                      )}
                    </button>
                    <button
                      onClick={() => toggleSort('price')}
                      className={`text-xs font-medium px-2 py-1 rounded flex items-center gap-1 ${
                        sortField === 'price' ? 'bg-gray-100 text-black' : 'text-gray-500'
                      }`}
                    >
                      Price
                      {sortField === 'price' && (
                        sortOrder === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />
                      )}
                    </button>
                  </div>
                </div>

                {/* FOLDER STRUCTURE */}
                {Object.keys(folderStructure).length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FolderTree size={14} className="text-gray-400" />
                      <span className="text-xs font-bold text-gray-400 uppercase">Folders</span>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                      {Object.entries(folderStructure).map(([dayName, sessions]) => (
                        <div key={dayName} className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700">
                            {dayName.replace(/_/g, ' ')}
                          </div>
                          <div className="p-2 space-y-1">
                            {Object.entries(sessions).map(([sessionCode, types]) => (
                              <div key={sessionCode} className="ml-2">
                                <div className="text-[11px] font-medium text-gray-600 mb-1">
                                  {sessionCode}
                                </div>
                                <div className="space-y-1 ml-2">
                                  {Object.entries(types).map(([type, tickets]) => (
                                    tickets.length > 0 && (
                                      <button
                                        key={type}
                                        onClick={() => loadFolderTickets(dayName, sessionCode, type)}
                                        className={`flex items-center justify-between w-full text-left px-2 py-1 rounded text-[10px] ${
                                          selectedFolder?.day === dayName && 
                                          selectedFolder?.session === sessionCode && 
                                          selectedFolder?.type === type
                                            ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                            : 'hover:bg-gray-50 text-gray-600'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1">
                                          {type === 'ADULT' ? <FileText size={10} /> : 
                                           type === 'STUDENT' ? <FileImage size={10} /> : 
                                           <FileText size={10} />}
                                          {type}
                                        </div>
                                        <span className="text-gray-400">{tickets.length}</span>
                                      </button>
                                    )
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* LIST ACTIONS */}
                <div className="flex justify-between items-center mb-3 px-1">
                  <div className="text-xs text-gray-500">
                    Page {currentPage}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={loadAllTickets} 
                      disabled={filteredHistory.length === 0}
                      className="text-xs font-bold bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle2 size={12}/> Load All
                    </button>
                    <button 
                      onClick={() => loadHistory(currentPage)} 
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
                              })} • {item.code.slice(0, 6)}...
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-bold text-green-700">
                            {item.price.toLocaleString()} TZS
                          </span>
                          {item.day && item.session && (
                            <span className="text-[10px] text-gray-400">
                              {item.day.name?.slice(0, 8)} • {getSessionCode(item.session.name)}
                            </span>
                          )}
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
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-700 truncate">
                  {selectedFolder 
                    ? `Folder: ${selectedFolder.day.replace(/_/g, ' ')} / ${selectedFolder.session} / ${selectedFolder.type}`
                    : generatedTickets 
                    ? `${activeTab === 'history' ? 'Selected' : 'Generated'} Batch (${generatedTickets.length} tickets)`
                    : activeTab === 'history' ? 'Batch View' : 'Generated Batch'
                  }
                </h2>
                {generatedTickets && (
                  <div className="flex flex-wrap gap-4 mt-1">
                    <p className="text-sm text-gray-500">
                      Total: {(generatedTickets.reduce((sum, t) => sum + t.price, 0)).toLocaleString()} TZS
                    </p>
                    {selectedFolder && (
                      <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        <Folder size={14} />
                        <span>{selectedFolder.day.replace(/_/g, ' ')} / {selectedFolder.session}</span>
                      </div>
                    )}
                  </div>
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
                    {/* Generate filename based on folder or session */}
                    {generatedTickets.length > 0 && (
                      <div className="text-xs text-gray-500 mr-2 flex items-center">
                        <span>File: </span>
                        <span className="ml-1 font-medium">
                          {selectedFolder 
                            ? `${selectedFolder.day}_${selectedFolder.session}_${selectedFolder.type}`
                            : generatedTickets[0].day?.name?.replace(/\s+/g, '_') || 'tickets'
                          }_${getTimestamp()}
                        </span>
                      </div>
                    )}
                    
                    {/* QR Grid Download */}
                    {viewMode === 'simple' && (
                      <PDFDownloadLink 
                        document={<SimpleQrGridPdfA3 tickets={generatedTickets} />} 
                        fileName={`${
                          selectedFolder 
                            ? `${selectedFolder.day}_${selectedFolder.session}_${selectedFolder.type}_qr_codes`
                            : generatedTickets[0].day?.name?.replace(/\s+/g, '_') + '_' + 
                              (generatedTickets[0].session ? getSessionCode(generatedTickets[0].session.name) : '') + '_qr_codes'
                        }_${getTimestamp()}.pdf`}
                        className="px-4 py-2.5 bg-blue-600 text-white border border-blue-600 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-all duration-200"
                      >
                        {({ loading }) => loading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="animate-spin w-3 h-3" /> Preparing A3...
                          </span>
                        ) : (
                          <>
                            <Download size={14}/> Download QR Grid
                          </>
                        )}
                      </PDFDownloadLink>
                    )}
                    
                    {/* Full Tickets Download */}
                    {viewMode === 'card' && (
                      <PDFDownloadLink 
                        document={<ThemedTicketPdfA3 tickets={generatedTickets} days={days} sessions={sessions} />} 
                        fileName={`${
                          selectedFolder 
                            ? `${selectedFolder.day}_${selectedFolder.session}_${selectedFolder.type}_tickets`
                            : generatedTickets[0].day?.name?.replace(/\s+/g, '_') + '_' + 
                              (generatedTickets[0].session ? getSessionCode(generatedTickets[0].session.name) : '') + '_tickets'
                        }_${getTimestamp()}.pdf`}
                        className="px-4 py-2.5 bg-black text-white border border-black rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-800 shadow-sm transition-all duration-200"
                      >
                        {({ loading }) => loading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="animate-spin w-3 h-3" /> Preparing A3...
                          </span>
                        ) : (
                          <>
                            <Download size={14}/> Download Tickets
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
                    days={days}
                    sessions={sessions}
                    showFolderInfo={!selectedFolder}
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
                      : 'Configure your ticket options and click "GENERATE TICKET BATCH"'
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
                    {/* Show breakdown of ticket types */}
                    <div className="flex gap-2">
                      {Object.entries(
                        generatedTickets.reduce((acc, t) => {
                          acc[t.type] = (acc[t.type] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([type, count]) => (
                        <span key={type} className={`px-2 py-1 rounded text-xs ${
                          type === 'ADULT' ? 'bg-red-50 text-red-600' :
                          type === 'STUDENT' ? 'bg-blue-50 text-blue-600' :
                          'bg-green-50 text-green-600'
                        }`}>
                          {count} {type}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs">
                    {selectedFolder 
                      ? `${selectedFolder.day.replace(/_/g, ' ')} / ${selectedFolder.session}`
                      : `Generated on ${new Date().toLocaleDateString()}`
                    }
                  </div>
                </div>
              </div>
            )}

            {/* Pagination for History Tab */}
            {activeTab === 'history' && !generatedTickets && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  pageSize={pageSize}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}