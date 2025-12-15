'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Save, 
  Database, 
  Shield, 
  Globe, 
  Download, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Clock3,
  Ticket,
  CreditCard,
  RefreshCw,
  Trash2,
  Plus,
  Edit,
  X
} from 'lucide-react';
import { seedDatabase } from '@/lib/drizzle/seeders/ConfigSeeder';
import { 
  getEventDays, updateEventDay, deleteEventDay, createEventDay,
  getEventSessions, updateEventSession, deleteEventSession, createEventSession,
  getTicketPrices, updateTicketPrice, deleteTicketPrice, createTicketPrice,
  getPaymentMethods, updatePaymentMethod, deletePaymentMethod, createPaymentMethod
} from  '@/lib/actions/setting/admin-actions';

// Types
interface EventDay {
  id: number;
  name: string;
  date: string;
  isActive: boolean;
}

interface EventSession {
  id: number;
  dayId: number;
  name: string;
  startTime: string;
  endTime: string;
  dayName?: string;
}

interface TicketPrice {
  id: number;
  name: string;
  type: string;
  price: string;
  description: string;
  isActive: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  imageUrl: string;
  colorClass: string;
  isActive: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>('No backups yet');
  const [seedResult, setSeedResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
    error?: string;
  } | null>(null);

  // Data states
  const [eventDays, setEventDays] = useState<EventDay[]>([]);
  const [eventSessions, setEventSessions] = useState<EventSession[]>([]);
  const [ticketPrices, setTicketPrices] = useState<TicketPrice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  
  // Editing states
  const [editingEventDayId, setEditingEventDayId] = useState<number | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editingTicketId, setEditingTicketId] = useState<number | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  
  // Form states
  const [eventDayForm, setEventDayForm] = useState({ name: '', date: '', isActive: true });
  const [sessionForm, setSessionForm] = useState({ dayId: 1, name: '', startTime: '', endTime: '' });
  const [ticketForm, setTicketForm] = useState({ 
    name: '', 
    type: '', 
    price: '', 
    description: '', 
    isActive: true 
  });
  const [paymentForm, setPaymentForm] = useState({ 
    id: '', 
    name: '', 
    imageUrl: '', 
    colorClass: '', 
    isActive: true 
  });

  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    eventName: 'The King & The Code',
    supportEmail: 'info@afyalink.com',
    currency: 'TZS',
    timezone: 'Africa/Dar_es_Salaam',
    maxTicketsPerOrder: '6',
    ticketValidityHours: '24'
  });

  // Load all data
  useEffect(() => {
    if (activeTab === 'eventDays') loadEventDays();
    if (activeTab === 'sessions') loadEventSessions();
    if (activeTab === 'tickets') loadTicketPrices();
    if (activeTab === 'payments') loadPaymentMethods();
  }, [activeTab]);

  const loadEventDays = async () => {
    const data = await getEventDays();
    setEventDays(data);
  };

  const loadEventSessions = async () => {
    const data = await getEventSessions();
    setEventSessions(data);
  };

  const loadTicketPrices = async () => {
    const data = await getTicketPrices();
    setTicketPrices(data);
  };

  const loadPaymentMethods = async () => {
    const data = await getPaymentMethods();
    setPaymentMethods(data);
  };

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    try {
      const res = await fetch('/api/cron/backup', {
        headers: { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET_DEMO || ''}` }
      });
      await new Promise(r => setTimeout(r, 2000));
      setLastBackup(new Date().toLocaleString());
      alert("Backup created successfully!");
    } catch (e) {
      alert("Backup failed.");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleSeedDatabase = async () => {
    if (!confirm('⚠️ Warning: This will reset all configuration data to default values. Continue?')) {
      return;
    }

    setIsSeeding(true);
    setSeedResult(null);

    try {
      const result = await seedDatabase();
      setSeedResult(result);
      
      if (result.success) {
        // Reload all data
        await Promise.all([
          loadEventDays(),
          loadEventSessions(),
          loadTicketPrices(),
          loadPaymentMethods()
        ]);
      }
    } catch (error) {
      setSeedResult({
        success: false,
        message: 'Seeding failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSeeding(false);
    }
  };

  // Event Days CRUD
  const handleCreateEventDay = async () => {
    if (!eventDayForm.name || !eventDayForm.date) return;
    await createEventDay(eventDayForm);
    setEventDayForm({ name: '', date: '', isActive: true });
    await loadEventDays();
  };

  const handleUpdateEventDay = async (id: number, data: Partial<EventDay>) => {
    await updateEventDay(id, data);
    setEditingEventDayId(null);
    await loadEventDays();
  };

  const handleDeleteEventDay = async (id: number) => {
    if (confirm('Are you sure? This will also delete all sessions for this day.')) {
      await deleteEventDay(id);
      await loadEventDays();
    }
  };

  // Sessions CRUD
  const handleCreateSession = async () => {
    if (!sessionForm.name || !sessionForm.startTime || !sessionForm.endTime) return;
    await createEventSession(sessionForm);
    setSessionForm({ dayId: 1, name: '', startTime: '', endTime: '' });
    await loadEventSessions();
  };

  const handleUpdateSession = async (id: number, data: Partial<EventSession>) => {
    await updateEventSession(id, data);
    setEditingSessionId(null);
    await loadEventSessions();
  };

  const handleDeleteSession = async (id: number) => {
    if (confirm('Delete this session?')) {
      await deleteEventSession(id);
      await loadEventSessions();
    }
  };

  // Ticket Prices CRUD
  const handleCreateTicket = async () => {
    if (!ticketForm.name || !ticketForm.price || !ticketForm.type) return;
    await createTicketPrice({
      ...ticketForm,
      type: ticketForm.type.toUpperCase().replace(/\s+/g, '_')
    });
    setTicketForm({ name: '', type: '', price: '', description: '', isActive: true });
    await loadTicketPrices();
  };

  const handleUpdateTicket = async (id: number, data: Partial<TicketPrice>) => {
    await updateTicketPrice(id, data);
    setEditingTicketId(null);
    await loadTicketPrices();
  };

  const handleDeleteTicket = async (id: number) => {
    if (confirm('Delete this ticket type?')) {
      await deleteTicketPrice(id);
      await loadTicketPrices();
    }
  };

  // Payment Methods CRUD
  const handleCreatePaymentMethod = async () => {
    if (!paymentForm.id || !paymentForm.name) return;
    await createPaymentMethod(paymentForm);
    setPaymentForm({ id: '', name: '', imageUrl: '', colorClass: '', isActive: true });
    await loadPaymentMethods();
  };

  const handleUpdatePaymentMethod = async (id: string, data: Partial<PaymentMethod>) => {
    await updatePaymentMethod(id, data);
    setEditingPaymentId(null);
    await loadPaymentMethods();
  };

  const handleDeletePaymentMethod = async (id: string) => {
    if (confirm('Delete this payment method?')) {
      await deletePaymentMethod(id);
      await loadPaymentMethods();
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-sm text-gray-500">Manage configuration, database, and system settings.</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('general')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'general' ? 'border-[#A81010] text-[#A81010]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Globe size={16} className="inline mr-2" />
            General
          </button>
          <button 
            onClick={() => setActiveTab('eventDays')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'eventDays' ? 'border-[#A81010] text-[#A81010]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar size={16} className="inline mr-2" />
            Event Days
          </button>
          <button 
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'sessions' ? 'border-[#A81010] text-[#A81010]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock3 size={16} className="inline mr-2" />
            Sessions
          </button>
          <button 
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'tickets' ? 'border-[#A81010] text-[#A81010]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Ticket size={16} className="inline mr-2" />
            Ticket Prices
          </button>
          <button 
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'payments' ? 'border-[#A81010] text-[#A81010]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <CreditCard size={16} className="inline mr-2" />
            Payment Methods
          </button>
          <button 
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'backup' ? 'border-[#A81010] text-[#A81010]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Database size={16} className="inline mr-2" />
            Database & Backup
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'security' ? 'border-[#A81010] text-[#A81010]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield size={16} className="inline mr-2" />
            Security
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          
          {/* --- GENERAL TAB --- */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Globe size={20} className="text-gray-400" /> General Configuration
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Event Name</label>
                  <input 
                    type="text" 
                    value={generalSettings.eventName}
                    onChange={(e) => setGeneralSettings({...generalSettings, eventName: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-[#A81010] outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Support Email</label>
                  <input 
                    type="email" 
                    value={generalSettings.supportEmail}
                    onChange={(e) => setGeneralSettings({...generalSettings, supportEmail: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-[#A81010] outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Currency</label>
                  <select 
                    value={generalSettings.currency}
                    onChange={(e) => setGeneralSettings({...generalSettings, currency: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none bg-white"
                  >
                    <option value="TZS">TZS (Tanzanian Shilling)</option>
                    <option value="USD">USD (US Dollar)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Timezone</label>
                  <select 
                    value={generalSettings.timezone}
                    onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none bg-white"
                  >
                    <option value="Africa/Dar_es_Salaam">Africa/Dar_es_Salaam (GMT+3)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Max Tickets Per Order</label>
                  <input 
                    type="number" 
                    value={generalSettings.maxTicketsPerOrder}
                    onChange={(e) => setGeneralSettings({...generalSettings, maxTicketsPerOrder: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-[#A81010] outline-none" 
                    min="1"
                    max="20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Ticket Validity (Hours)</label>
                  <input 
                    type="number" 
                    value={generalSettings.ticketValidityHours}
                    onChange={(e) => setGeneralSettings({...generalSettings, ticketValidityHours: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-[#A81010] outline-none" 
                    min="1"
                    max="72"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button className="px-6 py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 flex items-center gap-2">
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </div>
          )}

          {/* --- EVENT DAYS TAB --- */}
          {activeTab === 'eventDays' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Calendar size={20} className="text-gray-400" /> Event Days Management
                </h2>
                <button 
                  onClick={loadEventDays}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                >
                  <RefreshCw size={16} /> Refresh
                </button>
              </div>

              {/* Create New Day */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="font-bold text-gray-800 mb-3">Add New Event Day</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Day Name (e.g., Day 1)"
                    value={eventDayForm.name}
                    onChange={(e) => setEventDayForm({...eventDayForm, name: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="date"
                    value={eventDayForm.date}
                    onChange={(e) => setEventDayForm({...eventDayForm, date: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg text-sm"
                  />
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={eventDayForm.isActive}
                        onChange={(e) => setEventDayForm({...eventDayForm, isActive: e.target.checked})}
                        className="rounded"
                      />
                      <span className="text-sm">Active</span>
                    </label>
                    <button
                      onClick={handleCreateEventDay}
                      className="px-4 py-2 bg-[#A81010] text-white rounded-lg text-sm font-bold hover:bg-[#8a0d0d] flex items-center gap-2"
                    >
                      <Plus size={16} /> Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Event Days List */}
              <div className="space-y-3">
                {eventDays.map((day) => (
                  <div key={day.id} className="border border-gray-200 rounded-xl p-4">
                    {editingEventDayId === day.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={day.name}
                            onChange={(e) => handleUpdateEventDay(day.id, { name: e.target.value })}
                            className="p-3 border border-gray-300 rounded-lg text-sm"
                          />
                          <input
                            type="date"
                            value={day.date}
                            onChange={(e) => handleUpdateEventDay(day.id, { date: e.target.value })}
                            className="p-3 border border-gray-300 rounded-lg text-sm"
                          />
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={day.isActive}
                                onChange={(e) => handleUpdateEventDay(day.id, { isActive: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm">Active</span>
                            </label>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingEventDayId(null)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-gray-800">{day.name}</span>
                          <span className="text-gray-600">{new Date(day.date).toLocaleDateString()}</span>
                          <span className={`px-2 py-1 rounded text-xs ${day.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {day.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingEventDayId(day.id)}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteEventDay(day.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- SESSIONS TAB --- */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Clock3 size={20} className="text-gray-400" /> Event Sessions Management
                </h2>
                <button 
                  onClick={loadEventSessions}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                >
                  <RefreshCw size={16} /> Refresh
                </button>
              </div>

              {/* Create New Session */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="font-bold text-gray-800 mb-3">Add New Session</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <select
                    value={sessionForm.dayId}
                    onChange={(e) => setSessionForm({...sessionForm, dayId: Number(e.target.value)})}
                    className="p-3 border border-gray-300 rounded-lg text-sm"
                  >
                    {eventDays.map(day => (
                      <option key={day.id} value={day.id}>{day.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Session Name"
                    value={sessionForm.name}
                    onChange={(e) => setSessionForm({...sessionForm, name: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="time"
                    value={sessionForm.startTime}
                    onChange={(e) => setSessionForm({...sessionForm, startTime: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg text-sm"
                  />
                  <div className="flex items-center gap-3">
                    <input
                      type="time"
                      value={sessionForm.endTime}
                      onChange={(e) => setSessionForm({...sessionForm, endTime: e.target.value})}
                      className="p-3 border border-gray-300 rounded-lg text-sm flex-1"
                    />
                    <button
                      onClick={handleCreateSession}
                      className="px-4 py-3 bg-[#A81010] text-white rounded-lg text-sm font-bold hover:bg-[#8a0d0d] flex items-center gap-2"
                    >
                      <Plus size={16} /> Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Sessions List */}
              <div className="space-y-3">
                {eventSessions.map((session) => (
                  <div key={session.id} className="border border-gray-200 rounded-xl p-4">
                    {editingSessionId === session.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <select
                            value={session.dayId}
                            onChange={(e) => handleUpdateSession(session.id, { dayId: Number(e.target.value) })}
                            className="p-3 border border-gray-300 rounded-lg text-sm"
                          >
                            {eventDays.map(day => (
                              <option key={day.id} value={day.id}>{day.name}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={session.name}
                            onChange={(e) => handleUpdateSession(session.id, { name: e.target.value })}
                            className="p-3 border border-gray-300 rounded-lg text-sm"
                          />
                          <input
                            type="time"
                            value={session.startTime}
                            onChange={(e) => handleUpdateSession(session.id, { startTime: e.target.value })}
                            className="p-3 border border-gray-300 rounded-lg text-sm"
                          />
                          <div className="flex items-center gap-3">
                            <input
                              type="time"
                              value={session.endTime}
                              onChange={(e) => handleUpdateSession(session.id, { endTime: e.target.value })}
                              className="p-3 border border-gray-300 rounded-lg text-sm flex-1"
                            />
                            <button
                              onClick={() => setEditingSessionId(null)}
                              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="bg-gray-100 px-3 py-1 rounded-lg">
                            <span className="text-sm font-bold text-gray-700">{session.dayName}</span>
                          </div>
                          <span className="font-bold text-gray-800">{session.name}</span>
                          <span className="text-gray-600">{session.startTime} - {session.endTime}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingSessionId(session.id)}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- TICKET PRICES TAB --- */}
          {activeTab === 'tickets' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Ticket size={20} className="text-gray-400" /> Ticket Prices Management
                </h2>
                <button 
                  onClick={loadTicketPrices}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                >
                  <RefreshCw size={16} /> Refresh
                </button>
              </div>

              {/* Create New Ticket */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="font-bold text-gray-800 mb-3">Add New Ticket Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Ticket Name"
                    value={ticketForm.name}
                    onChange={(e) => setTicketForm({...ticketForm, name: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Type (e.g., ADULT, STUDENT)"
                    value={ticketForm.type}
                    onChange={(e) => setTicketForm({...ticketForm, type: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Price (e.g., 50000.00)"
                    value={ticketForm.price}
                    onChange={(e) => setTicketForm({...ticketForm, price: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg text-sm"
                  />
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Description"
                      value={ticketForm.description}
                      onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})}
                      className="p-3 border border-gray-300 rounded-lg text-sm flex-1"
                    />
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ticketForm.isActive}
                        onChange={(e) => setTicketForm({...ticketForm, isActive: e.target.checked})}
                        className="rounded"
                      />
                      <span className="text-sm">Active</span>
                    </label>
                    <button
                      onClick={handleCreateTicket}
                      className="px-4 py-3 bg-[#A81010] text-white rounded-lg text-sm font-bold hover:bg-[#8a0d0d] flex items-center gap-2"
                    >
                      <Plus size={16} /> Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Tickets List */}
              <div className="space-y-3">
                {ticketPrices.map((ticket) => (
                  <div key={ticket.id} className="border border-gray-200 rounded-xl p-4">
                    {editingTicketId === ticket.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={ticket.name}
                            onChange={(e) => handleUpdateTicket(ticket.id, { name: e.target.value })}
                            className="p-3 border border-gray-300 rounded-lg text-sm"
                          />
                          <input
                            type="text"
                            value={ticket.type}
                            onChange={(e) => handleUpdateTicket(ticket.id, { type: e.target.value })}
                            className="p-3 border border-gray-300 rounded-lg text-sm"
                          />
                          <input
                            type="text"
                            value={ticket.price}
                            onChange={(e) => handleUpdateTicket(ticket.id, { price: e.target.value })}
                            className="p-3 border border-gray-300 rounded-lg text-sm"
                          />
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={ticket.description}
                              onChange={(e) => handleUpdateTicket(ticket.id, { description: e.target.value })}
                              className="p-3 border border-gray-300 rounded-lg text-sm flex-1"
                            />
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={ticket.isActive}
                                onChange={(e) => handleUpdateTicket(ticket.id, { isActive: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm">Active</span>
                            </label>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingTicketId(null)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <span className="font-bold text-gray-800">{ticket.name}</span>
                            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{ticket.type}</span>
                            <span className={`px-2 py-1 rounded text-xs ${ticket.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {ticket.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{ticket.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xl font-bold text-gray-900">TZS {parseFloat(ticket.price).toLocaleString()}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingTicketId(ticket.id)}
                              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteTicket(ticket.id)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- PAYMENT METHODS TAB --- */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard size={20} className="text-gray-400" /> Payment Methods Management
                </h2>
                <button 
                  onClick={loadPaymentMethods}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                >
                  <RefreshCw size={16} /> Refresh
                </button>
              </div>

              {/* Create New Payment Method */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="font-bold text-gray-800 mb-3">Add New Payment Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="ID (e.g., mpesa)"
                    value={paymentForm.id}
                    onChange={(e) => setPaymentForm({...paymentForm, id: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Name"
                    value={paymentForm.name}
                    onChange={(e) => setPaymentForm({...paymentForm, name: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Image URL"
                    value={paymentForm.imageUrl}
                    onChange={(e) => setPaymentForm({...paymentForm, imageUrl: e.target.value})}
                    className="p-3 border border-gray-300 rounded-lg text-sm"
                  />
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Color Class (Tailwind)"
                      value={paymentForm.colorClass}
                      onChange={(e) => setPaymentForm({...paymentForm, colorClass: e.target.value})}
                      className="p-3 border border-gray-300 rounded-lg text-sm flex-1"
                    />
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={paymentForm.isActive}
                        onChange={(e) => setPaymentForm({...paymentForm, isActive: e.target.checked})}
                        className="rounded"
                      />
                      <span className="text-sm">Active</span>
                    </label>
                    <button
                      onClick={handleCreatePaymentMethod}
                      className="px-4 py-3 bg-[#A81010] text-white rounded-lg text-sm font-bold hover:bg-[#8a0d0d] flex items-center gap-2"
                    >
                      <Plus size={16} /> Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment Methods List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="border border-gray-200 rounded-xl p-4">
                    {editingPaymentId === method.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                          <input
                            type="text"
                            value={method.name}
                            onChange={(e) => handleUpdatePaymentMethod(method.id, { name: e.target.value })}
                            className="p-3 border border-gray-300 rounded-lg text-sm"
                          />
                          <input
                            type="text"
                            value={method.imageUrl}
                            onChange={(e) => handleUpdatePaymentMethod(method.id, { imageUrl: e.target.value })}
                            className="p-3 border border-gray-300 rounded-lg text-sm"
                          />
                          <input
                            type="text"
                            value={method.colorClass}
                            onChange={(e) => handleUpdatePaymentMethod(method.id, { colorClass: e.target.value })}
                            className="p-3 border border-gray-300 rounded-lg text-sm"
                          />
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={method.isActive}
                                onChange={(e) => handleUpdatePaymentMethod(method.id, { isActive: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm">Active</span>
                            </label>
                            <button
                              onClick={() => setEditingPaymentId(null)}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            {method.imageUrl && (
                              <div className="w-12 h-12 bg-white border rounded-lg flex items-center justify-center">
                                <img src={method.imageUrl} alt={method.name} className="w-8 h-8 object-contain" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-bold text-gray-800">{method.name}</h3>
                              <p className="text-sm text-gray-600">ID: {method.id}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${method.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {method.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{method.colorClass}</code>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingPaymentId(method.id)}
                              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeletePaymentMethod(method.id)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- BACKUP TAB --- */}
          {activeTab === 'backup' && (
            <div className="space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Database size={20} className="text-gray-400" /> Database Management
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Manage database backups and system reset.</p>
                </div>
                <div className="px-4 py-2 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  System Healthy
                </div>
              </div>

              {/* Automated Status Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-[#A81010]">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Daily Auto-Backup</h3>
                    <p className="text-xs text-gray-500">Scheduled to run every day at <span className="font-mono font-bold text-gray-700">00:00 EAT</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status:</span>
                  <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                    <CheckCircle size={14} /> Active
                  </span>
                </div>
              </div>

              {/* Database Reset Section */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-6 bg-red-50 border-b border-red-100">
                  <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                    <AlertCircle size={20} /> Reset Database to Default
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    This will reset all configuration data (Event Days, Sessions, Ticket Prices, Payment Methods) to default seed values.
                  </p>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Reset Configuration Data</p>
                      <p className="text-sm text-gray-500">Last reset: {seedResult ? new Date().toLocaleString() : 'Never'}</p>
                    </div>
                    <button
                      onClick={handleSeedDatabase}
                      disabled={isSeeding}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSeeding ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
                      {isSeeding ? 'Resetting...' : 'Reset to Default'}
                    </button>
                  </div>
                  
                  {seedResult && (
                    <div className={`mt-4 p-4 rounded-lg ${seedResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {seedResult.success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        <span className="font-bold">{seedResult.success ? 'Success' : 'Error'}</span>
                      </div>
                      <p className="text-sm">{seedResult.message}</p>
                      {seedResult.data && (
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div className="bg-white/50 p-2 rounded">
                            <div className="font-bold">Event Days</div>
                            <div>{seedResult.data.eventDays}</div>
                          </div>
                          <div className="bg-white/50 p-2 rounded">
                            <div className="font-bold">Sessions</div>
                            <div>{seedResult.data.eventSessions}</div>
                          </div>
                          <div className="bg-white/50 p-2 rounded">
                            <div className="font-bold">Ticket Prices</div>
                            <div>{seedResult.data.ticketPrices}</div>
                          </div>
                          <div className="bg-white/50 p-2 rounded">
                            <div className="font-bold">Payment Methods</div>
                            <div>{seedResult.data.paymentMethods}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Manual Action */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Manual Operations</h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-4 bg-white flex justify-between items-center border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-800">Create Immediate Snapshot</p>
                      <p className="text-xs text-gray-500">Last backup: {lastBackup}</p>
                    </div>
                    <button
                      onClick={handleManualBackup}
                      disabled={isBackingUp}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isBackingUp ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                      {isBackingUp ? 'Backing up...' : 'Backup Now'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 p-4 rounded-xl flex gap-3 text-blue-700 text-sm">
                <AlertCircle size={20} className="shrink-0" />
                <p>
                  <strong>Warning:</strong> The reset function will overwrite all configuration data. 
                  Backups are stored in the <strong>/backups</strong> directory. 
                  For production, configure S3 storage in <code>.env</code> file.
                </p>
              </div>
            </div>
          )}

          {/* --- SECURITY TAB --- */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Shield size={20} className="text-gray-400" /> Admin Security
              </h2>
              <div className="bg-gray-50 p-6 rounded-xl">
                <p className="text-sm text-gray-600 mb-4">
                  To change passwords or manage admin access, please visit the <a href="/admin/users" className="text-[#A81010] font-bold hover:underline">Users Page</a>.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-bold text-gray-800">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50">
                      Enable
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-bold text-gray-800">Session Timeout</h3>
                      <p className="text-sm text-gray-500">Automatically logout after 30 minutes of inactivity</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">30 min</span>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50">
                        Change
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  );
}