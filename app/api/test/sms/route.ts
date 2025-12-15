

// app/api/test/sms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SMSService } from '@/lib/services/sms';
import { Logger } from '@/lib/logger/logger';

export async function GET(request: NextRequest) {
  const logger = new Logger('TestSMSRoute');

  try {
    const searchParams = request.nextUrl.searchParams;
    const testPhone = searchParams.get('phone') || '0794809887';
    const testMessage = searchParams.get('message') || 'Test SMS from your application';

    logger.info('Test SMS request', { testPhone, testMessage });

    const result = await SMSService.sendSMS(testPhone, testMessage);

    return NextResponse.json({
      status: 'success',
      message: 'SMS test completed',
      smsResult: result,
      testPhone,
      testMessage
    });
  } catch (error: any) {
    logger.error('Test SMS failed', { error: error.message });
    return NextResponse.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
}
