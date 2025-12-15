'use client';

import { useState } from 'react';
import { seedDatabase } from '@/lib/drizzle/seeders/ConfigSeeder';
import { Database, Download, Clock, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

export default function BackupTab() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [seedResult, setSeedResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
    error?: string;
  } | null>(null);

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    try {
      // Call your backup API
      const res = await fetch('/api/admin/backup', { method: 'POST' });
      if (res.ok) {
        setLastBackup(new Date().toLocaleString());
        alert('Backup created successfully!');
      } else {
        alert('Backup failed');
      }
    } catch (error) {
      console.error('Backup error:', error);
      alert('Backup failed');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleSeedDatabase = async () => {
    if (!confirm('⚠️ Warning: This will reset all configuration data to default values. Continue?')) {
      return;
    }

    setIsSeeding(true);
    setSeedResult(null);

    try {
      const result = await seedDatabase();
      setSeedResult(result);
    } catch (error: any) {
      setSeedResult({
        success: false,
        message: 'Seeding failed',
        error: error.message
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Database Management</h2>

        {/* Automated Backup Status */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-[#A81010]">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Daily Auto-Backup</h3>
                <p className="text-sm text-gray-500">
                  Scheduled to run every day at <span className="font-mono font-bold text-gray-700">00:00 EAT</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status:</span>
              <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                <CheckCircle size={14} /> Active
              </span>
            </div>
          </div>
        </div>

        {/* Manual Backup */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Manual Operations</h3>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-6 bg-white flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <p className="font-medium text-gray-800">Create Immediate Backup</p>
                <p className="text-sm text-gray-500">
                  Last backup: {lastBackup || 'No backups yet'}
                </p>
              </div>
              <button
                onClick={handleManualBackup}
                disabled={isBackingUp}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
              >
                {isBackingUp ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Download size={16} />
                )}
                {isBackingUp ? 'Creating Backup...' : 'Backup Now'}
              </button>
            </div>
          </div>
        </div>

        {/* Database Reset */}
        <div className="border border-red-200 rounded-xl overflow-hidden">
          <div className="p-6 bg-red-50 border-b border-red-100">
            <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
              <AlertCircle size={20} /> Reset Database to Default
            </h3>
            <p className="text-sm text-red-700 mt-1">
              This will reset all configuration data (Event Days, Sessions, Ticket Prices, Payment Methods) to default seed values.
            </p>
          </div>
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <p className="font-medium text-gray-800">Reset Configuration Data</p>
                <p className="text-sm text-gray-500">
                  Last reset: {seedResult ? new Date().toLocaleString() : 'Never'}
                </p>
              </div>
              <button
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
              >
                {isSeeding ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <RefreshCw size={16} />
                )}
                {isSeeding ? 'Resetting...' : 'Reset to Default'}
              </button>
            </div>

            {seedResult && (
              <div className={`mt-6 p-4 rounded-lg ${
                seedResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {seedResult.success ? (
                    <CheckCircle size={18} />
                  ) : (
                    <AlertCircle size={18} />
                  )}
                  <span className="font-bold">{seedResult.success ? 'Success' : 'Error'}</span>
                </div>
                <p className="text-sm">{seedResult.message}</p>
                {seedResult.data && (
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white/50 p-3 rounded text-center">
                      <div className="text-2xl font-bold">{seedResult.data.eventDays}</div>
                      <div className="text-xs text-gray-600">Event Days</div>
                    </div>
                    <div className="bg-white/50 p-3 rounded text-center">
                      <div className="text-2xl font-bold">{seedResult.data.eventSessions}</div>
                      <div className="text-xs text-gray-600">Sessions</div>
                    </div>
                    <div className="bg-white/50 p-3 rounded text-center">
                      <div className="text-2xl font-bold">{seedResult.data.ticketPrices}</div>
                      <div className="text-xs text-gray-600">Ticket Prices</div>
                    </div>
                    <div className="bg-white/50 p-3 rounded text-center">
                      <div className="text-2xl font-bold">{seedResult.data.paymentMethods}</div>
                      <div className="text-xs text-gray-600">Payment Methods</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 p-4 rounded-xl flex gap-3 text-blue-700 text-sm">
          <Database size={20} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium mb-1">Backup Information</p>
            <p>
              Backups are stored securely in the <code className="bg-white/50 px-1 rounded">/backups</code> directory.
              For production environments, configure S3 storage in your <code className="bg-white/50 px-1 rounded">.env</code> file.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}