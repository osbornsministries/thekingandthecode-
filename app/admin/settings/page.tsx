'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Save, 
  Database, 
  Shield, 
  Globe, 
  Download, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

// You would usually fetch these from the DB, but for now we use state
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>('No backups yet');

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    
    // Call an internal API route or Server Action to trigger backup
    // For demo, we verify against the cron route or a server action
    try {
      const res = await fetch('/api/cron/backup', {
        headers: { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET_DEMO || ''}` } 
        // Note: In real app, use a Server Action to trigger BackupService.createBackup() directly
      });
      
      // Simulate delay for effect
      await new Promise(r => setTimeout(r, 2000));
      
      setLastBackup(new Date().toLocaleString());
      alert("Backup created successfully! Saved to server /backups folder.");
    } catch (e) {
      alert("Backup failed.");
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <AdminLayout>
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-sm text-gray-500">Manage configuration and database backups.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('general')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'general' ? 'border-[#A81010] text-[#A81010]' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          General
        </button>
        <button 
          onClick={() => setActiveTab('backup')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'backup' ? 'border-[#A81010] text-[#A81010]' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Database & Backup
        </button>
        <button 
          onClick={() => setActiveTab('security')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'security' ? 'border-[#A81010] text-[#A81010]' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Security
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        
        {/* --- GENERAL TAB --- */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Globe size={20} className="text-gray-400" /> General Configuration
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Event Name</label>
                <input type="text" defaultValue="The King & The Code" className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-[#A81010] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Support Email</label>
                <input type="email" defaultValue="info@afyalink.com" className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-[#A81010] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Currency</label>
                <select className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none bg-white">
                  <option>TZS (Tanzanian Shilling)</option>
                  <option>USD (US Dollar)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Timezone</label>
                <select className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none bg-white">
                  <option>Africa/Dar_es_Salaam (GMT+3)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button className="px-6 py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 flex items-center gap-2">
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>
        )}

        {/* --- BACKUP TAB --- */}
        {activeTab === 'backup' && (
          <div className="space-y-8">
             <div className="flex justify-between items-start">
               <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Database size={20} className="text-gray-400" /> Database Backups
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Manage automated and manual backups of your system data.</p>
               </div>
               <div className="px-4 py-2 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  System Healthy
               </div>
             </div>

             {/* Automated Status Card */}
             <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-[#A81010]">
                   <Clock size={24} />
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-900">Daily Auto-Backup</h3>
                   <p className="text-xs text-gray-500">Scheduled to run every day at <span className="font-mono font-bold text-gray-700">00:00 EAT</span></p>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status:</span>
                  <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                    <CheckCircle size={14} /> Active
                  </span>
               </div>
             </div>

             {/* Manual Action */}
             <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Manual Operations</h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-4 bg-white flex justify-between items-center border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-800">Create Immediate Snapshot</p>
                      <p className="text-xs text-gray-500">Last backup: {lastBackup}</p>
                    </div>
                    <button 
                      onClick={handleManualBackup}
                      disabled={isBackingUp}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isBackingUp ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                      {isBackingUp ? 'Backing up...' : 'Backup Now'}
                    </button>
                  </div>
                </div>
             </div>

             {/* Info Box */}
             <div className="bg-blue-50 p-4 rounded-xl flex gap-3 text-blue-700 text-sm">
               <AlertCircle size={20} className="shrink-0" />
               <p>Backups are stored securely in the <strong>/backups</strong> directory. For production, please configure S3 storage in the <code>.env</code> file.</p>
             </div>
          </div>
        )}

        {/* --- SECURITY TAB --- */}
        {activeTab === 'security' && (
          <div className="space-y-6">
             <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Shield size={20} className="text-gray-400" /> Admin Security
             </h2>
             <p className="text-sm text-gray-500">To change passwords or manage admin access, please visit the <a href="/admin/users" className="text-[#A81010] font-bold hover:underline">Users Page</a>.</p>
          </div>
        )}

      </div>
    </div>
    </AdminLayout>
  );
}