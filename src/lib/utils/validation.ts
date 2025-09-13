/**
 * Comprehensive input validation utilities
 * Provides consistent validation across the application
 */

import { z } from 'zod';
import { createValidationError } from './error-handler';

// Common validation schemas
export const commonSchemas = {
  // Basic types
  cuid: z.string().cuid(),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format'),
  
  // Domain validation
  domainName: z.string()
    .min(1, 'Domain name is required')
    .max(253, 'Domain name too long')
    .regex(/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/, 'Invalid domain name format'),
  
  // Geographic validation
  state: z.string().min(2, 'State must be at least 2 characters').max(50, 'State too long'),
  city: z.string().min(1, 'City is required').max(100, 'City name too long'),
  
  // Price validation
  price: z.number().min(0, 'Price must be non-negative').max(1000000, 'Price too high'),
  
  // Text validation
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(5000, 'Description too long'),
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
  
  // Pagination
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit too high').default(20),
  
  // Status enums
  userStatus: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']),
  domainStatus: z.enum(['DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'PAUSED', 'REJECTED', 'DELETED']),
  inquiryStatus: z.enum(['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'FORWARDED', 'COMPLETED']),
  dealStatus: z.enum(['NEGOTIATING', 'AGREED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'TRANSFER_INITIATED', 'COMPLETED', 'DISPUTED']),
  supportTicketStatus: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED']),
  supportTicketPriority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  supportTicketCategory: z.enum(['DOMAIN_INQUIRY', 'TRANSACTION_ISSUE', 'TECHNICAL_SUPPORT', 'ACCOUNT_ISSUE', 'PAYMENT_ISSUE', 'GENERAL_QUESTION']),
  priceType: z.enum(['FIXED', 'NEGOTIABLE', 'MAKE_OFFER']),
  geographicScope: z.enum(['NATIONAL', 'STATE', 'CITY']),
  paymentMethod: z.enum(['ESCROW_COM', 'PAYPAL', 'WIRE_TRANSFER', 'CRYPTO', 'OTHER']),
  userRole: z.enum(['BUYER', 'SELLER', 'ADMIN', 'SUPER_ADMIN']),
};

// Complex validation schemas
export const validationSchemas = {
  // User schemas
  createUser: z.object({
    email: commonSchemas.email,
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    password: commonSchemas.password,
    role: commonSchemas.userRole.default('SELLER'),
    company: z.string().max(100, 'Company name too long').optional(),
    phone: commonSchemas.phone.optional(),
  }),

  updateUser: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
    company: z.string().max(100, 'Company name too long').optional(),
    phone: commonSchemas.phone.optional(),
    status: commonSchemas.userStatus.optional(),
  }),

  // Domain schemas
  createDomain: z.object({
    name: commonSchemas.domainName,
    price: commonSchemas.price,
    priceType: commonSchemas.priceType.default('FIXED'),
    description: commonSchemas.description.optional(),
    geographicScope: commonSchemas.geographicScope.default('STATE'),
    state: commonSchemas.state.optional(),
    city: commonSchemas.city.optional(),
    category: z.string().max(100, 'Category name too long').optional(),
    tags: z.string().max(1000, 'Tags too long').optional(),
  }),

  updateDomain: z.object({
    price: commonSchemas.price.optional(),
    priceType: commonSchemas.priceType.optional(),
    description: commonSchemas.description.optional(),
    geographicScope: commonSchemas.geographicScope.optional(),
    state: commonSchemas.state.optional(),
    city: commonSchemas.city.optional(),
    category: z.string().max(100, 'Category name too long').optional(),
    tags: z.string().max(1000, 'Tags too long').optional(),
    status: commonSchemas.domainStatus.optional(),
  }),

  // Inquiry schemas
  createInquiry: z.object({
    domainId: commonSchemas.cuid,
    buyerName: z.string().min(1, 'Buyer name is required').max(100, 'Name too long'),
    buyerEmail: commonSchemas.email,
    buyerPhone: commonSchemas.phone.optional(),
    buyerCompany: z.string().max(100, 'Company name too long').optional(),
    budgetRange: z.string().min(1, 'Budget range is required').max(50, 'Budget range too long'),
    intendedUse: z.string().min(1, 'Intended use is required').max(500, 'Intended use too long'),
    timeline: z.string().max(100, 'Timeline too long').optional(),
    message: commonSchemas.message,
  }),

  updateInquiry: z.object({
    status: commonSchemas.inquiryStatus.optional(),
    message: commonSchemas.message.optional(),
  }),

  // Deal schemas
  createDeal: z.object({
    inquiryId: commonSchemas.cuid,
    agreedPrice: commonSchemas.price,
    currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
    paymentMethod: commonSchemas.paymentMethod,
    paymentInstructions: z.string().min(1, 'Payment instructions required').max(1000, 'Instructions too long'),
    timeline: z.string().min(1, 'Timeline is required').max(200, 'Timeline too long'),
    terms: z.string().min(1, 'Terms are required').max(2000, 'Terms too long'),
  }),

  updateDeal: z.object({
    status: commonSchemas.dealStatus.optional(),
    agreedPrice: commonSchemas.price.optional(),
    paymentInstructions: z.string().max(1000, 'Instructions too long').optional(),
    timeline: z.string().max(200, 'Timeline too long').optional(),
    terms: z.string().max(2000, 'Terms too long').optional(),
    adminNotes: z.string().max(1000, 'Admin notes too long').optional(),
  }),

  // Support ticket schemas
  createSupportTicket: z.object({
    title: commonSchemas.title,
    description: commonSchemas.description,
    category: commonSchemas.supportTicketCategory,
    priority: commonSchemas.supportTicketPriority.default('MEDIUM'),
    domainId: commonSchemas.cuid.optional(),
    transactionId: commonSchemas.cuid.optional(),
  }),

  updateSupportTicket: z.object({
    status: commonSchemas.supportTicketStatus.optional(),
    priority: commonSchemas.supportTicketPriority.optional(),
    assignedAdminId: commonSchemas.cuid.optional(),
  }),

  // Search and filter schemas
  searchParams: z.object({
    query: z.string().max(200, 'Search query too long').optional(),
    page: commonSchemas.page,
    limit: commonSchemas.limit,
  }),

  domainFilters: z.object({
    search: z.string().max(200, 'Search query too long').optional(),
    category: z.string().max(100, 'Category name too long').optional(),
    state: commonSchemas.state.optional(),
    city: commonSchemas.city.optional(),
    priceMin: commonSchemas.price.optional(),
    priceMax: commonSchemas.price.optional(),
    priceType: commonSchemas.priceType.optional(),
    geographicScope: commonSchemas.geographicScope.optional(),
    status: commonSchemas.domainStatus.optional(),
    isFeatured: z.boolean().optional(),
    page: commonSchemas.page,
    limit: commonSchemas.limit,
  }),

  userFilters: z.object({
    search: z.string().max(200, 'Search query too long').optional(),
    role: commonSchemas.userRole.optional(),
    status: commonSchemas.userStatus.optional(),
    page: commonSchemas.page,
    limit: commonSchemas.limit,
  }),
};

// Validation helper functions
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
  context?: string
): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      const field = firstError.path.join('.');
      const message = firstError.message;
      
      throw createValidationError(field, message);
    }
    
    throw createValidationError('input', `Validation failed${context ? ` in ${context}` : ''}`);
  }
}

export function validateInputSafe<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(input);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
}

// Sanitization helpers
export function sanitizeString(input: string, maxLength: number = 1000): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function sanitizeDomainName(domain: string): string {
  return domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
}

// Custom validators
export const customValidators = {
  // Check if domain name is available
  isDomainAvailable: async (domainName: string): Promise<boolean> => {
    // This would typically check against a database
    // For now, return true as a placeholder
    return true;
  },

  // Check if email is already registered
  isEmailAvailable: async (email: string): Promise<boolean> => {
    // This would typically check against a database
    // For now, return true as a placeholder
    return true;
  },

  // Validate password strength
  isStrongPassword: (password: string): boolean => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  },
};

// Export commonly used schemas
export { z };
