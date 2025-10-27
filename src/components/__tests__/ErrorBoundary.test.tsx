/**
 * ErrorBoundary Component Tests
 */
import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../ErrorBoundary';

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>No error</Text>;
};

describe('ErrorBoundary Component', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <Text>Test content</Text>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeTruthy();
  });

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Try Again')).toBeTruthy();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <Text>Custom error message</Text>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeTruthy();
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('recovers when Try Again is pressed', () => {
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);

      React.useEffect(() => {
        // After a short delay, stop throwing errors
        const timer = setTimeout(() => setShouldThrow(false), 100);
        return () => clearTimeout(timer);
      }, []);

      return <ThrowError shouldThrow={shouldThrow} />;
    };

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    // Should show error UI initially
    expect(screen.getByText('Something went wrong')).toBeTruthy();

    // Press Try Again
    fireEvent.press(screen.getByText('Try Again'));

    // Should eventually show the content (after the component stops throwing)
    expect(screen.queryByText('Something went wrong')).toBeFalsy();
  });

  it('shows debug info in development mode', () => {
    const originalDev = __DEV__;
    (global as any).__DEV__ = true;

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Debug Info (Development Only):')).toBeTruthy();
    expect(screen.getByText('Test error')).toBeTruthy();

    (global as any).__DEV__ = originalDev;
  });

  it('hides debug info in production mode', () => {
    const originalDev = __DEV__;
    (global as any).__DEV__ = false;

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Debug Info (Development Only):')).toBeFalsy();

    (global as any).__DEV__ = originalDev;
  });
});