import {
  extractTrpcData,
  extractTrpcDataWithFallback,
  hasTrpcData,
  extractTrpcArray,
  extractTrpcPaginatedData
} from '../../lib/utils/trpc-helpers';

describe('tRPC Helpers', () => {
  describe('extractTrpcData', () => {
    it('should extract data from superjson response', () => {
      const response = { json: { test: 'data' } };
      const result = extractTrpcData(response);
      expect(result).toEqual({ test: 'data' });
    });

    it('should extract data from regular response', () => {
      const response = { test: 'data' };
      const result = extractTrpcData(response);
      expect(result).toEqual({ test: 'data' });
    });

    it('should return null for null response', () => {
      const result = extractTrpcData(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined response', () => {
      const result = extractTrpcData(undefined);
      expect(result).toBeNull();
    });
  });

  describe('extractTrpcDataWithFallback', () => {
    it('should return extracted data when response is valid', () => {
      const response = { json: { test: 'data' } };
      const fallback = { test: 'fallback' };
      const result = extractTrpcDataWithFallback(response, fallback);
      expect(result).toEqual({ test: 'data' });
    });

    it('should return fallback when response is invalid', () => {
      const response = null;
      const fallback = { test: 'fallback' };
      const result = extractTrpcDataWithFallback(response, fallback);
      expect(result).toEqual({ test: 'fallback' });
    });
  });

  describe('hasTrpcData', () => {
    it('should return true for valid response', () => {
      const response = { json: { test: 'data' } };
      expect(hasTrpcData(response)).toBe(true);
    });

    it('should return true for regular response', () => {
      const response = { test: 'data' };
      expect(hasTrpcData(response)).toBe(true);
    });

    it('should return false for null response', () => {
      expect(hasTrpcData(null)).toBe(false);
    });

    it('should return false for undefined response', () => {
      expect(hasTrpcData(undefined)).toBe(false);
    });
  });

  describe('extractTrpcArray', () => {
    it('should extract array from superjson response', () => {
      const response = { json: [{ test: 'data1' }, { test: 'data2' }] };
      const result = extractTrpcArray(response);
      expect(result).toEqual([{ test: 'data1' }, { test: 'data2' }]);
    });

    it('should return empty array for non-array response', () => {
      const response = { json: { test: 'data' } };
      const result = extractTrpcArray(response);
      expect(result).toEqual([]);
    });

    it('should return empty array for null response', () => {
      const result = extractTrpcArray(null);
      expect(result).toEqual([]);
    });
  });

  describe('extractTrpcPaginatedData', () => {
    it('should extract paginated data from superjson response', () => {
      const response = {
        json: {
          items: [{ test: 'data1' }, { test: 'data2' }],
          nextCursor: 'cursor123'
        }
      };
      const result = extractTrpcPaginatedData(response);
      expect(result).toEqual({
        items: [{ test: 'data1' }, { test: 'data2' }],
        nextCursor: 'cursor123'
      });
    });

    it('should return empty items array for invalid response', () => {
      const response = null;
      const result = extractTrpcPaginatedData(response);
      expect(result).toEqual({ items: [] });
    });

    it('should handle response without nextCursor', () => {
      const response = {
        json: {
          items: [{ test: 'data1' }]
        }
      };
      const result = extractTrpcPaginatedData(response);
      expect(result).toEqual({
        items: [{ test: 'data1' }]
      });
    });

    it('should handle non-array items', () => {
      const response = {
        json: {
          items: { test: 'data' },
          nextCursor: 'cursor123'
        }
      };
      const result = extractTrpcPaginatedData(response);
      expect(result).toEqual({
        items: [],
        nextCursor: 'cursor123'
      });
    });
  });
});
