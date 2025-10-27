/**
 * EmptyState Component Tests
 */
import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { EmptyState } from '../EmptyState';

describe('EmptyState Component', () => {
  it('renders with title only', () => {
    render(<EmptyState title="No data available" />);
    expect(screen.getByText('No data available')).toBeTruthy();
  });

  it('renders with title and description', () => {
    render(
      <EmptyState
        title="No games yet"
        description="Log your first game to unlock trends and insights"
      />
    );
    expect(screen.getByText('No games yet')).toBeTruthy();
    expect(screen.getByText('Log your first game to unlock trends and insights')).toBeTruthy();
  });

  it('renders with icon', () => {
    render(
      <EmptyState
        title="No data"
        icon={<Text testID="custom-icon">📊</Text>}
      />
    );
    expect(screen.getByTestId('custom-icon')).toBeTruthy();
  });

  it('renders with action button', () => {
    const mockAction = jest.fn();
    render(
      <EmptyState
        title="No games yet"
        action={{
          label: 'Log a Game',
          onPress: mockAction,
        }}
      />
    );
    
    const button = screen.getByText('Log a Game');
    expect(button).toBeTruthy();
    
    fireEvent.press(button);
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('renders with custom action button variant', () => {
    const mockAction = jest.fn();
    render(
      <EmptyState
        title="No data"
        action={{
          label: 'Get Started',
          onPress: mockAction,
          variant: 'secondary',
        }}
      />
    );
    
    expect(screen.getByText('Get Started')).toBeTruthy();
  });

  it('applies custom testID', () => {
    render(<EmptyState title="Test" testID="empty-state" />);
    expect(screen.getByTestId('empty-state')).toBeTruthy();
  });

  it('applies custom className', () => {
    render(<EmptyState title="Test" className="custom-class" testID="empty-state" />);
    const emptyState = screen.getByTestId('empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('renders complete empty state with all props', () => {
    const mockAction = jest.fn();
    render(
      <EmptyState
        title="No stats available"
        description="Start tracking your performance to see detailed statistics"
        icon={<Text testID="icon">📈</Text>}
        action={{
          label: 'Start Tracking',
          onPress: mockAction,
          variant: 'primary',
        }}
        testID="complete-empty-state"
      />
    );
    
    expect(screen.getByText('No stats available')).toBeTruthy();
    expect(screen.getByText('Start tracking your performance to see detailed statistics')).toBeTruthy();
    expect(screen.getByTestId('icon')).toBeTruthy();
    expect(screen.getByText('Start Tracking')).toBeTruthy();
    expect(screen.getByTestId('complete-empty-state')).toBeTruthy();
  });
});