// app/admin/import-tickets/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { ImportTicketData, importTicket, bulkImportTickets, getImportHistory } from '@/lib/actions/ticket/ticket-importer';
import { ImportTicketForm } from '@/components/admin/tickets/import-tickets/ImportTicketForm';
import { ImportHistory } from '@/components/admin/tickets/import-tickets/BulkImport';
import { BulkImport } from '@/components/admin/tickets/import-tickets/ImportHistory';
import { CSVImport } from '@/components/admin/tickets/import-tickets/CSVImport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Upload, FileText, History, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/components/admin/AdminLayout';

export default function ImportTicketsPage() {
  const [activeTab, setActiveTab] = useState('single');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [importHistory, setImportHistory] = useState<any[]>([]);

  const handleSingleImport = async (data: ImportTicketData) => {
    setIsLoading(true);
    try {
      const result = await importTicket(data);
      setResult(result);
      if (result.success) {
        // Refresh import history
        // await loadImportHistory();
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Import failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkImport = async (data: ImportTicketData[]) => {
    setIsLoading(true);
    try {
      const result = await bulkImportTickets(data);
      setResult(result);
      if (result.success) {
        // Refresh import history
        // await loadImportHistory();
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Bulk import failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

//   const loadImportHistory = async () => {
//     try {
//       const history = await getImportHistory(20);
//       if (history.success) {
//         setImportHistory(history.tickets || []);
//       }
//     } catch (error) {
//       console.error('Failed to load import history:', error);
//     }
//   };

  // Load history on component mount
  useState(() => {
    // loadImportHistory();
  });

  return (
    <AdminLayout>
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Tickets</h1>
        <p className="text-muted-foreground">
          Import tickets manually or in bulk. Duplicate users will be detected automatically.
        </p>
      </div>

      {result && (
        <Alert className={result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          {result.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertTitle className={result.success ? 'text-green-800' : 'text-red-800'}>
            {result.success ? 'Import Successful' : 'Import Failed'}
          </AlertTitle>
          <AlertDescription className={result.success ? 'text-green-700' : 'text-red-700'}>
            {result.message}
            {result.summary && (
              <div className="mt-2 text-sm">
                {result.isDuplicate && (
                  <p className="font-medium">⚠️ Duplicate user detected</p>
                )}
                {result.summary.ticketCode && (
                  <p>Ticket Code: <span className="font-mono">{result.summary.ticketCode}</span></p>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="single" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Single Import
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Bulk Entry
          </TabsTrigger>
          <TabsTrigger value="csv" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            CSV Upload
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Import History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Single Ticket</CardTitle>
              <CardDescription>
                Import a single ticket manually. The system will check if the user already exists.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImportTicketForm 
                onSubmit={handleSingleImport} 
                isLoading={isLoading && activeTab === 'single'}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <BulkImport 
            onSubmit={handleBulkImport} 
            isLoading={isLoading && activeTab === 'bulk'}
          />
        </TabsContent>

        <TabsContent value="csv" className="space-y-4">
          <CSVImport 
            onSubmit={handleBulkImport} 
            isLoading={isLoading && activeTab === 'csv'}
          />
        </TabsContent>

        {/* <TabsContent value="history" className="space-y-4">
          <ImportHistory 
            history={importHistory} 
            isLoading={isLoading && activeTab === 'history'}
            onRefresh={loadImportHistory}
          />
        </TabsContent> */}
      </Tabs>
    </div>
    </AdminLayout>
  );
}