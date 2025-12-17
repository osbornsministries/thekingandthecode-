// app/admin/sms-templates/components/TicketSelection.tsx
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Filter, X, Check, Phone, User, Calendar, Clock } from 'lucide-react';
import { Ticket, Session, Day } from '@/lib/types/sms-templates';

interface TicketSelectionProps {
  tickets: Ticket[];
  sessions: Session[];
  days: Day[];
  selectedTickets: number[];
  selectedSession: string;
  selectedDay: string;
  selectedStatus: string;
  onSessionChange: (value: string) => void;
  onDayChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTicketToggle: (id: number) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  getFilteredTickets: () => Ticket[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function TicketSelection({
  tickets,
  sessions,
  days,
  selectedTickets,
  selectedSession,
  selectedDay,
  selectedStatus,
  onSessionChange,
  onDayChange,
  onStatusChange,
  onTicketToggle,
  onSelectAll,
  onClearSelection,
  getFilteredTickets,
  searchQuery,
  onSearchChange,
}: TicketSelectionProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [selectedTicketType, setSelectedTicketType] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');

  const filteredTickets = useMemo(() => {
    let filtered = getFilteredTickets();
    
    // Apply additional filters
    if (selectedPaymentStatus !== 'all') {
      filtered = filtered.filter(t => t.paymentStatus === selectedPaymentStatus);
    }
    
    if (selectedTicketType !== 'all') {
      filtered = filtered.filter(t => t.ticketType === selectedTicketType);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.ticketCode.toLowerCase().includes(query) ||
        t.purchaserName.toLowerCase().includes(query) ||
        t.purchaserPhone.includes(query)
      );
    }
    
    if (minAmount) {
      const min = parseFloat(minAmount);
      if (!isNaN(min)) {
        filtered = filtered.filter(t => t.totalAmount >= min);
      }
    }
    
    if (maxAmount) {
      const max = parseFloat(maxAmount);
      if (!isNaN(max)) {
        filtered = filtered.filter(t => t.totalAmount <= max);
      }
    }
    
    return filtered;
  }, [getFilteredTickets, selectedPaymentStatus, selectedTicketType, searchQuery, minAmount, maxAmount]);

  const handleClearAllFilters = () => {
    onSessionChange('all');
    onDayChange('all');
    onStatusChange('all');
    setSelectedPaymentStatus('all');
    setSelectedTicketType('all');
    setMinAmount('');
    setMaxAmount('');
    onSearchChange('');
    onClearSelection();
  };

  // Calculate statistics
  const totalAmount = filteredTickets.reduce((sum, ticket) => sum + ticket.totalAmount, 0);
  const totalTicketsSelected = selectedTickets.length;
  const totalQuantitySelected = filteredTickets
    .filter(t => selectedTickets.includes(t.id))
    .reduce((sum, ticket) => sum + ticket.totalQuantity, 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Select Tickets</CardTitle>
              <CardDescription>
                {totalTicketsSelected} ticket(s) selected • {totalQuantitySelected} total attendees
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onSelectAll} disabled={filteredTickets.length === 0}>
                <Check className="h-3 w-3 mr-1" />
                Select All ({filteredTickets.length})
              </Button>
              <Button variant="outline" size="sm" onClick={onClearSelection} disabled={selectedTickets.length === 0}>
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ticket code, name, or phone..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2 bg-muted/50 rounded text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-semibold">{filteredTickets.length}</p>
          </div>
          <div className="p-2 bg-muted/50 rounded text-center">
            <p className="text-xs text-muted-foreground">Selected</p>
            <p className="font-semibold text-primary">{totalTicketsSelected}</p>
          </div>
          <div className="p-2 bg-muted/50 rounded text-center">
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="font-semibold">{totalAmount.toLocaleString('en-TZ', { style: 'currency', currency: 'TZS' })}</p>
          </div>
        </div>

        {/* Main Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Day</Label>
              <Badge variant="outline" className="text-xs">
                {selectedDay === 'all' ? 'All' : days.find(d => d.id.toString() === selectedDay)?.name}
              </Badge>
            </div>
            <Select value={selectedDay} onValueChange={onDayChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Days</SelectItem>
                {days.map(day => (
                  <SelectItem key={day.id} value={day.id.toString()}>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-2" />
                      {day.name} ({new Date(day.date).toLocaleDateString()})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Session</Label>
              <Badge variant="outline" className="text-xs">
                {selectedSession === 'all' ? 'All' : sessions.find(s => s.id.toString() === selectedSession)?.name}
              </Badge>
            </div>
            <Select value={selectedSession} onValueChange={onSessionChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Sessions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {sessions.map(session => (
                  <SelectItem key={session.id} value={session.id.toString()}>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-2" />
                      {session.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Status</Label>
              <Badge variant={selectedStatus === 'ACTIVE' ? 'default' : 'outline'} className="text-xs">
                {selectedStatus === 'all' ? 'All' : selectedStatus}
              </Badge>
            </div>
            <Select value={selectedStatus} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="w-full mb-4"
        >
          <Filter className="h-3 w-3 mr-2" />
          {showAdvancedFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
        </Button>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-muted/30">
            <div className="space-y-2">
              <Label className="text-xs">Payment Status</Label>
              <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Ticket Type</Label>
              <Select value={selectedTicketType} onValueChange={setSelectedTicketType}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="ADULT">Adult</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="CHILD">Child</SelectItem>
                  <SelectItem value="REGULAR">Regular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Min Amount</Label>
              <Input
                placeholder="Min TZS"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="h-8"
                type="number"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Max Amount</Label>
              <Input
                placeholder="Max TZS"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="h-8"
                type="number"
              />
            </div>
          </div>
        )}

        {/* Clear Filters Button */}
        {(selectedSession !== 'all' || selectedDay !== 'all' || selectedStatus !== 'all' || 
          selectedPaymentStatus !== 'all' || selectedTicketType !== 'all' || searchQuery || 
          minAmount || maxAmount) && (
          <div className="mb-4">
            <Button variant="outline" size="sm" onClick={handleClearAllFilters}>
              <X className="h-3 w-3 mr-1" />
              Clear All Filters
            </Button>
          </div>
        )}

        {/* Tickets List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No tickets found matching your filters.</p>
              <Button variant="link" onClick={handleClearAllFilters} className="mt-2">
                Clear all filters
              </Button>
            </div>
          ) : (
            filteredTickets.map(ticket => {
              const session = sessions.find(s => s.id === ticket.sessionId);
              const day = days.find(d => d.id === session?.dayId);
              
              return (
                <TicketItem
                  key={ticket.id}
                  ticket={ticket}
                  session={session}
                  day={day}
                  isSelected={selectedTickets.includes(ticket.id)}
                  onToggle={() => onTicketToggle(ticket.id)}
                />
              );
            })
          )}
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-4">
        <div className="flex items-center justify-between w-full">
          <div className="text-sm text-muted-foreground">
            <p>Selected: {totalTicketsSelected} tickets ({totalQuantitySelected} attendees)</p>
            <p className="text-xs">
              Showing {filteredTickets.length} of {tickets.length} total tickets
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAllFilters}
            >
              Reset
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

interface TicketItemProps {
  ticket: Ticket;
  session?: Session;
  day?: Day;
  isSelected: boolean;
  onToggle: () => void;
}

function TicketItem({ ticket, session, day, isSelected, onToggle }: TicketItemProps) {
  // Format phone number
  const formatPhone = (phone: string) => {
    if (!phone) return 'N/A';
    if (phone.startsWith('255') && phone.length === 12) {
      return `+${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}`;
    }
    return phone;
  };

  // Format amount
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get ticket type color
  const getTicketTypeColor = (type: string) => {
    switch (type) {
      case 'ADULT': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'STUDENT': return 'bg-green-100 text-green-800 border-green-200';
      case 'CHILD': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'EXPIRED': return 'bg-red-100 text-red-800 border-red-200';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get payment status color
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-50 text-green-700 border-green-200';
      case 'UNPAID': return 'bg-red-50 text-red-700 border-red-200';
      case 'PARTIAL': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'REFUNDED': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div
      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'bg-primary/5 border-primary shadow-sm'
          : 'hover:bg-muted/30 hover:border-muted-foreground/30'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          {/* Header with ticket code and badges */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-lg">{ticket.ticketCode}</span>
              <Badge variant="outline" className={getTicketTypeColor(ticket.ticketType)}>
                {ticket.ticketType}
              </Badge>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">
                {formatAmount(ticket.totalAmount)} TZS
              </p>
              <p className="text-xs text-muted-foreground">
                {ticket.totalQuantity} {ticket.totalQuantity === 1 ? 'person' : 'people'}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{ticket.purchaserName || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono text-sm">{formatPhone(ticket.purchaserPhone)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex gap-2">
                <Badge variant="outline" className={getStatusColor(ticket.status)}>
                  {ticket.status}
                </Badge>
                <Badge variant="outline" className={getPaymentStatusColor(ticket.paymentStatus)}>
                  {ticket.paymentStatus}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Created: {new Date(ticket.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Quantity Breakdown */}
          {(ticket.adultQuantity > 0 || ticket.studentQuantity > 0 || ticket.childQuantity > 0) && (
            <div className="flex gap-4 text-sm">
              {ticket.adultQuantity > 0 && (
                <span className="inline-flex items-center">
                  <span className="font-medium">Adults:</span>
                  <span className="ml-1">{ticket.adultQuantity}</span>
                </span>
              )}
              {ticket.studentQuantity > 0 && (
                <span className="inline-flex items-center">
                  <span className="font-medium">Students:</span>
                  <span className="ml-1">{ticket.studentQuantity}</span>
                </span>
              )}
              {ticket.childQuantity > 0 && (
                <span className="inline-flex items-center">
                  <span className="font-medium">Children:</span>
                  <span className="ml-1">{ticket.childQuantity}</span>
                </span>
              )}
            </div>
          )}

          {/* Event/Session Info */}
          {session && day && (
            <div className="pt-3 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">{day.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-5">
                    {new Date(day.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">{session.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-5">
                    {session.startTime} - {session.endTime}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Checkbox */}
        <div className="flex flex-col items-center gap-2 ml-4 pt-1">
          <div className={`
            w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
            ${isSelected 
              ? 'bg-primary border-primary' 
              : 'border-gray-300 hover:border-primary'
            }
          `}>
            {isSelected && (
              <Check className="h-3 w-3 text-white" />
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {isSelected ? 'Selected' : 'Select'}
          </span>
        </div>
      </div>
    </div>
  );
}