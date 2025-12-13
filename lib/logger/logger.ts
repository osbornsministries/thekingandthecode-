// lib/logger/logger.ts
// import fs from 'fs';
// import path from 'path'; // path is no longer needed if fs is not used

type LogLevel = 'INFO' | 'ERROR' | 'WARN' | 'DEBUG' | 'REQUEST' | 'RESPONSE' | 'CRITICAL'; // Added CRITICAL

export class Logger {
  private context: string;
  
  constructor(context: string) {
    this.context = context.toUpperCase(); // Ensure context is uppercase for consistency
  }
  
  private writeLog(level: LogLevel, message: string, data?: any) {
    // Only run on server side (important for 'use server' actions)
    if (typeof window !== 'undefined') return;

    const timestamp = new Date().toISOString();
    let dataOutput = '';

    // Determine the best way to log the data/error
    if (data) {
      if (data instanceof Error) {
        dataOutput = `\n| Error Stack: ${data.stack}`;
      } else {
        try {
          // Print JSON data clearly
          dataOutput = `\n| Data: ${JSON.stringify(data, null, 2)}`;
        } catch (e) {
          dataOutput = `\n| Data: [Object - could not serialize]`;
        }
      }
    }

    const logEntry = `[${timestamp}] [${this.context}] ${level}: ${message}${dataOutput}`;

    // Log to console with appropriate method
    const consoleMethod = level === 'ERROR' || level === 'CRITICAL' ? console.error : 
                                level === 'WARN' ? console.warn : 
                                console.log;

    consoleMethod(logEntry);
  }
  
  // Public methods matching standard logging levels
  info(message: string, data?: any) {
    this.writeLog('INFO', message, data);
  }
  
  // Use 'error' for general errors, supporting an Error object
  error(message: string, error?: any) {
    this.writeLog('ERROR', message, error);
  }
  
  // Use 'critical' for unrecoverable errors in the main flow
  critical(message: string, error?: any) {
    this.writeLog('CRITICAL', message, error);
  }
  
  warn(message: string, data?: any) {
    this.writeLog('WARN', message, data);
  }
  
  // Debug only in development
  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      this.writeLog('DEBUG', message, data);
    }
  }
  
  // Specialized methods for external API calls
  request(message: string, data?: any) {
    this.writeLog('REQUEST', message, data);
  }
  
  response(message: string, data?: any) {
    this.writeLog('RESPONSE', message, data);
  }
}