/**
 * Icon Component Tests
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Icon } from '../Icon';

describe('Icon Component', () => {
  it('renders with default props', () => {
    render(<Icon name="home" />);
    expect(screen.root).toBeTruthy();
  });

  it('renders different icon names', () => {
    const iconNames = ['home', 'plus', 'search', 'check', 'calendar'] as const;
    
    iconNames.forEach(name => {
      render(<Icon name={name} testID={`icon-${name}`} />);
      expect(screen.getByTestId(`icon-${name}`)).toBeTruthy();
    });
  });

  it('applies different sizes', () => {
    render(<Icon name="home" size="small" testID="small-icon" />);
    expect(screen.getByTestId('small-icon')).toBeTruthy();
    
    render(<Icon name="home" size="large" testID="large-icon" />);
    expect(screen.getByTestId('large-icon')).toBeTruthy();
  });

  it('applies custom numeric size', () => {
    render(<Icon name="home" size={48} testID="custom-size-icon" />);
    expect(screen.getByTestId('custom-size-icon')).toBeTruthy();
  });

  it('applies different colors', () => {
    render(<Icon name="home" color="primary" testID="primary-icon" />);
    expect(screen.getByTestId('primary-icon')).toBeTruthy();
    
    render(<Icon name="home" color="success" testID="success-icon" />);
    expect(screen.getByTestId('success-icon')).toBeTruthy();
  });

  it('applies custom color string', () => {
    render(<Icon name="home" color="#FF0000" testID="custom-color-icon" />);
    expect(screen.getByTestId('custom-color-icon')).toBeTruthy();
  });

  it('handles filled state', () => {
    render(<Icon name="home" filled testID="filled-icon" />);
    expect(screen.getByTestId('filled-icon')).toBeTruthy();
  });

  it('applies custom stroke width', () => {
    render(<Icon name="home" strokeWidth={3} testID="thick-icon" />);
    expect(screen.getByTestId('thick-icon')).toBeTruthy();
  });

  it('applies accessibility label', () => {
    render(<Icon name="home" accessibilityLabel="Home Icon" testID="accessible-icon" />);
    const icon = screen.getByTestId('accessible-icon');
    expect(icon).toHaveAccessibilityLabel('Home Icon');
  });

  it('handles invalid icon name gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    render(<Icon name={'invalid' as any} />);
    expect(consoleSpy).toHaveBeenCalledWith('Icon: Unknown icon name "invalid"');
    consoleSpy.mockRestore();
  });

  it('renders all navigation icons', () => {
    const navIcons = ['home', 'trending-up', 'target', 'compass'] as const;
    
    navIcons.forEach(name => {
      render(<Icon name={name} testID={`nav-${name}`} />);
      expect(screen.getByTestId(`nav-${name}`)).toBeTruthy();
    });
  });

  it('renders all action icons', () => {
    const actionIcons = ['plus', 'edit', 'trash', 'save', 'share'] as const;
    
    actionIcons.forEach(name => {
      render(<Icon name={name} testID={`action-${name}`} />);
      expect(screen.getByTestId(`action-${name}`)).toBeTruthy();
    });
  });

  it('renders all UI icons', () => {
    const uiIcons = ['search', 'filter', 'settings', 'menu', 'x'] as const;
    
    uiIcons.forEach(name => {
      render(<Icon name={name} testID={`ui-${name}`} />);
      expect(screen.getByTestId(`ui-${name}`)).toBeTruthy();
    });
  });
});