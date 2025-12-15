'use client';

import { useState } from 'react';
import { seedDatabase } from '@/lib/drizzle/seeders/ConfigSeeder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Database, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SystemActions() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
    error?: string;
  } | null>(null);

  const handleSeedDatabase = async () => {
    if (!confirm('⚠️ Warning: This will reset all configuration data to default values. Continue?')) {
      return;
    }

    setIsSeeding(true);
    setSeedResult(null);

    try {
      const result = await seedDatabase();
      setSeedResult(result);
      
      if (result.success) {
        // Refresh the page after 2 seconds to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      setSeedResult({
        success: false,
        message: 'Seeding failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          System Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <Button
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isSeeding ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            {isSeeding ? 'Seeding...' : 'Seed Database'}
          </Button>
          
          <Button
            onClick={() => window.location.reload()}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </Button>
        </div>

        {seedResult && (
          <Alert variant={seedResult.success ? 'default' : 'destructive'}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {seedResult.success ? 'Success' : 'Error'}
            </AlertTitle>
            <AlertDescription>
              <p>{seedResult.message}</p>
              {seedResult.data && (
                <div className="mt-2 text-sm">
                  <p>Event Days: {seedResult.data.eventDays}</p>
                  <p>Sessions: {seedResult.data.eventSessions}</p>
                  <p>Ticket Prices: {seedResult.data.ticketPrices}</p>
                  <p>Payment Methods: {seedResult.data.paymentMethods}</p>
                </div>
              )}
              {seedResult.error && (
                <p className="mt-2 text-sm font-mono">{seedResult.error}</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-gray-500 space-y-1">
          <p>⚠️ <strong>Seed Database:</strong> Resets all configuration data to default values</p>
          <p>💡 <strong>Note:</strong> Use this when setting up the system or testing</p>
          <p>🔄 <strong>Refresh:</strong> Updates the view with latest data from database</p>
        </div>
      </CardContent>
    </Card>
  );
}