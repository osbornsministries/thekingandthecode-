// components/admin/TicketForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createTicket,updateTicket, getTicketById } from '@/lib/actions/ticket/tickets';
import { db } from '@/lib/db/db';
import { eventSessions, eventDays } from '@/lib/drizzle/schema';
import { eq, asc } from 'drizzle-orm';
import { Save, X, Loader2, Plus, Minus } from 'lucide-react';

interface TicketFormProps {
  ticketId?: number;
  mode?: 'create' | 'edit';
}

interface SessionOption {
  id: number;
  name: string;
  day: {
    id: number;
    name: string;
    date: Date;
  };
}

// Simple pricing configuration - no arrays, just objects
const PRICING = {
  REGULAR: { adult: 25000, student: 15000, child: 10000 },
  VIP: { adult: 50000, student: 30000, child: 20000 },
  VVIP: { adult: 100000, student: 60000, child: 40000 },
  STUDENT: { adult: 15000, student: 15000, child: 10000 },
  CHILD: { adult: 10000, student: 10000, child: 10000 }
} as const;

type TicketType = keyof typeof PRICING;

export default function TicketForm({ ticketId, mode = 'create' }: TicketFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [formData, setFormData] = useState({
    sessionId: '',
    purchaserName: '',
    purchaserPhone: '',
    ticketType: 'REGULAR' as TicketType,
    adultQuantity: 1,
    studentQuantity: 0,
    childQuantity: 0,
    totalAmount: 25000, // Initial amount for 1 adult regular ticket
    paymentStatus: 'PENDING' as 'PENDING' | 'PAID' | 'FAILED',
    paymentMethodId: '' as '' | 'CASH' | 'MPESA' | 'TIGO_PESA' | 'AIRTEL_MONEY' | 'CREDIT_CARD' | 'BANK_TRANSFER',
    institution: '',
    studentId: ''
  });

  // Calculate total amount - NO useMemo, just a simple function
  const calculateTotalAmount = (
    ticketType: TicketType, 
    adultQty: number, 
    studentQty: number, 
    childQty: number
  ) => {
    // Get prices for the ticket type, fallback to REGULAR if not found
    const prices = PRICING[ticketType] || PRICING.REGULAR;
    return (adultQty * prices.adult) + (studentQty * prices.student) + (childQty * prices.child);
  };

  // Get current prices
  const getCurrentPrices = () => {
    return PRICING[formData.ticketType] || PRICING.REGULAR;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sessions
        const sessionsData = await db.select({
          id: eventSessions.id,
          name: eventSessions.name,
          day: {
            id: eventDays.id,
            name: eventDays.name,
            date: eventDays.date
          }
        })
          .from(eventSessions)
          .leftJoin(eventDays, eq(eventSessions.dayId, eventDays.id))
          .orderBy(asc(eventDays.date), asc(eventSessions.startTime));
        
        setSessions(sessionsData);
        
        // Set default session if none selected
        if (sessionsData.length > 0 && !formData.sessionId) {
          setFormData(prev => ({ 
            ...prev, 
            sessionId: sessionsData[0].id.toString()
          }));
        }

        // Fetch ticket data if in edit mode
        if (mode === 'edit' && ticketId) {
          const ticket = await getTicketById(ticketId);
          if (ticket) {
            const ticketType = (ticket.ticketType as TicketType) || 'REGULAR';
            const adultQty = ticket.adultQuantity || 0;
            const studentQty = ticket.studentQuantity || 0;
            const childQty = ticket.childQuantity || 0;
            const total = calculateTotalAmount(ticketType, adultQty, studentQty, childQty);
            
            setFormData({
              sessionId: ticket.session?.id?.toString() || '',
              purchaserName: ticket.purchaserName || '',
              purchaserPhone: ticket.purchaserPhone || '',
              ticketType: ticketType,
              adultQuantity: adultQty,
              studentQuantity: studentQty,
              childQuantity: childQty,
              totalAmount: total,
              paymentStatus: (ticket.paymentStatus as 'PENDING' | 'PAID' | 'FAILED') || 'PENDING',
              paymentMethodId: (ticket.paymentMethodId as any) || '',
              institution: ticket.institution || '',
              studentId: ticket.studentId || ''
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [mode, ticketId]);

  // Update total when quantities change
  useEffect(() => {
    const total = calculateTotalAmount(
      formData.ticketType,
      formData.adultQuantity,
      formData.studentQuantity,
      formData.childQuantity
    );
    setFormData(prev => ({ ...prev, totalAmount: total }));
  }, [formData.adultQuantity, formData.studentQuantity, formData.childQuantity, formData.ticketType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'ticketType') {
      const newTicketType = value as TicketType;
      // Update ticket type and recalculate total
      const total = calculateTotalAmount(
        newTicketType,
        formData.adultQuantity,
        formData.studentQuantity,
        formData.childQuantity
      );
      setFormData(prev => ({ 
        ...prev, 
        ticketType: newTicketType,
        totalAmount: total 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleQuantityChange = (type: 'adult' | 'student' | 'child', operation: 'increase' | 'decrease') => {
    setFormData(prev => {
      const key = `${type}Quantity` as keyof typeof prev;
      const current = prev[key] as number;
      const newValue = operation === 'increase' ? current + 1 : Math.max(0, current - 1);
      
      // Calculate new total
      const newTotal = calculateTotalAmount(
        prev.ticketType,
        type === 'adult' ? newValue : prev.adultQuantity,
        type === 'student' ? newValue : prev.studentQuantity,
        type === 'child' ? newValue : prev.childQuantity
      );
      
      return { 
        ...prev, 
        [key]: newValue,
        totalAmount: newTotal
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.sessionId || !formData.purchaserName || !formData.purchaserPhone) {
      alert('Please fill in all required fields');
      return;
    }

    const totalQuantity = formData.adultQuantity + formData.studentQuantity + formData.childQuantity;
    if (totalQuantity <= 0) {
      alert('At least one ticket quantity must be greater than 0');
      return;
    }

    setIsLoading(true);

    try {
      const ticketData = {
        sessionId: parseInt(formData.sessionId),
        purchaserName: formData.purchaserName,
        purchaserPhone: formData.purchaserPhone,
        ticketType: formData.ticketType,
        adultQuantity: formData.adultQuantity,
        studentQuantity: formData.studentQuantity,
        childQuantity: formData.childQuantity,
        totalAmount: formData.totalAmount,
        paymentStatus: formData.paymentStatus,
        paymentMethodId: formData.paymentMethodId || undefined,
        institution: formData.institution || undefined,
        studentId: formData.studentId || undefined
      };

      let result;
      if (mode === 'create') {
        result = await createTicket(ticketData);
      } else if (mode === 'edit' && ticketId) {
        result = await updateTicket(ticketId, ticketData);
      }

      if (result?.success) {
        router.push('/admin/tickets');
        router.refresh();
      } else {
        alert(result?.error || 'Failed to save ticket');
      }
    } catch (error) {
      console.error('Error saving ticket:', error);
      alert('An error occurred while saving the ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const currentPrices = getCurrentPrices();
  const totalQuantity = formData.adultQuantity + formData.studentQuantity + formData.childQuantity;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {mode === 'create' ? 'Create New Ticket' : 'Edit Ticket'}
            </h2>
            <p className="text-sm text-gray-500">
              {mode === 'create' ? 'Add a new ticket to the system' : 'Update ticket information'}
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/tickets')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            type="button"
          >
            <X size={16} /> Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Session *
              </label>
              <select
                name="sessionId"
                value={formData.sessionId}
                onChange={handleChange}
                required
                disabled={sessions.length === 0 || isLoading}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010] disabled:opacity-50"
              >
                <option value="">Select a session</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.day.name} - {session.name}
                  </option>
                ))}
              </select>
              {sessions.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">Loading sessions...</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ticket Type *
              </label>
              <select
                name="ticketType"
                value={formData.ticketType}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010] disabled:opacity-50"
              >
                <option value="REGULAR">Regular</option>
                <option value="VIP">VIP</option>
                <option value="VVIP">VVIP</option>
                <option value="STUDENT">Student</option>
                <option value="CHILD">Child</option>
              </select>
            </div>
          </div>

          {/* Purchaser Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Purchaser Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="purchaserName"
                  value={formData.purchaserName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010] disabled:opacity-50"
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
                  value={formData.purchaserPhone}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010] disabled:opacity-50"
                  placeholder="255712345678"
                />
              </div>
            </div>

            {/* Student Information (Conditional) */}
            {(formData.ticketType === 'STUDENT' || formData.studentQuantity > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institution
                  </label>
                  <input
                    type="text"
                    name="institution"
                    value={formData.institution}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010] disabled:opacity-50"
                    placeholder="University of Dar es Salaam"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student ID
                  </label>
                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010] disabled:opacity-50"
                    placeholder="STD2024001"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Ticket Quantities */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ticket Quantities</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Adult Tickets */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900">Adult Tickets</h4>
                    <p className="text-sm text-gray-500">Age 18+</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    TZS {currentPrices.adult.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange('adult', 'decrease')}
                    disabled={formData.adultQuantity <= 0 || isLoading}
                    className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-2xl font-bold text-gray-900">{formData.adultQuantity}</span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange('adult', 'increase')}
                    disabled={isLoading}
                    className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Student Tickets */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900">Student Tickets</h4>
                    <p className="text-sm text-gray-500">With valid ID</p>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    TZS {currentPrices.student.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange('student', 'decrease')}
                    disabled={formData.studentQuantity <= 0 || isLoading}
                    className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-2xl font-bold text-gray-900">{formData.studentQuantity}</span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange('student', 'increase')}
                    disabled={isLoading}
                    className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Child Tickets */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900">Child Tickets</h4>
                    <p className="text-sm text-gray-500">Under 15 years</p>
                  </div>
                  <span className="text-lg font-bold text-purple-600">
                    TZS {currentPrices.child.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange('child', 'decrease')}
                    disabled={formData.childQuantity <= 0 || isLoading}
                    className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-2xl font-bold text-gray-900">{formData.childQuantity}</span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange('child', 'increase')}
                    disabled={isLoading}
                    className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalQuantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-2xl font-bold text-[#A81010]">
                    TZS {formData.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
              {totalQuantity === 0 && (
                <p className="text-sm text-red-600 mt-2 text-center">
                  At least one ticket must be selected
                </p>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status *
                </label>
                <select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010] disabled:opacity-50"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  name="paymentMethodId"
                  value={formData.paymentMethodId}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81010]/20 focus:border-[#A81010] disabled:opacity-50"
                >
                  <option value="">Select payment method</option>
                  <option value="CASH">Cash</option>
                  <option value="MPESA">M-Pesa</option>
                  <option value="TIGO_PESA">Tigo Pesa</option>
                  <option value="AIRTEL_MONEY">Airtel Money</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/admin/tickets')}
              disabled={isLoading}
              className="px-6 py-3 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || totalQuantity === 0 || !formData.sessionId}
              className="px-6 py-3 bg-[#A81010] text-white rounded-lg font-medium hover:bg-[#8a0d0d] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {mode === 'create' ? 'Create Ticket' : 'Update Ticket'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}