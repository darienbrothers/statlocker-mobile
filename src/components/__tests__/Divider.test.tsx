/**
 * Divider Component Tests
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Divider } from '../Divider';

describe('Divider Component', () => {
  it('renders horizontal divider by default', () => {
    render(<Divider testID="divider" />);
    const divider = screen.getByTestId('divider');
    expect(divider).toBeTruthy();
    expect(divider).toHaveAccessibilityRole('separator');
  });

  it('renders vertical divider', () => {
    render(<Divider orientation="vertical" testID="divider" />);
    const divider = screen.getByTestId('divider');
    expect(divider).toBeTruthy();
  });

  it('applies different thickness options', () => {
    render(<Divider thickness="thick" testID="divider" />);
    const divider = screen.getByTestId('divider');
    expect(divider).toBeTruthy();
  });

  it('applies different color options', () => {
    render(<Divider color="dark" testID="divider" />);
    const divider = screen.getByTestId('divider');
    expect(divider).toBeTruthy();
  });

  it('applies custom className', () => {
    render(<Divider className="custom-class" testID="divider" />);
    const divider = screen.getByTestId('divider');
    expect(divider).toBeTruthy();
  });

  it('passes through additional props', () => {
    render(<Divider testID="divider" accessibilityLabel="Custom Divider" />);
    const divider = screen.getByTestId('divider');
    expect(divider).toHaveAccessibilityLabel('Custom Divider');
  });
});