/**
 * Production-safe logging utility
 * Automatically disables logging in production builds
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  level: LogLevel;
  enableInProduction: boolean;
  prefix?: string;
}

class Logger {
  private config: LogConfig;
  private isProduction: boolean;

  constructor(config: LogConfig = { level: 'info', enableInProduction: false }) {
    this.config = config;
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isProduction && !this.config.enableInProduction) {
      return false;
    }

    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levels[level] >= levels[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const prefix = this.config.prefix || '';
    const timestamp = new Date().toISOString();
    return `${prefix}[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message), data || '');
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message), data || '');
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), data || '');
    }
  }

  error(message: string, data?: any): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), data || '');
    }
  }
}

// Create logger instances for different modules
export const logger = new Logger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
  enableInProduction: false,
  prefix: '[APP]',
});

export const dbLogger = new Logger({
  level: process.env.NODE_ENV === 'development' ? 'info' : 'error',
  enableInProduction: false,
  prefix: '[DB]',
});

export const apiLogger = new Logger({
  level: process.env.NODE_ENV === 'development' ? 'info' : 'error',
  enableInProduction: false,
  prefix: '[API]',
});

export const authLogger = new Logger({
  level: process.env.NODE_ENV === 'development' ? 'warn' : 'error',
  enableInProduction: false,
  prefix: '[AUTH]',
});

// Utility function to create module-specific loggers
export function createLogger(module: string, config?: Partial<LogConfig>): Logger {
  return new Logger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
    enableInProduction: false,
    prefix: `[${module.toUpperCase()}]`,
    ...config,
  });
}
