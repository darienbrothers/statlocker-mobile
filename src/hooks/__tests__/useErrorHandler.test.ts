/**
 * useErrorHandler Hook Tests
 */
import { renderHook, act } from '@testing-library/react-native';
import { useErrorHandler } from '../useErrorHandler';

describe('useErrorHandler Hook', () => {
  // Suppress console.error and console.warn for these tests
  const originalError = console.error;
  const originalWarn = console.warn;
  beforeAll(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
    console.warn = originalWarn;
  });

  it('handles basic errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = new Error('Test error');

    let userMessage: string;
    act(() => {
      userMessage = result.current.handleError(error);
    });

    expect(userMessage!).toBe('Something went wrong. Please try again.');
    expect(console.error).toHaveBeenCalledWith('Error handled:', error);
  });

  it('uses custom fallback message', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = new Error('Test error');

    let userMessage: string;
    act(() => {
      userMessage = result.current.handleError(error, {
        fallbackMessage: 'Custom error message',
      });
    });

    expect(userMessage!).toBe('Custom error message');
  });

  it('handles network errors with specific message', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = new Error('Network request failed');

    let userMessage: string;
    act(() => {
      userMessage = result.current.handleError(error);
    });

    expect(userMessage!).toBe('Please check your internet connection and try again.');
  });

  it('handles timeout errors with specific message', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = new Error('Request timeout');

    let userMessage: string;
    act(() => {
      userMessage = result.current.handleError(error);
    });

    expect(userMessage!).toBe('The request timed out. Please try again.');
  });

  it('handles HTTP status codes', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    const testCases = [
      { statusCode: 400, expected: 'Invalid request. Please check your input.' },
      { statusCode: 401, expected: 'Please sign in to continue.' },
      { statusCode: 403, expected: 'You don\'t have permission to perform this action.' },
      { statusCode: 404, expected: 'The requested resource was not found.' },
      { statusCode: 500, expected: 'Server error. Please try again later.' },
    ];

    testCases.forEach(({ statusCode, expected }) => {
      const error = Object.assign(new Error('HTTP Error'), { statusCode });

      let userMessage: string;
      act(() => {
        userMessage = result.current.handleError(error);
      });

      expect(userMessage!).toBe(expected);
    });
  });

  it('uses userMessage when available', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = Object.assign(new Error('Technical error'), {
      userMessage: 'User-friendly message',
    });

    let userMessage: string;
    act(() => {
      userMessage = result.current.handleError(error);
    });

    expect(userMessage!).toBe('User-friendly message');
  });

  it('handles async errors successfully', async () => {
    const { result } = renderHook(() => useErrorHandler());
    const successValue = 'success';

    const asyncFn = jest.fn().mockResolvedValue(successValue);

    let resultValue: string | null;
    await act(async () => {
      resultValue = await result.current.handleAsyncError(asyncFn);
    });

    expect(resultValue!).toBe(successValue);
    expect(asyncFn).toHaveBeenCalled();
  });

  it('handles async errors with failure', async () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = new Error('Async error');

    const asyncFn = jest.fn().mockRejectedValue(error);

    let resultValue: string | null;
    await act(async () => {
      resultValue = await result.current.handleAsyncError(asyncFn);
    });

    expect(resultValue).toBeNull();
    expect(asyncFn).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('Error handled:', error);
  });

  it('respects logError option', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = new Error('Test error');

    act(() => {
      result.current.handleError(error, { logError: false });
    });

    // Should not log when logError is false
    expect(console.error).not.toHaveBeenCalledWith('Error handled:', error);
  });

  it('respects showToast option', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = new Error('Test error');

    act(() => {
      result.current.handleError(error, { showToast: true });
    });

    expect(console.warn).toHaveBeenCalledWith(
      'Error toast:',
      'Something went wrong. Please try again.'
    );
  });
});