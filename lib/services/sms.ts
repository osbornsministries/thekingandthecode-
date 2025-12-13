// lib/services/sms.ts
const BRIQ_API_KEY = "Q19lbjziQvWJ3CGMuKdbePqHvTV3EvBzd2y8T-6dXjE";
const BRIQ_SENDER_ID ="BRIQ";
const BRIQ_URL = 'https://karibu.briq.tz/v1/message/send-instant';

import { Logger } from '@/lib/logger/logger';

export class SMSService {
  private static logger = new Logger('SMSService');

  static async sendSMS(phone: string, message: string) {
    this.logger.debug('Starting SMS send', {
      phone,
      messageLength: message.length,
      hasCredentials: !!(BRIQ_API_KEY && BRIQ_SENDER_ID)
    });

    if (!BRIQ_API_KEY || !BRIQ_SENDER_ID) {
      this.logger.error('Briq credentials missing', { phone });
      throw new Error('Missing Briq credentials');
    }

    let formattedPhone = phone.startsWith('0') ? '255' + phone.substring(1) : phone;

    try {
      this.logger.info('Sending SMS', { formattedPhone, messagePreview: message.substring(0,50) });

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
        this.logger.info('SMS sent successfully', { phone: formattedPhone });
        return { success: true, data: result };
      } else {
        this.logger.error('SMS failed', { phone: formattedPhone, error: result });
        return { success: false, error: result };
      }
    } catch (error: any) {
      this.logger.error('Network error', { error: error.message });
      return { success: false, error: error.message };
    }
  }
}
