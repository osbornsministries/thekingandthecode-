
import 'dotenv/config'; // Load .env variables before anything else

// lib/services/azampay-service.ts
export interface AuthTokenResponse {
  success: boolean;
  data?: {
    accessToken: string;
    expiresIn: number;
    tokenType: string;
  };
  message?: string;
  error?: string;
}

export interface MNOCheckoutResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  externalId?: string;
  transactionId?: string;
}

export interface CheckoutParams {
  accountNumber: string;
  amount: string;
  currency: 'TZS' | 'USD';
  provider: 'Airtel' | 'Tigo' | 'Halopesa' | 'Azampay' | 'Mpesa';
  externalId: string;
  property1?: string;
  property2?: string;
}

export interface AuthPayload {
  appName: string;
  clientId: string;
  clientSecret: string;
}

export class AzamPayService {
  private static readonly AZAMPAY_AUTH_URL = 'https://authenticator.azampay.co.tz/AppRegistration/GenerateToken';
  private static readonly AZAMPAY_BASE_URL = 'https://checkout.azampay.co.tz';

  // Laravel-like Cookie string from PHP
private static readonly DEFAULT_COOKIES = 'TS01ae326f=01b76a8c2498cd7684d0d0f0960315fa989e934798f1ef100a9e6f4126f008056fe2b2b326943d5bdb69dadd448c37e83109eb32d8; f5avraaaaaaaaaaaaaaaa_session_=BAICMOEAELDGCOLMFCJEBBKIGKDFBODCIABOMKILMAGPDJCNPMOFAGJHFPCGLLMEBIBDGIOKELKDLALODIJAMCMCAJHIICOIMDGJNOEJOKICDKFPHPEIFNALMCCIOOHO; TS01bcc26b=01b76a8c24404f196adb5577443f17fdbb5af3039d2b5da4af6448ae120cda50d33851291aac16e002e83787b2f220b307d6073fb3';

  /**
   * Laravel-like initialization
   * Validates environment variables and prepares the service
   */
  public static initialize(): void {
    this.validateEnv();
    console.log('✅ AzamPay Service initialized');
  }

  /**
   * Environment validation - Laravel style
   */
  private static validateEnv(): void {
    const requiredVars = [
      'AZAMPAY_APP_NAME',
      'AZAMPAY_CLIENT_ID',
      'AZAMPAY_CLIENT_SECRET'
    ];

    const missing = requiredVars.filter(key => {
      const value = process.env[key];
      return !value || value.trim() === '';
    });

    if (missing.length > 0) {
      throw new Error(`AzamPay Configuration Error: Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  /**
   * Get authentication token (PHP version clone)
   */
public static async authtoken(): Promise<AuthTokenResponse> {
  try {
    // Validate environment first
    this.validateEnv();

    console.log('🔍 DEBUG: Starting AzamPay authentication...');

    // According to AzamPay docs, the payload should be exactly as specified
    const payload = {
      appName: process.env.AZAMPAY_APP_NAME,
      clientId: process.env.AZAMPAY_CLIENT_ID,
      clientSecret: process.env.AZAMPAY_CLIENT_SECRET
    };

    console.log('📤 Payload prepared:', {
      appName: payload.appName,
      clientId: payload.clientId?.substring(0, 10) + '...',
      secretLength: payload.clientSecret?.length
    });

    // Make the request according to AzamPay documentation
    const response = await fetch('https://authenticator.azampay.co.tz/AppRegistration/GenerateToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('📥 Raw response:', responseText);

    if (!response.ok) {
      console.error('❌ Auth failed. Status:', response.status);
      try {
        const errorData = JSON.parse(responseText);
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`,
          message: 'Authentication failed',
          statusCode: response.status
        };
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          message: 'Authentication failed',
          rawResponse: responseText
        };
      }
    }

    const data = JSON.parse(responseText);
    console.log('✅ Parsed response:', {
      success: data.success,
      message: data.message,
      hasAccessToken: !!(data.data?.accessToken)
    });

    if (data.success && data.data?.accessToken) {
      return {
        success: true,
        data: {
          accessToken: data.data.accessToken,
          expiresIn: data.data.expiresIn || 3600,
          tokenType: data.data.tokenType || 'Bearer'
        },
        message: data.message || 'Token generated successfully'
      };
    }

    return {
      success: false,
      error: data.message || 'Authentication failed',
      message: 'Failed to get access token',
      responseData: data
    };

  } catch (error: any) {
    console.error('💥 Authentication error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Network error during authentication'
    };
  }
}
  /**
   * MNO Checkout - PHP version clone
   */
  public static async mnocheckout(
    accountNumber: string,
    amount: string,
    currency: string = 'TZS',
    provider: string = 'Mpesa'
  ): Promise<MNOCheckoutResponse> {
    try {
      // Initialize and get token
      this.initialize();
      const authResult = await this.authtoken();

      if (!authResult.success || !authResult.data?.accessToken) {
        return {
          success: false,
          error: 'Authentication failed',
          message: authResult.message || 'Could not get authentication token'
        };
      }

      // Generate externalId exactly like PHP's bin2hex(random_bytes(16))
      const externalId = this.generateExternalId();

      // Prepare checkout payload exactly as in PHP
      const checkoutPayload = {
        accountNumber: accountNumber,
        additionalProperties: {
          property1: 878346737777,
          property2: 878346737777
        },
        amount: amount,
        currency: currency,
        externalId: externalId,
        provider: provider
      };

      // Make checkout request
      const checkoutUrl = `${this.AZAMPAY_BASE_URL}/azampay/mno/checkout`;
      const response = await fetch(checkoutUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authResult.data.accessToken}`,
          'Content-Type': 'application/json',
          // Include cookies for consistency
          'Cookie': this.DEFAULT_COOKIES
        },
        body: JSON.stringify(checkoutPayload),
        cache: 'no-store',
        next: { revalidate: 0 }
      });

      const result = await response.json();

      // Laravel-like response handling
      if (response.ok) {
        return {
          success: true,
          data: result,
          externalId: externalId,
          transactionId: result.transactionId || result.data?.transactionId,
          message: result.message || 'Checkout initiated successfully'
        };
      } else {
        return {
          success: false,
          error: result.error || `HTTP ${response.status}`,
          message: result.message || 'Checkout failed',
          externalId: externalId
        };
      }

    } catch (error: any) {
      console.error('AzamPay MNO Checkout Exception:', error);
      return {
        success: false,
        error: error.message,
        message: 'Network error during checkout'
      };
    }
  }

  /**
   * Generate external ID exactly like PHP's vsprintf(bin2hex(random_bytes(16)))
   */
  private static generateExternalId(): string {
    // Generate 16 random bytes (128 bits)
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    
    // Convert to hex string
    const hexString = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Format exactly like PHP's vsprintf pattern: %s%s-%s-%s-%s-%s%s%s
    const pattern = /(.{4})(.{4})-(.{4})-(.{4})-(.{4})-(.{4})(.{4})(.{4})/;
    return hexString.replace(pattern, '$1$2-$3-$4-$5-$6$7$8');
  }

  /**
   * Laravel-like convenience method with object params
   */
  public static async checkout(params: CheckoutParams): Promise<MNOCheckoutResponse> {
    return this.mnocheckout(
      params.accountNumber,
      params.amount,
      params.currency,
      params.provider
    );
  }

  /**
   * Check payment status (additional method not in PHP)
   */
  public static async checkPaymentStatus(externalId: string): Promise<MNOCheckoutResponse> {
    try {
      const authResult = await this.authtoken();
      
      if (!authResult.success || !authResult.data?.accessToken) {
        return {
          success: false,
          error: 'Authentication failed',
          message: 'Could not get authentication token'
        };
      }

      const statusUrl = `${this.AZAMPAY_BASE_URL}/azampay/payment/status/${externalId}`;
      const response = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authResult.data.accessToken}`,
          'Content-Type': 'application/json',
          'Cookie': this.DEFAULT_COOKIES
        },
        cache: 'no-store'
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: result,
          message: result.message || 'Status retrieved successfully'
        };
      } else {
        return {
          success: false,
          error: result.error || `HTTP ${response.status}`,
          message: result.message || 'Failed to get status'
        };
      }

    } catch (error: any) {
      console.error('AzamPay Status Check Exception:', error);
      return {
        success: false,
        error: error.message,
        message: 'Network error during status check'
      };
    }
  }

  /**
   * Debug environment (similar to Laravel's dd())
   */
  public static debugEnv(): Record<string, any> {
    try {
      this.validateEnv();
      return {
        status: '✅ All environment variables are set',
        appName: process.env.AZAMPAY_APP_NAME,
        clientId: `${process.env.AZAMPAY_CLIENT_ID?.substring(0, 8)}...`,
        clientSecretLength: process.env.AZAMPAY_CLIENT_SECRET?.length || 0,
        hasSecret: !!process.env.AZAMPAY_CLIENT_SECRET,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        status: '❌ Configuration Error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Laravel-style response helper
   */
  public static response(data: any, status: number = 200) {
    return {
      success: status >= 200 && status < 300,
      data: data,
      status: status,
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance for easy use
export const azamPayService = new AzamPayService();

// Usage example in an API route:
/*
import { azamPayService } from '@/lib/services/azampay-service';

export async function POST(request: Request) {
  try {
    const { accountNumber, amount, provider } = await request.json();
    
    const result = await azamPayService.mnocheckout(
      accountNumber,
      amount,
      'TZS',
      provider
    );
    
    return Response.json(result, {
      status: result.success ? 200 : 400
    });
  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
*/