/**
 * Progress Component Tests
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Progress } from '../Progress';

describe('Progress Component', () => {
  it('renders with default props', () => {
    render(<Progress value={50} testID="progress" />);
    const progress = screen.getByTestId('progress');
    expect(progress).toBeTruthy();
  });

  it('displays percentage correctly', () => {
    render(<Progress value={75} showPercentage />);
    expect(screen.getByText('75%')).toBeTruthy();
  });

  it('displays label when provided', () => {
    render(<Progress value={50} label="Goals Progress" />);
    expect(screen.getByText('Goals Progress')).toBeTruthy();
  });

  it('hides percentage when showPercentage is false', () => {
    render(<Progress value={50} showPercentage={false} />);
    expect(screen.queryByText('50%')).toBeNull();
  });

  it('handles different variants', () => {
    render(<Progress value={50} variant="success" testID="progress" />);
    const progress = screen.getByTestId('progress');
    expect(progress).toBeTruthy();
  });

  it('handles custom max value', () => {
    render(<Progress value={25} max={50} showPercentage />);
    expect(screen.getByText('50%')).toBeTruthy();
  });

  it('clamps value to 0-100 range', () => {
    render(<Progress value={150} showPercentage />);
    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('handles negative values', () => {
    render(<Progress value={-10} showPercentage />);
    expect(screen.getByText('0%')).toBeTruthy();
  });

  it('has proper accessibility attributes', () => {
    render(<Progress value={50} max={100} testID="progress" />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAccessibilityValue({
      min: 0,
      max: 100,
      now: 50,
    });
  });

  it('applies custom className', () => {
    render(<Progress value={50} className="custom-class" testID="progress" />);
    const progress = screen.getByTestId('progress');
    expect(progress).toBeTruthy();
  });
});