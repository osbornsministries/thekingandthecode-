// lib/logger/logger.ts
import fs from 'fs';
import path from 'path';

type LogLevel = 'INFO' | 'ERROR' | 'WARN' | 'DEBUG' | 'REQUEST' | 'RESPONSE';

export class Logger {
  private context: string;
  
  constructor(context: string) {
    this.context = context;
  }
  
  private writeLog(level: LogLevel, message: string, data?: any) {
    // Only run on server side
    if (typeof window !== 'undefined') return;

    try {
      const logDir = path.join(process.cwd(), 'logs');
      
      // Ensure logs directory exists
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // Create filename based on date (e.g., 2025-12-19.log)
      const dateStr = new Date().toISOString().split('T')[0];
      const filePath = path.join(logDir, `${dateStr}.log`);

      // Format the log entry
      const timestamp = new Date().toISOString();
      const dataString = data ? ` | Data: ${JSON.stringify(data, null, 2)}` : '';
      const logEntry = `[${timestamp}] [${level}] [${this.context}] ${message}${dataString}\n`;

      // Append to file
      fs.appendFileSync(filePath, logEntry);
      
      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        const consoleMethod = level === 'ERROR' ? console.error : 
                              level === 'WARN' ? console.warn : 
                              console.log;
        consoleMethod(`[${this.context}] ${level}: ${message}`, data || '');
      }
      
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
  
  info(message: string, data?: any) {
    this.writeLog('INFO', message, data);
  }
  
  error(message: string, error?: any) {
    this.writeLog('ERROR', message, error);
  }
  
  warn(message: string, data?: any) {
    this.writeLog('WARN', message, data);
  }
  
  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      this.writeLog('DEBUG', message, data);
    }
  }
  
  request(message: string, data?: any) {
    this.writeLog('REQUEST', message, data);
  }
  
  response(message: string, data?: any) {
    this.writeLog('RESPONSE', message, data);
  }
}