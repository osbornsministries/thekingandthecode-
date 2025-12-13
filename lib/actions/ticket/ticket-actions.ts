// lib/actions/ticket-actions.ts
'use server';

// Re-export from purchase-processor
export { 
  processTicketPurchase, 
  checkPaymentStatus, 
  completeCashPayment 
} from './purchase-processor';

// Re-export from ticket-verifier
export { 
  verifyTicket, 
  getVerificationHistory 
} from './ticket-verifier';

// Export types
export type { 
  PurchaseData, 
  ValidationResult 
} from './purchase-processor';

export type { 
  VerificationStep, 
  VerificationResult 
} from './ticket-verifier';