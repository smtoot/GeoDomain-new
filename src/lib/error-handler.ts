// Enhanced error handling utilities for better error management and user experience

export interface ErrorInfo {
  code: string;
  message: string;
  details?: string;
  timestamp: string;
  userId?: string;
  requestId?: string;
  stack?: string;
  context?: Record<string, any>;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string;
    requestId?: string;
  };
}

export interface ValidationErrorResponse extends ErrorResponse {
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    details?: string;
    fieldErrors?: Record<string, string[]>;
    requestId?: string;
  };
}

export interface ApiErrorResponse extends ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: string;
    statusCode: number;
    requestId?: string;
  };
}

// Error codes for consistent error handling
export const ERROR_CODES = {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  RESOURCE_UNAVAILABLE: 'RESOURCE_UNAVAILABLE',
  CONFLICT: 'CONFLICT',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  QUERY_ERROR: 'QUERY_ERROR',
  TRANSACTION_ERROR: 'TRANSACTION_ERROR',
  
  // External service errors
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// User-friendly error messages
export const USER_FRIENDLY_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again',
  [ERROR_CODES.INVALID_INPUT]: 'The information you provided is not valid',
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields',
  [ERROR_CODES.INVALID_FORMAT]: 'The format is not correct',
  
  [ERROR_CODES.UNAUTHORIZED]: 'Please log in to continue',
  [ERROR_CODES.FORBIDDEN]: 'You don\'t have permission to perform this action',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Email or password is incorrect',
  [ERROR_CODES.SESSION_EXPIRED]: 'Your session has expired. Please log in again',
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'You need additional permissions for this action',
  
  [ERROR_CODES.NOT_FOUND]: 'The requested resource was not found',
  [ERROR_CODES.ALREADY_EXISTS]: 'This resource already exists',
  [ERROR_CODES.RESOURCE_UNAVAILABLE]: 'The resource is currently unavailable',
  [ERROR_CODES.CONFLICT]: 'There is a conflict with the current state',
  
  [ERROR_CODES.DATABASE_ERROR]: 'We\'re experiencing technical difficulties. Please try again later',
  [ERROR_CODES.CONNECTION_ERROR]: 'Unable to connect to our services. Please check your internet connection',
  [ERROR_CODES.QUERY_ERROR]: 'We encountered an error processing your request',
  [ERROR_CODES.TRANSACTION_ERROR]: 'There was an error processing your transaction',
  
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'We\'re having trouble connecting to external services',
  [ERROR_CODES.API_RATE_LIMIT]: 'Too many requests. Please wait a moment and try again',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'This service is temporarily unavailable',
  
  [ERROR_CODES.INTERNAL_ERROR]: 'Something went wrong on our end. Please try again later',
  [ERROR_CODES.CONFIGURATION_ERROR]: 'We\'re experiencing configuration issues',
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again',
};

// Enhanced error handler class
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: ErrorInfo[] = [];
  private maxLogSize = 1000;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Creates a standardized error response
   */
  static createErrorResponse(
    code: ErrorCode,
    message?: string,
    details?: string,
    requestId?: string
  ): ErrorResponse {
    return {
      success: false,
      error: {
        code,
        message: message || USER_FRIENDLY_MESSAGES[code],
        details,
        requestId,
      },
    };
  }

  /**
   * Creates a validation error response
   */
  static createValidationErrorResponse(
    message: string,
    fieldErrors?: Record<string, string[]>,
    requestId?: string
  ): ValidationErrorResponse {
    return {
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message,
        fieldErrors,
        requestId,
      },
    };
  }

  /**
   * Creates an API error response
   */
  static createApiErrorResponse(
    code: ErrorCode,
    message: string,
    statusCode: number,
    details?: string,
    requestId?: string
  ): ApiErrorResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details,
        statusCode,
        requestId,
      },
    };
  }

  /**
   * Logs an error with context information
   */
  logError(
    error: Error | string,
    context?: {
      code?: ErrorCode;
      userId?: string;
      requestId?: string;
      context?: Record<string, any>;
    }
  ): void {
    const errorInfo: ErrorInfo = {
      code: context?.code || ERROR_CODES.UNKNOWN_ERROR,
      message: typeof error === 'string' ? error : error.message,
      details: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      userId: context?.userId,
      requestId: context?.requestId,
      stack: error instanceof Error ? error.stack : undefined,
      context: context?.context,
    };

    this.errorLog.push(errorInfo);

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      }

    // In production, you might want to send to external logging service
    // this.sendToLoggingService(errorInfo);
  }

  /**
   * Gets recent errors from the log
   */
  getRecentErrors(limit: number = 10): ErrorInfo[] {
    return this.errorLog.slice(-limit);
  }

  /**
   * Gets errors by code
   */
  getErrorsByCode(code: ErrorCode): ErrorInfo[] {
    return this.errorLog.filter(error => error.code === code);
  }

  /**
   * Gets errors for a specific user
   */
  getUserErrors(userId: string): ErrorInfo[] {
    return this.errorLog.filter(error => error.userId === userId);
  }

  /**
   * Clears the error log
   */
  clearLog(): void {
    this.errorLog = [];
  }

  /**
   * Handles and formats errors for API responses
   */
  static handleApiError(
    error: unknown,
    requestId?: string
  ): ApiErrorResponse {
    if (error instanceof Error) {
      // Handle known error types
      if (error.name === 'ValidationError') {
        return this.createApiErrorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          'Validation failed',
          400,
          error.message,
          requestId
        );
      }

      if (error.name === 'UnauthorizedError') {
        return this.createApiErrorResponse(
          ERROR_CODES.UNAUTHORIZED,
          'Authentication required',
          401,
          error.message,
          requestId
        );
      }

      if (error.name === 'ForbiddenError') {
        return this.createApiErrorResponse(
          ERROR_CODES.FORBIDDEN,
          'Access denied',
          403,
          error.message,
          requestId
        );
      }

      if (error.name === 'NotFoundError') {
        return this.createApiErrorResponse(
          ERROR_CODES.NOT_FOUND,
          'Resource not found',
          404,
          error.message,
          requestId
        );
      }

      // Handle database errors
      if (error.message.includes('database') || error.message.includes('connection')) {
        return this.createApiErrorResponse(
          ERROR_CODES.DATABASE_ERROR,
          'Database operation failed',
          500,
          error.message,
          requestId
        );
      }

      // Default error handling
      return this.createApiErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'Internal server error',
        500,
        error.message,
        requestId
      );
    }

    // Handle string errors
    if (typeof error === 'string') {
      return this.createApiErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'Internal server error',
        500,
        error,
        requestId
      );
    }

    // Handle unknown error types
    return this.createApiErrorResponse(
      ERROR_CODES.UNKNOWN_ERROR,
      'An unexpected error occurred',
      500,
      'Unknown error type',
      requestId
    );
  }

  /**
   * Safely executes a function and handles any errors
   */
  static async safeExecute<T>(
    fn: () => Promise<T>,
    errorContext?: {
      code?: ErrorCode;
      userId?: string;
      requestId?: string;
      context?: Record<string, any>;
    }
  ): Promise<{ success: true; data: T } | { success: false; error: ErrorInfo }> {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      const errorInfo: ErrorInfo = {
        code: errorContext?.code || ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        userId: errorContext?.userId,
        requestId: errorContext?.requestId,
        stack: error instanceof Error ? error.stack : undefined,
        context: errorContext?.context,
      };

      // Log the error
      ErrorHandler.getInstance().logError(error, errorContext);

      return { success: false, error: errorInfo };
    }
  }
}

// Utility functions for common error scenarios
export const errorUtils = {
  /**
   * Checks if an error is a validation error
   */
  isValidationError(error: unknown): boolean {
    return error instanceof Error && error.name === 'ValidationError';
  },

  /**
   * Checks if an error is an authentication error
   */
  isAuthError(error: unknown): boolean {
    return error instanceof Error && 
      (error.name === 'UnauthorizedError' || error.name === 'ForbiddenError');
  },

  /**
   * Checks if an error is a database error
   */
  isDatabaseError(error: unknown): boolean {
    return error instanceof Error && 
      (error.message.includes('database') || error.message.includes('connection'));
  },

  /**
   * Extracts user-friendly message from any error
   */
  getUserFriendlyMessage(error: unknown): string {
    if (error instanceof Error) {
      // Check if it's a known error type
      for (const [code, message] of Object.entries(USER_FRIENDLY_MESSAGES)) {
        if (error.message.includes(code) || error.name.includes(code)) {
          return message;
        }
      }
      
      // Return the error message if it's user-friendly
      if (error.message && !error.message.includes('Error:')) {
        return error.message;
      }
    }
    
    return USER_FRIENDLY_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
  },

  /**
   * Formats error for logging
   */
  formatErrorForLog(error: unknown): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}\n${error.stack}`;
    }
    return String(error);
  },
};

// Export the singleton instance
export const errorHandler = ErrorHandler.getInstance();
