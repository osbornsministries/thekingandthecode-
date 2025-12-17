// app/api/sms/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { smsLogs } from '@/lib/drizzle/schema/sms';
import { eq } from 'drizzle-orm';
import { SMSService } from '@/lib/services/sms';

// Main POST handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, message, template, ticketId, sessionId, variables, isTest } = body;

    // Validation
    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length > 1600) {
      return NextResponse.json(
        { error: 'Message too long. Maximum 1600 characters allowed.' },
        { status: 400 }
      );
    }

    // Create SMS log entry
    const smsLog = await db.insert(smsLogs).values({
      phone: phone,
      message: message,
      templateName: template,
      ticketId: ticketId ? parseInt(ticketId) : undefined,
      sessionId: sessionId ? parseInt(sessionId) : undefined,
      status: 'PENDING',
      isTest: Boolean(isTest),
      sentAt: new Date(),
      variables: variables ? JSON.stringify(variables) : undefined,
    }).$returningId();

    let smsResult;
    
    if (isTest) {
      // For test messages, simulate sending
      console.log(`[TEST SMS] To: ${phone}, Message: ${message.substring(0, 50)}...`);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      smsResult = {
        success: Math.random() > 0.1, // 90% success rate for testing
        data: { messageId: `test_${Date.now()}` },
        error: Math.random() > 0.9 ? 'Test error simulation' : undefined
      };
    } else {
      // REAL SMS SENDING using your existing SMSService
      smsResult = await SMSService.sendSMS(phone, message);
    }

    // Update SMS log with result
    await db.update(smsLogs)
      .set({
        status: smsResult.success ? 'SENT' : 'FAILED',
        messageId: smsResult.data?.messageId || `briq_${Date.now()}`,
        error: smsResult.error ? JSON.stringify(smsResult.error) : null,
        sentAt: new Date(),
      })
      .where(eq(smsLogs.id, smsLog[0].id));

    if (smsResult.success) {
      return NextResponse.json({
        success: true,
        messageId: smsResult.data?.messageId,
        logId: smsLog[0].id,
        message: 'SMS sent successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: smsResult.error || 'Failed to send SMS',
        logId: smsLog[0].id,
        message: 'Failed to send SMS'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('SMS sending error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET handler for checking SMS status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const messageId = searchParams.get('messageId');
    const logId = searchParams.get('logId');

    if (!messageId && !logId) {
      return NextResponse.json(
        { error: 'messageId or logId is required' },
        { status: 400 }
      );
    }

    // Query SMS log
    const queryConditions = [];
    if (messageId) {
      queryConditions.push(eq(smsLogs.messageId, messageId));
    }
    if (logId) {
      queryConditions.push(eq(smsLogs.id, parseInt(logId)));
    }

    const smsLog = await db.select()
      .from(smsLogs)
      .where(queryConditions[0])
      .limit(1)
      .execute();

    if (smsLog.length === 0) {
      return NextResponse.json(
        { error: 'SMS log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: smsLog[0].status,
      sentAt: smsLog[0].sentAt,
      deliveredAt: smsLog[0].deliveredAt,
      error: smsLog[0].error,
      isTest: smsLog[0].isTest
    });

  } catch (error) {
    console.error('Error fetching SMS status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SMS status' },
      { status: 500 }
    );
  }
}

// Optional: Bulk SMS endpoint
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body; // Array of { phone, message, template?, ticketId? }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (messages.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 messages per batch' },
        { status: 400 }
      );
    }

    const results = [];
    const logs = [];

    // Create logs first
    for (const msg of messages) {
      const log = await db.insert(smsLogs).values({
        phone: msg.phone,
        message: msg.message,
        templateName: msg.template,
        ticketId: msg.ticketId,
        status: 'PENDING',
        sentAt: new Date(),
      }).$returningId();
      
      logs.push({ id: log[0].id, data: msg });
    }

    // Send SMS in sequence with delay
    for (const log of logs) {
      try {
        const smsResult = await SMSService.sendSMS(log.data.phone, log.data.message);
        
        // Update log
        await db.update(smsLogs)
          .set({
            status: smsResult.success ? 'SENT' : 'FAILED',
            messageId: smsResult.data?.messageId,
            error: smsResult.error ? JSON.stringify(smsResult.error) : null,
          })
          .where(eq(smsLogs.id, log.id));

        results.push({
          logId: log.id,
          phone: log.data.phone,
          success: smsResult.success,
          error: smsResult.error
        });

        // Rate limiting: 100ms between messages
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error sending SMS to ${log.data.phone}:`, error);
        results.push({
          logId: log.id,
          phone: log.data.phone,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Sent ${successful} messages, ${failed} failed`,
      results,
      summary: {
        total: results.length,
        successful,
        failed
      }
    });

  } catch (error) {
    console.error('Bulk SMS sending error:', error);
    return NextResponse.json(
      { error: 'Failed to send bulk SMS' },
      { status: 500 }
    );
  }
}