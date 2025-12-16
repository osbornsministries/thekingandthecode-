// app/admin/tickets/[id]/edit/EditTicketForm.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/providers/ToastProvider';
import { 
  Ticket, Calendar, Clock, User, Phone, DollarSign, Users, 
  GraduationCap, Baby, Save, X, Loader, CreditCard, Database,
  Tag, Building, FileText, MessageSquare, Trash2, Copy, Check,
  ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';

interface TicketFormData {
  id: number;
  sessionId: string;
  purchaserName: string;
  purchaserPhone: string;
  ticketType: string;
  totalAmount: string;
  paymentStatus: string;
  adultQuantity: number;
  studentQuantity: number;
  childQuantity: number;
  studentId: string;
  institution: string;
  ticketCode: string;
}

interface TransactionFormData {
  id?: number;
  externalId: string;
  reference: string;
  transId: string;
  provider: string;
  accountNumber: string;
  amount: string;
  currency: string;
  status: string;
  message: string;
}

interface SessionData {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  dayName: string;
  dayDate: string | null;
}

interface SessionOption {
  id: number;
  name: string;
  dayName: string;
  date: string | null;
  startTime: string;
  endTime: string;
}

interface EditTicketFormProps {
  initialData: TicketFormData;
  transaction: TransactionFormData | null;
  currentSession: SessionData | null;
  sessions: SessionOption[];
}

export default function EditTicketForm({ 
  initialData, 
  transaction, 
  currentSession,
  sessions 
}: EditTicketFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'ticket' | 'transaction' | 'session'>('ticket');
  const [copied, setCopied] = useState(false);
  
  const [ticketForm, setTicketForm] = useState<TicketFormData>(initialData);
  const [transactionForm, setTransactionForm] = useState<TransactionFormData>(
    transaction || {
      externalId: '',
      reference: '',
      transId: '',
      provider: '',
      accountNumber: '',
      amount: '',
      currency: 'TZS',
      status: 'PENDING',
      message: '',
    }
  );
  
  // Update forms when initialData changes
  useEffect(() => {
    setTicketForm(initialData);
    if (transaction) {
      setTransactionForm(transaction);
    }
  }, [initialData, transaction]);

  // Calculate totals
  const totalQuantity = ticketForm.adultQuantity + ticketForm.studentQuantity + ticketForm.childQuantity;

  // Copy to clipboard handler
  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(ticketForm.ticketCode);
      setCopied(true);
      addToast('Ticket code copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      addToast('Failed to copy ticket code', 'error');
    }
  }, [ticketForm.ticketCode, addToast]);

  // Handle ticket form changes
  const handleTicketChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      const numValue = value === '' ? 0 : Math.max(0, parseInt(value) || 0);
      setTicketForm(prev => ({ ...prev, [name]: numValue }));
    } else {
      setTicketForm(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  // Handle transaction form changes
  const handleTransactionChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTransactionForm(prev => ({ ...prev, [name]: value }));
  }, []);

  // Handle session change
  const handleSessionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setTicketForm(prev => ({ ...prev, sessionId: e.target.value }));
  }, []);

  // Ticket form submission
  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await fetch(`/api/admin/tickets/${initialData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ticketForm,
          adultQuantity: Number(ticketForm.adultQuantity) || 0,
          studentQuantity: Number(ticketForm.studentQuantity) || 0,
          childQuantity: Number(ticketForm.childQuantity) || 0,
          totalAmount: Number(ticketForm.totalAmount) || 0,
          sessionId: ticketForm.sessionId ? parseInt(ticketForm.sessionId) : null,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        addToast('Ticket updated successfully!', 'success');
        router.refresh();
      } else {
        addToast(data.error || 'Failed to update ticket', 'error');
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      addToast('An error occurred while updating the ticket', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Transaction form submission
  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (!ticketForm.id) {
        addToast('Ticket ID is required', 'error');
        return;
      }

      const url = transactionForm.id 
        ? `/api/admin/transactions/${transactionForm.id}`
        : `/api/admin/transactions`;
      
      const method = transactionForm.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...transactionForm,
          ticketId: ticketForm.id,
          amount: transactionForm.amount ? parseFloat(transactionForm.amount) : null,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.id) {
          setTransactionForm(prev => ({ ...prev, id: data.id }));
        }
        addToast(
          transactionForm.id ? 'Transaction updated successfully!' : 'Transaction created successfully!',
          'success'
        );
        router.refresh();
      } else {
        addToast(data.error || 'Failed to save transaction', 'error');
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      addToast('An error occurred while saving the transaction', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Session update
  const handleSessionUpdate = async () => {
    setSaving(true);
    
    try {
      const response = await fetch(`/api/admin/tickets/${initialData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: ticketForm.sessionId ? parseInt(ticketForm.sessionId) : null 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        addToast('Session updated successfully!', 'success');
        router.refresh();
      } else {
        addToast(data.error || 'Failed to update session', 'error');
      }
    } catch (error) {
      console.error('Error updating session:', error);
      addToast('An error occurred while updating the session', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async () => {
    if (!transactionForm.id || !confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    setSaving(true);
    
    try {
      const response = await fetch(`/api/admin/transactions/${transactionForm.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
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
        addToast('Transaction deleted successfully!', 'success');
        router.refresh();
      } else {
        const data = await response.json();
        addToast(data.error || 'Failed to delete transaction', 'error');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      addToast('An error occurred while deleting the transaction', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reset form to initial values
  const handleResetForm = () => {
    setTicketForm(initialData);
    if (transaction) {
      setTransactionForm(transaction);
    } else {
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
    }
    addToast('Form reset to original values', 'info');
  };

  // Render tabs
  const renderTabs = () => (
    <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
      <button
        onClick={() => setActiveTab('ticket')}
        className={`flex-shrink-0 px-4 py-2 font-medium text-sm ${activeTab === 'ticket' ? 'border-b-2 border-[#A81010] text-[#A81010]' : 'text-gray-500 hover:text-gray-700'}`}
      >
        <div className="flex items-center gap-2">
          <Ticket size={16} />
          Ticket Details
        </div>
      </button>
      <button
        onClick={() => setActiveTab('transaction')}
        className={`flex-shrink-0 px-4 py-2 font-medium text-sm ${activeTab === 'transaction' ? 'border-b-2 border-[#A81010] text-[#A81010]' : 'text-gray-500 hover:text-gray-700'}`}
      >
        <div className="flex items-center gap-2">
          <CreditCard size={16} />
          Transaction
        </div>
      </button>
      <button
        onClick={() => setActiveTab('session')}
        className={`flex-shrink-0 px-4 py-2 font-medium text-sm ${activeTab === 'session' ? 'border-b-2 border-[#A81010] text-[#A81010]' : 'text-gray-500 hover:text-gray-700'}`}
      >
        <div className="flex items-center gap-2">
          <Calendar size={16} />
          Session
        </div>
      </button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Ticket #{initialData.id}</h1>
            <p className="text-sm text-gray-500">Update ticket, transaction, and session information.</p>
          </div>
          <button
            onClick={handleResetForm}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Reset
          </button>
        </div>
      </div>

      {renderTabs()}

      {/* Ticket Details Tab */}
      {activeTab === 'ticket' && (
        <form onSubmit={handleTicketSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ticket Information */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Ticket size={20} /> Ticket Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ticket Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ticketForm.ticketCode}
                      readOnly
                      className="flex-1 px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
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
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Purchaser Information */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User size={20} /> Purchaser Information
              </h2>
              <div className="space-y-4">
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
                  />
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign size={20} /> Ticket Details
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
                  />
                </div>
              </div>
            </div>

            {/* Quantity Breakdown */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={20} /> Quantity Breakdown
                <span className="text-sm font-normal text-gray-500 ml-2">(Total: {totalQuantity})</span>
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
                      onChange={handleTicketChange}
                      min="0"
                      className="w-20 px-2 py-1 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#A81010]"
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
                      onChange={handleTicketChange}
                      min="0"
                      className="w-20 px-2 py-1 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#A81010]"
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
                      onChange={handleTicketChange}
                      min="0"
                      className="w-20 px-2 py-1 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#A81010]"
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
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <X size={16} /> Cancel
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('transaction')}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                Transaction
                <ChevronRight size={16} />
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#A81010] text-white rounded-lg font-medium hover:bg-[#8a0d0d] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving...' : 'Save Ticket'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Transaction Tab */}
      {activeTab === 'transaction' && (
        <form onSubmit={handleTransactionSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard size={20} /> Transaction Details
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {transactionForm.id ? 'Edit existing transaction' : 'Create new transaction for this ticket'}
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
                    Provider *
                  </label>
                  <select
                    name="provider"
                    value={transactionForm.provider}
                    onChange={handleTransactionChange}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
                  >
                    <option value="">Select provider</option>
                    <option value="STRIPE">Stripe</option>
                    <option value="PAYPAL">PayPal</option>
                    <option value="MPESA">M-Pesa</option>
                    <option value="TIGO_PESA">Tigo Pesa</option>
                    <option value="AIRTEL_MONEY">Airtel Money</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="CASH">Cash</option>
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
                    Amount *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={transactionForm.amount}
                    onChange={handleTransactionChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={transactionForm.status}
                    onChange={handleTransactionChange}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="SUCCESS">Success</option>
                    <option value="FAILED">Failed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="REFUNDED">Refunded</option>
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
          <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8 pt-6 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('ticket')}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <ChevronLeft size={16} />
                Ticket
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('session')}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                Session
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="flex gap-3">
              {transactionForm.id && (
                <button
                  type="button"
                  onClick={handleDeleteTransaction}
                  disabled={saving}
                  className="px-6 py-2.5 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#A81010] text-white rounded-lg font-medium hover:bg-[#8a0d0d] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving...' : 'Save Transaction'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Session Tab */}
      {activeTab === 'session' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={20} /> Session Assignment
            </h2>
            
            {currentSession ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-blue-900 mb-2">Current Session</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Day</p>
                    <p className="font-bold">{currentSession.dayName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Session</p>
                    <p className="font-bold">{currentSession.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="font-bold">{currentSession.startTime} - {currentSession.endTime}</p>
                  </div>
                  {currentSession.dayDate && (
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-bold">
                        {new Date(currentSession.dayDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800">No session assigned to this ticket.</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Assign to New Session
              </label>
              <select
                value={ticketForm.sessionId}
                onChange={handleSessionChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010]"
              >
                <option value="">Select a session</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.dayName} - {session.name} ({session.startTime} - {session.endTime})
                    {session.date && ` - ${new Date(session.date).toLocaleDateString()}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('transaction')}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <ChevronLeft size={16} />
              Transaction
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleSessionUpdate}
                disabled={saving || !ticketForm.sessionId}
                className="px-6 py-2.5 bg-[#A81010] text-white rounded-lg font-medium hover:bg-[#8a0d0d] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving...' : 'Update Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}