// app/admin/sms-templates/components/LoadingState.tsx
import { RefreshCw } from 'lucide-react';

export function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p>Loading...</p>
      </div>
    </div>
  );
}