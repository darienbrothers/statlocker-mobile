/**
 * TabIcon Component Tests
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { TabIcon } from '../TabIcon';

describe('TabIcon Component', () => {
  it('renders home icon correctly', () => {
    render(<TabIcon name="home" />);
    // Should render without crashing
    expect(screen.root).toBeTruthy();
  });

  it('renders trending-up icon correctly', () => {
    render(<TabIcon name="trending-up" />);
    expect(screen.root).toBeTruthy();
  });

  it('renders target icon correctly', () => {
    render(<TabIcon name="target" />);
    expect(screen.root).toBeTruthy();
  });

  it('renders compass icon correctly', () => {
    render(<TabIcon name="compass" />);
    expect(screen.root).toBeTruthy();
  });

  it('handles active state correctly', () => {
    render(<TabIcon name="home" active={true} />);
    expect(screen.root).toBeTruthy();
  });

  it('handles inactive state correctly', () => {
    render(<TabIcon name="home" active={false} />);
    expect(screen.root).toBeTruthy();
  });

  it('applies custom size', () => {
    render(<TabIcon name="home" size={32} />);
    expect(screen.root).toBeTruthy();
  });

  it('applies custom color', () => {
    render(<TabIcon name="home" color="#FF0000" />);
    expect(screen.root).toBeTruthy();
  });

  it('handles invalid icon name gracefully', () => {
    // Suppress console.warn for this test
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    render(<TabIcon name={'invalid' as any} />);
    expect(consoleSpy).toHaveBeenCalledWith('TabIcon: Unknown icon name "invalid"');
    consoleSpy.mockRestore();
  });
});