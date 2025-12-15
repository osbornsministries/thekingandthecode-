// components/admin/ticket/import/BulkImport.tsx
'use client';

import { useState } from 'react';
import { ImportTicketData } from '@/lib/actions/ticket/ticket-importer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Copy, Check, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BulkImportProps {
  onSubmit: (data: ImportTicketData[]) => Promise<void>;
  isLoading: boolean;
}

export function BulkImport({ onSubmit, isLoading }: BulkImportProps) {
  const [inputText, setInputText] = useState('');
  const [parsedTickets, setParsedTickets] = useState<ImportTicketData[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dayId, setDayId] = useState<string>('1');
  const [sessionId, setSessionId] = useState<string>('1');
  const [priceId, setPriceId] = useState<string>('1');

  // Mock data - in production, fetch from API
  const days = [
    { id: 1, name: 'Day 1: January 15, 2024' },
    { id: 2, name: 'Day 2: January 16, 2024' },
    { id: 3, name: 'Day 3: January 17, 2024' }
  ];

  const sessions = [
    { id: 1, dayId: 1, name: 'Morning Session (9:00 - 12:00)' },
    { id: 2, dayId: 1, name: 'Afternoon Session (14:00 - 17:00)' },
    { id: 3, dayId: 1, name: 'Evening Session (18:00 - 21:00)' },
    { id: 4, dayId: 2, name: 'Morning Session (9:00 - 12:00)' },
    { id: 5, dayId: 2, name: 'Afternoon Session (14:00 - 17:00)' }
  ];

  const prices = [
    { id: 1, name: 'Adult Regular', price: 10000, ticketType: 'ADULT' },
    { id: 2, name: 'Student Regular', price: 5000, ticketType: 'STUDENT' },
    { id: 3, name: 'Child Regular', price: 3000, ticketType: 'CHILD' },
    { id: 4, name: 'Adult VIP', price: 20000, ticketType: 'ADULT' },
    { id: 5, name: 'Student VIP', price: 10000, ticketType: 'STUDENT' }
  ];

  const sampleData = `John Doe,255712345678,ADULT,15000,true,PAID,MPESA,REF123,TRX456,STU001,UNIVERSITY,University of Dar es Salaam,"First year student"
Jane Smith,255765432109,STUDENT,5000,true,PAID,AIRTEL,REF124,TRX457,STU002,COLLEGE,"Arusha Technical College",""
Mike Johnson,255788765432,CHILD,3000,false,PENDING,CASH,,,,,"Child under 12"
Sarah Wilson,255711223344,ADULT,10000,true,PAID,TIGO,REF125,TRX458,,,,"Group booking"`;

  const formatData = `Format: fullName,phone,ticketType,totalAmount,isPaid,paymentStatus,paymentMethodId,externalId,transactionId,studentId,institution,institutionName,notes

Example:
John Doe,255712345678,ADULT,15000,true,PAID,MPESA,REF123,TRX456,,,,"Attending with family"`;

  const parseBulkData = () => {
    try {
      const lines = inputText.trim().split('\n');
      const tickets: ImportTicketData[] = [];
      const errors: string[] = [];

      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('#')) {
          return; // Skip empty lines and comments
        }

        // Parse CSV line with proper quote handling
        const parts: string[] = [];
        let currentPart = '';
        let insideQuotes = false;
        
        for (let i = 0; i < trimmedLine.length; i++) {
          const char = trimmedLine[i];
          const nextChar = trimmedLine[i + 1];
          
          if (char === '"' && !insideQuotes) {
            insideQuotes = true;
          } else if (char === '"' && insideQuotes && nextChar === '"') {
            // Escaped quote
            currentPart += '"';
            i++; // Skip next quote
          } else if (char === '"' && insideQuotes) {
            insideQuotes = false;
          } else if (char === ',' && !insideQuotes) {
            parts.push(currentPart.trim());
            currentPart = '';
          } else {
            currentPart += char;
          }
        }
        parts.push(currentPart.trim());

        // Clean up quotes
        const cleanedParts = parts.map(part => 
          part.startsWith('"') && part.endsWith('"') ? part.slice(1, -1) : part
        );
        
        if (cleanedParts.length < 7) {
          errors.push(`Line ${index + 1}: Insufficient data (${cleanedParts.length} fields, need at least 7)`);
          return;
        }

        const ticket: ImportTicketData = {
          fullName: cleanedParts[0],
          phone: cleanedParts[1],
          ticketType: cleanedParts[2] as 'ADULT' | 'STUDENT' | 'CHILD',
          dayId: parseInt(dayId),
          sessionId: parseInt(sessionId),
          priceId: parseInt(priceId),
          totalAmount: parseFloat(cleanedParts[3]) || 0,
          isPaid: cleanedParts[4].toLowerCase() === 'true',
          paymentStatus: (cleanedParts[5] as 'PAID' | 'PENDING' | 'FAILED') || 'PENDING',
          paymentMethodId: cleanedParts[6] || 'CASH',
          externalId: cleanedParts[7] || undefined,
          transactionId: cleanedParts[8] || undefined,
          studentId: cleanedParts[9] || undefined,
          institution: cleanedParts[10] as any,
          institutionName: cleanedParts[11] || undefined,
          notes: cleanedParts[12] || undefined,
          quantity: 1
        };

        // Validate required fields
        if (!ticket.fullName) errors.push(`Line ${index + 1}: Full name is required`);
        if (!ticket.phone) errors.push(`Line ${index + 1}: Phone number is required`);
        
        if (ticket.ticketType === 'STUDENT') {
          if (!ticket.studentId) errors.push(`Line ${index + 1}: Student ID is required for student tickets`);
          if (!ticket.institution) errors.push(`Line ${index + 1}: Institution is required for student tickets`);
        }

        tickets.push(ticket);
      });

      if (errors.length > 0) {
        setParseError(errors.join('\n'));
        setParsedTickets([]);
      } else {
        setParseError(null);
        setParsedTickets(tickets);
      }
    } catch (error) {
      setParseError(`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setParsedTickets([]);
    }
  };

  const handleSubmit = async () => {
    if (parsedTickets.length === 0) {
      setParseError('No valid tickets to import');
      return;
    }
    await onSubmit(parsedTickets);
  };

  const copySampleData = () => {
    navigator.clipboard.writeText(sampleData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Ticket Import</CardTitle>
          <CardDescription>
            Import multiple tickets using comma-separated values. Each line represents one ticket.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The system will automatically detect duplicate users and mark them accordingly.
            </AlertDescription>
          </Alert>

          {/* Global Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Event Day</Label>
              <Select value={dayId} onValueChange={setDayId}>
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
              <Label>Session</Label>
              <Select value={sessionId} onValueChange={setSessionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions
                    .filter(s => s.dayId === parseInt(dayId))
                    .map(session => (
                      <SelectItem key={session.id} value={session.id.toString()}>
                        {session.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Price</Label>
              <Select value={priceId} onValueChange={setPriceId}>
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
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bulkData">Ticket Data (CSV Format)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copySampleData}
                className="gap-2"
              >
                {copied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                {copied ? 'Copied!' : 'Copy Sample'}
              </Button>
            </div>
            <Textarea
              id="bulkData"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={formatData}
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={parseBulkData}
              variant="outline"
              className="flex-1"
            >
              Parse Data
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || parsedTickets.length === 0}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${parsedTickets.length} Ticket${parsedTickets.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>

          {parseError && (
            <Alert variant="destructive">
              <AlertDescription className="font-mono text-sm whitespace-pre-wrap">
                {parseError}
              </AlertDescription>
            </Alert>
          )}

          {parsedTickets.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">
                  Parsed Tickets ({parsedTickets.length})
                </h4>
                <Badge variant="outline">
                  Ready for Import
                </Badge>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Phone</th>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-left">Amount</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedTickets.slice(0, 5).map((ticket, index) => (
                        <tr key={index} className="border-t hover:bg-muted/50">
                          <td className="px-4 py-2 font-medium">{ticket.fullName}</td>
                          <td className="px-4 py-2">{ticket.phone}</td>
                          <td className="px-4 py-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                ticket.ticketType === 'ADULT' ? 'border-blue-200 text-blue-700' :
                                ticket.ticketType === 'STUDENT' ? 'border-purple-200 text-purple-700' :
                                'border-green-200 text-green-700'
                              }`}
                            >
                              {ticket.ticketType}
                            </Badge>
                          </td>
                          <td className="px-4 py-2">
                            TZS {ticket.totalAmount.toLocaleString()}
                          </td>
                          <td className="px-4 py-2">
                            <Badge 
                              variant={ticket.isPaid ? "default" : "secondary"}
                              className={`text-xs ${
                                ticket.isPaid ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                              }`}
                            >
                              {ticket.paymentStatus}
                            </Badge>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-xs text-muted-foreground">
                              {ticket.paymentMethodId}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {parsedTickets.length > 5 && (
                  <div className="px-4 py-2 bg-muted text-center text-sm">
                    ... and {parsedTickets.length - 5} more tickets
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Total Tickets</p>
                  <p className="font-semibold">{parsedTickets.length}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-semibold">
                    TZS {parsedTickets.reduce((sum, t) => sum + t.totalAmount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Paid Tickets</p>
                  <p className="font-semibold">
                    {parsedTickets.filter(t => t.isPaid).length}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Pending Tickets</p>
                  <p className="font-semibold">
                    {parsedTickets.filter(t => !t.isPaid).length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}