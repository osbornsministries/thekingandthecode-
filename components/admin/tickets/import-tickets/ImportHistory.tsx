// components/admin/tickets/import-tickets/ImportHistory.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Search, Filter, Download, Eye, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import ImportErrorDetailsModal from './ImportErrorDetailsModal';

interface ImportHistoryProps {
  history: any[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

interface ImportErrorDetails {
  row?: number;
  error?: string;
  validationErrors?: Record<string, string>;
  originalData?: any;
}

export function ImportHistory({ history, isLoading, onRefresh }: ImportHistoryProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [selectedError, setSelectedError] = useState<ImportErrorDetails | null>(null);

  const filteredHistory = history.filter(ticket => {
    const matchesSearch = 
      (ticket.purchaserName?.toLowerCase().includes(search.toLowerCase()) || false) ||
      (ticket.purchaserPhone?.includes(search) || false) ||
      (ticket.ticketCode?.toLowerCase().includes(search.toLowerCase()) || false);
    
    const matchesStatus = statusFilter === 'all' || ticket.paymentStatus === statusFilter;
    const matchesType = typeFilter === 'all' || ticket.ticketType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const formatDate = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">PAID</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">PENDING</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">FAILED</Badge>;
      case 'IMPORT_FAILED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">IMPORT FAILED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'ADULT':
        return <Badge variant="outline" className="border-blue-200 text-blue-700">ADULT</Badge>;
      case 'STUDENT':
        return <Badge variant="outline" className="border-purple-200 text-purple-700">STUDENT</Badge>;
      case 'CHILD':
        return <Badge variant="outline" className="border-green-200 text-green-700">CHILD</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const viewErrorDetails = (ticket: any) => {
    if (ticket.importError || ticket.validationErrors) {
      setSelectedError({
        row: ticket.importRow,
        error: ticket.importError,
        validationErrors: ticket.validationErrors,
        originalData: ticket.originalData
      });
      setShowErrorDetails(true);
    }
  };

  const handleExportHistory = () => {
    const headers = [
      'Ticket Code',
      'Name',
      'Phone',
      'Type',
      'Amount',
      'Status',
      'Imported At',
      'Duplicate',
      'Import Error',
      'Validation Errors'
    ];
    
    const rows = history.map(ticket => [
      ticket.ticketCode || '',
      ticket.purchaserName || '',
      ticket.purchaserPhone || '',
      ticket.ticketType || '',
      ticket.totalAmount || '0',
      ticket.paymentStatus || '',
      formatDate(ticket.createdAt),
      ticket.isDuplicate ? 'Yes' : 'No',
      ticket.importError || '',
      ticket.validationErrors ? JSON.stringify(ticket.validationErrors) : ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalFailed = history.filter(t => t.importError || t.validationErrors).length;
  const totalDuplicates = history.filter(t => t.isDuplicate).length;
  const totalSuccess = history.filter(t => !t.importError && !t.isDuplicate && !t.validationErrors).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Import History</CardTitle>
              <CardDescription>
                View all imported tickets and their status
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportHistory}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">{totalSuccess}</div>
                    <div className="text-sm text-green-600">Successful</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-700">{totalDuplicates}</div>
                    <div className="text-sm text-orange-600">Duplicates</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-red-50 border-red-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-700">{totalFailed}</div>
                    <div className="text-sm text-red-600">Failed</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or ticket code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="IMPORT_FAILED">Import Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="ADULT">Adult</SelectItem>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="CHILD">Child</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Imported</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No import history found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHistory.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-mono font-medium">
                            {ticket.ticketCode || 'N/A'}
                          </TableCell>
                          <TableCell>{ticket.purchaserName || 'N/A'}</TableCell>
                          <TableCell>{ticket.purchaserPhone || 'N/A'}</TableCell>
                          <TableCell>{getTypeBadge(ticket.ticketType)}</TableCell>
                          <TableCell>
                            TZS {ticket.totalAmount ? parseFloat(ticket.totalAmount).toLocaleString() : '0'}
                          </TableCell>
                          <TableCell>{getStatusBadge(ticket.paymentStatus)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(ticket.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {ticket.isDuplicate && (
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 w-fit">
                                  Duplicate
                                </Badge>
                              )}
                              {ticket.importError && (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 w-fit">
                                  Import Failed
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {(ticket.importError || ticket.validationErrors) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewErrorDetails(ticket)}
                                className="h-8 w-8 p-0"
                                title="View error details"
                              >
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Summary */}
            {!isLoading && history.length > 0 && (
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground items-center">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>Success: {totalSuccess}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                  <span>Pending: {history.filter(t => t.paymentStatus === 'PENDING').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <span>Failed: {totalFailed}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  <span>Duplicates: {totalDuplicates}</span>
                </div>
                <div className="ml-auto">
                  <span>Total: {history.length} tickets</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Details Modal */}
      {selectedError && (
        <ImportErrorDetailsModal
          isOpen={showErrorDetails}
          onClose={() => {
            setShowErrorDetails(false);
            setSelectedError(null);
          }}
          errorDetails={selectedError}
        />
      )}
    </div>
  );
}