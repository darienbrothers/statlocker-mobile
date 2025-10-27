/**
 * Logging System Tests
 */
import { 
  Logger, 
  ConsoleLogProvider, 
  SentryLogProvider,
  LogLevel,
  logger,
  logError,
  logWarning,
  logInfo,
  logDebug,
  type LogEntry,
  type LogContext 
} from '../logging';

describe('Logging System', () => {
  // Mock console methods
  const originalConsole = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  beforeEach(() => {
    console.debug = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  afterAll(() => {
    Object.assign(console, originalConsole);
  });

  describe('ConsoleLogProvider', () => {
    let provider: ConsoleLogProvider;

    beforeEach(() => {
      provider = new ConsoleLogProvider();
    });

    it('logs debug messages to console.debug', () => {
      const entry: LogEntry = {
        level: LogLevel.DEBUG,
        message: 'Debug message',
        timestamp: new Date(),
      };

      provider.log(entry);

      expect(console.debug).toHaveBeenCalled();
    });

    it('logs info messages to console.info', () => {
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Info message',
        timestamp: new Date(),
      };

      provider.log(entry);

      expect(console.info).toHaveBeenCalled();
    });

    it('logs warn messages to console.warn', () => {
      const entry: LogEntry = {
        level: LogLevel.WARN,
        message: 'Warning message',
        timestamp: new Date(),
      };

      provider.log(entry);

      expect(console.warn).toHaveBeenCalled();
    });

    it('logs error messages to console.error', () => {
      const entry: LogEntry = {
        level: LogLevel.ERROR,
        message: 'Error message',
        timestamp: new Date(),
      };

      provider.log(entry);

      expect(console.error).toHaveBeenCalled();
    });

    it('logs fatal messages to console.error', () => {
      const entry: LogEntry = {
        level: LogLevel.FATAL,
        message: 'Fatal message',
        timestamp: new Date(),
      };

      provider.log(entry);

      expect(console.error).toHaveBeenCalled();
    });

    it('sets context correctly', () => {
      const context: LogContext = {
        userId: '123',
        route: '/dashboard',
      };

      provider.setContext(context);

      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Test message',
        timestamp: new Date(),
      };

      provider.log(entry);

      expect(console.info).toHaveBeenCalled();
    });

    it('sets user correctly', () => {
      const user = { id: '123', email: 'test@example.com' };

      provider.setUser(user);

      // Should not throw
      expect(() => provider.setUser(user)).not.toThrow();
    });
  });

  describe('SentryLogProvider', () => {
    let provider: SentryLogProvider;

    beforeEach(() => {
      provider = new SentryLogProvider();
    });

    it('falls back to console when not initialized', () => {
      const entry: LogEntry = {
        level: LogLevel.ERROR,
        message: 'Error message',
        timestamp: new Date(),
      };

      provider.log(entry);

      // Should fallback to console
      expect(console.error).toHaveBeenCalled();
    });

    it('handles setContext when not initialized', () => {
      const context: LogContext = { userId: '123' };

      expect(() => provider.setContext(context)).not.toThrow();
    });

    it('handles setUser when not initialized', () => {
      const user = { id: '123', email: 'test@example.com' };

      expect(() => provider.setUser(user)).not.toThrow();
    });

    it('handles flush when not initialized', async () => {
      await expect(provider.flush()).resolves.toBeUndefined();
    });
  });

  describe('Logger', () => {
    let testLogger: Logger;
    let mockProvider: jest.Mocked<ConsoleLogProvider>;

    beforeEach(() => {
      mockProvider = {
        log: jest.fn(),
        setContext: jest.fn(),
        setUser: jest.fn(),
      } as any;

      testLogger = new Logger(mockProvider, LogLevel.DEBUG);
    });

    it('logs debug messages when level allows', () => {
      testLogger.debug('Debug message');

      expect(mockProvider.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.DEBUG,
          message: 'Debug message',
        })
      );
    });

    it('logs info messages', () => {
      testLogger.info('Info message');

      expect(mockProvider.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.INFO,
          message: 'Info message',
        })
      );
    });

    it('logs warning messages', () => {
      testLogger.warn('Warning message');

      expect(mockProvider.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.WARN,
          message: 'Warning message',
        })
      );
    });

    it('logs error messages with error object', () => {
      const error = new Error('Test error');
      testLogger.error('Error message', error);

      expect(mockProvider.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.ERROR,
          message: 'Error message',
          error,
        })
      );
    });

    it('logs fatal messages', () => {
      const error = new Error('Fatal error');
      testLogger.fatal('Fatal message', error);

      expect(mockProvider.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.FATAL,
          message: 'Fatal message',
          error,
        })
      );
    });

    it('respects minimum log level', () => {
      const warnLogger = new Logger(mockProvider, LogLevel.WARN);

      warnLogger.debug('Debug message');
      warnLogger.info('Info message');
      warnLogger.warn('Warning message');

      expect(mockProvider.log).toHaveBeenCalledTimes(1);
      expect(mockProvider.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.WARN,
          message: 'Warning message',
        })
      );
    });

    it('includes context in log entries', () => {
      const context: LogContext = { userId: '123', route: '/test' };
      testLogger.info('Test message', context);

      expect(mockProvider.log).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining(context),
        })
      );
    });

    it('includes tags in log entries', () => {
      const tags = ['auth', 'error'];
      testLogger.error('Error message', undefined, undefined, tags);

      expect(mockProvider.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tags,
        })
      );
    });

    it('sets global context', () => {
      const context: LogContext = { sessionId: 'abc123' };
      testLogger.setContext(context);

      expect(mockProvider.setContext).toHaveBeenCalledWith(
        expect.objectContaining(context)
      );
    });

    it('sets user information', () => {
      const user = { id: '123', email: 'test@example.com' };
      testLogger.setUser(user);

      expect(mockProvider.setUser).toHaveBeenCalledWith(user);
    });
  });

  describe('Convenience Functions', () => {
    it('logError calls logger.error', () => {
      const spy = jest.spyOn(logger, 'error');
      const error = new Error('Test error');
      const context = { userId: '123' };

      logError('Error message', error, context);

      expect(spy).toHaveBeenCalledWith('Error message', error, context);
      spy.mockRestore();
    });

    it('logWarning calls logger.warn', () => {
      const spy = jest.spyOn(logger, 'warn');
      const context = { route: '/test' };

      logWarning('Warning message', context);

      expect(spy).toHaveBeenCalledWith('Warning message', context);
      spy.mockRestore();
    });

    it('logInfo calls logger.info', () => {
      const spy = jest.spyOn(logger, 'info');
      const context = { action: 'test' };

      logInfo('Info message', context);

      expect(spy).toHaveBeenCalledWith('Info message', context);
      spy.mockRestore();
    });

    it('logDebug calls logger.debug', () => {
      const spy = jest.spyOn(logger, 'debug');
      const context = { debug: true };

      logDebug('Debug message', context);

      expect(spy).toHaveBeenCalledWith('Debug message', context);
      spy.mockRestore();
    });
  });
});