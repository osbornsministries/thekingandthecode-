// utils/ticket-code-generator.ts
/**
 * Generate a 4-digit ticket code
 * Format: XXXX (where X is a digit 0-9)
 */
export function generate4DigitTicketCode(): string {
  // Generate a random 4-digit number
  const random4Digit = Math.floor(1000 + Math.random() * 9000);
  return random4Digit.toString();
}

/**
 * Validate if a ticket code matches the 4-digit format
 */
export function isValid4DigitTicketCode(code: string): boolean {
  return /^\d{4}$/.test(code);
}

/**
 * Extract numeric part from old format and convert to 4 digits
 * Old formats: "ADT-7356045323" or "7356045323"
 */
export function convertTo4DigitFormat(oldCode: string): string {
  if (isValid4DigitTicketCode(oldCode)) {
    return oldCode; // Already 4 digits
  }
  
  // Extract all digits from the old code
  const digits = oldCode.replace(/\D/g, '');
  
  if (digits.length === 0) {
    // If no digits, generate new
    return generate4DigitTicketCode();
  }
  
  // Take last 4 digits (or first 4 if longer)
  let fourDigits = digits;
  if (digits.length > 4) {
    fourDigits = digits.slice(-4);
  } else if (digits.length < 4) {
    // Pad with zeros if less than 4 digits
    fourDigits = digits.padStart(4, '0');
  }
  
  return fourDigits;
}