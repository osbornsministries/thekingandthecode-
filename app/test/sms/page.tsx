'use client';
import { useState } from 'react';
import { Logger } from '@/lib/logger/logger';

export default function SMSTestPage() {
  const [phone, setPhone] = useState('0712345678');
  const [message, setMessage] = useState('Test SMS from your application');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testSMSService = async () => {
    setLoading(true);
    setResult(null);

    try {
      const params = new URLSearchParams({ phone, message });
      const response = await fetch(`/api/test/sms?${params}`);
      const data = await response.json();
      setResult(data);

      const logger = new Logger('SMSTestUI');
      logger.info('SMS test triggered', { phone, message, status: data.status });
    } catch (error: any) {
      setResult({ status: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">SMS Service Test</h1>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="mb-4">
          <label className="block font-medium mb-1">Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <button
          onClick={testSMSService}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Testing...' : 'Test SMS'}
        </button>
      </div>

      {result && (
        <div className={`p-4 rounded ${
          result.status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
