// components/import/CSVImport.tsx
'use client';

import { useState, useCallback } from 'react';
import { ImportTicketData } from '@/lib/actions/ticket/ticket-importer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload, FileText, AlertCircle, Download, X, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import Papa from 'papaparse';

interface CSVImportProps {
  onSubmit: (data: ImportTicketData[]) => Promise<void>;
  isLoading: boolean;
}

export function CSVImport({ onSubmit, isLoading }: CSVImportProps) {
  const [parsedTickets, setParsedTickets] = useState<ImportTicketData[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [filePreview, setFilePreview] = useState<string>('');
  const [parseStats, setParseStats] = useState({
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    skippedRows: 0
  });

  // Simplified template with only 2 examples matching your format
  const downloadTemplate = () => {
    const template = `S/N,FULL NAME,PHONE,PAYMENT METHOD,DAY,SESSION,TICKET TYPE,CAPACITY NUMBER,PRICE PER TICKET,TOTAL,STATUS
1,SUZAN AARON,755026297,MPESA,1,Night,Adult,1,50000,50000,TAKEN
2,SARAH NDILE,628331663,PESA PAL,1,Night,Student,1,30000,,TAKEN`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ticket_list_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith('.csv')) {
      setParseError('Please upload a CSV file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setParseError('File size should be less than 5MB');
      return;
    }

    setFileName(file.name);
    setParseError(null);
    setParsedTickets([]);
    setParseStats({
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      skippedRows: 0
    });

    // Read file for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFilePreview(content.substring(0, 1000)); // First 1000 chars
    };
    reader.readAsText(file);

    // Parse CSV
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const tickets: ImportTicketData[] = [];
          const errors: string[] = [];
          let totalRows = 0;
          let validRows = 0;
          let invalidRows = 0;
          let skippedRows = 0;

          // Expected headers in your format
          const expectedHeaders = [
            'S/N', 'FULL NAME', 'PHONE', 'PAYMENT METHOD', 'DAY', 
            'SESSION', 'TICKET TYPE', 'CAPACITY NUMBER', 'PRICE PER TICKET', 
            'TOTAL', 'STATUS'
          ];

          const headers = results.meta.fields || [];
          
          // Check if headers match expected format
          const hasRequiredHeaders = expectedHeaders.every(header => 
            headers.some(h => h.trim().toUpperCase() === header.trim().toUpperCase())
          );

          if (!hasRequiredHeaders) {
            errors.push(`CSV format doesn't match expected format. Please use the template.`);
            errors.push(`Expected headers: ${expectedHeaders.join(', ')}`);
            errors.push(`Found headers: ${headers.join(', ')}`);
          }

          results.data.forEach((row: any, index: number) => {
            totalRows++;
            
            // Skip empty rows or rows with empty first column
            const serialNumber = row['S/N'] || row['S/N'] || row.SN || '';
            if (!serialNumber || serialNumber.toString().trim() === '') {
              skippedRows++;
              return; // Skip empty rows
            }

            try {
              // Clean and normalize column names (case insensitive)
              const getColumnValue = (keys: string[]) => {
                for (const key of keys) {
                  if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
                    return row[key];
                  }
                  // Try case-insensitive match
                  const lowerKey = key.toLowerCase();
                  for (const actualKey of Object.keys(row)) {
                    if (actualKey.toLowerCase() === lowerKey) {
                      return row[actualKey];
                    }
                  }
                }
                return '';
              };

              const fullName = getColumnValue(['FULL NAME', 'FULL_NAME', 'NAME', 'FULL NAME ', 'FULL NAME  ']);
              const phone = getColumnValue(['PHONE', 'PHONE NUMBER', 'PHONENUMBER', 'PHONE ']);
              const paymentMethod = getColumnValue(['PAYMENT METHOD', 'PAYMENT_METHOD', 'PAYMENT', 'PAYMENT METHOD ']);
              const dayStr = getColumnValue(['DAY', 'DAY ', 'DAY NUMBER', 'DAY_NO']);
              const session = getColumnValue(['SESSION', 'SESSION ', 'TIME', 'TIME SESSION']);
              const ticketTypeRaw = getColumnValue(['TICKET TYPE', 'TICKET_TYPE', 'TYPE', 'TICKET TYPE ', 'TICKET']);
              const quantityStr = getColumnValue(['CAPACITY NUMBER', 'CAPACITY_NUMBER', 'QUANTITY', 'QTY', 'NUMBER', 'CAPACITY NUMBER ']);
              const pricePerTicketStr = getColumnValue(['PRICE PER TICKET', 'PRICE_PER_TICKET', 'PRICE', 'PRICE PER TICKET ', 'UNIT PRICE']);
              const totalStr = getColumnValue(['TOTAL', 'TOTAL ', 'TOTAL AMOUNT', 'AMOUNT']);
              const status = getColumnValue(['STATUS', 'STATUS ', 'PAYMENT STATUS']);

              // Clean and validate data
              if (!fullName || fullName.toString().trim() === '') {
                invalidRows++;
                errors.push(`Row ${index + 2}: Full name is required`);
                return;
              }
              
              if (!phone || phone.toString().trim() === '') {
                invalidRows++;
                errors.push(`Row ${index + 2}: Phone number is required`);
                return;
              }

              // Clean phone number - remove spaces, dashes, and ensure it starts with 255
              let cleanedPhone = phone.toString().replace(/\s+/g, '').replace(/-/g, '').replace(/\+/g, '');
              
              // If phone starts with 0, replace with 255
              if (cleanedPhone.startsWith('0')) {
                cleanedPhone = '255' + cleanedPhone.substring(1);
              }
              
              // If phone is 9 digits, prepend 255
              if (cleanedPhone.length === 9 && !cleanedPhone.startsWith('255')) {
                cleanedPhone = '255' + cleanedPhone;
              }
              
              // Validate phone format
              const phoneRegex = /^255\d{9}$/;
              if (!phoneRegex.test(cleanedPhone)) {
                invalidRows++;
                errors.push(`Row ${index + 2}: Invalid phone format: ${phone}. Use format: 255712345678 or 0712345678`);
                return;
              }

              // Map session names to session IDs
              const sessionMap: Record<string, number> = {
                'night': 1,
                'afternoon': 2,
                'evening': 3,
                'morning': 4,
                'night ': 1,
                'afternoon ': 2,
                'evening ': 3,
                'morning ': 4
              };

              const sessionLower = (session || 'Night').toString().toLowerCase().trim();
              const sessionId = sessionMap[sessionLower] || 1;

              // Map ticket types to standard format
              const ticketTypeMap: Record<string, 'ADULT' | 'STUDENT' | 'CHILD'> = {
                'adult': 'ADULT',
                'student': 'STUDENT',
                'kid': 'CHILD',
                'child': 'CHILD',
                'children': 'CHILD',
                'adult ': 'ADULT',
                'student ': 'STUDENT',
                'kid ': 'CHILD'
              };

              const ticketTypeLower = (ticketTypeRaw || 'Adult').toString().toLowerCase().trim();
              const ticketType = ticketTypeMap[ticketTypeLower] || 'ADULT';

              // Parse quantities and amounts
              const quantity = parseInt(quantityStr?.toString() || '1') || 1;
              const pricePerTicket = parsePrice(pricePerTicketStr?.toString() || '0');
              const totalAmount = parsePrice(totalStr?.toString() || '0') || (pricePerTicket * quantity);

              // Map payment methods to standard format
              const paymentMethodMap: Record<string, string> = {
                'mpesa': 'MPESA',
                'pesa pal': 'PESAPAL',
                'pesapal': 'PESAPAL',
                'cash': 'CASH',
                'bank': 'BANK',
                'airtel': 'AIRTEL',
                'tigo': 'TIGO',
                'mpesa ': 'MPESA',
                'pesa pal ': 'PESAPAL',
                'cash ': 'CASH'
              };

              const paymentMethodLower = (paymentMethod || 'CASH').toString().toLowerCase().trim();
              const paymentMethodId = paymentMethodMap[paymentMethodLower] || 'CASH';

              // Determine if paid based on STATUS column
              const isPaid = (status || 'TAKEN').toString().toUpperCase() === 'TAKEN';
              const paymentStatus = isPaid ? 'PAID' : 'PENDING';

              // Map DAY to dayId
              const dayId = parseInt(dayStr?.toString() || '1') || 1;

              // Create the ticket object
              const ticket: ImportTicketData = {
                fullName: fullName.toString().trim(),
                phone: cleanedPhone,
                ticketType,
                dayId,
                sessionId,
                priceId: 1, // Default price ID
                totalAmount,
                isPaid,
                paymentStatus,
                paymentMethodId,
                externalId: undefined,
                transactionId: undefined,
                studentId: ticketType === 'STUDENT' ? `STU-${Math.floor(10000 + Math.random() * 90000)}` : undefined,
                institution: ticketType === 'STUDENT' ? 'UNIVERSITY' : undefined,
                institutionName: ticketType === 'STUDENT' ? 'University' : undefined,
                notes: `Imported from CSV - Row ${index + 2}`,
                quantity
              };

              tickets.push(ticket);
              validRows++;
              
            } catch (rowError: any) {
              invalidRows++;
              errors.push(`Row ${index + 2}: ${rowError.message || 'Invalid data format'}`);
            }
          });

          setParseStats({
            totalRows,
            validRows,
            invalidRows,
            skippedRows
          });

          if (errors.length > 0) {
            setParseError(errors.slice(0, 10).join('\n'));
            if (errors.length > 10) {
              setParseError(prev => prev + `\n... and ${errors.length - 10} more errors`);
            }
            setParsedTickets([]);
          } else {
            setParseError(null);
            setParsedTickets(tickets);
          }
        } catch (error) {
          setParseError(`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setParsedTickets([]);
        }
      },
      error: (error: any) => {
        setParseError(`CSV parse error: ${error.message}`);
        setParsedTickets([]);
      }
    });
  }, []);

  // Helper function to parse price strings like "250,000/=" or "50,000"
  const parsePrice = (priceStr: string): number => {
    if (!priceStr || priceStr.trim() === '') return 0;
    
    // Remove currency symbols, commas, slashes, equals signs, and spaces
    const cleaned = priceStr
      .toString()
      .replace(/[^\d.-]/g, '') // Keep only numbers, dots, and minus
      .replace(/,/g, '') // Remove commas
      .trim();
    
    return parseFloat(cleaned) || 0;
  };

  const handleSubmit = async () => {
    if (parsedTickets.length === 0) {
      setParseError('No valid tickets to import');
      return;
    }
    await onSubmit(parsedTickets);
  };

  const clearFile = () => {
    setFileName('');
    setFilePreview('');
    setParsedTickets([]);
    setParseError(null);
    setParseStats({
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      skippedRows: 0
    });
    // Reset file input
    const fileInput = document.getElementById('csvFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>CSV File Import</CardTitle>
          <CardDescription>
            Upload a CSV file matching your ticket list format. Download the template to ensure correct formatting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p><strong>Required CSV Format:</strong> Must match exactly the column names from your ticket list</p>
              <div className="text-xs font-mono bg-muted p-2 rounded mt-2">
                S/N,FULL NAME,PHONE,PAYMENT METHOD,DAY,SESSION,TICKET TYPE,CAPACITY NUMBER,PRICE PER TICKET,TOTAL,STATUS
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>CSV Template</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="gap-2"
                >
                  <Download className="h-3 w-3" />
                  Download Template
                </Button>
              </div>
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-sm font-semibold mb-2">CSV Format Details:</p>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="font-medium">Column</p>
                      <p>S/N</p>
                      <p>FULL NAME</p>
                      <p>PHONE</p>
                      <p>PAYMENT METHOD</p>
                      <p>DAY</p>
                      <p>SESSION</p>
                      <p>TICKET TYPE</p>
                      <p>CAPACITY NUMBER</p>
                      <p>PRICE PER TICKET</p>
                      <p>TOTAL</p>
                      <p>STATUS</p>
                    </div>
                    <div>
                      <p className="font-medium">Description</p>
                      <p>Serial number (can be empty)</p>
                      <p>Full name of attendee</p>
                      <p>Phone number (0712345678 or 255712345678)</p>
                      <p>MPESA, CASH, PESA PAL, BANK</p>
                      <p>Day number (1, 2, 3)</p>
                      <p>Night, Afternoon, Evening</p>
                      <p>Adult, Student, Kid/Child</p>
                      <p>Quantity (number of tickets)</p>
                      <p>Price per ticket (50000, 30000)</p>
                      <p>Total amount (optional)</p>
                      <p>TAKEN or empty</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="csvFile">Upload CSV File</Label>
              <div className={`border-2 ${fileName ? 'border-primary/20' : 'border-dashed'} rounded-lg p-8 text-center transition-colors`}>
                <input
                  type="file"
                  id="csvFile"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="csvFile" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Click to upload or drag and drop</p>
                      <p className="text-sm text-muted-foreground">CSV files only (max 5MB)</p>
                    </div>
                    {fileName && (
                      <div className="mt-2 flex items-center justify-center gap-2 text-sm bg-primary/5 rounded-full px-4 py-2">
                        <FileText className="h-4 w-4" />
                        <span>{fileName}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={clearFile}
                          className="h-6 w-6"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {filePreview && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>File Preview</Label>
                  <span className="text-xs text-muted-foreground">
                    Showing first {Math.min(1000, filePreview.length)} characters
                  </span>
                </div>
                <div className="border rounded-lg p-4 bg-muted/50">
                  <pre className="text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {filePreview}
                    {filePreview.length >= 1000 && '...'}
                  </pre>
                </div>
              </div>
            )}

            {parseStats.totalRows > 0 && (
              <div className="border rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Rows</p>
                    <p className="text-2xl font-bold">{parseStats.totalRows}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Valid Tickets</p>
                    <p className="text-2xl font-bold text-green-600">{parseStats.validRows}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Invalid Rows</p>
                    <p className="text-2xl font-bold text-red-600">{parseStats.invalidRows}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Skipped</p>
                    <p className="text-2xl font-bold text-yellow-600">{parseStats.skippedRows}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
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
                <AlertDescription className="font-mono text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {parseError}
                </AlertDescription>
              </Alert>
            )}

            {parsedTickets.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">
                    Tickets Ready for Import ({parsedTickets.length})
                  </h4>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    <Check className="h-3 w-3 mr-1" />
                    Ready
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
                          <th className="px-4 py-2 text-left">Day</th>
                          <th className="px-4 py-2 text-left">Session</th>
                          <th className="px-4 py-2 text-left">Qty</th>
                          <th className="px-4 py-2 text-left">Amount</th>
                          <th className="px-4 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedTickets.slice(0, 5).map((ticket, index) => (
                          <tr key={index} className="border-t hover:bg-muted/50">
                            <td className="px-4 py-2 font-medium">{ticket.fullName}</td>
                            <td className="px-4 py-2 font-mono text-xs">{ticket.phone}</td>
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
                            <td className="px-4 py-2">Day {ticket.dayId}</td>
                            <td className="px-4 py-2">
                              {ticket.sessionId === 1 ? 'Night' : 
                               ticket.sessionId === 2 ? 'Afternoon' : 
                               ticket.sessionId === 3 ? 'Evening' : 'Morning'}
                            </td>
                            <td className="px-4 py-2">{ticket.quantity}</td>
                            <td className="px-4 py-2 font-medium">
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
                    <p className="font-semibold text-lg">{parsedTickets.length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Total Amount</p>
                    <p className="font-semibold text-lg">
                      TZS {parsedTickets.reduce((sum, t) => sum + t.totalAmount, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Paid Tickets</p>
                    <p className="font-semibold text-lg">
                      {parsedTickets.filter(t => t.isPaid).length}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Pending Tickets</p>
                    <p className="font-semibold text-lg">
                      {parsedTickets.filter(t => !t.isPaid).length}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Adult Tickets</p>
                    <p className="font-semibold">
                      {parsedTickets.filter(t => t.ticketType === 'ADULT').length}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Student Tickets</p>
                    <p className="font-semibold">
                      {parsedTickets.filter(t => t.ticketType === 'STUDENT').length}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Child Tickets</p>
                    <p className="font-semibold">
                      {parsedTickets.filter(t => t.ticketType === 'CHILD').length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}