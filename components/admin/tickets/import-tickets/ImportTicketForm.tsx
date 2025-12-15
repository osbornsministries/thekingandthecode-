// components/import/ImportTicketForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { ImportTicketData } from '@/lib/actions/ticket/ticket-importer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Info } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';

interface ImportTicketFormProps {
  onSubmit: (data: ImportTicketData) => Promise<void>;
  isLoading: boolean;
}

export function ImportTicketForm({ onSubmit, isLoading }: ImportTicketFormProps) {
  const [formData, setFormData] = useState<ImportTicketData>({
    dayId: 1,
    sessionId: 1,
    priceId: 1,
    quantity: 1,
    paymentMethodId: 'CASH',
    fullName: '',
    phone: '',
    totalAmount: 0,
    ticketType: 'ADULT',
    isPaid: true,
    paymentStatus: 'PAID',
    notes: ''
  });

  const [days, setDays] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        // In a real app, you'd fetch these from your API
        // For now, using mock data
        const mockDays = [
          { id: 1, name: 'Day 1: January 15, 2024' },
          { id: 2, name: 'Day 2: January 16, 2024' },
          { id: 3, name: 'Day 3: January 17, 2024' }
        ];

        const mockSessions = [
          { id: 1, dayId: 1, name: 'Morning Session (9:00 - 12:00)' },
          { id: 2, dayId: 1, name: 'Afternoon Session (14:00 - 17:00)' },
          { id: 3, dayId: 1, name: 'Evening Session (18:00 - 21:00)' }
        ];

        const mockPrices = [
          { id: 1, name: 'Adult Regular', price: 10000 },
          { id: 2, name: 'Student Regular', price: 5000 },
          { id: 3, name: 'Child Regular', price: 3000 }
        ];

        const mockPaymentMethods = [
          { id: 'CASH', name: 'Cash' },
          { id: 'MPESA', name: 'M-Pesa' },
          { id: 'AIRTEL', name: 'Airtel Money' },
          { id: 'TIGO', name: 'Tigo Pesa' },
          { id: 'BANK', name: 'Bank Transfer' }
        ];

        setDays(mockDays);
        setSessions(mockSessions);
        setPrices(mockPrices);
        setPaymentMethods(mockPaymentMethods);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate amount based on selected price
    const selectedPrice = prices.find(p => p.id === formData.priceId);
    if (selectedPrice) {
      const calculatedAmount = selectedPrice.price * formData.quantity;
      await onSubmit({
        ...formData,
        totalAmount: calculatedAmount
      });
    } else {
      await onSubmit(formData);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'totalAmount' ? Number(value) : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: name === 'dayId' || name === 'sessionId' || name === 'priceId' || name === 'quantity' 
        ? Number(value) 
        : value
    }));
  };

  const handleTicketTypeChange = (value: 'ADULT' | 'STUDENT' | 'CHILD') => {
    setFormData(prev => ({
      ...prev,
      ticketType: value,
      // Clear student-specific fields when changing ticket type
      ...(value !== 'STUDENT' && {
        studentId: '',
        institution: '',
        institutionName: ''
      })
    }));
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          The system will automatically check if this user already has tickets and mark this as a duplicate if found.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Event Details */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-semibold text-lg">Event Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="dayId">Event Day</Label>
              <Select value={formData.dayId.toString()} onValueChange={(v) => handleSelectChange('dayId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {days.map(day => (
                    <SelectItem key={day.id} value={day.id.toString()}>
                      {day.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionId">Session</Label>
              <Select value={formData.sessionId.toString()} onValueChange={(v) => handleSelectChange('sessionId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.filter(s => s.dayId === formData.dayId).map(session => (
                    <SelectItem key={session.id} value={session.id.toString()}>
                      {session.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticketType">Ticket Type</Label>
              <Select value={formData.ticketType} onValueChange={handleTicketTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ticket type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADULT">Adult</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="CHILD">Child</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceId">Ticket Price</Label>
              <Select value={formData.priceId.toString()} onValueChange={(v) => handleSelectChange('priceId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select price" />
                </SelectTrigger>
                <SelectContent>
                  {prices.map(price => (
                    <SelectItem key={price.id} value={price.id.toString()}>
                      {price.name} - TZS {price.price.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={handleInputChange}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* User Details */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-semibold text-lg">User Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                placeholder="255712345678"
              />
            </div>

            {/* Student-specific fields */}
            {formData.ticketType === 'STUDENT' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID *</Label>
                  <Input
                    id="studentId"
                    name="studentId"
                    value={formData.studentId || ''}
                    onChange={handleInputChange}
                    required={formData.ticketType === 'STUDENT'}
                    placeholder="STU123456"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institution">Institution Type *</Label>
                  <Select 
                    value={formData.institution || ''} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, institution: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select institution" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNIVERSITY">University</SelectItem>
                      <SelectItem value="COLLEGE">College</SelectItem>
                      <SelectItem value="SECONDARY">Secondary School</SelectItem>
                      <SelectItem value="PRIMARY">Primary School</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.institution === 'OTHER' && (
                  <div className="space-y-2">
                    <Label htmlFor="institutionName">Institution Name *</Label>
                    <Input
                      id="institutionName"
                      name="institutionName"
                      value={formData.institutionName || ''}
                      onChange={handleInputChange}
                      required={formData.institution === 'OTHER'}
                      placeholder="Enter institution name"
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Details */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-lg">Payment Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethodId">Payment Method</Label>
              <Select 
                value={formData.paymentMethodId} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, paymentMethodId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(method => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isPaid">Payment Status</Label>
              <Select 
                value={formData.isPaid ? 'paid' : 'pending'} 
                onValueChange={(v) => setFormData(prev => ({ 
                  ...prev, 
                  isPaid: v === 'paid',
                  paymentStatus: v === 'paid' ? 'PAID' : 'PENDING'
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.isPaid && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="externalId">External ID (Optional)</Label>
                <Input
                  id="externalId"
                  name="externalId"
                  value={formData.externalId || ''}
                  onChange={handleInputChange}
                  placeholder="Payment reference ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
                <Input
                  id="transactionId"
                  name="transactionId"
                  value={formData.transactionId || ''}
                  onChange={handleInputChange}
                  placeholder="Transaction ID"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes || ''}
              onChange={handleInputChange}
              placeholder="Any additional notes about this import"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button 
          type="submit" 
          disabled={isLoading}
          className="min-w-[150px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            'Import Ticket'
          )}
        </Button>
      </div>
    </form>
  );
}