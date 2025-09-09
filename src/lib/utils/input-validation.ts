import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Enhanced validation result types
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
  fieldErrors?: Record<string, string[]>;
}

export interface ValidationOptions {
  sanitize?: boolean;
  strict?: boolean;
  allowUnknown?: boolean;
}

// Enhanced base validation schemas with better error messages
export const baseValidationSchemas = {
  // Email validation
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(254, 'Email too long')
    .transform(val => val.toLowerCase().trim()),
  
  // Password validation with detailed requirements
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/^(?=.*\d)/, 'Password must contain at least one number')
    .regex(/^(?=.*[@$!%*?&])/, 'Password must contain at least one special character (@$!%*?&)'),
  
  // Name validation
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s\-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .transform(val => val.trim()),
  
  // Phone validation
  phone: z.string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format')
    .optional()
    .transform(val => val ? val.trim() : undefined),
  
  // URL validation
  url: z.string()
    .url('Invalid URL format')
    .max(2048, 'URL too long')
    .transform(val => val.trim()),
  
  // Domain name validation
  domainName: z.string()
    .min(1, 'Domain name is required')
    .max(253, 'Domain name too long')
    .regex(/^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/, 'Invalid domain format')
    .transform(val => val.toLowerCase().trim()),
  
  // Price validation
  price: z.number()
    .positive('Price must be positive')
    .max(1000000, 'Price too high')
    .min(0.01, 'Price must be at least $0.01'),
  
  // Text content validation with sanitization
  textContent: z.string()
    .max(10000, 'Content too long')
    .transform(val => DOMPurify.sanitize(val.trim())),
  
  // Short text validation
  shortText: z.string()
    .max(500, 'Text too long')
    .transform(val => val.trim()),
  
  // ID validation
  id: z.string()
    .min(1, 'ID is required')
    .max(100, 'ID too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid ID format'),
  
  // Date validation
  date: z.string()
    .datetime('Invalid date format')
    .transform(val => new Date(val)),
  
  // Boolean validation
  boolean: z.boolean()
    .or(z.string().transform(val => val === 'true')),
  
  // Array validation
  array: <T>(schema: z.ZodType<T>) => z.array(schema),
  
  // Optional field
  optional: <T>(schema: z.ZodType<T>) => schema.optional(),
  
  // Required field
  required: <T>(schema: z.ZodType<T>) => schema,
};

// Enhanced domain-specific validation schemas
export const domainValidationSchemas = {
  // Domain creation
  createDomain: z.object({
    name: baseValidationSchemas.domainName,
    price: baseValidationSchemas.price,
    priceType: z.enum(['FIXED', 'NEGOTIABLE', 'MAKE_OFFER']),
    description: baseValidationSchemas.optional(baseValidationSchemas.textContent),
    geographicScope: z.enum(['NATIONAL', 'STATE', 'CITY']),
    state: baseValidationSchemas.optional(baseValidationSchemas.shortText),
    city: baseValidationSchemas.optional(baseValidationSchemas.shortText),
    category: baseValidationSchemas.shortText,
    industry: baseValidationSchemas.shortText,
    logoUrl: baseValidationSchemas.optional(baseValidationSchemas.url),
    images: baseValidationSchemas.optional(z.array(baseValidationSchemas.url)),
    tags: baseValidationSchemas.optional(z.array(baseValidationSchemas.shortText)),
    features: baseValidationSchemas.optional(z.array(baseValidationSchemas.shortText)),
    contactInfo: baseValidationSchemas.optional(z.object({
      email: baseValidationSchemas.email,
      phone: baseValidationSchemas.phone,
      website: baseValidationSchemas.optional(baseValidationSchemas.url),
    })),
  }),

  // Domain update
  updateDomain: z.object({
    name: baseValidationSchemas.optional(baseValidationSchemas.domainName),
    price: baseValidationSchemas.optional(baseValidationSchemas.price),
    priceType: baseValidationSchemas.optional(z.enum(['FIXED', 'NEGOTIABLE', 'MAKE_OFFER'])),
    description: baseValidationSchemas.optional(baseValidationSchemas.textContent),
    geographicScope: baseValidationSchemas.optional(z.enum(['NATIONAL', 'STATE', 'CITY'])),
    state: baseValidationSchemas.optional(baseValidationSchemas.shortText),
    city: baseValidationSchemas.optional(baseValidationSchemas.shortText),
    category: baseValidationSchemas.optional(baseValidationSchemas.shortText),
    industry: baseValidationSchemas.optional(baseValidationSchemas.shortText),
    logoUrl: baseValidationSchemas.optional(baseValidationSchemas.url),
    images: baseValidationSchemas.optional(z.array(baseValidationSchemas.url)),
    tags: baseValidationSchemas.optional(z.array(baseValidationSchemas.shortText)),
    features: baseValidationSchemas.optional(z.array(baseValidationSchemas.shortText)),
    status: baseValidationSchemas.optional(z.enum(['DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'PAUSED'])),
  }),

  // Domain search
  searchDomains: z.object({
    query: baseValidationSchemas.optional(baseValidationSchemas.shortText),
    category: baseValidationSchemas.optional(baseValidationSchemas.shortText),
    industry: baseValidationSchemas.optional(baseValidationSchemas.shortText),
    priceRange: baseValidationSchemas.optional(z.object({
      min: baseValidationSchemas.optional(z.number().min(0)),
      max: baseValidationSchemas.optional(z.number().min(0)),
    })),
    geographicScope: baseValidationSchemas.optional(z.enum(['NATIONAL', 'STATE', 'CITY'])),
    state: baseValidationSchemas.optional(baseValidationSchemas.shortText),
    city: baseValidationSchemas.optional(baseValidationSchemas.shortText),
    status: baseValidationSchemas.optional(z.enum(['VERIFIED', 'PAUSED'])),
    sortBy: baseValidationSchemas.optional(z.enum(['name', 'price', 'createdAt', 'updatedAt'])),
    sortOrder: baseValidationSchemas.optional(z.enum(['asc', 'desc'])),
    page: baseValidationSchemas.optional(z.number().min(1)),
    limit: baseValidationSchemas.optional(z.number().min(1).max(100)),
  }),
};

// Enhanced user validation schemas
export const userValidationSchemas = {
  // User registration
  registerUser: z.object({
    email: baseValidationSchemas.email,
    password: baseValidationSchemas.password,
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
    firstName: baseValidationSchemas.name,
    lastName: baseValidationSchemas.name,
    phone: baseValidationSchemas.phone,
    company: baseValidationSchemas.optional(baseValidationSchemas.shortText),
    website: baseValidationSchemas.optional(baseValidationSchemas.url),
    agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms and conditions'),
    marketingConsent: baseValidationSchemas.optional(z.boolean()),
  }).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),

  // User profile update
  updateProfile: z.object({
    firstName: baseValidationSchemas.optional(baseValidationSchemas.name),
    lastName: baseValidationSchemas.optional(baseValidationSchemas.name),
    phone: baseValidationSchemas.optional(baseValidationSchemas.phone),
    company: baseValidationSchemas.optional(baseValidationSchemas.shortText),
    website: baseValidationSchemas.optional(baseValidationSchemas.url),
    bio: baseValidationSchemas.optional(baseValidationSchemas.textContent),
    avatar: baseValidationSchemas.optional(baseValidationSchemas.url),
    preferences: baseValidationSchemas.optional(z.object({
      emailNotifications: z.boolean().optional(),
      smsNotifications: z.boolean().optional(),
      marketingEmails: z.boolean().optional(),
      language: z.enum(['en', 'es', 'fr', 'de']).optional(),
      timezone: z.string().optional(),
    })),
  }),

  // User login
  loginUser: z.object({
    email: baseValidationSchemas.email,
    password: z.string().min(1, 'Password is required'),
    rememberMe: baseValidationSchemas.optional(z.boolean()),
  }),
};

// Enhanced inquiry validation schemas
export const inquiryValidationSchemas = {
  // Create inquiry
  createInquiry: z.object({
    domainId: baseValidationSchemas.id,
    message: baseValidationSchemas.textContent,
    offerAmount: baseValidationSchemas.optional(baseValidationSchemas.price),
    contactMethod: z.enum(['email', 'phone', 'both']),
    urgency: baseValidationSchemas.optional(z.enum(['low', 'medium', 'high', 'urgent'])),
    additionalInfo: baseValidationSchemas.optional(baseValidationSchemas.textContent),
  }),

  // Update inquiry
  updateInquiry: z.object({
    message: baseValidationSchemas.optional(baseValidationSchemas.textContent),
    offerAmount: baseValidationSchemas.optional(baseValidationSchemas.price),
    status: baseValidationSchemas.optional(z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'COUNTER_OFFER', 'WITHDRAWN'])),
    response: baseValidationSchemas.optional(baseValidationSchemas.textContent),
    urgency: baseValidationSchemas.optional(z.enum(['low', 'medium', 'high', 'urgent'])),
  }),
};

// Enhanced validation utilities
export class ValidationUtils {
  /**
   * Validates data against a schema with enhanced error handling
   */
  static validate<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    options: ValidationOptions = {}
  ): ValidationResult<T> {
    try {
      const result = schema.safeParse(data);
      
      if (result.success) {
        return {
          success: true,
          data: result.data,
        };
             } else {
         const errors = result.error.issues.map(err => err.message);
         const fieldErrors: Record<string, string[]> = {};
         
         result.error.issues.forEach((err: any) => {
           const path = err.path.join('.');
           if (!fieldErrors[path]) {
             fieldErrors[path] = [];
           }
           fieldErrors[path].push(err.message);
         });
        
        return {
          success: false,
          errors,
          fieldErrors,
        };
      }
    } catch (error) {
      console.error('Validation error:', error);
      return {
        success: false,
        errors: ['Validation failed due to an unexpected error'],
      };
    }
  }

  /**
   * Sanitizes input data to prevent XSS attacks
   */
  static sanitizeInput(input: string): string {
    try {
      return DOMPurify.sanitize(input.trim());
    } catch (error) {
      console.warn('Input sanitization failed:', error);
      return input.trim();
    }
  }

  /**
   * Validates and sanitizes multiple fields
   */
  static validateAndSanitize<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    options: ValidationOptions = {}
  ): ValidationResult<T> {
    const result = this.validate(schema, data, options);
    
    if (result.success && result.data && options.sanitize) {
      let sanitizedData: T;
      
      if (typeof result.data === 'string') {
        // Handle primitive string types
        sanitizedData = this.sanitizeInput(result.data) as T;
      } else if (typeof result.data === 'object' && result.data !== null) {
        // Handle object types
        sanitizedData = this.sanitizeObject(result.data as Record<string, any>) as T;
      } else {
        // Handle other primitive types
        sanitizedData = result.data;
      }
      
      return {
        success: true,
        data: sanitizedData,
      };
    }
    
    return result;
  }

  /**
   * Sanitizes all string values in an object
   */
  private static sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized = { ...obj } as T;
    
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        (sanitized as any)[key] = this.sanitizeInput(value);
      } else if (Array.isArray(value)) {
        (sanitized as any)[key] = value.map((item: any) => 
          typeof item === 'string' ? this.sanitizeInput(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        (sanitized as any)[key] = this.sanitizeObject(value);
      }
    }
    
    return sanitized;
  }

  /**
   * Creates a custom validation schema with common patterns
   */
  static createCustomSchema<T>(
    baseSchema: z.ZodSchema<T>,
    customRules: Array<(data: T) => boolean | string>
  ): z.ZodSchema<T> {
    return baseSchema.refine(
      (data: T) => {
        for (const rule of customRules) {
          const result = rule(data);
          if (typeof result === 'string') {
            return false;
          }
        }
        return true;
      },
      {
        message: 'Validation failed',
        params: { customRules: customRules.length }
      }
    );
  }
}

// Export all schemas and utilities
export {
  baseValidationSchemas as baseSchemas,
  domainValidationSchemas as domainSchemas,
  userValidationSchemas as userSchemas,
  inquiryValidationSchemas as inquirySchemas,
};
