import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Enhanced utility functions with better type safety and error handling

/**
 * Combines class names with Tailwind CSS class merging
 * @param inputs - Class values to combine
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date with time
 * @param date - Date to format
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number, 
  options: Intl.DateTimeFormatOptions = {}
): string {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date');
    }
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    };
    
    return d.toLocaleDateString('en-US', defaultOptions);
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Formats a date without time
 * @param date - Date to format
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatDateOnly(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {}
): string {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date');
    }
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    };
    
    return d.toLocaleDateString('en-US', defaultOptions);
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Formats a price with currency
 * @param price - Price to format
 * @param currency - Currency code
 * @param options - Formatting options
 * @returns Formatted price string
 */
export function formatPrice(
  price: number | string | { _value?: string } | null | undefined,
  currency: string = 'USD',
  options: Intl.NumberFormatOptions = {}
): string {
  try {
    // Handle Prisma Decimal type and other price formats
    let numericPrice: number;
    
    if (typeof price === 'number') {
      numericPrice = price;
    } else if (typeof price === 'string') {
      numericPrice = parseFloat(price);
    } else if (price && typeof price === 'object' && '_value' in price) {
      numericPrice = parseFloat(price._value || '0');
    } else if (price === null || price === undefined) {
      numericPrice = 0;
    } else {
      numericPrice = Number(price);
    }
    
    if (isNaN(numericPrice)) {
      throw new Error('Invalid price value');
    }
    
    const defaultOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options,
    };
    
    return new Intl.NumberFormat('en-US', defaultOptions).format(numericPrice);
  } catch (error) {
    return `$${0}`;
  }
}

/**
 * Formats a number with appropriate units (K, M, B)
 * @param num - Number to format
 * @param decimals - Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(num: number, decimals: number = 1): string {
  try {
    if (isNaN(num)) {
      throw new Error('Invalid number');
    }
    
    if (num >= 1e9) {
      return (num / 1e9).toFixed(decimals) + 'B';
    } else if (num >= 1e6) {
      return (num / 1e6).toFixed(decimals) + 'M';
    } else if (num >= 1e3) {
      return (num / 1e3).toFixed(decimals) + 'K';
    } else {
      return num.toFixed(decimals);
    }
  } catch (error) {
    return '0';
  }
}

/**
 * Truncates text to a specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add when truncated
 * @returns Truncated text
 */
export function truncateText(
  text: string, 
  maxLength: number, 
  suffix: string = '...'
): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Generates a random string of specified length
 * @param length - Length of the string
 * @param charset - Character set to use
 * @returns Random string
 */
export function generateRandomString(
  length: number = 8,
  charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

/**
 * Debounces a function call
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttles a function call
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Deep clones an object
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  
  return obj;
}

/**
 * Checks if a value is empty (null, undefined, empty string, empty array, empty object)
 * @param value - Value to check
 * @returns True if empty
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  
  return false;
}

/**
 * Safely gets a nested property value
 * @param obj - Object to search
 * @param path - Property path (dot notation or array)
 * @param defaultValue - Default value if property not found
 * @returns Property value or default
 */
export function getNestedValue<T = any>(
  obj: any,
  path: string | string[],
  defaultValue?: T
): T | undefined {
  try {
    const keys = Array.isArray(path) ? path : path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Converts a string to title case
 * @param str - String to convert
 * @returns Title case string
 */
export function toTitleCase(str: string): string {
  if (!str) return str;
  
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

/**
 * Formats a duration in milliseconds to human readable format
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}
