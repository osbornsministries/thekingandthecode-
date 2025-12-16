// app/admin/tickets/create/CreateTicketForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/providers/ToastProvider';
import { 
  Ticket, Calendar, Clock, User, Phone, DollarSign, Users, 
  GraduationCap, Baby, Save, X, Loader, CreditCard, Database,
  Tag, Building, FileText, MessageSquare, Plus
} from 'lucide-react';

interface Session {
  id: number;
  name: string;
  dayName: string;
  date: string | null;
  startTime: string;
  endTime: string;
}

interface CreateTicketFormProps {
  sessions: Session[];
}

export default function CreateTicketForm({ sessions }: CreateTicketFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ticket' | 'transaction'>('ticket');
  
  const [ticketForm, setTicketForm] = useState({
    sessionId: '',
    purchaserName: '',
    purchaserPhone: '',
    ticketType: 'REGULAR',
    totalAmount: '',
    paymentStatus: 'PAID',
    adultQuantity: 0,
    studentQuantity: 0,
    childQuantity: 0,
    studentId: '',
    institution: '',
  });

  const [transactionForm, setTransactionForm] = useState({
    externalId: '',
    reference: '',
    transId: '',
    provider: '',
    accountNumber: '',
    amount: '',
    currency: 'TZS',
    status: 'PENDING',
    message: '',
  });

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // First create the ticket
      const ticketResponse = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketForm),
      });
      
      const ticketData = await ticketResponse.json();
      
      if (!ticketResponse.ok) {
        throw new Error(ticketData.error || 'Failed to create ticket');
      }

      let transactionCreated = false;
      // If transaction data is provided, create transaction
      if (transactionForm.provider || transactionForm.amount) {
        const transactionResponse = await fetch('/api/admin/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...transactionForm,
            ticketId: ticketData.id,
          }),
        });

        if (transactionResponse.ok) {
          transactionCreated = true;
        } else {
          const errorData = await transactionResponse.json();
          console.warn('Transaction creation failed:', errorData);
          addToast('Ticket created but transaction failed to save', 'warning', 7000);
        }
      }

      // Show success toast
      addToast(
        `Ticket created successfully${transactionCreated ? ' with transaction' : ''}!`,
        'success'
      );

      // Redirect after a short delay to show the toast
      setTimeout(() => {
        router.push('/admin/tickets');
        router.refresh();
      }, 1500);

    } catch (error) {
      console.error('Error creating ticket:', error);
      addToast(
        error instanceof Error ? error.message : 'Failed to create ticket',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTicketChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTicketForm(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const handleTransactionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTransactionForm(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const handleTicketNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTicketForm(prev => ({ 
      ...prev, 
      [name]: parseInt(value) || 0 
    }));
  };

  // Calculate total quantity
  const totalQuantity = ticketForm.adultQuantity + ticketForm.studentQuantity + ticketForm.childQuantity;



  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Ticket</h1>
        <p className="text-sm text-gray-500">Create a new ticket with optional transaction details.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('ticket')}
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'ticket' ? 'border-b-2 border-[#A81010] text-[#A81010]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <div className="flex items-center gap-2">
            <Ticket size={16} />
            Ticket Details
          </div>
        </button>
        <button
          onClick={() => setActiveTab('transaction')}
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'transaction' ? 'border-b-2 border-[#A81010] text-[#A81010]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <div className="flex items-center gap-2">
            <CreditCard size={16} />
            Transaction (Optional)
          </div>
        </button>
      </div>

      {/* Ticket Details Tab */}
      {activeTab === 'ticket' && (
        <form onSubmit={handleTicketSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Purchaser Information */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User size={20} /> Purchaser Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="purchaserName"
                    value={ticketForm.purchaserName}
                    onChange={handleTicketChange}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="purchaserPhone"
                    value={ticketForm.purchaserPhone}
                    onChange={handleTicketChange}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
                    placeholder="255123456789"
                  />
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Ticket size={20} /> Ticket Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ticket Type *
                  </label>
                  <select
                    name="ticketType"
                    value={ticketForm.ticketType}
                    onChange={handleTicketChange}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
                  >
                    <option value="REGULAR">Regular</option>
                    <option value="VIP">VIP</option>
                    <option value="VVIP">VVIP</option>
                    <option value="ADULT">Adult</option>
                    <option value="STUDENT">Student</option>
                    <option value="CHILD">Child</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session *
                  </label>
                  <select
                    name="sessionId"
                    value={ticketForm.sessionId}
                    onChange={handleTicketChange}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
                  >
                    <option value="">Select a session</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.dayName} - {session.name} ({session.startTime} - {session.endTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign size={20} /> Payment Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Amount (TZS) *
                  </label>
                  <input
                    type="number"
                    name="totalAmount"
                    value={ticketForm.totalAmount}
                    onChange={handleTicketChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
                    placeholder="25000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Status *
                  </label>
                  <select
                    name="paymentStatus"
                    value={ticketForm.paymentStatus}
                    onChange={handleTicketChange}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
                  >
                    <option value="PAID">Paid</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                    <option value="UNPAID">Unpaid</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quantity Breakdown */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={20} /> Quantity Breakdown (Total: {totalQuantity})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-600" />
                      <span className="font-medium text-gray-900">Adults</span>
                    </div>
                    <input
                      type="number"
                      name="adultQuantity"
                      value={ticketForm.adultQuantity}
                      onChange={handleTicketNumberChange}
                      min="0"
                      className="w-20 px-2 py-1 bg-white border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Regular adult tickets</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <GraduationCap size={16} className="text-gray-600" />
                      <span className="font-medium text-gray-900">Students</span>
                    </div>
                    <input
                      type="number"
                      name="studentQuantity"
                      value={ticketForm.studentQuantity}
                      onChange={handleTicketNumberChange}
                      min="0"
                      className="w-20 px-2 py-1 bg-white border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Student discount tickets</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Baby size={16} className="text-gray-600" />
                      <span className="font-medium text-gray-900">Children</span>
                    </div>
                    <input
                      type="number"
                      name="childQuantity"
                      value={ticketForm.childQuantity}
                      onChange={handleTicketNumberChange}
                      min="0"
                      className="w-20 px-2 py-1 bg-white border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Children under 12</p>
                </div>
              </div>
            </div>

            {/* Student Information (Conditional) */}
            {ticketForm.ticketType === 'STUDENT' && (
              <div className="md:col-span-2">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Student Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student ID
                    </label>
                    <input
                      type="text"
                      name="studentId"
                      value={ticketForm.studentId}
                      onChange={handleTicketChange}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
                      placeholder="STD-2024-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Institution
                    </label>
                    <input
                      type="text"
                      name="institution"
                      value={ticketForm.institution}
                      onChange={handleTicketChange}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
                      placeholder="University Name"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-between gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
            >
              <X size={16} /> Cancel
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('transaction')}
                className="px-6 py-2.5 border border-[#A81010] text-[#A81010] rounded-lg font-medium hover:bg-red-50 transition-colors duration-200 flex items-center gap-2"
              >
                <CreditCard size={16} /> Add Transaction
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#A81010] text-white rounded-lg font-medium hover:bg-[#8a0d0d] transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                {loading ? 'Creating...' : 'Create Ticket'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Transaction Tab */}
      {activeTab === 'transaction' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard size={20} /> Transaction Details (Optional)
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              You can add transaction details now or leave it empty and add later.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Transaction IDs */}
            <div className="md:col-span-2">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Database size={16} /> Transaction IDs
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    External ID
                  </label>
                  <input
                    type="text"
                    name="externalId"
                    value={transactionForm.externalId}
                    onChange={handleTransactionChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
                    placeholder="EXT-123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference
                  </label>
                  <input
                    type="text"
                    name="reference"
                    value={transactionForm.reference}
                    onChange={handleTransactionChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
                    placeholder="REF-789012"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction ID
                  </label>
                  <input
                    type="text"
                    name="transId"
                    value={transactionForm.transId}
                    onChange={handleTransactionChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
                    placeholder="TXN-345678"
                  />
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Building size={16} /> Payment Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provider
                  </label>
                  <select
                    name="provider"
                    value={transactionForm.provider}
                    onChange={handleTransactionChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
                  >
                    <option value="">Select provider</option>
                    <option value="MPESA">M-Pesa</option>
                    <option value="TIGO_PESA">Tigo Pesa</option>
                    <option value="AIRTEL_MONEY">Airtel Money</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                      <option value="CASH">Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={transactionForm.accountNumber}
                    onChange={handleTransactionChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
                    placeholder="2557XXXXXX"
                  />
                </div>
              </div>
            </div>

            {/* Amount & Status */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign size={16} /> Amount & Status
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={transactionForm.amount}
                    onChange={handleTransactionChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
                    placeholder="25000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={transactionForm.status}
                    onChange={handleTransactionChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="SUCCESS">Success</option>
                    <option value="FAILED">Failed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="md:col-span-2">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MessageSquare size={16} /> Message / Notes
              </h3>
              <textarea
                name="message"
                value={transactionForm.message}
                onChange={handleTransactionChange}
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
                placeholder="Additional transaction notes..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('ticket')}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
            >
              Back to Ticket
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  // Clear transaction form
                  setTransactionForm({
                    externalId: '',
                    reference: '',
                    transId: '',
                    provider: '',
                    accountNumber: '',
                    amount: '',
                    currency: 'TZS',
                    status: 'PENDING',
                    message: '',
                  });
                }}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
              >
                Clear
              </button>
              <button
                onClick={handleTicketSubmit}
                disabled={loading}
                className="px-6 py-2.5 bg-[#A81010] text-white rounded-lg font-medium hover:bg-[#8a0d0d] transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                {loading ? 'Creating...' : 'Create Ticket with Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}