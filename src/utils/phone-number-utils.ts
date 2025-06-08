/**
 * Format a phone number from E.164 format to a more readable format
 * @param phoneNumber - Phone number in E.164 format (e.g., +1234567890)
 * @returns Formatted phone number (e.g., (123) 456-7890)
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove any non-digit characters except the leading +
  const cleaned = phoneNumber.replace(/[^\d+]/g, "");
  
  // Check if it's a US/Canada number (+1)
  if (cleaned.startsWith("+1") && cleaned.length === 12) {
    const areaCode = cleaned.slice(2, 5);
    const firstPart = cleaned.slice(5, 8);
    const secondPart = cleaned.slice(8, 12);
    return `(${areaCode}) ${firstPart}-${secondPart}`;
  }
  
  // For international numbers, just format with spaces
  if (cleaned.startsWith("+")) {
    // Try to format as groups of digits
    const countryCode = cleaned.slice(1, 3);
    const rest = cleaned.slice(3);
    
    if (rest.length >= 6) {
      const parts = [];
      for (let i = 0; i < rest.length; i += 3) {
        parts.push(rest.slice(i, i + 3));
      }
      return `+${countryCode} ${parts.join(" ")}`;
    }
  }
  
  // Return as-is if we can't format it
  return phoneNumber;
};

/**
 * Extract area code from a phone number
 * @param phoneNumber - Phone number in E.164 format
 * @returns Area code or null if not found
 */
export const extractAreaCode = (phoneNumber: string): string | null => {
  const cleaned = phoneNumber.replace(/[^\d+]/g, "");
  
  // For US/Canada numbers
  if (cleaned.startsWith("+1") && cleaned.length === 12) {
    return cleaned.slice(2, 5);
  }
  
  return null;
};

/**
 * Validate if a phone number is in E.164 format
 * @param phoneNumber - Phone number to validate
 * @returns True if valid E.164 format
 */
export const isValidE164 = (phoneNumber: string): boolean => {
  // E.164 format: + followed by 1-15 digits
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
};
