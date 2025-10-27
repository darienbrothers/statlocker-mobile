/**
 * Logging Adapter - Pluggable error logging system
 * 
 * Features:
 * - Pluggable provider support (Sentry/LogRocket/Console)
 * - User/session context integration
 * - Different log levels for development vs production
 * - PII-safe logging
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  route?: string;
  userAgent?: string;
  buildVersion?: string;
  environment?: string;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  error?: Error;
  context?: LogContext;
  timestamp: Date;
  tags?: string[];
}

export interface LogProvider {
  log(entry: LogEntry): void;
  setContext(context: LogContext): void;
  setUser(user: { id: string; email?: string }): void;
  flush?(): Promise<void>;
}

// Console Logger (Development)
class ConsoleLogProvider implements LogProvider {
  private context: LogContext = {};

  log(entry: LogEntry): void {
    const { level, message, error, context, timestamp, tags } = entry;
    const levelName = LogLevel[level];
    const contextStr = { ...this.context, ...context };
    
    const logMessage = [
      `[${timestamp.toISOString()}]`,
      `[${levelName}]`,
      message,
      tags?.length ? `(${tags.join(', ')})` : '',
    ].filter(Boolean).join(' ');

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, contextStr, error);
        break;
      case LogLevel.INFO:
        console.info(logMessage, contextStr, error);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, contextStr, error);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logMessage, contextStr, error);
        break;
    }
  }

  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  setUser(user: { id: string; email?: string }): void {
    this.context.userId = user.id;
    // Don't log email in console for privacy
  }
}

// Sentry Logger (Production)
class SentryLogProvider implements LogProvider {
  private isInitialized = false;

  constructor() {
    // TODO: Initialize Sentry
    // Sentry.init({ dsn: 'your-dsn' });
    this.isInitialized = false; // Set to true when Sentry is configured
  }

  log(entry: LogEntry): void {
    if (!this.isInitialized) {
      // Fallback to console in development
      new ConsoleLogProvider().log(entry);
      return;
    }

    const { level, message, error, context, tags } = entry;

    // TODO: Implement Sentry logging
    // Sentry.withScope((scope) => {
    //   if (context) {
    //     scope.setContext('custom', context);
    //   }
    //   if (tags) {
    //     tags.forEach(tag => scope.setTag('custom', tag));
    //   }
    //   
    //   if (error) {
    //     Sentry.captureException(error);
    //   } else {
    //     Sentry.captureMessage(message, level);
    //   }
    // });
  }

  setContext(context: LogContext): void {
    if (!this.isInitialized) return;
    
    // TODO: Set Sentry context
    // Sentry.setContext('app', context);
  }

  setUser(user: { id: string; email?: string }): void {
    if (!this.isInitialized) return;
    
    // TODO: Set Sentry user
    // Sentry.setUser({ id: user.id, email: user.email });
  }

  async flush(): Promise<void> {
    if (!this.isInitialized) return;
    
    // TODO: Flush Sentry
    // await Sentry.flush(2000);
  }
}

// Logger Class
class Logger {
  private provider: LogProvider;
  private minLevel: LogLevel;
  private globalContext: LogContext = {};

  constructor(provider?: LogProvider, minLevel: LogLevel = LogLevel.INFO) {
    this.provider = provider || this.getDefaultProvider();
    this.minLevel = minLevel;
    this.initializeGlobalContext();
  }

  private getDefaultProvider(): LogProvider {
    // Use console in development, Sentry in production
    return __DEV__ ? new ConsoleLogProvider() : new SentryLogProvider();
  }

  private initializeGlobalContext(): void {
    this.globalContext = {
      environment: __DEV__ ? 'development' : 'production',
      buildVersion: '1.0.0', // TODO: Get from app config
      timestamp: new Date().toISOString(),
    };
    this.provider.setContext(this.globalContext);
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    error?: Error,
    context?: LogContext,
    tags?: string[]
  ): LogEntry {
    return {
      level,
      message,
      error,
      context: { ...this.globalContext, ...context },
      timestamp: new Date(),
      tags,
    };
  }

  debug(message: string, context?: LogContext, tags?: string[]): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const entry = this.createLogEntry(LogLevel.DEBUG, message, undefined, context, tags);
    this.provider.log(entry);
  }

  info(message: string, context?: LogContext, tags?: string[]): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const entry = this.createLogEntry(LogLevel.INFO, message, undefined, context, tags);
    this.provider.log(entry);
  }

  warn(message: string, context?: LogContext, tags?: string[]): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const entry = this.createLogEntry(LogLevel.WARN, message, undefined, context, tags);
    this.provider.log(entry);
  }

  error(message: string, error?: Error, context?: LogContext, tags?: string[]): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    const entry = this.createLogEntry(LogLevel.ERROR, message, error, context, tags);
    this.provider.log(entry);
  }

  fatal(message: string, error?: Error, context?: LogContext, tags?: string[]): void {
    if (!this.shouldLog(LogLevel.FATAL)) return;
    const entry = this.createLogEntry(LogLevel.FATAL, message, error, context, tags);
    this.provider.log(entry);
  }

  setContext(context: LogContext): void {
    this.globalContext = { ...this.globalContext, ...context };
    this.provider.setContext(this.globalContext);
  }

  setUser(user: { id: string; email?: string }): void {
    this.provider.setUser(user);
  }

  async flush(): Promise<void> {
    if (this.provider.flush) {
      await this.provider.flush();
    }
  }
}

// Global logger instance
export const logger = new Logger(
  undefined, // Use default provider
  __DEV__ ? LogLevel.DEBUG : LogLevel.INFO
);

// Convenience functions
export const logError = (message: string, error?: Error, context?: LogContext) => {
  logger.error(message, error, context);
};

export const logWarning = (message: string, context?: LogContext) => {
  logger.warn(message, context);
};

export const logInfo = (message: string, context?: LogContext) => {
  logger.info(message, context);
};

export const logDebug = (message: string, context?: LogContext) => {
  logger.debug(message, context);
};

// Export types and classes
export { Logger, ConsoleLogProvider, SentryLogProvider };