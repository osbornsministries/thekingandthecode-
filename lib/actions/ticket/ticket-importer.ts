// lib/actions/ticket-importer.ts
'use server';

import { db } from '@/lib/db/db';
import { SMSService } from '@/lib/services/sms';
import { Logger } from '@/lib/logger/logger';
import { 
  tickets, transactions, adults, students, children, 
  eventSessions, eventDays, ticketPrices, paymentMethods
} from '@/lib/drizzle/schema';
import { eq, and, sql, like, isNull, or, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------
export interface ImportTicketData {
  dayId: number;
  sessionId: number;
  priceId: number;
  quantity: number;
  paymentMethodId: string;
  fullName: string;
  phone: string;
  totalAmount: number;
  ticketType: 'ADULT' | 'STUDENT' | 'CHILD';
  studentId?: string;
  institution?: string;
  institutionName?: string;
  isPaid?: boolean;
  paymentStatus?: 'PAID' | 'PENDING' | 'FAILED';
  externalId?: string;
  transactionId?: string;
  importedAt?: Date;
  notes?: string;
  rowNumber?: number;
}

export interface ImportResult {
  success: boolean;
  message: string;
  ticketId?: number;
  ticketCode?: string;
  isDuplicate?: boolean;
  originalTicketId?: number;
  originalTicketCode?: string;
  validationResults?: ValidationResult[];
  summary?: any;
}

export interface ValidationResult {
  passed: boolean;
  step: string;
  message: string;
  details?: any;
}

// ----------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------
function generateTicketCode(ticketType: string = 'IMP'): string {
  const prefix = ticketType === 'ADULT' ? 'ADT' : 
                 ticketType === 'STUDENT' ? 'STU' : 
                 ticketType === 'CHILD' ? 'CHD' : 'IMP';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${timestamp}${random}`;
}

// Helper to normalize phone numbers
function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 255
  if (cleaned.startsWith('0')) {
    cleaned = '255' + cleaned.substring(1);
  }
  
  // If 9 digits and doesn't start with 255, add it
  if (cleaned.length === 9 && !cleaned.startsWith('255')) {
    cleaned = '255' + cleaned;
  }
  
  // Ensure it's exactly 12 digits
  if (cleaned.length === 12) {
    return cleaned;
  }
  
  return cleaned || phone; // Return cleaned if possible, otherwise original
}

// Helper to parse amounts with various formats
function parseAmount(amount: string | number): number {
  if (typeof amount === 'number') return amount;
  
  if (!amount || amount.toString().trim() === '') return 0;
  
  // Remove currency symbols, commas, slashes, equals, spaces
  const cleaned = amount
    .toString()
    .replace(/[^\d.-]/g, '') // Keep only numbers, dots, and minus
    .replace(/,/g, '') // Remove commas
    .trim();
  
  return parseFloat(cleaned) || 0;
}

// Helper to map session names to session IDs
async function getSessionIdByName(dayId: number, sessionName: string): Promise<number> {
  if (!sessionName || sessionName.trim() === '') return 1;
  
  const normalizedSession = sessionName.toLowerCase().trim();
  
  try {
    // Try to find session by name for the given day
    const sessions = await db.select()
      .from(eventSessions)
      .where(eq(eventSessions.dayId, dayId));

    // Find session by name match
    for (const session of sessions) {
      if (session.name.toLowerCase().includes(normalizedSession) || 
          normalizedSession.includes(session.name.toLowerCase())) {
        return session.id;
      }
    }
    
    // If not found, get the first session for the day
    if (sessions.length > 0) {
      return sessions[0].id;
    }
    
  } catch (error) {
    console.error('Error getting session ID:', error);
  }
  
  return 1; // Default fallback
}

// Helper to map ticket types to standard format
function normalizeTicketType(ticketType: string): 'ADULT' | 'STUDENT' | 'CHILD' {
  if (!ticketType) return 'ADULT';
  
  const normalized = ticketType.toLowerCase().trim();
  
  if (normalized.includes('student')) return 'STUDENT';
  if (normalized.includes('kid') || normalized.includes('child')) return 'CHILD';
  if (normalized.includes('adult')) return 'ADULT';
  
  // Default mapping
  const typeMap: Record<string, 'ADULT' | 'STUDENT' | 'CHILD'> = {
    'adult': 'ADULT',
    'student': 'STUDENT',
    'kid': 'CHILD',
    'child': 'CHILD',
    'children': 'CHILD'
  };
  
  return typeMap[normalized] || 'ADULT';
}

// Helper to map payment methods
function normalizePaymentMethod(paymentMethod: string): string {
  if (!paymentMethod) return 'CASH';
  
  const normalized = paymentMethod.toLowerCase().trim();
  
  const methodMap: Record<string, string> = {
    'mpesa': 'MPESA',
    'pesa pal': 'PESAPAL',
    'pesapal': 'PESAPAL',
    'cash': 'CASH',
    'bank': 'BANK',
    'airtel': 'AIRTEL',
    'tigo': 'TIGO',
    'halotel': 'HALOTEL'
  };
  
  return methodMap[normalized] || 'CASH';
}

// ----------------------------------------------------------------------
// GET IMPORT HISTORY
// ----------------------------------------------------------------------

export async function getImportHistory(limit: number = 50) {
  const logger = new Logger('import-history');
  
  try {
    // Try query with isImported column first
    let importedTickets;
    
    try {
      importedTickets = await db.select({
        id: tickets.id,
        ticketCode: tickets.ticketCode,
        purchaserName: tickets.purchaserName,
        purchaserPhone: tickets.purchaserPhone,
        ticketType: tickets.ticketType,
        totalAmount: tickets.totalAmount,
        status: tickets.status,
        paymentStatus: tickets.paymentStatus,
        createdAt: tickets.createdAt,
        isImported: tickets.isImported,
        metadata: tickets.metadata
      })
      .from(tickets)
      .where(eq(tickets.isImported, true))
      .orderBy(desc(tickets.createdAt))
      .limit(limit);
      
      logger.info('Retrieved import history using isImported column', { 
        count: importedTickets.length 
      });
      
    } catch (error) {
      console.log('isImported column not found, searching by metadata');
      
      // Fallback: search in metadata for import indicators
      importedTickets = await db.select({
        id: tickets.id,
        ticketCode: tickets.ticketCode,
        purchaserName: tickets.purchaserName,
        purchaserPhone: tickets.purchaserPhone,
        ticketType: tickets.ticketType,
        totalAmount: tickets.totalAmount,
        status: tickets.status,
        paymentStatus: tickets.paymentStatus,
        createdAt: tickets.createdAt,
        metadata: tickets.metadata
      })
      .from(tickets)
      .where(
        or(
          sql`${tickets.metadata} LIKE '%"importSource":"csv"%'`,
          sql`${tickets.metadata} LIKE '%"isImported":true%'`,
          sql`${tickets.metadata} LIKE '%"importNotes":"Imported from CSV%"'`,
          sql`${tickets.metadata} LIKE '%Imported from CSV%'`
        )
      )
      .orderBy(desc(tickets.createdAt))
      .limit(limit);
      
      logger.info('Retrieved import history using metadata search', { 
        count: importedTickets.length 
      });
    }

    // Parse metadata for additional info
    const parsedTickets = importedTickets.map(ticket => {
      let metadata = null;
      let isDuplicate = false;
      let importSource = 'manual';
      let importRow = null;
      let importError = null;
      let validationErrors = null;
      
      try {
        if (ticket.metadata) {
          metadata = JSON.parse(ticket.metadata);
          isDuplicate = metadata?.isDuplicate || false;
          importSource = metadata?.importSource || 'manual';
          importRow = metadata?.importRow;
          importError = metadata?.importError;
          validationErrors = metadata?.validationErrors;
        }
      } catch (e) {
        console.error('Error parsing metadata:', e);
      }
      
      return {
        ...ticket,
        metadata,
        isDuplicate,
        importSource,
        importRow,
        importError,
        validationErrors,
        // Ensure isImported is true for these tickets
        isImported: true
      };
    });

    return {
      success: true,
      tickets: parsedTickets,
      count: parsedTickets.length
    };

  } catch (error: any) {
    logger.error('Error getting import history', error);
    console.error('Import history error:', error);
    
    // Ultimate fallback: return empty array
    return {
      success: true,
      tickets: [],
      count: 0,
      error: error.message
    };
  }
}
// ----------------------------------------------------------------------
// BULK IMPORT ACTION (For CSV imports)
// ----------------------------------------------------------------------
export async function bulkImportTickets(ticketsData: ImportTicketData[]): Promise<{
  success: boolean;
  message: string;
  results: Array<{
    success: boolean;
    data?: ImportTicketData;
    error?: string;
    row?: number;
    validationErrors?: Record<string, string>;
    ticketCode?: string;
    ticketId?: number;
    isDuplicate?: boolean;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    duplicates: number;
    newUsers: number;
    totalAmount: number;
    totalQuantity: number;
  };
}> {
  const logger = new Logger('bulk-import');
  const results: Array<{
    success: boolean;
    data?: ImportTicketData;
    error?: string;
    row?: number;
    validationErrors?: Record<string, string>;
    ticketCode?: string;
    ticketId?: number;
    isDuplicate?: boolean;
  }> = [];
  
  try {
    logger.info('Starting bulk import', { 
      totalTickets: ticketsData.length 
    });

    let successful = 0;
    let failed = 0;
    let duplicates = 0;
    let newUsers = 0;
    let totalAmount = 0;
    let totalQuantity = 0;

    // Process tickets sequentially
    for (let i = 0; i < ticketsData.length; i++) {
      const ticketData = ticketsData[i];
      const rowNumber = i + 1;
      
      logger.info(`Processing ticket ${rowNumber} of ${ticketsData.length}`, {
        rowNumber,
        fullName: ticketData.fullName,
        phone: ticketData.phone
      });

      try {
        // Validate required fields
        const validationErrors: Record<string, string> = {};
        
        if (!ticketData.fullName || ticketData.fullName.trim() === '') {
          validationErrors['fullName'] = 'Full name is required';
        }
        
        if (!ticketData.phone || ticketData.phone.trim() === '') {
          validationErrors['phone'] = 'Phone number is required';
        } else {
          // Validate phone format
          const normalizedPhone = normalizePhoneNumber(ticketData.phone);
          const phoneRegex = /^255\d{9}$/;
          if (!phoneRegex.test(normalizedPhone)) {
            validationErrors['phone'] = `Invalid phone format: ${ticketData.phone}. Use: 255712345678 or 0712345678`;
          } else {
            ticketData.phone = normalizedPhone;
          }
        }
        
        if (!ticketData.ticketType) {
          validationErrors['ticketType'] = 'Ticket type is required';
        }
        
        if (ticketData.totalAmount <= 0) {
          validationErrors['totalAmount'] = 'Total amount must be greater than 0';
        }
        
        if (Object.keys(validationErrors).length > 0) {
          failed++;
          results.push({
            success: false,
            data: ticketData,
            error: 'Validation failed',
            row: rowNumber,
            validationErrors
          });
          continue;
        }

        // Check for duplicates
        let isDuplicate = false;
        let duplicateError = '';
        
        try {
          const existingTicket = await db.select()
            .from(tickets)
            .where(
              and(
                eq(tickets.purchaserPhone, ticketData.phone),
                eq(tickets.purchaserName, ticketData.fullName),
                eq(tickets.ticketType, ticketData.ticketType)
              )
            )
            .limit(1)
            .then(rows => rows[0]);

          if (existingTicket) {
            isDuplicate = true;
            duplicates++;
            duplicateError = `Duplicate ticket found for ${ticketData.fullName} (${ticketData.phone})`;
          }
        } catch (dbError) {
          console.error('Error checking duplicate:', dbError);
        }

        // Get or generate missing fields
        if (!ticketData.sessionId || ticketData.sessionId < 1) {
          ticketData.sessionId = 1;
        }
        
        if (!ticketData.dayId || ticketData.dayId < 1) {
          ticketData.dayId = 1;
        }
        
        if (!ticketData.priceId || ticketData.priceId < 1) {
          ticketData.priceId = 1;
        }
        
        if (!ticketData.paymentMethodId) {
          ticketData.paymentMethodId = 'CASH';
        }
        
        if (!ticketData.quantity || ticketData.quantity < 1) {
          ticketData.quantity = 1;
        }
        
        if (!ticketData.paymentStatus) {
          ticketData.paymentStatus = ticketData.isPaid ? 'PAID' : 'PENDING';
        }

        // Generate ticket code
        const ticketCode = generateTicketCode(ticketData.ticketType);
        const status = ticketData.isPaid ? 'PAID' : 'PENDING';
        
        // Insert ticket
        const [insertResult] = await db.insert(tickets).values({
          ticketCode,
          purchaserName: ticketData.fullName,
          purchaserPhone: ticketData.phone,
          ticketType: ticketData.ticketType,
          totalAmount: ticketData.totalAmount.toString(),
          status,
          paymentStatus: ticketData.paymentStatus,
          paymentMethodId: ticketData.paymentMethodId,
          sessionId: ticketData.sessionId,
          dayId: ticketData.dayId,
          quantity: ticketData.quantity,
          isImported: true,
          metadata: JSON.stringify({
            studentId: ticketData.studentId,
            institution: ticketData.institution,
            institutionName: ticketData.institutionName,
            isPaid: ticketData.isPaid,
            paymentStatus: ticketData.paymentStatus,
            externalId: ticketData.externalId,
            transactionId: ticketData.transactionId,
            importedAt: new Date().toISOString(),
            importNotes: ticketData.notes,
            isDuplicate,
            importSource: 'csv',
            importRow: rowNumber,
            validationErrors: validationErrors
          })
        });

        // Get the inserted ticket ID
        const ticketId = insertResult.insertId;

        // Create transaction if paid
        if (ticketData.isPaid) {
          try {
            await db.insert(transactions).values({
              ticketId: ticketId,
              externalId: ticketData.externalId || `IMP-${Date.now()}-${ticketCode}`,
              reference: ticketCode,
              transId: ticketData.transactionId || `TXN-IMP-${Date.now()}`,
              provider: ticketData.paymentMethodId,
              accountNumber: ticketData.phone,
              amount: ticketData.totalAmount.toString(),
              status: 'SUCCESS',
              currency: 'TZS',
              message: `Imported ${ticketData.isPaid ? 'as paid' : 'as pending'}`,
              metadata: JSON.stringify({
                isImported: true,
                importData: ticketData,
                importTimestamp: new Date().toISOString()
              })
            });
          } catch (txnError) {
            console.error('Error creating transaction:', txnError);
          }
        }

        // Create attendee records
        try {
          const attendeeTable = ticketData.ticketType === 'ADULT' ? adults :
                               ticketData.ticketType === 'STUDENT' ? students :
                               ticketData.ticketType === 'CHILD' ? children : null;

          if (attendeeTable) {
            for (let i = 0; i < ticketData.quantity; i++) {
              const attendeeData: any = {
                ticketId: ticketId,
                fullName: ticketData.quantity > 1 ? 
                  `${ticketData.fullName} ${i + 1}` : 
                  ticketData.fullName,
                phoneNumber: ticketData.phone,
                isImported: true,
                importNotes: ticketData.notes || 'Imported via CSV'
              };

              if (ticketData.ticketType === 'STUDENT') {
                attendeeData.studentId = ticketData.studentId || `STU-${ticketCode.slice(0, 8)}-${i + 1}`;
                attendeeData.institutionType = ticketData.institution || 'UNKNOWN';
                attendeeData.institutionName = ticketData.institutionName || ticketData.institution || 'Unknown';
              }

              if (ticketData.ticketType === 'CHILD') {
                attendeeData.parentName = ticketData.fullName;
              }

              await db.insert(attendeeTable).values(attendeeData);
            }
          }
        } catch (attendeeError) {
          console.error('Error creating attendee records:', attendeeError);
        }

        // Send SMS notification (optional)
       // Send SMS notification (optional) - Updated message format
        if (ticketData.isPaid) {
          try {
            // Get day and session names
            const dayName = `Day ${ticketData.dayId || 1}`;
            const sessionName = ticketData.sessionId === 1 ? 'Night' : 
                              ticketData.sessionId === 2 ? 'Afternoon' :
                              ticketData.sessionId === 3 ? 'Evening' :
                              ticketData.sessionId === 4 ? 'Morning' : 'Session';
            
            const smsMessage = `Hello ${ticketData.fullName}! Your transaction for ${dayName} - ${sessionName} has been successful. Your ticket code is ${ticketCode}. Amount: TZS ${ticketData.totalAmount.toLocaleString()}`;
            
            await SMSService.sendSMS(ticketData.phone, smsMessage);
            
            // Optional: Log SMS sent
            logger.info(`SMS sent to ${ticketData.phone}`, {
              phone: ticketData.phone,
              ticketCode,
              day: dayName,
              session: sessionName
            });
            
          } catch (smsError) {
            console.error('Error sending SMS:', smsError);
            logger.error('Failed to send SMS', { 
              phone: ticketData.phone, 
              error: smsError.message 
            });
          }
        }

        successful++;
        newUsers++;
        totalAmount += ticketData.totalAmount;
        totalQuantity += ticketData.quantity;

        results.push({
          success: true,
          data: ticketData,
          row: rowNumber,
          ticketCode,
          ticketId,
          isDuplicate
        });

        logger.info(`Ticket ${rowNumber} imported successfully`, {
          success: true,
          isDuplicate,
          ticketCode
        });

      } catch (ticketError: any) {
        failed++;
        logger.error(`Error processing ticket ${rowNumber}`, ticketError);
        
        results.push({
          success: false,
          data: ticketData,
          error: `Failed to import ticket: ${ticketError.message}`,
          row: rowNumber,
          validationErrors: {}
        });
      }

      // Small delay between imports
      if (i < ticketsData.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    const summary = {
      total: ticketsData.length,
      successful,
      failed,
      duplicates,
      newUsers,
      totalAmount,
      totalQuantity
    };

    logger.info('Bulk import completed', summary);
    
    // Revalidate the import page
    revalidatePath('/admin/tickets/import-ticket');
    
    return {
      success: failed === 0,
      message: failed === 0 
        ? `All ${successful} tickets imported successfully (${duplicates} duplicates, ${newUsers} new users)`
        : `${successful} tickets imported, ${failed} failed (${duplicates} duplicates, ${newUsers} new users)`,
      results,
      summary
    };

  } catch (error: any) {
    logger.critical('Critical error in bulkImportTickets', error);
    
    return {
      success: false,
      message: `Bulk import failed: ${error.message}`,
      results,
      summary: {
        total: ticketsData.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        duplicates: results.filter(r => r.isDuplicate).length,
        newUsers: results.filter(r => r.success && !r.isDuplicate).length,
        totalAmount: results.reduce((sum, r) => 
          r.success && r.data ? sum + r.data.totalAmount : sum, 0
        ),
        totalQuantity: results.reduce((sum, r) => 
          r.success && r.data ? sum + (r.data.quantity || 1) : sum, 0
        )
      }
    };
  }
}

// ----------------------------------------------------------------------
// SINGLE IMPORT TICKET (Legacy function)
// ----------------------------------------------------------------------
export async function importTicket(importData: ImportTicketData): Promise<ImportResult> {
  const logger = new Logger('single-import');
  
  try {
    // Use bulk import with single item
    const bulkResult = await bulkImportTickets([importData]);
    
    if (bulkResult.results.length > 0) {
      const result = bulkResult.results[0];
      return {
        success: result.success,
        message: result.success ? 'Ticket imported successfully' : result.error || 'Import failed',
        ticketId: result.ticketId,
        ticketCode: result.ticketCode,
        isDuplicate: result.isDuplicate,
        summary: {
          ...importData,
          success: result.success
        }
      };
    }
    
    return {
      success: false,
      message: 'No result returned from import'
    };
    
  } catch (error: any) {
    logger.critical('Error in importTicket', error);
    return {
      success: false,
      message: `Import failed: ${error.message}`
    };
  }
}

// ----------------------------------------------------------------------
// PARSE CSV DATA
// ----------------------------------------------------------------------
export async function parseTicketListCSV(csvData: string): Promise<{
  success: boolean;
  tickets: ImportTicketData[];
  errors: string[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    skippedRows: number;
  };
}> {
  const tickets: ImportTicketData[] = [];
  const errors: string[] = [];
  
  try {
    const lines = csvData.split('\n');
    let totalRows = 0;
    let validRows = 0;
    let invalidRows = 0;
    let skippedRows = 0;

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      totalRows++;
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line || line === '') {
        skippedRows++;
        continue;
      }

      const parts = line.split(',').map(part => part.trim());
      
      // Skip rows without essential data
      if (parts.length < 2 || !parts[1] || parts[1] === '') {
        skippedRows++;
        continue;
      }

      try {
        // Parse data from your CSV format
        const fullName = parts[1] || ''; // FULL NAME column
        const phone = parts[2] || ''; // PHONE column
        const paymentMethodRaw = parts[3] || 'CASH'; // PAYMENT METHOD column
        const dayRaw = parts[4] || '1'; // DAY column
        const sessionRaw = parts[5] || 'Night'; // SESSION column
        const ticketTypeRaw = parts[6] || 'Adult'; // TICKET TYPE column
        const quantityRaw = parts[7] || '1'; // CAPACITY NUMBER column
        const pricePerTicketRaw = parts[8] || '0'; // PRICE PER TICKET column
        const totalRaw = parts[9] || '0'; // TOTAL column
        const statusRaw = parts[10] || 'TAKEN'; // STATUS column

        // Validate required fields
        if (!fullName) {
          errors.push(`Row ${i + 1}: Full name is required`);
          invalidRows++;
          continue;
        }

        if (!phone) {
          errors.push(`Row ${i + 1}: Phone number is required`);
          invalidRows++;
          continue;
        }

        // Normalize data
        const normalizedPhone = normalizePhoneNumber(phone);
        const normalizedTicketType = normalizeTicketType(ticketTypeRaw);
        const normalizedPaymentMethod = normalizePaymentMethod(paymentMethodRaw);
        
        // Parse numbers
        const dayId = parseInt(dayRaw) || 1;
        const quantity = parseInt(quantityRaw) || 1;
        const pricePerTicket = parseAmount(pricePerTicketRaw);
        const totalAmount = parseAmount(totalRaw) || (pricePerTicket * quantity);
        
        // Get session ID
        const sessionId = await getSessionIdByName(dayId, sessionRaw);
        
        // Determine payment status
        const isPaid = statusRaw.toUpperCase() === 'TAKEN';
        const paymentStatus: 'PAID' | 'PENDING' = isPaid ? 'PAID' : 'PENDING';

        // Create ticket data
        const ticketData: ImportTicketData = {
          dayId,
          sessionId,
          priceId: 1, // Default price ID
          quantity,
          paymentMethodId: normalizedPaymentMethod,
          fullName,
          phone: normalizedPhone,
          totalAmount,
          ticketType: normalizedTicketType,
          studentId: normalizedTicketType === 'STUDENT' ? 
            `STU-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}` : 
            undefined,
          institution: normalizedTicketType === 'STUDENT' ? 'UNIVERSITY' : undefined,
          institutionName: normalizedTicketType === 'STUDENT' ? 'University' : undefined,
          isPaid,
          paymentStatus,
          externalId: `CSV-IMP-${Date.now()}-${i}`,
          notes: `Imported from CSV - Row ${i + 1}`,
          rowNumber: i + 1
        };

        tickets.push(ticketData);
        validRows++;
        
      } catch (parseError: any) {
        errors.push(`Row ${i + 1}: ${parseError.message || 'Invalid data format'}`);
        invalidRows++;
      }
    }

    const stats = {
      totalRows,
      validRows,
      invalidRows,
      skippedRows
    };

    console.log('CSV parsing completed', stats);
    
    return {
      success: validRows > 0,
      tickets,
      errors,
      stats
    };

  } catch (error: any) {
    console.error('Error parsing CSV data', error);
    return {
      success: false,
      tickets: [],
      errors: [`CSV parse error: ${error.message}`],
      stats: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        skippedRows: 0
      }
    };
  }
}