// components/admin/tickets/import-tickets/ImportResultsModal.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Download, ExternalLink } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ImportResult {
  success: boolean;
  data?: any;
  error?: string;
  row?: number;
  validationErrors?: Record<string, string>;
}

interface ImportResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: {
    success: ImportResult[];
    failed: ImportResult[];
  };
  onViewHistory: () => void;
}

export default function ImportResultsModal({
  isOpen,
  onClose,
  results,
  onViewHistory,
}: ImportResultsModalProps) {
  const totalSuccess = results.success.length;
  const totalFailed = results.failed.length;
  const totalProcessed = totalSuccess + totalFailed;

  const handleExportFailed = () => {
    // Create CSV content for failed items
    const headers = ['Row', 'Error', 'Validation Errors'];
    const rows = results.failed.map(item => [
      item.row || 'N/A',
      item.error || 'Unknown error',
      item.validationErrors ? Object.entries(item.validationErrors).map(([key, value]) => `${key}: ${value}`).join('; ') : 'None'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `failed-imports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Import Results
          </DialogTitle>
          <DialogDescription>
            {totalProcessed} tickets processed • {totalSuccess} succeeded • {totalFailed} failed
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="failed" className="h-full flex flex-col">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="failed" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Failed ({totalFailed})
              </TabsTrigger>
              <TabsTrigger value="success" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Success ({totalSuccess})
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto py-4">
              <TabsContent value="failed" className="h-full m-0">
                {totalFailed === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No failed imports
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        Showing {totalFailed} failed import(s)
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportFailed}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Export Failed
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Row #</TableHead>
                              <TableHead>Data Preview</TableHead>
                              <TableHead>Error</TableHead>
                              <TableHead>Validation Errors</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {results.failed.map((item, index) => (
                              <TableRow key={index} className="hover:bg-red-50">
                                <TableCell className="font-mono">
                                  {item.row || index + 1}
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {item.data ? (
                                    <div className="text-xs font-mono bg-gray-50 p-2 rounded">
                                      {JSON.stringify(item.data)}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">No data</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="text-red-600 text-sm">
                                    {item.error || 'Unknown error'}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {item.validationErrors ? (
                                    <div className="space-y-1">
                                      {Object.entries(item.validationErrors).map(([field, error]) => (
                                        <div key={field} className="text-xs">
                                          <Badge variant="outline" className="mr-1 bg-red-50 text-red-700 border-red-200">
                                            {field}
                                          </Badge>
                                          <span className="text-red-600">{error}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">None</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="success" className="h-full m-0">
                {totalSuccess === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No successful imports
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        Showing {totalSuccess} successful import(s)
                      </p>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Row #</TableHead>
                              <TableHead>Ticket Code</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {results.success.map((item, index) => (
                              <TableRow key={index} className="hover:bg-green-50">
                                <TableCell className="font-mono">
                                  {item.row || index + 1}
                                </TableCell>
                                <TableCell className="font-mono font-medium">
                                  {item.data?.ticketCode || 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {item.data?.purchaserName || 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {item.data?.purchaserPhone || 'N/A'}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {item.data?.ticketType || 'N/A'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                    Imported
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportFailed}
              disabled={totalFailed === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export Failed
            </Button>
            <Button
              onClick={() => {
                onViewHistory();
                onClose();
              }}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View Import History
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}