/**
 * Card Component Tests
 */
import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Card } from '../Card';

describe('Card Component', () => {
  it('renders children correctly', () => {
    render(
      <Card>
        <Text>Card Content</Text>
      </Card>
    );
    
    expect(screen.getByText('Card Content')).toBeTruthy();
  });

  it('applies default padding', () => {
    render(
      <Card testID="test-card">
        <Text>Content</Text>
      </Card>
    );
    
    const card = screen.getByTestId('test-card');
    expect(card).toBeTruthy();
  });

  it('applies small padding', () => {
    render(
      <Card padding="small" testID="test-card">
        <Text>Content</Text>
      </Card>
    );
    
    const card = screen.getByTestId('test-card');
    expect(card).toBeTruthy();
  });

  it('applies large padding', () => {
    render(
      <Card padding="large" testID="test-card">
        <Text>Content</Text>
      </Card>
    );
    
    const card = screen.getByTestId('test-card');
    expect(card).toBeTruthy();
  });

  it('applies no padding', () => {
    render(
      <Card padding="none" testID="test-card">
        <Text>Content</Text>
      </Card>
    );
    
    const card = screen.getByTestId('test-card');
    expect(card).toBeTruthy();
  });

  it('applies custom className', () => {
    render(
      <Card className="custom-class" testID="test-card">
        <Text>Content</Text>
      </Card>
    );
    
    const card = screen.getByTestId('test-card');
    expect(card).toBeTruthy();
  });

  it('passes through additional props', () => {
    render(
      <Card testID="test-card" accessibilityLabel="Test Card">
        <Text>Content</Text>
      </Card>
    );
    
    const card = screen.getByTestId('test-card');
    expect(card).toHaveAccessibilityLabel('Test Card');
  });
});