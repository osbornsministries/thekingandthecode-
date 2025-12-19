// app/admin/import-tickets/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { ImportTicketData, bulkImportTickets, getImportHistory } from '@/lib/actions/ticket/ticket-importer';
import { CSVImport } from '@/components/admin/tickets/import-tickets/CSVImport';
import { ImportHistory } from '@/components/admin/tickets/import-tickets/BulkImport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Upload, History, CheckCircle, XCircle } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ImportResultsModal from '@/components/admin/tickets/import-tickets/ImportResultsModal';

export default function ImportTicketsPage() {
  const [activeTab, setActiveTab] = useState('csv');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: any[];
    failed: any[];
  }>({ success: [], failed: [] });

  const handleBulkImport = async (data: ImportTicketData[]) => {
    setIsLoading(true);
    setShowResultsModal(false);
    try {
      const result = await bulkImportTickets(data);
      setResult(result);
      
      // Process results for modal display
      if (result.results) {
        const successItems = result.results.filter((item: any) => item.success);
        const failedItems = result.results.filter((item: any) => !item.success);
        
        setImportResults({
          success: successItems,
          failed: failedItems
        });
        
        if (failedItems.length > 0 || successItems.length > 0) {
          setShowResultsModal(true);
        }
      }
      
      if (result.success) {
        // Refresh import history
        await loadImportHistory();
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

  const loadImportHistory = async () => {
    try {
      const history = await getImportHistory(50);
      if (history.success) {
        setImportHistory(history.tickets || []);
      }
    } catch (error) {
      console.error('Failed to load import history:', error);
    }
  };

  // Load history on component mount
  useEffect(() => {
    loadImportHistory();
  }, []);

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import Tickets</h1>
          <p className="text-muted-foreground">
            Upload CSV file to import tickets in bulk. Duplicate users will be detected automatically.
          </p>
        </div>

        {result && !showResultsModal && (
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
                  {result.summary.totalImported && (
                    <p>Successfully imported: <span className="font-bold">{result.summary.totalImported}</span> tickets</p>
                  )}
                  {result.summary.duplicates && (
                    <p>Duplicates found: <span className="font-bold text-amber-600">{result.summary.duplicates}</span></p>
                  )}
                  {result.summary.failed && (
                    <p>Failed to import: <span className="font-bold text-red-600">{result.summary.failed}</span> tickets</p>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              CSV Upload
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Import History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="csv" className="space-y-4">
            <CSVImport 
              onSubmit={handleBulkImport} 
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <ImportHistory 
              history={importHistory} 
              isLoading={isLoading && activeTab === 'history'}
              onRefresh={loadImportHistory}
            />
          </TabsContent>
        </Tabs>

        {/* Import Results Modal */}
        <ImportResultsModal
          isOpen={showResultsModal}
          onClose={() => setShowResultsModal(false)}
          results={importResults}
          onViewHistory={() => {
            setShowResultsModal(false);
            setActiveTab('history');
            loadImportHistory();
          }}
        />
      </div>
    </AdminLayout>
  );
}