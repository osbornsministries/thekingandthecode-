// components/admin/tickets/import-tickets/ImportErrorDetailsModal.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, XCircle, Copy } from 'lucide-react';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useState } from 'react';

interface ImportErrorDetails {
  row?: number;
  error?: string;
  validationErrors?: Record<string, string>;
  originalData?: any;
}

interface ImportErrorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorDetails: ImportErrorDetails;
}

export default function ImportErrorDetailsModal({
  isOpen,
  onClose,
  errorDetails,
}: ImportErrorDetailsModalProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    const text = `
Row: ${errorDetails.row || 'N/A'}
Error: ${errorDetails.error || 'N/A'}
Validation Errors: ${errorDetails.validationErrors ? JSON.stringify(errorDetails.validationErrors, null, 2) : 'None'}
Original Data: ${errorDetails.originalData ? JSON.stringify(errorDetails.originalData, null, 2) : 'N/A'}
    `.trim();
    
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Import Error Details
          </DialogTitle>
          <DialogDescription>
            {errorDetails.row && `Row ${errorDetails.row} • `}
            Detailed error information for troubleshooting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Summary */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="font-medium text-red-800">Error Message</h4>
                <p className="text-red-700 text-sm">{errorDetails.error || 'Unknown error occurred'}</p>
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {errorDetails.validationErrors && Object.keys(errorDetails.validationErrors).length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Validation Errors</h4>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableBody>
                    {Object.entries(errorDetails.validationErrors).map(([field, error]) => (
                      <TableRow key={field} className="hover:bg-red-50">
                        <TableCell className="font-medium w-32">
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            {field}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-red-600">{error}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Original Data */}
          {errorDetails.originalData && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Original Data</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="h-8 gap-2"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <div className="bg-gray-50 border rounded-lg p-4">
                <pre className="text-sm font-mono overflow-auto max-h-48">
                  {JSON.stringify(errorDetails.originalData, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Row Information */}
          {errorDetails.row && (
            <div className="text-sm text-muted-foreground">
              <p>This error occurred at row {errorDetails.row} in your CSV file.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}