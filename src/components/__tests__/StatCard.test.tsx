/**
 * StatCard Component Tests
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StatCard } from '../StatCard';

describe('StatCard Component', () => {
  it('renders basic stat card correctly', () => {
    render(
      <StatCard
        title="Goals"
        value={15}
        testID="stat-card"
      />
    );
    
    expect(screen.getByText('Goals')).toBeTruthy();
    expect(screen.getByText('15')).toBeTruthy();
  });

  it('renders stat card with string value', () => {
    render(
      <StatCard
        title="Position"
        value="Midfielder"
      />
    );
    
    expect(screen.getByText('Position')).toBeTruthy();
    expect(screen.getByText('Midfielder')).toBeTruthy();
  });

  it('formats percentage values correctly', () => {
    render(
      <StatCard
        title="Shot Accuracy"
        value={0.75}
      />
    );
    
    expect(screen.getByText('Shot Accuracy')).toBeTruthy();
    expect(screen.getByText('75.0%')).toBeTruthy();
  });

  it('renders positive delta correctly', () => {
    render(
      <StatCard
        title="Goals"
        value={15}
        delta={{
          value: 3,
          type: 'positive',
        }}
      />
    );
    
    expect(screen.getByText('Goals')).toBeTruthy();
    expect(screen.getByText('15')).toBeTruthy();
    expect(screen.getByText('+3')).toBeTruthy();
  });

  it('renders negative delta correctly', () => {
    render(
      <StatCard
        title="Turnovers"
        value={8}
        delta={{
          value: -2,
          type: 'negative',
        }}
      />
    );
    
    expect(screen.getByText('Turnovers')).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy();
    expect(screen.getByText('-2')).toBeTruthy();
  });

  it('renders neutral delta correctly', () => {
    render(
      <StatCard
        title="Assists"
        value={5}
        delta={{
          value: 0,
          type: 'neutral',
        }}
      />
    );
    
    expect(screen.getByText('Assists')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
  });

  it('renders delta with percentage values', () => {
    render(
      <StatCard
        title="Shot Accuracy"
        value={0.75}
        delta={{
          value: 0.05,
          type: 'positive',
        }}
      />
    );
    
    expect(screen.getByText('75.0%')).toBeTruthy();
    expect(screen.getByText('+5.0%')).toBeTruthy();
  });

  it('renders delta with custom label', () => {
    render(
      <StatCard
        title="Goals"
        value={15}
        delta={{
          value: 3,
          type: 'positive',
          label: 'this week',
        }}
      />
    );
    
    expect(screen.getByText('+3 this week')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    render(
      <StatCard
        title="Goals"
        value={15}
        subtitle="Season total"
      />
    );
    
    expect(screen.getByText('Goals')).toBeTruthy();
    expect(screen.getByText('15')).toBeTruthy();
    expect(screen.getByText('Season total')).toBeTruthy();
  });

  it('formats large numbers with locale formatting', () => {
    render(
      <StatCard
        title="Total Distance"
        value={1234567}
      />
    );
    
    expect(screen.getByText('Total Distance')).toBeTruthy();
    expect(screen.getByText('1,234,567')).toBeTruthy();
  });

  it('applies custom testID', () => {
    render(
      <StatCard
        title="Goals"
        value={15}
        testID="custom-stat-card"
      />
    );
    
    expect(screen.getByTestId('custom-stat-card')).toBeTruthy();
  });
});