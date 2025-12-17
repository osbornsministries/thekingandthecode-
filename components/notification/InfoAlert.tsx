// app/admin/sms-templates/components/InfoAlert.tsx
import { Alert, AlertDescription } from '@/components/ui/alert';

export function InfoAlert() {
  return (
    <Alert className="bg-muted">
      <AlertDescription className="text-sm">
        <strong>Note:</strong> SMS messages are limited to 160 characters per segment. 
        Messages longer than 160 characters will be split into multiple SMS, which may incur additional charges.
      </AlertDescription>
    </Alert>
  );
}