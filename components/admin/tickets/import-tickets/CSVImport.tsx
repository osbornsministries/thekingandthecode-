// components/admin/tickets/import-tickets/CSVImport.tsx
'use client';

import { useState, useCallback, useRef } from 'react';
import { ImportTicketData } from '@/lib/actions/ticket/ticket-importer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload, FileText, AlertCircle, Download, X, Check, Edit, RefreshCw, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import Papa from 'papaparse';
import ImportResultsModal from './ImportResultsModal';
import EditTicketModal from './EditTicketModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CSVImportProps {
  onSubmit: (data: ImportTicketData[]) => Promise<any>;
  isLoading: boolean;
}

interface ParseResult {
  tickets: ImportTicketData[];
  errors: Array<{
    row: number;
    error: string;
    validationErrors: Record<string, string>;
    originalData: any;
  }>;
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    skippedRows: number;
  };
  rawData?: any[];
}

export function CSVImport({ onSubmit, isLoading }: CSVImportProps) {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [ticketToEdit, setTicketToEdit] = useState<{
    index: number;
    ticket: ImportTicketData;
    originalData: any;
    rowNumber: number;
    isErrorCorrection?: boolean;
  } | null>(null);
  const [importResults, setImportResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'errors' | 'corrected'>('preview');
  const [correctedTickets, setCorrectedTickets] = useState<Array<{
    originalError: ParseResult['errors'][0];
    correctedTicket: ImportTicketData;
  }>>([]);

  const rawParsedData = useRef<any[]>([]);

  const downloadTemplate = () => {
    const template = `S/N,FULL NAME,PHONE,PAYMENT METHOD,DAY,SESSION,TICKET TYPE,CAPACITY NUMBER,PRICE PER TICKET,TOTAL,STATUS
1,SUZAN AARON,755026297,MPESA,1,Night,Adult,1,50000,50000,TAKEN
2,SARAH NDILE,628331663,PESA PAL,1,Night,Student,1,30000,,TAKEN
3,JOHN DOE,712345678,CASH,1,Night,Child,1,20000,20000,
4,JANE SMITH,754321987,MPESA,2,Afternoon,Adult,2,50000,100000,TAKEN`;

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

    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    setFileName(file.name);
    setParseResult(null);
    setImportResults(null);
    setCorrectedTickets([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
      parseCSV(content);
    };
    reader.readAsText(file);
  }, []);

  const parseCSV = (content: string) => {
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parseResult: ParseResult = {
          tickets: [],
          errors: [],
          stats: {
            totalRows: 0,
            validRows: 0,
            invalidRows: 0,
            skippedRows: 0,
          },
          rawData: results.data
        };

        rawParsedData.current = results.data as any[];

        results.data.forEach((row: any, index: number) => {
          parseResult.stats.totalRows++;
          
          const rowNumber = index + 2;
          const errors: string[] = [];
          const validationErrors: Record<string, string> = {};

          const serialNumber = row['S/N'] || row['S/N'] || '';
          if (!serialNumber || serialNumber.toString().trim() === '') {
            parseResult.stats.skippedRows++;
            return;
          }

          try {
            const getValue = (keys: string[]) => {
              for (const key of keys) {
                const value = row[key];
                if (value !== undefined && value !== null && value !== '') {
                  return value;
                }
                const lowerKey = key.toLowerCase();
                for (const actualKey of Object.keys(row)) {
                  if (actualKey.toLowerCase() === lowerKey) {
                    return row[actualKey];
                  }
                }
              }
              return '';
            };

            const fullName = getValue(['FULL NAME', 'FULL_NAME', 'NAME']);
            const phone = getValue(['PHONE', 'PHONE NUMBER', 'PHONENUMBER']);
            const paymentMethod = getValue(['PAYMENT METHOD', 'PAYMENT_METHOD', 'PAYMENT']);
            const dayStr = getValue(['DAY', 'DAY NUMBER', 'DAY_NO']);
            const session = getValue(['SESSION', 'TIME', 'TIME SESSION']);
            const ticketTypeRaw = getValue(['TICKET TYPE', 'TICKET_TYPE', 'TYPE', 'TICKET']);
            const quantityStr = getValue(['CAPACITY NUMBER', 'CAPACITY_NUMBER', 'QUANTITY', 'QTY']);
            const pricePerTicketStr = getValue(['PRICE PER TICKET', 'PRICE_PER_TICKET', 'PRICE', 'UNIT PRICE']);
            const totalStr = getValue(['TOTAL', 'TOTAL AMOUNT', 'AMOUNT']);
            const status = getValue(['STATUS', 'PAYMENT STATUS']);

            if (!fullName) {
              errors.push('Full name is required');
              validationErrors['FULL NAME'] = 'This field is required';
            }

            if (!phone) {
              errors.push('Phone number is required');
              validationErrors['PHONE'] = 'This field is required';
            } else {
              let cleanedPhone = phone.toString().replace(/\s+/g, '').replace(/-/g, '').replace(/\+/g, '');
              
              if (cleanedPhone.startsWith('0')) {
                cleanedPhone = '255' + cleanedPhone.substring(1);
              }
              
              if (cleanedPhone.length === 9 && !cleanedPhone.startsWith('255')) {
                cleanedPhone = '255' + cleanedPhone;
              }
              
              const phoneRegex = /^255\d{9}$/;
              if (!phoneRegex.test(cleanedPhone)) {
                errors.push(`Invalid phone format: ${phone}`);
                validationErrors['PHONE'] = 'Use format: 255712345678 or 0712345678';
              }
            }

            const ticketTypeLower = (ticketTypeRaw || 'Adult').toString().toLowerCase().trim();
            const validTicketTypes = ['adult', 'student', 'kid', 'child'];
            if (!validTicketTypes.includes(ticketTypeLower)) {
              errors.push(`Invalid ticket type: ${ticketTypeRaw}`);
              validationErrors['TICKET TYPE'] = 'Must be: Adult, Student, or Child';
            }

            const dayId = parseInt(dayStr?.toString() || '1') || 1;
            if (dayId < 1 || dayId > 3) {
              errors.push(`Invalid day: ${dayStr}. Must be 1, 2, or 3`);
              validationErrors['DAY'] = 'Must be 1, 2, or 3';
            }

            const sessionLower = (session || 'Night').toString().toLowerCase().trim();
            const validSessions = ['night', 'afternoon', 'evening', 'morning'];
            if (!validSessions.includes(sessionLower)) {
              errors.push(`Invalid session: ${session}`);
              validationErrors['SESSION'] = 'Must be: Night, Afternoon, Evening, or Morning';
            }

            const quantity = parseInt(quantityStr?.toString() || '1') || 1;
            if (quantity < 1) {
              errors.push(`Invalid quantity: ${quantityStr}`);
              validationErrors['CAPACITY NUMBER'] = 'Must be 1 or greater';
            }

            const pricePerTicket = parsePrice(pricePerTicketStr?.toString() || '0');
            if (pricePerTicket < 0) {
              errors.push(`Invalid price: ${pricePerTicketStr}`);
              validationErrors['PRICE PER TICKET'] = 'Must be a valid number';
            }

            const totalAmount = parsePrice(totalStr?.toString() || '0') || (pricePerTicket * quantity);
            if (totalAmount < 0) {
              errors.push(`Invalid total amount: ${totalStr}`);
              validationErrors['TOTAL'] = 'Must be a valid number';
            }

            if (errors.length > 0) {
              parseResult.stats.invalidRows++;
              parseResult.errors.push({
                row: rowNumber,
                error: errors.join('; '),
                validationErrors,
                originalData: row,
              });
            } else {
              parseResult.stats.validRows++;
              
              let cleanedPhone = phone.toString().replace(/\s+/g, '').replace(/-/g, '').replace(/\+/g, '');
              if (cleanedPhone.startsWith('0')) {
                cleanedPhone = '255' + cleanedPhone.substring(1);
              }
              if (cleanedPhone.length === 9 && !cleanedPhone.startsWith('255')) {
                cleanedPhone = '255' + cleanedPhone;
              }

              const sessionMap: Record<string, number> = {
                'night': 1,
                'afternoon': 2,
                'evening': 3,
                'morning': 4,
              };
              
              const sessionId = sessionMap[sessionLower] || 1;

              const ticketTypeMap: Record<string, 'ADULT' | 'STUDENT' | 'CHILD'> = {
                'adult': 'ADULT',
                'student': 'STUDENT',
                'kid': 'CHILD',
                'child': 'CHILD',
              };

              const ticketType = ticketTypeMap[ticketTypeLower] || 'ADULT';

              const isPaid = (status || 'TAKEN').toString().toUpperCase() === 'TAKEN';
              const paymentStatus = isPaid ? 'PAID' : 'PENDING';

              const paymentMethodMap: Record<string, string> = {
                'mpesa': 'MPESA',
                'pesa pal': 'PESAPAL',
                'pesapal': 'PESAPAL',
                'cash': 'CASH',
                'bank': 'BANK',
              };

              const paymentMethodLower = (paymentMethod || 'CASH').toString().toLowerCase().trim();
              const paymentMethodId = paymentMethodMap[paymentMethodLower] || 'CASH';

              const ticket: ImportTicketData = {
                fullName: fullName.toString().trim(),
                phone: cleanedPhone,
                ticketType,
                dayId,
                sessionId,
                priceId: 1,
                totalAmount,
                isPaid,
                paymentStatus,
                paymentMethodId,
                externalId: undefined,
                transactionId: undefined,
                studentId: ticketType === 'STUDENT' ? `STU-${Math.floor(10000 + Math.random() * 90000)}` : undefined,
                institution: ticketType === 'STUDENT' ? 'UNIVERSITY' : undefined,
                institutionName: ticketType === 'STUDENT' ? 'University' : undefined,
                notes: `Imported from CSV - Row ${rowNumber}`,
                quantity,
              };

              parseResult.tickets.push(ticket);
            }
          } catch (error: any) {
            parseResult.stats.invalidRows++;
            parseResult.errors.push({
              row: rowNumber,
              error: error.message || 'Invalid data format',
              validationErrors: {},
              originalData: row,
            });
          }
        });

        setParseResult(parseResult);
        setActiveTab(parseResult.errors.length > 0 ? 'errors' : 'preview');
      },
      error: (error: any) => {
        alert(`CSV parse error: ${error.message}`);
      }
    });
  };

  const parsePrice = (priceStr: string): number => {
    if (!priceStr || priceStr.trim() === '') return 0;
    const cleaned = priceStr
      .toString()
      .replace(/[^\d.-]/g, '')
      .replace(/,/g, '')
      .trim();
    return parseFloat(cleaned) || 0;
  };

  const handleSubmit = async () => {
    if (!parseResult || parseResult.tickets.length === 0) {
      alert('No valid tickets to import');
      return;
    }

    // try {
      const result = await onSubmit(parseResult.tickets);
      setImportResults(result);
      
      if (result.results) {
        setShowResultsModal(true);
      }
  //   } catch (error) {
  //     console.error('Import failed:', error);
  //     alert('Import failed. Please check the console for details.');
  //   }
   };

  const clearFile = () => {
    setFileName('');
    setFileContent('');
    setParseResult(null);
    setImportResults(null);
    setCorrectedTickets([]);
    rawParsedData.current = [];
    const fileInput = document.getElementById('csvFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleEditTicket = (index: number) => {
    if (!parseResult || !parseResult.rawData) return;
    
    const ticket = parseResult.tickets[index];
    let originalIndex = 0;
    let validCount = 0;
    
    for (let i = 0; i < parseResult.rawData.length; i++) {
      const row = parseResult.rawData[i];
      const serialNumber = row['S/N'] || '';
      
      if (serialNumber && serialNumber.toString().trim() !== '') {
        if (validCount === index) {
          originalIndex = i;
          break;
        }
        validCount++;
      }
    }
    
    const originalData = parseResult.rawData[originalIndex];
    
    setTicketToEdit({
      index,
      ticket,
      originalData: originalData || {},
      rowNumber: originalIndex + 2,
    });
    setShowEditModal(true);
  };

  const handleEditErrorRow = (errorIndex: number) => {
    if (!parseResult) return;
    
    const error = parseResult.errors[errorIndex];
    const row = error.originalData;
    
    let ticket: ImportTicketData = {
      fullName: row['FULL NAME'] || row['FULL_NAME'] || row['NAME'] || '',
      phone: row['PHONE'] || row['PHONE NUMBER'] || '',
      ticketType: 'ADULT',
      dayId: 1,
      sessionId: 1,
      priceId: 1,
      totalAmount: 0,
      isPaid: false,
      paymentStatus: 'PENDING',
      paymentMethodId: 'CASH',
      quantity: 1,
      notes: `Corrected from error row ${error.row}`,
      externalId: undefined,
      transactionId: undefined,
      studentId: undefined,
      institution: undefined,
      institutionName: undefined,
    };
    
    try {
      if (row['TICKET TYPE']) {
        const type = row['TICKET TYPE'].toString().toLowerCase().trim();
        if (type.includes('student')) ticket.ticketType = 'STUDENT';
        else if (type.includes('child') || type.includes('kid')) ticket.ticketType = 'CHILD';
      }
      
      if (row['DAY']) {
        const day = parseInt(row['DAY'].toString()) || 1;
        ticket.dayId = Math.max(1, Math.min(3, day));
      }
      
      if (row['SESSION']) {
        const session = row['SESSION'].toString().toLowerCase().trim();
        if (session.includes('afternoon')) ticket.sessionId = 2;
        else if (session.includes('evening')) ticket.sessionId = 3;
        else if (session.includes('morning')) ticket.sessionId = 4;
      }
      
      if (row['TOTAL']) {
        ticket.totalAmount = parsePrice(row['TOTAL'].toString());
      }
      
      if (row['STATUS'] && row['STATUS'].toString().toUpperCase() === 'TAKEN') {
        ticket.isPaid = true;
        ticket.paymentStatus = 'PAID';
      }
      
      if (row['CAPACITY NUMBER']) {
        ticket.quantity = parseInt(row['CAPACITY NUMBER'].toString()) || 1;
      }
      
    } catch (e) {
      console.error('Error parsing error row:', e);
    }
    
    setTicketToEdit({
      index: errorIndex,
      ticket,
      originalData: error.originalData,
      rowNumber: error.row,
      isErrorCorrection: true,
    });
    setShowEditModal(true);
  };

  const handleSaveEditedTicket = (editedTicket: ImportTicketData) => {
    if (!parseResult || !ticketToEdit) return;

    if (ticketToEdit.isErrorCorrection) {
      // Save as corrected error
      const originalError = parseResult.errors[ticketToEdit.index];
      const correctedItem = {
        originalError,
        correctedTicket: editedTicket
      };

      const existingIndex = correctedTickets.findIndex(
        ct => ct.originalError.row === originalError.row
      );

      if (existingIndex >= 0) {
        const updated = [...correctedTickets];
        updated[existingIndex] = correctedItem;
        setCorrectedTickets(updated);
      } else {
        setCorrectedTickets([...correctedTickets, correctedItem]);
      }
    } else {
      // Update existing valid ticket
      const updatedTickets = [...parseResult.tickets];
      updatedTickets[ticketToEdit.index] = editedTicket;
      setParseResult({
        ...parseResult,
        tickets: updatedTickets,
      });
    }
    
    setShowEditModal(false);
    setTicketToEdit(null);
  };

  const addCorrectedToImport = () => {
    if (!parseResult || correctedTickets.length === 0) return;

    const newTickets = correctedTickets.map(item => item.correctedTicket);
    const updatedTickets = [...parseResult.tickets, ...newTickets];
    
    const remainingErrors = parseResult.errors.filter(error => 
      !correctedTickets.some(ct => ct.originalError.row === error.row)
    );
    
    setParseResult({
      ...parseResult,
      tickets: updatedTickets,
      errors: remainingErrors,
      stats: {
        ...parseResult.stats,
        validRows: parseResult.stats.validRows + correctedTickets.length,
        invalidRows: parseResult.stats.invalidRows - correctedTickets.length
      }
    });
    
    setCorrectedTickets([]);
    setActiveTab('preview');
  };

  const handleEditCorrectedTicket = (index: number) => {
    const correctedItem = correctedTickets[index];
    
    setTicketToEdit({
      index,
      ticket: correctedItem.correctedTicket,
      originalData: correctedItem.originalError.originalData,
      rowNumber: correctedItem.originalError.row,
      isErrorCorrection: true,
    });
    setShowEditModal(true);
  };

  const handleRemoveCorrectedTicket = (index: number) => {
    const updatedCorrected = correctedTickets.filter((_, i) => i !== index);
    setCorrectedTickets(updatedCorrected);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>CSV File Import</CardTitle>
          <CardDescription>
            Upload a CSV file matching your ticket list format. Correct errors and retry failed imports.
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

            {parseResult && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-2xl font-bold">{parseResult.stats.totalRows}</div>
                      <div className="text-sm text-muted-foreground">Total Rows</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-6 text-center">
                      <div className="text-2xl font-bold text-green-700">{parseResult.stats.validRows}</div>
                      <div className="text-sm text-green-600">Valid Tickets</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="pt-6 text-center">
                      <div className="text-2xl font-bold text-red-700">{parseResult.stats.invalidRows}</div>
                      <div className="text-sm text-red-600">Errors</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="pt-6 text-center">
                      <div className="text-2xl font-bold text-yellow-700">{parseResult.stats.skippedRows}</div>
                      <div className="text-sm text-yellow-600">Skipped</div>
                    </CardContent>
                  </Card>
                </div>

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="preview" disabled={parseResult.tickets.length === 0}>
                      Valid Tickets ({parseResult.tickets.length})
                    </TabsTrigger>
                    <TabsTrigger value="errors" disabled={parseResult.errors.length === 0}>
                      Errors ({parseResult.errors.length})
                    </TabsTrigger>
                    <TabsTrigger value="corrected" disabled={correctedTickets.length === 0}>
                      Corrected ({correctedTickets.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="preview" className="space-y-4">
                    {parseResult.tickets.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">Valid Tickets Ready for Import</h4>
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
                                  <th className="px-4 py-2 text-left">Row</th>
                                  <th className="px-4 py-2 text-left">Name</th>
                                  <th className="px-4 py-2 text-left">Phone</th>
                                  <th className="px-4 py-2 text-left">Type</th>
                                  <th className="px-4 py-2 text-left">Amount</th>
                                  <th className="px-4 py-2 text-left">Status</th>
                                  <th className="px-4 py-2 text-left">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {parseResult.tickets.slice(0, 10).map((ticket, index) => (
                                  <tr key={index} className="border-t hover:bg-muted/50">
                                    <td className="px-4 py-2 font-mono">{index + 1}</td>
                                    <td className="px-4 py-2 font-medium">{ticket.fullName}</td>
                                    <td className="px-4 py-2 font-mono text-xs">{ticket.phone}</td>
                                    <td className="px-4 py-2">
                                      <Badge variant="outline">
                                        {ticket.ticketType}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-2 font-medium">
                                      TZS {ticket.totalAmount.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2">
                                      <Badge 
                                        variant={ticket.isPaid ? "default" : "secondary"}
                                        className={ticket.isPaid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                                      >
                                        {ticket.paymentStatus}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditTicket(index)}
                                        className="h-8 w-8 p-0"
                                        title="Edit ticket"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          {parseResult.tickets.length > 10 && (
                            <div className="px-4 py-2 bg-muted text-center text-sm">
                              ... and {parseResult.tickets.length - 10} more tickets
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="errors" className="space-y-4">
                    {parseResult.errors.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-red-600">Rows with Errors</h4>
                          {correctedTickets.length > 0 && (
                            <Badge className="bg-blue-100 text-blue-800">
                              {correctedTickets.length} corrected
                            </Badge>
                          )}
                        </div>
                        
                        <div className="border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-red-50">
                                <tr>
                                  <th className="px-4 py-2 text-left">Row #</th>
                                  <th className="px-4 py-2 text-left">Data</th>
                                  <th className="px-4 py-2 text-left">Error Details</th>
                                  <th className="px-4 py-2 text-left">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {parseResult.errors.map((error, index) => {
                                  const isCorrected = correctedTickets.some(
                                    ct => ct.originalError.row === error.row
                                  );
                                  return (
                                    <tr key={index} className={`border-t hover:bg-red-50/50 ${isCorrected ? 'bg-green-50' : ''}`}>
                                      <td className="px-4 py-2 font-mono font-bold">
                                        Row {error.row}
                                        {isCorrected && (
                                          <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
                                            Corrected
                                          </Badge>
                                        )}
                                      </td>
                                      <td className="px-4 py-2">
                                        <div className="text-xs font-mono max-w-xs truncate">
                                          {JSON.stringify(error.originalData)}
                                        </div>
                                      </td>
                                      <td className="px-4 py-2">
                                        <div className="space-y-1">
                                          <p className="text-red-600 text-sm">{error.error}</p>
                                          {Object.keys(error.validationErrors).length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                              {Object.entries(error.validationErrors).map(([field, fieldError]) => (
                                                <Badge key={field} variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                                                  {field}: {fieldError}
                                                </Badge>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-4 py-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditErrorRow(index)}
                                          className="h-8 w-8 p-0"
                                          title="Correct this error"
                                          disabled={isCorrected}
                                        >
                                          <Edit className={`h-4 w-4 ${isCorrected ? 'text-green-600' : ''}`} />
                                        </Button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="corrected" className="space-y-4">
                    {correctedTickets.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">Corrected Tickets</h4>
                            <p className="text-sm text-muted-foreground">
                              {correctedTickets.length} error(s) have been corrected
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addCorrectedToImport}
                              className="gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Add to Import ({correctedTickets.length})
                            </Button>
                          </div>
                        </div>
                        
                        <div className="border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-blue-50">
                                <tr>
                                  <th className="px-4 py-2 text-left">Original Row</th>
                                  <th className="px-4 py-2 text-left">Name</th>
                                  <th className="px-4 py-2 text-left">Phone</th>
                                  <th className="px-4 py-2 text-left">Type</th>
                                  <th className="px-4 py-2 text-left">Amount</th>
                                  <th className="px-4 py-2 text-left">Status</th>
                                  <th className="px-4 py-2 text-left">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {correctedTickets.map((item, index) => (
                                  <tr key={index} className="border-t hover:bg-blue-50/50">
                                    <td className="px-4 py-2 font-mono font-bold">
                                      Row {item.originalError.row}
                                    </td>
                                    <td className="px-4 py-2 font-medium">{item.correctedTicket.fullName}</td>
                                    <td className="px-4 py-2 font-mono text-xs">{item.correctedTicket.phone}</td>
                                    <td className="px-4 py-2">
                                      <Badge variant="outline">
                                        {item.correctedTicket.ticketType}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-2 font-medium">
                                      TZS {item.correctedTicket.totalAmount.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2">
                                      <Badge 
                                        variant={item.correctedTicket.isPaid ? "default" : "secondary"}
                                        className={item.correctedTicket.isPaid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                                      >
                                        {item.correctedTicket.paymentStatus}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-2">
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditCorrectedTicket(index)}
                                          className="h-8 w-8 p-0"
                                          title="Edit corrected ticket"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveCorrectedTicket(index)}
                                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                          title="Remove from corrected"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading || parseResult.tickets.length === 0}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      `Import ${parseResult.tickets.length} Valid Ticket${parseResult.tickets.length !== 1 ? 's' : ''}`
                    )}
                  </Button>
                  {correctedTickets.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addCorrectedToImport}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Corrected ({correctedTickets.length})
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {importResults && (
        <ImportResultsModal
          isOpen={showResultsModal}
          onClose={() => setShowResultsModal(false)}
          results={importResults}
          onViewHistory={() => {
            setShowResultsModal(false);
          }}
        />
      )}

      {ticketToEdit && (
        <EditTicketModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setTicketToEdit(null);
          }}
          ticket={ticketToEdit.ticket}
          originalData={ticketToEdit.originalData}
          rowNumber={ticketToEdit.rowNumber}
          onSave={handleSaveEditedTicket}
        />
      )}
    </div>
  );
}