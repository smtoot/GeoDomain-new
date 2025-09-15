/**
 * tRPC Response Helpers
 * 
 * Utility functions to handle tRPC response data extraction consistently
 * across the application to prevent data structure inconsistencies.
 */

/**
 * Safely extracts data from tRPC response, handling both superjson and regular responses
 * @param response - tRPC response object
 * @returns Extracted data or null if response is invalid
 */
export function extractTrpcData<T>(response: any): T | null {
  if (!response) return null;
  
  // Handle superjson transformed responses
  if (response.json !== undefined) {
    return response.json as T;
  }
  
  // Handle regular responses
  return response as T;
}

/**
 * Safely extracts data from tRPC response with fallback
 * @param response - tRPC response object
 * @param fallback - Fallback value if response is invalid
 * @returns Extracted data or fallback
 */
export function extractTrpcDataWithFallback<T>(response: any, fallback: T): T {
  const data = extractTrpcData<T>(response);
  return data !== null ? data : fallback;
}

/**
 * Type guard to check if tRPC response has data
 * @param response - tRPC response object
 * @returns True if response has valid data
 */
export function hasTrpcData(response: any): boolean {
  return response !== null && response !== undefined;
}

/**
 * Safely extracts array data from tRPC response
 * @param response - tRPC response object
 * @returns Array data or empty array if invalid
 */
export function extractTrpcArray<T>(response: any): T[] {
  const data = extractTrpcData<T[]>(response);
  return Array.isArray(data) ? data : [];
}

/**
 * Safely extracts paginated data from tRPC response
 * @param response - tRPC response object
 * @returns Object with items array and pagination info
 */
export function extractTrpcPaginatedData<T>(response: any): { items: T[]; nextCursor?: string } {
  const data = extractTrpcData<{ items: T[]; nextCursor?: string }>(response);
  
  if (!data || typeof data !== 'object') {
    return { items: [] };
  }
  
  return {
    items: Array.isArray(data.items) ? data.items : [],
    nextCursor: data.nextCursor
  };
}
