import { describe, it, expect } from '@jest/globals';
import { sanitization } from '@/lib/security/sanitization';

describe('Input Sanitization', () => {
  describe('HTML Sanitization', () => {
    it('should sanitize HTML content', () => {
      const maliciousHTML = '<script>alert("xss")</script><p>Safe content</p>';
      const sanitized = sanitization.html(maliciousHTML);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Safe content');
    });

    it('should preserve safe HTML tags', () => {
      const safeHTML = '<p>Safe paragraph</p><strong>Bold text</strong>';
      const sanitized = sanitization.html(safeHTML);
      
      expect(sanitized).toContain('<p>');
      expect(sanitized).toContain('<strong>');
      expect(sanitized).toContain('Safe paragraph');
      expect(sanitized).toContain('Bold text');
    });

    it('should remove dangerous attributes', () => {
      const dangerousHTML = '<img src="x" onerror="alert(1)">';
      const sanitized = sanitization.html(dangerousHTML);
      
      expect(sanitized).not.toContain('onerror');
    });
  });

  describe('Text Sanitization', () => {
    it('should remove all HTML tags from text', () => {
      const htmlText = '<p>Hello <strong>world</strong></p>';
      const sanitized = sanitization.text(htmlText);
      
      expect(sanitized).not.toContain('<p>');
      expect(sanitized).not.toContain('<strong>');
      expect(sanitized).toContain('Hello world');
    });

    it('should handle empty strings', () => {
      const sanitized = sanitization.text('');
      expect(sanitized).toBe('');
    });

    it('should handle null and undefined', () => {
      expect(() => sanitization.text(null as any)).not.toThrow();
      expect(() => sanitization.text(undefined as any)).not.toThrow();
    });
  });

  describe('Search Query Sanitization', () => {
    it('should sanitize search queries', () => {
      const maliciousQuery = '<script>alert("xss")</script>search term';
      const sanitized = sanitization.searchQuery(maliciousQuery);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('search term');
    });

    it('should preserve normal search terms', () => {
      const normalQuery = 'domain name search';
      const sanitized = sanitization.searchQuery(normalQuery);
      
      expect(sanitized).toBe(normalQuery);
    });

    it('should handle special characters in search', () => {
      const specialQuery = 'domain-name_search@example.com';
      const sanitized = sanitization.searchQuery(specialQuery);
      
      expect(sanitized).toContain('domain-name_search');
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize string inputs', () => {
      const maliciousString = '<script>alert("xss")</script>Hello';
      const sanitized = sanitization.input(maliciousString);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Hello');
    });

    it('should sanitize object inputs recursively', () => {
      const maliciousObject = {
        name: '<script>alert("xss")</script>John',
        email: 'john@example.com',
        nested: {
          description: '<img src="x" onerror="alert(1)">Safe description'
        }
      };
      
      const sanitized = sanitization.input(maliciousObject);
      
      expect(sanitized.name).not.toContain('<script>');
      expect(sanitized.name).toContain('John');
      expect(sanitized.email).toBe('john@example.com');
      expect(sanitized.nested.description).not.toContain('onerror');
      expect(sanitized.nested.description).toContain('Safe description');
    });

    it('should handle arrays', () => {
      const maliciousArray = [
        '<script>alert("xss")</script>Item 1',
        'Safe item 2',
        { name: '<img src="x" onerror="alert(1)">Item 3' }
      ];
      
      const sanitized = sanitization.input(maliciousArray);
      
      expect(sanitized[0]).not.toContain('<script>');
      expect(sanitized[0]).toContain('Item 1');
      expect(sanitized[1]).toBe('Safe item 2');
      expect(sanitized[2].name).not.toContain('onerror');
      expect(sanitized[2].name).toContain('Item 3');
    });

    it('should handle non-string, non-object inputs', () => {
      expect(sanitization.input(123)).toBe(123);
      expect(sanitization.input(true)).toBe(true);
      expect(sanitization.input(null)).toBe(null);
      expect(sanitization.input(undefined)).toBe(undefined);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000) + '<script>alert("xss")</script>';
      const sanitized = sanitization.input(longString);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized.length).toBeGreaterThan(10000);
    });

    it('should handle deeply nested objects', () => {
      const deepObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: '<script>alert("xss")</script>Deep value'
              }
            }
          }
        }
      };
      
      const sanitized = sanitization.input(deepObject);
      
      expect(sanitized.level1.level2.level3.level4.value).not.toContain('<script>');
      expect(sanitized.level1.level2.level3.level4.value).toContain('Deep value');
    });

    it('should handle circular references gracefully', () => {
      const circularObject: any = { name: 'Test' };
      circularObject.self = circularObject;
      
      expect(() => sanitization.input(circularObject)).not.toThrow();
    });
  });
});
