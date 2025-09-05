import {
  cn,
  formatDate,
  formatDateOnly,
  formatPrice,
  formatNumber,
  truncateText,
  generateRandomString,
  debounce,
  throttle,
  deepClone,
  isEmpty,
  getNestedValue,
  toTitleCase,
  formatDuration,
} from '@/lib/utils';

describe('Enhanced Utility Functions', () => {
  describe('cn (class name utility)', () => {
    it('should combine class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'active', false && 'hidden')).toBe('base active');
    });

    it('should handle undefined and null values', () => {
      expect(cn('base', undefined, null, 'valid')).toBe('base valid');
    });
  });

  describe('formatDate', () => {
    it('should format date with time correctly', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const result = formatDate(date);
      expect(result).toContain('Dec 25, 2023');
      // Note: Time will be in local timezone, so we just check it contains time
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should handle string dates', () => {
      const result = formatDate('2023-12-25T10:30:00Z');
      expect(result).toContain('Dec 25, 2023');
    });

    it('should handle invalid dates gracefully', () => {
      const result = formatDate('invalid-date');
      expect(result).toBe('Invalid Date');
    });

    it('should accept custom options', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const result = formatDate(date, { month: 'long' });
      expect(result).toContain('December');
    });
  });

  describe('formatDateOnly', () => {
    it('should format date without time', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const result = formatDateOnly(date);
      expect(result).toBe('Dec 25, 2023');
      expect(result).not.toContain('10:30');
    });

    it('should handle string dates', () => {
      const result = formatDateOnly('2023-12-25T10:30:00Z');
      expect(result).toBe('Dec 25, 2023');
    });
  });

  describe('formatPrice', () => {
    it('should format price correctly', () => {
      expect(formatPrice(1234.56)).toBe('$1,234.56');
      expect(formatPrice(100)).toBe('$100');
    });

    it('should handle Prisma Decimal types', () => {
      const decimalPrice = { _value: '1234.56' };
      expect(formatPrice(decimalPrice)).toBe('$1,234.56');
    });

    it('should handle string prices', () => {
      expect(formatPrice('1234.56')).toBe('$1,234.56');
    });

    it('should handle null and undefined', () => {
      expect(formatPrice(null)).toBe('$0');
      expect(formatPrice(undefined)).toBe('$0');
    });

    it('should accept custom currency', () => {
      expect(formatPrice(1234.56, 'EUR')).toBe('€1,234.56');
    });

    it('should handle custom formatting options', () => {
      expect(formatPrice(1234.56, 'USD', { minimumFractionDigits: 0, maximumFractionDigits: 0 })).toBe('$1,235');
    });
  });

  describe('formatNumber', () => {
    it('should format large numbers with units', () => {
      expect(formatNumber(1500)).toBe('1.5K');
      expect(formatNumber(1500000)).toBe('1.5M');
      expect(formatNumber(1500000000)).toBe('1.5B');
    });

    it('should handle small numbers', () => {
      expect(formatNumber(123)).toBe('123.0');
      expect(formatNumber(123.456)).toBe('123.5');
    });

    it('should accept custom decimal places', () => {
      expect(formatNumber(1234.567, 2)).toBe('1.23K');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const longText = 'This is a very long text that needs to be truncated';
      const result = truncateText(longText, 20);
      expect(result).toBe('This is a very lo...');
    });

    it('should not truncate short text', () => {
      const shortText = 'Short text';
      const result = truncateText(shortText, 20);
      expect(result).toBe('Short text');
    });

    it('should use custom suffix', () => {
      const longText = 'Very long text here';
      const result = truncateText(longText, 10, '***');
      expect(result).toBe('Very lo***');
    });
  });

  describe('generateRandomString', () => {
    it('should generate string of specified length', () => {
      const result = generateRandomString(10);
      expect(result).toHaveLength(10);
    });

    it('should use default length of 8', () => {
      const result = generateRandomString();
      expect(result).toHaveLength(8);
    });

    it('should use custom charset', () => {
      const result = generateRandomString(5, 'ABC');
      expect(result).toMatch(/^[ABC]{5}$/);
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      jest.useFakeTimers();
      
      let callCount = 0;
      const debouncedFn = debounce(() => { callCount++; }, 100);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      expect(callCount).toBe(0);
      
      jest.advanceTimersByTime(100);
      await Promise.resolve(); // Wait for async execution
      
      expect(callCount).toBe(1);
      
      jest.useRealTimers();
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      jest.useFakeTimers();
      
      let callCount = 0;
      const throttledFn = throttle(() => { callCount++; }, 100);
      
      throttledFn();
      throttledFn();
      throttledFn();
      
      expect(callCount).toBe(1);
      
      jest.advanceTimersByTime(100);
      await Promise.resolve();
      
      throttledFn();
      expect(callCount).toBe(2);
      
      jest.useRealTimers();
    });
  });

  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('test')).toBe('test');
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
    });

    it('should clone arrays', () => {
      const original = [1, 2, [3, 4]];
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[2]).not.toBe(original[2]);
    });

    it('should clone objects', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });

    it('should clone dates', () => {
      const original = new Date('2023-12-25');
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });
  });

  describe('isEmpty', () => {
    it('should identify empty values', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
    });

    it('should identify non-empty values', () => {
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty([1, 2, 3])).toBe(false);
      expect(isEmpty({ key: 'value' })).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });
  });

  describe('getNestedValue', () => {
    const testObj = {
      user: {
        profile: {
          name: 'John',
          settings: {
            theme: 'dark'
          }
        }
      }
    };

    it('should get nested values using dot notation', () => {
      expect(getNestedValue(testObj, 'user.profile.name')).toBe('John');
      expect(getNestedValue(testObj, 'user.profile.settings.theme')).toBe('dark');
    });

    it('should get nested values using array notation', () => {
      expect(getNestedValue(testObj, ['user', 'profile', 'name'])).toBe('John');
    });

    it('should return default value for non-existent paths', () => {
      expect(getNestedValue(testObj, 'user.profile.age', 'unknown')).toBe('unknown');
    });

    it('should handle invalid paths gracefully', () => {
      expect(getNestedValue(testObj, 'invalid.path', 'default')).toBe('default');
    });
  });

  describe('toTitleCase', () => {
    it('should convert string to title case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
      expect(toTitleCase('JOHN DOE')).toBe('John Doe');
      expect(toTitleCase('mary jane watson')).toBe('Mary Jane Watson');
    });

    it('should handle empty strings', () => {
      expect(toTitleCase('')).toBe('');
      expect(toTitleCase(null as any)).toBe(null);
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds correctly', () => {
      expect(formatDuration(500)).toBe('500ms');
      expect(formatDuration(1500)).toBe('1.5s');
      expect(formatDuration(90000)).toBe('1.5m');
      expect(formatDuration(7200000)).toBe('2.0h');
    });

    it('should handle edge cases', () => {
      expect(formatDuration(0)).toBe('0ms');
      expect(formatDuration(999)).toBe('999ms');
      expect(formatDuration(59999)).toBe('60.0s');
    });
  });
});
