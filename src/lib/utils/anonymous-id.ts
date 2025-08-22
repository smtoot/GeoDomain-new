/**
 * Utility functions for generating and managing anonymous buyer identifiers
 */

// Generate a random anonymous buyer ID
export function generateAnonymousBuyerId(): string {
  const prefix = 'Buyer';
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${randomPart}`;
}

// Generate a unique anonymous buyer ID (with timestamp for uniqueness)
export function generateUniqueAnonymousBuyerId(): string {
  const prefix = 'Buyer';
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${randomPart}`;
}

// Validate if a string is a valid anonymous buyer ID format
export function isValidAnonymousBuyerId(id: string): boolean {
  const pattern = /^Buyer-[A-Z0-9]+(-[A-Z0-9]+)?$/;
  return pattern.test(id);
}

// Extract the random part from an anonymous buyer ID
export function extractAnonymousIdParts(id: string): { prefix: string; parts: string[] } {
  if (!isValidAnonymousBuyerId(id)) {
    throw new Error('Invalid anonymous buyer ID format');
  }
  
  const parts = id.split('-');
  return {
    prefix: parts[0],
    parts: parts.slice(1)
  };
}
