// app/(admin)/agent/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { 
  ScanLine, UserSearch, CheckCircle, XCircle, 
  UserPlus, History, Loader2, RefreshCcw,
  Phone, Mail, Ticket, Calendar, Clock,
  Search, Users, QrCode, ArrowRight
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  scanTicketForAssignment, 
  searchAttendees, 
  generateOtp,
  assignTicketToAttendee,
  getAgentAssignments 
}  from '@/lib/actions/ticket/agent-actions';

type ScanResult = any;
type AttendeeSearchResult = any;

export default function AgentAssignmentPage() {
  // State
  const [activeTab, setActiveTab] = useState<'scan' | 'assign' | 'history'>('scan');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<AttendeeSearchResult[]>([]);
  const [selectedAttendee, setSelectedAttendee] = useState<AttendeeSearchResult | null>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    name: '',
    phone: '',
    email: '',
    requireOtp: false
  });
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [agentId, setAgentId] = useState<string>('agent-001'); // In production, get from auth

  // Handle QR scan
  const handleScan = async (result: string) => {
    if (loading) return;
    setLoading(true);
    
    const scanData = await scanTicketForAssignment(result);
    
    if (scanData.success && scanData.data) {
      setScanResult(scanData.data);
      setActiveTab('assign');
    } else {
      alert(scanData.error || 'Failed to scan ticket');
    }
    
    setLoading(false);
  };

  // Search attendees
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    const result = await searchAttendees(searchTerm);
    
    if (result.success) {
      setSearchResults(result.data);
    } else {
      alert(result.error || 'Search failed');
      setSearchResults([]);
    }
    
    setLoading(false);
  };

  // Select attendee from search results
  const handleSelectAttendee = (attendee: AttendeeSearchResult) => {
    setSelectedAttendee(attendee);
    setAssignmentForm({
      name: attendee.name,
      phone: attendee.phone,
      email: '',
      requireOtp: false
    });
  };

  // Generate OTP
  const handleGenerateOtp = async () => {
    const phone = assignmentForm.phone;
    if (!phone || phone === 'N/A') {
      alert('Valid phone number required for OTP');
      return;
    }
    
    const result = await generateOtp(phone);
    if (result.success && result.otp) {
      setGeneratedOtp(result.otp);
      alert(`OTP sent to ${phone}: ${result.otp}`);
    } else {
      alert(result.error || 'Failed to generate OTP');
    }
  };

  // Assign ticket
  const handleAssignTicket = async () => {
    if (!scanResult) {
      alert('No ticket scanned');
      return;
    }
    
    if (!assignmentForm.name.trim()) {
      alert('Name is required');
      return;
    }
    
    if (assignmentForm.requireOtp && !otp) {
      alert('OTP is required');
      return;
    }
    
    if (assignmentForm.requireOtp && otp !== generatedOtp) {
      alert('Invalid OTP');
      return;
    }
    
    setAssigning(true);
    
    const assignmentData = {
      ticketId: scanResult.ticketId,
      assigneeName: assignmentForm.name,
      assigneePhone: assignmentForm.phone,
      assigneeEmail: assignmentForm.email,
      agentId,
      requireOtp: assignmentForm.requireOtp,
      otpCode: assignmentForm.requireOtp ? otp : undefined,
      otpExpiry: assignmentForm.requireOtp ? new Date(Date.now() + 10 * 60 * 1000) : undefined
    };
    
    const result = await assignTicketToAttendee(assignmentData);
    
    if (result.success) {
      alert('Ticket assigned successfully!');
      resetForm();
      setActiveTab('history');
      loadAssignments();
    } else {
      alert(result.error || 'Failed to assign ticket');
    }
    
    setAssigning(false);
  };

  // Load assignment history
  const loadAssignments = async () => {
    const result = await getAgentAssignments(agentId);
    if (result.success) {
      setAssignments(result.data);
    }
  };

  // Reset form
  const resetForm = () => {
    setScanResult(null);
    setSelectedAttendee(null);
    setSearchTerm('');
    setSearchResults([]);
    setAssignmentForm({
      name: '',
      phone: '',
      email: '',
      requireOtp: false
    });
    setOtp('');
    setGeneratedOtp(null);
  };

  // Load history on tab change
  useEffect(() => {
    if (activeTab === 'history') {
      loadAssignments();
    }
  }, [activeTab]);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Agent Assignment Desk</h1>
          <p className="text-gray-500 mt-2">Assign printed POS tickets to registered attendees</p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tickets Scanned</p>
                  <p className="text-2xl font-bold text-gray-800">{scanResult ? 1 : 0}</p>
                </div>
                <QrCode className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Today's Assignments</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {assignments.filter(a => 
                      new Date(a.assignment.createdAt).toDateString() === new Date().toDateString()
                    ).length}
                  </p>
                </div>
                <UserPlus className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Agent ID</p>
                  <p className="text-lg font-bold text-gray-800 font-mono">{agentId}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Scanning & Search */}
          <div className="lg:col-span-5 space-y-6">
            {/* Tab Navigation */}
            <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm">
              <button
                onClick={() => setActiveTab('scan')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'scan' ? 'bg-black text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ScanLine size={16} /> Scan Ticket
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'history' ? 'bg-black text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <History size={16} /> History
              </button>
            </div>

            {/* Scan Area */}
            {activeTab === 'scan' && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="relative h-[300px] bg-black rounded-xl overflow-hidden">
                  {!scanResult && (
                    <Scanner
                      onScan={(result) => {
                        if (result?.[0]?.rawValue && !loading) {
                          handleScan(result[0].rawValue);
                        }
                      }}
                      components={{ finder: true }}
                    />
                  )}
                  
                  {loading && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                      <Loader2 className="w-12 h-12 text-white animate-spin" />
                    </div>
                  )}
                  
                  {scanResult && (
                    <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                      <div className="text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <p className="text-white text-lg font-bold">Ticket Scanned!</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 text-center">
                  <p className="text-gray-500 text-sm">
                    Scan a printed POS ticket QR code to begin assignment
                  </p>
                </div>
                
                {scanResult && (
                  <button
                    onClick={resetForm}
                    className="mt-4 w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCcw size={16} /> Scan Another Ticket
                  </button>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800">Recent Assignments</h3>
                  <button
                    onClick={loadAssignments}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <RefreshCcw size={16} />
                  </button>
                </div>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {assignments.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No assignments yet</p>
                    </div>
                  ) : (
                    assignments.map((assignment) => (
                      <div key={assignment.assignment.id} className="p-4 border border-gray-100 rounded-xl hover:border-gray-300 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold">{assignment.assignment.assignedTo}</p>
                            <p className="text-sm text-gray-500">{assignment.assignment.assignedPhone}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            assignment.assignment.status === 'COMPLETED' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {assignment.assignment.status}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <p>Ticket: {assignment.ticket.ticketCode.slice(0, 8)}...</p>
                          <p className="text-xs mt-1">
                            {new Date(assignment.assignment.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Ticket Info Card */}
            {scanResult && activeTab !== 'history' && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-4">Ticket Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ticket Code:</span>
                    <span className="font-bold font-mono">{scanResult.ticketCode.slice(0, 12)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      scanResult.ticketType === 'ADULT' ? 'bg-red-100 text-red-700' :
                      scanResult.ticketType === 'STUDENT' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {scanResult.ticketType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Original Owner:</span>
                    <span>{scanResult.originalOwner}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className={`font-bold ${
                      scanResult.isValid ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {scanResult.isValid ? 'VALID' : 'INVALID'}
                    </span>
                  </div>
                  {scanResult.eventInfo && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Calendar size={14} /> Event:
                        </span>
                        <span>{scanResult.eventInfo.dayName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Clock size={14} /> Session:
                        </span>
                        <span>{scanResult.eventInfo.sessionTime}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Assignment Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 h-full">
              <div className="flex items-center gap-2 mb-6">
                <UserPlus className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-bold text-gray-800">Assign to Attendee</h2>
              </div>
              
              {!scanResult ? (
                <div className="text-center py-12 text-gray-400">
                  <Ticket className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">Scan a ticket to begin assignment</p>
                  <p className="text-sm mt-2">The assignment form will appear here after scanning</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Search for Existing Attendee */}
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Search size={14} /> Search Existing Attendee
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, phone, or student ID..."
                        className="flex-1 p-3 border border-gray-300 rounded-xl focus:border-black outline-none"
                      />
                      <button
                        onClick={handleSearch}
                        disabled={!searchTerm.trim() || loading}
                        className="px-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="animate-spin" /> : 'Search'}
                      </button>
                    </div>
                    
                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                        {searchResults.map((attendee) => (
                          <div
                            key={`${attendee.type}-${attendee.id}`}
                            onClick={() => handleSelectAttendee(attendee)}
                            className={`p-3 border rounded-xl cursor-pointer transition-colors ${
                              selectedAttendee?.id === attendee.id && selectedAttendee?.type === attendee.type
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-bold">{attendee.name}</p>
                                <p className="text-sm text-gray-500">
                                  {attendee.type} • {attendee.phone || 'No phone'}
                                  {attendee.studentId && ` • ${attendee.studentId}`}
                                </p>
                              </div>
                              {attendee.hasActiveTicket && (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                                  Has Ticket
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Assignment Form */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                      <UserPlus size={16} /> Assign to New Attendee
                    </h3>
                    
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Full Name *</label>
                      <input
                        type="text"
                        value={assignmentForm.name}
                        onChange={(e) => setAssignmentForm({...assignmentForm, name: e.target.value})}
                        placeholder="Enter attendee's full name"
                        className="w-full p-3 border border-gray-300 rounded-xl focus:border-black outline-none"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                          <Phone size={14} /> Phone Number
                        </label>
                        <input
                          type="tel"
                          value={assignmentForm.phone}
                          onChange={(e) => setAssignmentForm({...assignmentForm, phone: e.target.value})}
                          placeholder="e.g., 255712345678"
                          className="w-full p-3 border border-gray-300 rounded-xl focus:border-black outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                          <Mail size={14} /> Email (Optional)
                        </label>
                        <input
                          type="email"
                          value={assignmentForm.email}
                          onChange={(e) => setAssignmentForm({...assignmentForm, email: e.target.value})}
                          placeholder="email@example.com"
                          className="w-full p-3 border border-gray-300 rounded-xl focus:border-black outline-none"
                        />
                      </div>
                    </div>
                    
                    {/* OTP Section */}
                    <div className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="requireOtp"
                            checked={assignmentForm.requireOtp}
                            onChange={(e) => setAssignmentForm({...assignmentForm, requireOtp: e.target.checked})}
                            className="w-4 h-4"
                          />
                          <label htmlFor="requireOtp" className="text-sm font-bold text-gray-700">
                            Require OTP Verification
                          </label>
                        </div>
                        
                        {assignmentForm.requireOtp && assignmentForm.phone && assignmentForm.phone !== 'N/A' && (
                          <button
                            onClick={handleGenerateOtp}
                            className="text-sm text-blue-600 hover:text-blue-700 font-bold"
                          >
                            Generate OTP
                          </button>
                        )}
                      </div>
                      
                      {assignmentForm.requireOtp && generatedOtp && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="Enter 6-digit OTP"
                              className="flex-1 p-3 border border-gray-300 rounded-xl text-center text-lg font-mono"
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            OTP sent to {assignmentForm.phone}. Valid for 10 minutes.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Assignment Button */}
                    <button
                      onClick={handleAssignTicket}
                      disabled={!assignmentForm.name.trim() || assigning || (assignmentForm.requireOtp && !otp)}
                      className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200"
                    >
                      {assigning ? (
                        <>
                          <Loader2 className="animate-spin" /> Assigning...
                        </>
                      ) : (
                        <>
                          <UserPlus size={18} /> ASSIGN TICKET
                        </>
                      )}
                    </button>
                    
                    {/* Summary */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Ticket Value:</span>
                        <span className="font-bold">{scanResult.price.toLocaleString()} TZS</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-500">Assignment Type:</span>
                        <span className="font-bold">POS to Attendee</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-500">Agent:</span>
                        <span className="font-bold">{agentId}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}