import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

// Create a DOM environment for server-side DOMPurify
const window = new JSDOM("").window;
const purify = DOMPurify(window as any);

// Sanitization configuration
const sanitizeConfig = {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
};

// Strict sanitization for user input
const strictSanitizeConfig = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
};

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (input: string): string => {
  if (typeof input !== "string") return "";
  return purify.sanitize(input, sanitizeConfig);
};

/**
 * Strictly sanitize input by removing all HTML tags
 */
export const sanitizeStrict = (input: string): string => {
  if (typeof input !== "string") return "";
  return purify.sanitize(input, strictSanitizeConfig);
};

/**
 * Sanitize user input for database storage
 */
export const sanitizeInput = (input: any): any => {
  if (typeof input === "string") {
    return sanitizeStrict(input.trim());
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
};

/**
 * Validate and sanitize email addresses
 */
export const sanitizeEmail = (email: string): string => {
  if (typeof email !== "string") return "";
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = sanitizeStrict(email.toLowerCase().trim());
  
  if (!emailRegex.test(sanitized)) {
    throw new Error("Invalid email format");
  }
  
  return sanitized;
};

/**
 * Validate and sanitize domain names
 */
export const sanitizeDomain = (domain: string): string => {
  if (typeof domain !== "string") return "";
  
  // Domain validation regex
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  const sanitized = sanitizeStrict(domain.toLowerCase().trim());
  
  if (!domainRegex.test(sanitized)) {
    throw new Error("Invalid domain format");
  }
  
  return sanitized;
};

/**
 * Sanitize file names to prevent path traversal attacks
 */
export const sanitizeFileName = (fileName: string): string => {
  if (typeof fileName !== "string") return "";
  
  // Remove path traversal attempts and dangerous characters
  const sanitized = sanitizeStrict(fileName)
    .replace(/\.\./g, "") // Remove path traversal
    .replace(/[\/\\]/g, "_") // Replace path separators
    .replace(/[<>:"|?*]/g, "_") // Replace invalid characters
    .trim();
  
  if (!sanitized || sanitized.length === 0) {
    throw new Error("Invalid file name");
  }
  
  return sanitized;
};

/**
 * Sanitize search queries
 */
export const sanitizeSearchQuery = (query: string): string => {
  if (typeof query !== "string") return "";
  
  // Remove SQL injection attempts and dangerous characters
  const sanitized = sanitizeStrict(query)
    .replace(/['";\\]/g, "") // Remove SQL injection characters
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
  
  if (sanitized.length > 100) {
    throw new Error("Search query too long");
  }
  
  return sanitized;
};

/**
 * Sanitize phone numbers
 */
export const sanitizePhone = (phone: string): string => {
  if (typeof phone !== "string") return "";
  
  // Remove all non-digit characters except + at the beginning
  const sanitized = phone.replace(/[^\d+]/g, "");
  
  if (!sanitized.match(/^\+?[\d]{10,15}$/)) {
    throw new Error("Invalid phone number format");
  }
  
  return sanitized;
};

/**
 * Sanitize URLs
 */
export const sanitizeUrl = (url: string): string => {
  if (typeof url !== "string") return "";
  
  try {
    const sanitized = sanitizeStrict(url.trim());
    const parsedUrl = new URL(sanitized);
    
    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Invalid URL protocol");
    }
    
    return parsedUrl.toString();
  } catch {
    throw new Error("Invalid URL format");
  }
};

/**
 * Sanitize JSON input
 */
export const sanitizeJson = (input: any): any => {
  try {
    const jsonString = typeof input === "string" ? input : JSON.stringify(input);
    const parsed = JSON.parse(jsonString);
    return sanitizeInput(parsed);
  } catch {
    throw new Error("Invalid JSON format");
  }
};

/**
 * Sanitize user input for display (allows some HTML)
 */
export const sanitizeForDisplay = (input: string): string => {
  if (typeof input !== "string") return "";
  return sanitizeHtml(input);
};

/**
 * Sanitize user input for storage (removes all HTML)
 */
export const sanitizeForStorage = (input: string): string => {
  if (typeof input !== "string") return "";
  return sanitizeStrict(input);
};

// Export all sanitization functions
export const sanitization = {
  html: sanitizeHtml,
  strict: sanitizeStrict,
  input: sanitizeInput,
  email: sanitizeEmail,
  domain: sanitizeDomain,
  fileName: sanitizeFileName,
  searchQuery: sanitizeSearchQuery,
  phone: sanitizePhone,
  url: sanitizeUrl,
  json: sanitizeJson,
  forDisplay: sanitizeForDisplay,
  forStorage: sanitizeForStorage,
};
