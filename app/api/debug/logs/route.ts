// app/api/debug/logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, `${date}.log`);
    
    if (!fs.existsSync(logFile)) {
      return NextResponse.json({
        exists: false,
        message: `Log file for ${date} not found`,
        availableLogs: fs.existsSync(logDir) 
          ? fs.readdirSync(logDir).filter(f => f.endsWith('.log'))
          : []
      });
    }
    
    const logContent = fs.readFileSync(logFile, 'utf-8');
    const logLines = logContent.split('\n').filter(line => line.trim());
    const recentLogs = logLines.slice(-limit);
    
    // Filter for SMSService logs if requested
    const filter = searchParams.get('filter');
    const filteredLogs = filter 
      ? recentLogs.filter(line => line.includes(`[${filter}]`))
      : recentLogs;
    
    return NextResponse.json({
      exists: true,
      date,
      filePath: logFile,
      totalLines: logLines.length,
      showing: filteredLogs.length,
      filter,
      logs: filteredLogs
    });
    
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}