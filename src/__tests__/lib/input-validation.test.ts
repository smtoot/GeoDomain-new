import {
  baseValidationSchemas,
  domainValidationSchemas,
  userValidationSchemas,
  inquiryValidationSchemas,
  ValidationUtils,
  ValidationResult,
} from '@/lib/input-validation';

describe('Enhanced Input Validation', () => {
  describe('Base Validation Schemas', () => {
    describe('email', () => {
      it('should validate valid emails', () => {
        const result = baseValidationSchemas.email.safeParse('test@example.com');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe('test@example.com');
        }
      });

      it('should reject invalid emails', () => {
        const result = baseValidationSchemas.email.safeParse('invalid-email');
        expect(result.success).toBe(false);
      });

      it('should transform email to lowercase', () => {
        const result = baseValidationSchemas.email.safeParse('TEST@EXAMPLE.COM');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe('test@example.com');
        }
      });
    });

    describe('password', () => {
      it('should validate strong passwords', () => {
        const result = baseValidationSchemas.password.safeParse('StrongPass123!');
        expect(result.success).toBe(true);
      });

      it('should reject weak passwords', () => {
        const result = baseValidationSchemas.password.safeParse('weak');
        expect(result.success).toBe(false);
      });

      it('should require uppercase letter', () => {
        const result = baseValidationSchemas.password.safeParse('strongpass123!');
        expect(result.success).toBe(false);
      });

      it('should require lowercase letter', () => {
        const result = baseValidationSchemas.password.safeParse('STRONGPASS123!');
        expect(result.success).toBe(false);
      });

      it('should require number', () => {
        const result = baseValidationSchemas.password.safeParse('StrongPass!');
        expect(result.success).toBe(false);
      });

      it('should require special character', () => {
        const result = baseValidationSchemas.password.safeParse('StrongPass123');
        expect(result.success).toBe(false);
      });
    });

    describe('domainName', () => {
      it('should validate valid domain names', () => {
        const result = baseValidationSchemas.domainName.safeParse('example.com');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe('example.com');
        }
      });

      it('should validate domain names with hyphens', () => {
        const result = baseValidationSchemas.domainName.safeParse('my-example.com');
        expect(result.success).toBe(true);
      });

      it('should reject invalid domain names', () => {
        const result = baseValidationSchemas.domainName.safeParse('invalid domain');
        expect(result.success).toBe(false);
      });

      it('should transform to lowercase', () => {
        const result = baseValidationSchemas.domainName.safeParse('EXAMPLE.COM');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe('example.com');
        }
      });
    });

    describe('price', () => {
      it('should validate valid prices', () => {
        const result = baseValidationSchemas.price.safeParse(100);
        expect(result.success).toBe(true);
      });

      it('should reject negative prices', () => {
        const result = baseValidationSchemas.price.safeParse(-100);
        expect(result.success).toBe(false);
      });

      it('should reject zero prices', () => {
        const result = baseValidationSchemas.price.safeParse(0);
        expect(result.success).toBe(false);
      });

      it('should reject very high prices', () => {
        const result = baseValidationSchemas.price.safeParse(2000000);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Domain Validation Schemas', () => {
    describe('createDomain', () => {
      it('should validate valid domain creation data', () => {
        const validData = {
          name: 'example.com',
          price: 1000,
          priceType: 'FIXED' as const,
          description: 'A great domain',
          geographicScope: 'NATIONAL' as const,
          category: 'Technology',
          industry: 'Software',
        };

        const result = domainValidationSchemas.createDomain.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid domain creation data', () => {
        const invalidData = {
          name: 'invalid domain',
          price: -100,
          priceType: 'INVALID' as any,
        };

        const result = domainValidationSchemas.createDomain.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('searchDomains', () => {
      it('should validate valid search parameters', () => {
        const validData = {
          query: 'example',
          category: 'Technology',
          priceRange: { min: 100, max: 1000 },
          page: 1,
          limit: 20,
        };

        const result = domainValidationSchemas.searchDomains.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should handle optional parameters', () => {
        const minimalData = {};

        const result = domainValidationSchemas.searchDomains.safeParse(minimalData);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('User Validation Schemas', () => {
    describe('registerUser', () => {
      it('should validate valid registration data', () => {
        const validData = {
          email: 'test@example.com',
          password: 'StrongPass123!',
          confirmPassword: 'StrongPass123!',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          agreeToTerms: true,
        };

        const result = userValidationSchemas.registerUser.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject mismatched passwords', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'StrongPass123!',
          confirmPassword: 'DifferentPass123!',
          firstName: 'John',
          lastName: 'Doe',
          agreeToTerms: true,
        };

        const result = userValidationSchemas.registerUser.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject without terms agreement', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'StrongPass123!',
          confirmPassword: 'StrongPass123!',
          firstName: 'John',
          lastName: 'Doe',
          agreeToTerms: false,
        };

        const result = userValidationSchemas.registerUser.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('loginUser', () => {
      it('should validate valid login data', () => {
        const validData = {
          email: 'test@example.com',
          password: 'password123',
        };

        const result = userValidationSchemas.loginUser.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject empty password', () => {
        const invalidData = {
          email: 'test@example.com',
          password: '',
        };

        const result = userValidationSchemas.loginUser.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Inquiry Validation Schemas', () => {
    describe('createInquiry', () => {
      it('should validate valid inquiry data', () => {
        const validData = {
          domainId: 'domain123',
          message: 'I am interested in this domain',
          contactMethod: 'email' as const,
        };

        const result = inquiryValidationSchemas.createInquiry.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should handle optional fields', () => {
        const minimalData = {
          domainId: 'domain123',
          message: 'Interested',
          contactMethod: 'email' as const,
        };

        const result = inquiryValidationSchemas.createInquiry.safeParse(minimalData);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('ValidationUtils', () => {
    describe('validate', () => {
      it('should return success for valid data', () => {
        const schema = baseValidationSchemas.email;
        const data = 'test@example.com';

        const result = ValidationUtils.validate(schema, data);
        expect(result.success).toBe(true);
        expect(result.data).toBe('test@example.com');
      });

      it('should return failure for invalid data', () => {
        const schema = baseValidationSchemas.email;
        const data = 'invalid-email';

        const result = ValidationUtils.validate(schema, data);
        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.fieldErrors).toBeDefined();
      });

      it('should handle validation errors gracefully', () => {
        const schema = baseValidationSchemas.email;
        const data = 'invalid-email';

        const result = ValidationUtils.validate(schema, data);
        expect(result.success).toBe(false);
        expect(result.errors?.length).toBeGreaterThan(0);
      });
    });

    describe('sanitizeInput', () => {
      it('should sanitize HTML content', () => {
        const input = '<script>alert("xss")</script>Hello World';
        const result = ValidationUtils.sanitizeInput(input);
        
        expect(result).not.toContain('<script>');
        expect(result).toContain('Hello World');
      });

      it('should handle empty input', () => {
        const result = ValidationUtils.sanitizeInput('');
        expect(result).toBe('');
      });
    });

    describe('validateAndSanitize', () => {
      it('should validate and sanitize data when option is enabled', () => {
        const schema = baseValidationSchemas.shortText;
        const data = '<script>alert("xss")</script>Valid content';

        const result = ValidationUtils.validateAndSanitize(schema, data, { sanitize: true });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).not.toContain('<script>');
          expect(result.data).toContain('Valid content');
        }
      });

      it('should not sanitize when option is disabled', () => {
        const schema = baseValidationSchemas.shortText;
        const data = '<script>alert("xss")</script>Valid content';

        const result = ValidationUtils.validateAndSanitize(schema, data, { sanitize: false });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toContain('<script>');
        }
      });
    });

    describe('createCustomSchema', () => {
      it('should create schema with custom validation rules', () => {
        const baseSchema = baseValidationSchemas.price;
        const customRules = [
          (data: number) => data % 100 === 0 || 'Price must be divisible by 100',
          (data: number) => data <= 5000 || 'Price must be under $5000',
        ];

        const customSchema = ValidationUtils.createCustomSchema(baseSchema, customRules);

        // Test valid data
        const validResult = customSchema.safeParse(1000);
        expect(validResult.success).toBe(true);

        // Test invalid data (not divisible by 100)
        const invalidResult1 = customSchema.safeParse(150);
        expect(invalidResult1.success).toBe(false);

        // Test invalid data (too high)
        const invalidResult2 = customSchema.safeParse(6000);
        expect(invalidResult2.success).toBe(false);
      });
    });
  });

  describe('Schema Composition', () => {
    it('should compose schemas correctly', () => {
      const composedSchema = baseValidationSchemas.optional(baseValidationSchemas.email);
      
      // Test with valid email
      const result1 = composedSchema.safeParse('test@example.com');
      expect(result1.success).toBe(true);
      
      // Test with undefined (optional)
      const result2 = composedSchema.safeParse(undefined);
      expect(result2.success).toBe(true);
      
      // Test with invalid email
      const result3 = composedSchema.safeParse('invalid-email');
      expect(result3.success).toBe(false);
    });

    it('should handle array schemas', () => {
      const arraySchema = baseValidationSchemas.array(baseValidationSchemas.email);
      
      const validData = ['test1@example.com', 'test2@example.com'];
      const result = arraySchema.safeParse(validData);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).toEqual(['test1@example.com', 'test2@example.com']);
      }
    });
  });

  describe('Error Handling', () => {
    it('should provide detailed error information', () => {
      const schema = domainValidationSchemas.createDomain;
      const invalidData = {
        name: 'invalid domain name',
        price: -100,
        priceType: 'INVALID' as any,
      };

      const result = ValidationUtils.validate(schema, invalidData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.fieldErrors).toBeDefined();
      
      if (!result.success) {
        expect(result.errors!.length).toBeGreaterThan(0);
        expect(Object.keys(result.fieldErrors!).length).toBeGreaterThan(0);
      }
    });

    it('should handle malformed data gracefully', () => {
      const schema = baseValidationSchemas.email;
      const malformedData = null;

      const result = ValidationUtils.validate(schema, malformedData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});
