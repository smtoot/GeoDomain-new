import { describe, it, expect } from '@jest/globals';
import { 
  ApiError, 
  createTRPCError, 
  logError, 
  createDatabaseError,
  createNotFoundError,
  createValidationError,
  createUnauthorizedError,
  createForbiddenError,
  ErrorCode 
} from '@/lib/errors/api-errors';
import { TRPCError } from '@trpc/server';

describe('API Error Handling', () => {
  describe('ApiError Class', () => {
    it('should create ApiError with correct properties', () => {
      const error = new ApiError('INTERNAL_SERVER_ERROR', 'Test error', undefined, ErrorCode.DATABASE_ERROR);
      
      expect(error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(error.message).toBe('Test error');
      expect(error.customCode).toBe(ErrorCode.DATABASE_ERROR);
      expect(error).toBeInstanceOf(TRPCError);
    });

    it('should create ApiError with cause', () => {
      const cause = new Error('Original error');
      const error = new ApiError('INTERNAL_SERVER_ERROR', 'Test error', cause);
      
      expect(error.cause).toBe(cause);
    });

    it('should have correct error codes', () => {
      expect(ErrorCode.DATABASE_ERROR).toBe('DATABASE_ERROR');
      expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCode.AUTHENTICATION_ERROR).toBe('AUTHENTICATION_ERROR');
      expect(ErrorCode.AUTHORIZATION_ERROR).toBe('AUTHORIZATION_ERROR');
      expect(ErrorCode.NOT_FOUND_ERROR).toBe('NOT_FOUND_ERROR');
      expect(ErrorCode.RATE_LIMIT_ERROR).toBe('RATE_LIMIT_ERROR');
      expect(ErrorCode.EXTERNAL_SERVICE_ERROR).toBe('EXTERNAL_SERVICE_ERROR');
    });
  });

  describe('Error Creation Functions', () => {
    it('should create TRPC error', () => {
      const error = createTRPCError('BAD_REQUEST', 'Invalid input');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.message).toBe('Invalid input');
    });

    it('should create database error', () => {
      const error = createDatabaseError('Database connection failed');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(error.message).toBe('Database connection failed');
      expect(error.customCode).toBe(ErrorCode.DATABASE_ERROR);
    });

    it('should create not found error', () => {
      const error = createNotFoundError('User not found');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('User not found');
      expect(error.customCode).toBe(ErrorCode.NOT_FOUND_ERROR);
    });

    it('should create validation error', () => {
      const error = createValidationError('Invalid email format');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.message).toBe('Invalid email format');
      expect(error.customCode).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it('should create unauthorized error', () => {
      const error = createUnauthorizedError('Authentication required');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe('Authentication required');
      expect(error.customCode).toBe(ErrorCode.AUTHENTICATION_ERROR);
    });

    it('should create forbidden error', () => {
      const error = createForbiddenError('Insufficient permissions');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toBe('Insufficient permissions');
      expect(error.customCode).toBe(ErrorCode.AUTHORIZATION_ERROR);
    });
  });

  describe('Error Logging', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log error with context', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };
      
      logError(error, context);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test error'),
        expect.objectContaining(context)
      );
    });

    it('should log error without context', () => {
      const error = new Error('Test error');
      
      logError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test error'),
        expect.any(Object)
      );
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';
      
      logError(error as any);
      
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Error Serialization', () => {
    it('should serialize error correctly', () => {
      const error = new ApiError('INTERNAL_SERVER_ERROR', 'Test error', undefined, ErrorCode.DATABASE_ERROR);
      
      const serialized = JSON.stringify(error);
      const parsed = JSON.parse(serialized);
      
      expect(parsed.code).toBe('INTERNAL_SERVER_ERROR');
      expect(parsed.message).toBe('Test error');
      expect(parsed.customCode).toBe(ErrorCode.DATABASE_ERROR);
    });

    it('should include cause in serialization', () => {
      const cause = new Error('Original error');
      const error = new ApiError('INTERNAL_SERVER_ERROR', 'Test error', cause);
      
      const serialized = JSON.stringify(error);
      const parsed = JSON.parse(serialized);
      
      expect(parsed.cause).toBeDefined();
    });
  });

  describe('Error Inheritance', () => {
    it('should be instance of TRPCError', () => {
      const error = new ApiError('INTERNAL_SERVER_ERROR', 'Test error');
      
      expect(error).toBeInstanceOf(TRPCError);
      expect(error).toBeInstanceOf(Error);
    });

    it('should maintain TRPCError properties', () => {
      const error = new ApiError('INTERNAL_SERVER_ERROR', 'Test error');
      
      expect(error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('TRPCError');
    });
  });

  describe('Error Stack Traces', () => {
    it('should preserve stack trace', () => {
      const error = new ApiError('INTERNAL_SERVER_ERROR', 'Test error');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ApiError');
    });

    it('should include cause in stack trace', () => {
      const cause = new Error('Original error');
      const error = new ApiError('INTERNAL_SERVER_ERROR', 'Test error', cause);
      
      expect(error.stack).toBeDefined();
      expect(error.cause).toBe(cause);
    });
  });
});
