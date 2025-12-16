// app/admin/tickets/[id]/edit/EditTicketForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/providers/ToastProvider';
import { 
  Ticket, Calendar, Clock, User, Phone, DollarSign, Users, 
  GraduationCap, Baby, Save, X, Loader, CreditCard, Database,
  Tag, Building, FileText, MessageSquare, Trash2
} from 'lucide-react';

// ... interfaces remain the same ...

export default function EditTicketForm({ 
  initialData, 
  transaction, 
  currentSession,
  sessions 
}: EditTicketFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ticket' | 'transaction' | 'session'>('ticket');
  
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
  }, [initialData]);

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`/api/admin/tickets/${initialData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketForm),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        addToast('Ticket updated successfully!', 'success');
        
        // Redirect after a short delay to show the toast
        setTimeout(() => {
          router.push('/admin/tickets');
          router.refresh();
        }, 1500);
      } else {
        addToast(data.error || 'Failed to update ticket', 'error');
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      addToast('An error occurred while updating the ticket', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Ensure we have the ticket ID
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
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Update the transaction form with the response data
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
      setLoading(false);
    }
  };

  const handleSessionUpdate = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/admin/tickets/${initialData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: ticketForm.sessionId }),
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
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!transactionForm.id || !confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`/api/admin/transactions/${transactionForm.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Reset transaction form
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
      setLoading(false);
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Edit Ticket #{initialData.id}</h1>
        <p className="text-sm text-gray-500">Update ticket, transaction, and session information.</p>
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
            Transaction
          </div>
        </button>
        <button
          onClick={() => setActiveTab('session')}
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'session' ? 'border-b-2 border-[#A81010] text-[#A81010]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            Session
          </div>
        </button>
      </div>

      {/* Ticket Details Tab */}
      {activeTab === 'ticket' && (
        <form onSubmit={handleTicketSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User size={20} /> Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ticket Code
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={ticketForm.ticketCode}
                      readOnly
                      className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(ticketForm.ticketCode)}
                      className="px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200"
                    >
                      <Tag size={16} />
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
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
            >
              <X size={16} /> Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#A81010] text-white rounded-lg font-medium hover:bg-[#8a0d0d] transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
              {loading ? 'Updating...' : 'Update Ticket'}
            </button>
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
                    Provider
                  </label>
                  <select
                    name="provider"
                    value={transactionForm.provider}
                    onChange={handleTransactionChange}
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
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('ticket')}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
            >
              Back to Ticket
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#A81010] text-white rounded-lg font-medium hover:bg-[#8a0d0d] transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
              {loading ? 'Saving...' : 'Save Transaction'}
            </button>
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
                      <p className="font-bold">{new Date(currentSession.dayDate).toLocaleDateString()}</p>
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
                Assign to New Session *
              </label>
              <select
                value={ticketForm.sessionId}
                onChange={(e) => setTicketForm(prev => ({ ...prev, sessionId: e.target.value }))}
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

          {/* Form Actions */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('ticket')}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
            >
              Back to Ticket
            </button>
            <button
              onClick={handleSessionUpdate}
              disabled={loading || !ticketForm.sessionId}
              className="px-6 py-2.5 bg-[#A81010] text-white rounded-lg font-medium hover:bg-[#8a0d0d] transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
              {loading ? 'Updating...' : 'Update Session'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}