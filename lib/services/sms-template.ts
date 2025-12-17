// lib/services/sms.ts
const BRIQ_API_KEY = "x6Q1CHWNhvwGCQ0wfqVwM8rT_MZ7X8vzFWHk1ZDYnmQ";
const BRIQ_SENDER_ID = "KingAndCode";
const BRIQ_URL = 'https://karibu.briq.tz/v1/message/send-instant';

import { Logger } from '@/lib/logger/logger';

export interface SMSResult {
  success: boolean;
  data?: any;
  error?: string;
  messageId?: string;
  recipient?: string;
}

export interface SMSTemplate {
  id?: number;
  name: string;
  description?: string;
  content: string;
  variables?: string[]; // Array of variable names used in the template
  category?: string;
  isActive?: boolean;
}

export interface TemplateData {
  [key: string]: string | number | Date | undefined | null;
}

export class SMSService {
  private static logger = new Logger('SMSService');

  // ----------------------------------------------------------------------
  // RAW SMS SENDING
  // ----------------------------------------------------------------------
  static async sendSMS(phone: string, message: string): Promise<SMSResult> {
    this.logger.debug('Starting SMS send', {
      phone,
      messageLength: message.length,
      hasCredentials: !!(BRIQ_API_KEY && BRIQ_SENDER_ID)
    });

    if (!BRIQ_API_KEY || !BRIQ_SENDER_ID) {
      this.logger.error('Briq credentials missing', { phone });
      throw new Error('Missing Briq credentials');
    }

    let formattedPhone = phone.startsWith('0') ? '+255' + phone.substring(1) : phone;

    try {
      this.logger.info('Sending SMS', { 
        formattedPhone, 
        messagePreview: message.substring(0, 50) + (message.length > 50 ? '...' : '') 
      });

      const response = await fetch(BRIQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': BRIQ_API_KEY,
        },
        body: JSON.stringify({
          content: message,
          recipients: [formattedPhone],
          sender_id: BRIQ_SENDER_ID,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        this.logger.info('SMS sent successfully', { 
          phone: formattedPhone,
          messageId: result.message_id || result.id
        });
        return { 
          success: true, 
          data: result,
          messageId: result.message_id || result.id,
          recipient: formattedPhone
        };
      } else {
        this.logger.error('SMS failed', { 
          phone: formattedPhone, 
          error: result,
          statusCode: response.status 
        });
        return { 
          success: false, 
          error: result.message || 'Failed to send SMS',
          data: result,
          recipient: formattedPhone
        };
      }
    } catch (error: any) {
      this.logger.error('Network error', { 
        error: error.message,
        phone: formattedPhone 
      });
      return { 
        success: false, 
        error: error.message,
        recipient: formattedPhone
      };
    }
  }

  // ----------------------------------------------------------------------
  // TEMPLATE-BASED SMS SENDING
  // ----------------------------------------------------------------------
  
  /**
   * Send SMS using a template and data
   */
  static async sendTemplateSMS(
    phone: string, 
    template: SMSTemplate | string, 
    data: TemplateData = {}
  ): Promise<SMSResult> {
    try {
      let templateContent: string;
      let templateName: string;

      // If template is a string, use it as content directly
      if (typeof template === 'string') {
        templateContent = template;
        templateName = 'inline-template';
      } else {
        templateContent = template.content;
        templateName = template.name;
      }

      // Render template with data
      const renderedMessage = this.renderTemplate(templateContent, data);

      // Validate required variables if template has variables defined
      if (typeof template !== 'string' && template.variables && template.variables.length > 0) {
        const missingVars = this.validateTemplateVariables(templateContent, data, template.variables);
        if (missingVars.length > 0) {
          this.logger.warn('Missing template variables', {
            template: templateName,
            missingVariables: missingVars,
            phone
          });
          // You might want to throw an error or handle this differently
          // For now, we'll still send the SMS but log the warning
        }
      }

      // Send the rendered message
      const result = await this.sendSMS(phone, renderedMessage);

      // Add template info to result
      if (result.success) {
        this.logger.info('Template SMS sent successfully', {
          template: templateName,
          phone,
          renderedLength: renderedMessage.length
        });
      }

      return {
        ...result,
        data: {
          ...result.data,
          template: templateName,
          renderedMessage,
          originalTemplate: typeof template !== 'string' ? template : undefined
        }
      };

    } catch (error: any) {
      this.logger.error('Error in sendTemplateSMS', {
        error: error.message,
        phone,
        template: typeof template === 'string' ? 'inline' : template.name
      });
      return { 
        success: false, 
        error: `Template SMS error: ${error.message}`,
        recipient: phone
      };
    }
  }

  /**
   * Send SMS using a template name (fetches template from database)
   */
  static async sendSMSByTemplateName(
    phone: string,
    templateName: string,
    data: TemplateData = {},
    category?: string
  ): Promise<SMSResult> {
    try {
      // Fetch template from database
      const template = await this.getTemplateByName(templateName, category);
      
      if (!template) {
        this.logger.error('Template not found', { templateName, category });
        return {
          success: false,
          error: `Template "${templateName}" not found`,
          recipient: phone
        };
      }

      // Send using template
      return await this.sendTemplateSMS(phone, template, data);

    } catch (error: any) {
      this.logger.error('Error in sendSMSByTemplateName', {
        error: error.message,
        phone,
        templateName
      });
      return {
        success: false,
        error: `Template fetch error: ${error.message}`,
        recipient: phone
      };
    }
  }

  // ----------------------------------------------------------------------
  // TEMPLATE RENDERING & VALIDATION
  // ----------------------------------------------------------------------

  /**
   * Render a template string with data
   */
  static renderTemplate(template: string, data: TemplateData): string {
    let rendered = template;

    // Support both {{variable}} and {variable} syntax
    rendered = rendered.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
      return this.getVariableValue(data, variableName);
    });

    rendered = rendered.replace(/\{(\w+)\}/g, (match, variableName) => {
      return this.getVariableValue(data, variableName);
    });

    return rendered;
  }

  /**
   * Get variable value with fallback
   */
  private static getVariableValue(data: TemplateData, variableName: string): string {
    const value = data[variableName];
    
    if (value === undefined || value === null) {
      // Return empty string or you could throw an error
      return '';
    }

    // Format dates if needed
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    return String(value);
  }

  /**
   * Validate that all required variables are present in the data
   */
  static validateTemplateVariables(
    template: string, 
    data: TemplateData, 
    requiredVariables?: string[]
  ): string[] {
    const missing: string[] = [];

    // Extract variables from template if not provided
    const variablesToCheck = requiredVariables || this.extractVariables(template);

    variablesToCheck.forEach(variable => {
      if (data[variable] === undefined || data[variable] === null) {
        missing.push(variable);
      }
    });

    return missing;
  }

  /**
   * Extract all variable names from a template string
   */
  static extractVariables(template: string): string[] {
    const variables: string[] = [];
    const patterns = [
      /\{\{(\w+)\}\}/g,  // {{variable}}
      /\{(\w+)\}/g       // {variable}
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(template)) !== null) {
        if (!variables.includes(match[1])) {
          variables.push(match[1]);
        }
      }
    });

    return variables;
  }

  /**
   * Create a new template object
   */
  static createTemplate(
    name: string, 
    content: string, 
    description?: string, 
    category?: string
  ): SMSTemplate {
    const variables = this.extractVariables(content);
    
    return {
      name,
      content,
      description,
      variables,
      category,
      isActive: true
    };
  }

  // ----------------------------------------------------------------------
  // TEMPLATE DATABASE OPERATIONS
  // ----------------------------------------------------------------------

  /**
   * Get template by name from database
   */
// lib/services/sms.ts
// Update the getTemplateByName method:
private static async getTemplateByName(
  name: string, 
  category?: string
): Promise<SMSTemplate | null> {
  try {
    const { db } = await import('@/lib/db/db');
    const { smsTemplates } = await import('@/lib/drizzle/schema');
    const { eq, and } = await import('drizzle-orm');

    const conditions = [
      eq(smsTemplates.name, name),
      eq(smsTemplates.isActive, true)
    ];

    if (category) {
      conditions.push(eq(smsTemplates.category, category));
    }

    const template = await db.select()
      .from(smsTemplates)
      .where(and(...conditions))
      .then(rows => rows[0]);

    if (!template) return null;

    return {
      id: template.id,
      name: template.name,
      description: template.description || undefined,
      content: template.content, // Changed from template.template to template.content
      variables: template.variables || [],
      category: template.category || undefined,
      isActive: template.isActive
    };
  } catch (error: any) {
    this.logger.error('Error fetching template from database', {
      error: error.message,
      templateName: name
    });
    return null;
  }
}

// Also update the saveTemplate method:
static async saveTemplate(template: SMSTemplate): Promise<{ success: boolean; id?: number; error?: string }> {
  try {
    const { db } = await import('@/lib/db/db');
    const { smsTemplates } = await import('@/lib/drizzle/schema');

    const [saved] = await db.insert(smsTemplates).values({
      name: template.name,
      description: template.description,
      content: template.content, // Changed from template.template to template.content
      variables: template.variables,
      category: template.category,
      isActive: template.isActive ?? true,
    }).returning({ id: smsTemplates.id });

    this.logger.info('Template saved to database', {
      id: saved.id,
      name: template.name
    });

    return { success: true, id: saved.id };
  } catch (error: any) {
    this.logger.error('Error saving template to database', {
      error: error.message,
      templateName: template.name
    });
    return { success: false, error: error.message };
  }
}
  /**
   * Get all templates from database
   */
  static async getAllTemplates(category?: string): Promise<SMSTemplate[]> {
    try {
      const { db } = await import('@/lib/db/db');
      const { smsTemplates } = await import('@/lib/drizzle/schema');
      const { eq, desc } = await import('drizzle-orm');

      const query = db.select()
        .from(smsTemplates)
        .where(category ? eq(smsTemplates.category, category) : undefined)
        .orderBy(desc(smsTemplates.createdAt));

      const templates = await query;

      return templates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description || undefined,
        content: template.content,
        variables: template.variables || [],
        category: template.category || undefined,
        isActive: template.isActive
      }));

    } catch (error: any) {
      this.logger.error('Error fetching templates from database', {
        error: error.message
      });
      return [];
    }
  }

  // ----------------------------------------------------------------------
  // PRE-DEFINED TEMPLATES FOR PURCHASE SYSTEM
  // ----------------------------------------------------------------------

  static getPurchaseTemplates(): SMSTemplate[] {
    return [
      this.createTemplate(
        'PURCHASE_SUBMISSION_ADULT',
        `Hello {{fullName}}!

Your ticket purchase for {{eventDay}} - {{sessionName}} has been submitted successfully.

Ticket Code: {{ticketCode}}
Quantity: {{quantity}} Adult ticket(s)
Total Amount: TZS {{totalAmount}}

Please check your phone and enter your PIN to complete the payment.

Thank you!`,
        'SMS sent when adult ticket purchase is submitted',
        'PURCHASE'
      ),
      this.createTemplate(
        'PURCHASE_SUBMISSION_STUDENT',
        `Hello {{fullName}}!

Your student ticket purchase for {{eventDay}} - {{sessionName}} has been submitted.

Student ID: {{studentId}}
Institution: {{institution}}
Ticket Code: {{ticketCode}}
Amount: TZS {{totalAmount}}

Please check your phone and enter your PIN to complete payment.

Thank you!`,
        'SMS sent when student ticket purchase is submitted',
        'PURCHASE'
      ),
      this.createTemplate(
        'PURCHASE_SUBMISSION_CHILD',
        `Hello {{fullName}}!

Your child ticket purchase for {{eventDay}} - {{sessionName}} has been submitted.

Ticket Code: {{ticketCode}}
Quantity: {{quantity}} Child ticket(s)
Total Amount: TZS {{totalAmount}}

Please check your phone and enter your PIN to complete the payment.

Thank you!`,
        'SMS sent when child ticket purchase is submitted',
        'PURCHASE'
      ),
      this.createTemplate(
        'PAYMENT_VERIFIED',
        `Hello {{fullName}}!

Your payment for ticket {{ticketCode}} has been confirmed.

Transaction ID: {{transactionId}}
Event: {{eventDay}} - {{sessionName}}
Date: {{eventDate}}
Time: {{sessionTime}}

Your ticket is now active. Please keep this SMS as proof of purchase.

Thank you for your purchase!`,
        'SMS sent when payment is verified successfully',
        'VERIFICATION'
      ),
      this.createTemplate(
        'PAYMENT_PENDING_REMINDER',
        `Hello {{fullName}}!

We noticed your payment for ticket {{ticketCode}} is still pending.

Please complete the payment on your phone to secure your ticket for:
{{eventDay}} - {{sessionName}}

If you've already paid, please ignore this message.

Thank you!`,
        'SMS reminder for pending payments',
        'REMINDER'
      ),
      this.createTemplate(
        'PAYMENT_FAILED',
        `Hello {{fullName}},

We were unable to process your payment for ticket {{ticketCode}}.

Reason: {{failureReason}}
Amount: TZS {{totalAmount}}

Please try again or contact support if the issue persists.

Thank you.`,
        'SMS sent when payment fails',
        'PAYMENT'
      )
    ];
  }

  /**
   * Seed default templates to database
   */
  static async seedDefaultTemplates(): Promise<{ success: boolean; seeded: number; errors: string[] }> {
    const errors: string[] = [];
    let seeded = 0;

    const templates = this.getPurchaseTemplates();

    for (const template of templates) {
      try {
        // Check if template already exists
        const existing = await this.getTemplateByName(template.name, template.category);
        
        if (!existing) {
          const result = await this.saveTemplate(template);
          if (result.success) {
            seeded++;
            this.logger.info('Template seeded', { name: template.name });
          } else {
            errors.push(`Failed to seed ${template.name}: ${result.error}`);
          }
        } else {
          this.logger.debug('Template already exists, skipping', { name: template.name });
        }
      } catch (error: any) {
        errors.push(`Error seeding ${template.name}: ${error.message}`);
      }
    }

    return {
      success: errors.length === 0,
      seeded,
      errors
    };
  }

  // ----------------------------------------------------------------------
  // BULK SMS OPERATIONS
  // ----------------------------------------------------------------------

  /**
   * Send SMS to multiple recipients
   */
  static async sendBulkSMS(
    phones: string[], 
    message: string, 
    batchSize: number = 50
  ): Promise<{ results: SMSResult[]; successful: number; failed: number }> {
    const results: SMSResult[] = [];
    const batches = [];

    // Split into batches
    for (let i = 0; i < phones.length; i += batchSize) {
      batches.push(phones.slice(i, i + batchSize));
    }

    // Send each batch
    for (const batch of batches) {
      const batchPromises = batch.map(phone => this.sendSMS(phone, message));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to avoid rate limiting
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    this.logger.info('Bulk SMS operation completed', {
      total: phones.length,
      successful,
      failed,
      batches: batches.length
    });

    return { results, successful, failed };
  }

  /**
   * Send bulk SMS using template
   */
  static async sendBulkTemplateSMS(
    recipients: Array<{ phone: string; data: TemplateData }>,
    template: SMSTemplate | string,
    batchSize: number = 50
  ): Promise<{ results: SMSResult[]; successful: number; failed: number }> {
    const results: SMSResult[] = [];
    const batches = [];

    // Split into batches
    for (let i = 0; i < recipients.length; i += batchSize) {
      batches.push(recipients.slice(i, i + batchSize));
    }

    // Send each batch
    for (const batch of batches) {
      const batchPromises = batch.map(({ phone, data }) => 
        this.sendTemplateSMS(phone, template, data)
      );
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    this.logger.info('Bulk template SMS operation completed', {
      total: recipients.length,
      successful,
      failed,
      batches: batches.length
    });

    return { results, successful, failed };
  }
}

// Export a singleton instance for convenience
export const smsService = SMSService;

// Quick usage examples (commented out for reference)
/*
// Example 1: Send raw SMS
const result1 = await SMSService.sendSMS('255712345678', 'Hello World!');

// Example 2: Send using inline template
const result2 = await SMSService.sendTemplateSMS(
  '255712345678',
  'Hello {{name}}! Your ticket {{ticketCode}} is ready.',
  { name: 'John', ticketCode: 'TK123456' }
);

// Example 3: Send using saved template name
const result3 = await SMSService.sendSMSByTemplateName(
  '255712345678',
  'PURCHASE_SUBMISSION_ADULT',
  {
    fullName: 'John Doe',
    eventDay: 'Day 1',
    sessionName: 'Morning Session',
    ticketCode: 'TK123456',
    quantity: 2,
    totalAmount: '20000'
  }
);

// Example 4: Create and save a new template
const template = SMSService.createTemplate(
  'WELCOME_MESSAGE',
  'Welcome {{name}} to The King and The Code!',
  'Welcome message for new users',
  'WELCOME'
);
await SMSService.saveTemplate(template);

// Example 5: Bulk SMS
const bulkResult = await SMSService.sendBulkSMS(
  ['255712345678', '255765432189'],
  'Event reminder: Your session starts in 1 hour!'
);
*/