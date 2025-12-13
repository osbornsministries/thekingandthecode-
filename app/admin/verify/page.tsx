'use client';

import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { verifyTicket } from '@/lib/actions/ticket/ticket-verifier';
import { 
  ScanLine, Keyboard, CheckCircle, XCircle, 
  AlertTriangle, Loader2, RefreshCcw, 
  CreditCard, Calendar, Clock, UserCheck
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

export default function VerifyPage() {
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');
  const [scanResult, setScanResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isPaused, setIsPaused] = useState(false);

  const handleVerify = async (code: string) => {
    if (!code || loading || isPaused) return;
    setIsPaused(true);
    setLoading(true);

    const result = await verifyTicket(code);
    setScanResult(result);
    setLoading(false);
  };

  const resetScanner = () => {
    setScanResult(null);
    setManualCode('');
    setIsPaused(false);
  };

  // Helper to render checklist steps
  const CheckItem = ({ label, status, icon: Icon }: any) => {
    let colorClass = "text-gray-400";
    let iconClass = "text-gray-300";

    // Logic: If result is success, ALL are green.
    // If failed, check 'step' to determine where to stop red.
    const isSuccess = scanResult?.success;
    const failedStep = scanResult?.step;

    if (isSuccess) {
        colorClass = "text-green-700 font-bold";
        iconClass = "text-green-600";
    } else if (failedStep) {
        // Define order
        const steps = ['EXISTENCE', 'PAYMENT', 'DAY', 'SESSION', 'USAGE'];
        const myIndex = steps.indexOf(label.toUpperCase());
        const failIndex = steps.indexOf(failedStep);

        if (myIndex < failIndex) {
            colorClass = "text-green-700 font-bold"; // Passed this step
            iconClass = "text-green-600";
        } else if (myIndex === failIndex) {
            colorClass = "text-red-600 font-bold"; // Failed here
            iconClass = "text-red-500";
        }
    }

    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm ${colorClass}`}>
            <Icon size={20} className={iconClass} />
            <span className="flex-1">{label} Check</span>
            {isSuccess || (scanResult?.step && colorClass.includes('green')) ? (
                 <CheckCircle size={18} className="text-green-500" />
            ) : (scanResult?.step && colorClass.includes('red')) ? (
                 <XCircle size={18} className="text-red-500" />
            ) : (
                 <div className="w-4 h-4 rounded-full bg-gray-200" />
            )}
        </div>
    );
  };

  return (
    <AdminLayout>
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Gatekeeper</h1>
           <p className="text-sm text-gray-500">Secure Entry Verification</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
          <button onClick={() => setActiveTab('scan')} className={`px-4 py-2 rounded-md ${activeTab === 'scan' ? 'bg-black text-white' : 'text-gray-500'}`}>
            <ScanLine size={18} />
          </button>
          <button onClick={() => setActiveTab('manual')} className={`px-4 py-2 rounded-md ${activeTab === 'manual' ? 'bg-black text-white' : 'text-gray-500'}`}>
            <Keyboard size={18} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden min-h-[500px] flex flex-col relative">
        
        {/* INPUT MODE */}
        {!scanResult ? (
          <div className="flex-1 flex flex-col">
            {activeTab === 'scan' ? (
              <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                <Scanner 
                  onScan={(r) => { if (r?.[0]?.rawValue && !isPaused) handleVerify(r[0].rawValue); }}
                  paused={isPaused}
                  components={{ onOff: true, finder: true }}
                />
                <div className="absolute bottom-10 left-0 right-0 text-center text-white/80 font-bold animate-pulse">
                   Scanning...
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
                 <input 
                   value={manualCode} 
                   onChange={(e) => setManualCode(e.target.value)} 
                   placeholder="Enter Ticket UUID"
                   className="w-full p-4 text-center text-xl font-mono border-2 border-gray-300 rounded-2xl focus:border-black outline-none uppercase"
                 />
                 <button onClick={() => handleVerify(manualCode)} disabled={!manualCode || loading} className="w-full py-4 bg-black text-white font-bold rounded-2xl">
                   {loading ? <Loader2 className="animate-spin mx-auto" /> : 'VERIFY'}
                 </button>
              </div>
            )}
            
            {loading && activeTab === 'scan' && (
               <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 text-white">
                  <Loader2 className="w-12 h-12 animate-spin mb-4" />
                  <p className="font-bold text-xl">Verifying...</p>
               </div>
            )}
          </div>
        ) : (
          
          /* RESULT MODE */
          <div className="flex-1 p-8 flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-500">
             
             {/* 1. Header Status */}
             <div className="text-center mb-8">
                 <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4 shadow-2xl ${
                     scanResult.success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                 }`}>
                     {scanResult.success ? <CheckCircle size={48} /> : <XCircle size={48} />}
                 </div>
                 <h2 className={`text-3xl font-black uppercase ${scanResult.success ? 'text-green-600' : 'text-red-600'}`}>
                     {scanResult.success ? 'ALLOWED' : 'REJECTED'}
                 </h2>
                 <p className="text-gray-500 font-medium mt-1">{scanResult.error || scanResult.message}</p>
                 {scanResult.details && <p className="text-xs text-red-400 mt-1 font-mono">{scanResult.details}</p>}
             </div>

             {/* 2. Verification Steps Checklist */}
             <div className="space-y-3 mb-8">
                 <CheckItem label="Existence" icon={ScanLine} />
                 <CheckItem label="Payment" icon={CreditCard} />
                 <CheckItem label="Day" icon={Calendar} />
                 <CheckItem label="Session" icon={Clock} />
                 <CheckItem label="Usage" icon={UserCheck} />
             </div>

             {/* 3. Ticket Details (Only if found) */}
             {scanResult.data && (
                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm mb-6">
                     <div className="flex justify-between mb-2">
                         <span className="text-gray-500">Guest</span>
                         <span className="font-bold">{scanResult.data.guest}</span>
                     </div>
                     <div className="flex justify-between">
                         <span className="text-gray-500">Ticket</span>
                         <span className="font-bold px-2 bg-black text-white rounded text-xs py-0.5">{scanResult.data.type}</span>
                     </div>
                 </div>
             )}

             <button onClick={resetScanner} className="mt-auto w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:scale-105 transition-transform">
                 <RefreshCcw size={18} className="inline mr-2" /> Scan Next
             </button>
          </div>
        )}

      </div>
    </div>
    </AdminLayout>
  );
}