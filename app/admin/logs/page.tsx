'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import { useEffect, useState } from 'react';

const secret = process.env.NEXT_PUBLIC_LOG_SECRET || 'super-secret-key-123'; // use NEXT_PUBLIC_LOG_SECRET for client

export default function LogsPage() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/logs/list?secret=${secret}`)
      .then((res) => res.json())
      .then(setLogs)
      .catch(console.error);
  }, []);

  const download = (file: string) => {
    window.location.href = `/api/logs/${file}?secret=${secret}`;
  };

  return (
    <AdminLayout>
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Logs</h1>
      {logs.length === 0 && <p>No logs found.</p>}
      <ul className="space-y-2">
        {logs.map((log) => (
          <li key={log} className="flex items-center justify-between border p-2 rounded">
            <span>{log}</span>
            <button
              onClick={() => download(log)}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Download
            </button>
          </li>
        ))}
      </ul>
    </div>
    </AdminLayout>
  );
}
