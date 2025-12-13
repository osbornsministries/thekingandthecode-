import { NextResponse } from 'next/server';
import { BackupService } from '@/lib/services/backup';

export async function GET(request: Request) {
  // Security: Check for a secret key to prevent strangers from triggering backups
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const result = await BackupService.createBackup();

  if (result.success) {
    return NextResponse.json({ message: 'Backup Successful', result });
  } else {
    return NextResponse.json({ message: 'Backup Failed', error: result.error }, { status: 500 });
  }
}