import { TRPCError } from "@trpc/server";

// Error codes enum
export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  
  // Validation errors
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  
  // Rate limiting errors
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  
  // Resource errors
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  CONFLICT = "CONFLICT",
  
  // Database errors
  DATABASE_ERROR = "DATABASE_ERROR",
  TRANSACTION_FAILED = "TRANSACTION_FAILED",
  
  // External service errors
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  PAYMENT_ERROR = "PAYMENT_ERROR",
  
  // System errors
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

// Error response interface
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

// Custom API Error class
export class APIError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly requestId?: string;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: any,
    requestId?: string
  ) {
    super(message);
    this.name = "APIError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.requestId = requestId;
  }
}

// Create standardized error response
export const createErrorResponse = (
  error: APIError | Error,
  requestId?: string
): ErrorResponse => {
  if (error instanceof APIError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
        requestId: requestId || error.requestId,
      },
    };
  }

  // Handle generic errors
  return {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "An unexpected error occurred",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
};

// Create TRPC error from API error
export const createTRPCError = (error: APIError): TRPCError => {
  const trpcErrorMap: Record<string, TRPCError["code"]> = {
    [ErrorCode.UNAUTHORIZED]: "UNAUTHORIZED",
    [ErrorCode.FORBIDDEN]: "FORBIDDEN",
    [ErrorCode.VALIDATION_ERROR]: "BAD_REQUEST",
    [ErrorCode.INVALID_INPUT]: "BAD_REQUEST",
    [ErrorCode.MISSING_REQUIRED_FIELD]: "BAD_REQUEST",
    [ErrorCode.RATE_LIMIT_EXCEEDED]: "TOO_MANY_REQUESTS",
    [ErrorCode.NOT_FOUND]: "NOT_FOUND",
    [ErrorCode.ALREADY_EXISTS]: "CONFLICT",
    [ErrorCode.CONFLICT]: "CONFLICT",
    [ErrorCode.DATABASE_ERROR]: "INTERNAL_SERVER_ERROR",
    [ErrorCode.TRANSACTION_FAILED]: "INTERNAL_SERVER_ERROR",
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: "INTERNAL_SERVER_ERROR",
    [ErrorCode.PAYMENT_ERROR]: "INTERNAL_SERVER_ERROR",
    [ErrorCode.INTERNAL_SERVER_ERROR]: "INTERNAL_SERVER_ERROR",
    [ErrorCode.SERVICE_UNAVAILABLE]: "INTERNAL_SERVER_ERROR",
  };

  const trpcCode = trpcErrorMap[error.code] || "INTERNAL_SERVER_ERROR";

  return new TRPCError({
    code: trpcCode,
    message: error.message,
    cause: error,
  });
};

// Predefined error creators
export const createUnauthorizedError = (message: string = "Unauthorized"): APIError =>
  new APIError(ErrorCode.UNAUTHORIZED, message, 401);

export const createForbiddenError = (message: string = "Forbidden"): APIError =>
  new APIError(ErrorCode.FORBIDDEN, message, 403);

export const createNotFoundError = (message: string = "Resource not found"): APIError =>
  new APIError(ErrorCode.NOT_FOUND, message, 404);

export const createValidationError = (message: string, details?: any): APIError =>
  new APIError(ErrorCode.VALIDATION_ERROR, message, 400, details);

export const createConflictError = (message: string = "Resource already exists"): APIError =>
  new APIError(ErrorCode.CONFLICT, message, 409);

export const createRateLimitError = (message: string = "Rate limit exceeded"): APIError =>
  new APIError(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429);

export const createDatabaseError = (message: string = "Database operation failed"): APIError =>
  new APIError(ErrorCode.DATABASE_ERROR, message, 500);

export const createExternalServiceError = (message: string = "External service error"): APIError =>
  new APIError(ErrorCode.EXTERNAL_SERVICE_ERROR, message, 502);

export const createInternalServerError = (message: string = "Internal server error"): APIError =>
  new APIError(ErrorCode.INTERNAL_SERVER_ERROR, message, 500);

// Error logging utility
export const logError = (error: Error, context?: any): void => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
  };

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("API Error:", errorInfo);
  }

  // TODO: Integrate with logging service (e.g., Sentry, DataDog)
  // loggingService.logError(errorInfo);
};

// Error handling middleware for Next.js API routes
export const errorHandler = (error: Error, req: any, res: any, next: any) => {
  logError(error, { url: req.url, method: req.method });

  if (error instanceof APIError) {
    return res.status(error.statusCode).json(createErrorResponse(error));
  }

  // Handle TRPC errors
  if (error instanceof TRPCError) {
    const apiError = new APIError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      error.message,
      500
    );
    return res.status(500).json(createErrorResponse(apiError));
  }

  // Handle generic errors
  const apiError = createInternalServerError();
  return res.status(500).json(createErrorResponse(apiError));
};

// Validation error creator
export const createValidationErrors = (errors: Record<string, string[]>): APIError => {
  return new APIError(
    ErrorCode.VALIDATION_ERROR,
    "Validation failed",
    400,
    { errors }
  );
};

// Success response creator
export const createSuccessResponse = <T>(data: T, message?: string) => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString(),
});

// Export all error utilities
export const errorUtils = {
  createErrorResponse,
  createTRPCError,
  createUnauthorizedError,
  createForbiddenError,
  createNotFoundError,
  createValidationError,
  createConflictError,
  createRateLimitError,
  createDatabaseError,
  createExternalServiceError,
  createInternalServerError,
  createValidationErrors,
  createSuccessResponse,
  logError,
  errorHandler,
};
