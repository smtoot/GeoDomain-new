/**
 * Contact Information Detection
 * 
 * Simple, non-blocking detection of contact information in messages
 * Used for flagging messages for admin review
 */

export interface ContactInfoDetection {
  hasContactInfo: boolean;
  detectedTypes: string[];
  warnings: string[];
}

/**
 * Detect contact information in message content
 * Returns detection results without blocking the message
 */
export const detectContactInfo = (message: string): ContactInfoDetection => {
  const detectedTypes: string[] = [];
  const warnings: string[] = [];
  
  // Email detection
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = message.match(emailRegex);
  if (emails && emails.length > 0) {
    detectedTypes.push('email');
    warnings.push(`Email address detected: ${emails[0]}`);
  }
  
  // Phone number detection (US format)
  const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
  const phones = message.match(phoneRegex);
  if (phones && phones.length > 0) {
    detectedTypes.push('phone');
    warnings.push(`Phone number detected: ${phones[0]}`);
  }
  
  // URL detection
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = message.match(urlRegex);
  if (urls && urls.length > 0) {
    detectedTypes.push('url');
    warnings.push(`URL detected: ${urls[0]}`);
  }
  
  // Social media handles
  const socialRegex = /@[a-zA-Z0-9_]+/g;
  const socialHandles = message.match(socialRegex);
  if (socialHandles && socialHandles.length > 0) {
    detectedTypes.push('social');
    warnings.push(`Social media handle detected: ${socialHandles[0]}`);
  }
  
  return {
    hasContactInfo: detectedTypes.length > 0,
    detectedTypes,
    warnings
  };
};

/**
 * Get flagged reason based on detected contact info types
 */
export const getFlaggedReason = (detectedTypes: string[]): string => {
  if (detectedTypes.includes('email')) {
    return 'Email address detected';
  }
  if (detectedTypes.includes('phone')) {
    return 'Phone number detected';
  }
  if (detectedTypes.includes('url')) {
    return 'URL detected';
  }
  if (detectedTypes.includes('social')) {
    return 'Social media handle detected';
  }
  return 'Contact information detected';
};

/**
 * Check if message should be flagged for admin review
 */
export const shouldFlagMessage = (message: string): boolean => {
  const detection = detectContactInfo(message);
  return detection.hasContactInfo;
};
