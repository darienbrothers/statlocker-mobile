/**
 * Tag Component Tests
 */
import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Tag } from '../Tag';

describe('Tag Component', () => {
  it('renders with default variant', () => {
    render(<Tag>Default Tag</Tag>);
    expect(screen.getByText('Default Tag')).toBeTruthy();
  });

  it('renders success variant', () => {
    render(<Tag variant="success">Success Tag</Tag>);
    expect(screen.getByText('Success Tag')).toBeTruthy();
  });

  it('renders primary variant', () => {
    render(<Tag variant="primary">Primary Tag</Tag>);
    expect(screen.getByText('Primary Tag')).toBeTruthy();
  });

  it('renders warning variant', () => {
    render(<Tag variant="warning">Warning Tag</Tag>);
    expect(screen.getByText('Warning Tag')).toBeTruthy();
  });

  it('renders danger variant', () => {
    render(<Tag variant="danger">Danger Tag</Tag>);
    expect(screen.getByText('Danger Tag')).toBeTruthy();
  });

  it('renders small size', () => {
    render(<Tag size="small">Small Tag</Tag>);
    expect(screen.getByText('Small Tag')).toBeTruthy();
  });

  it('renders with custom testID', () => {
    render(<Tag testID="custom-tag">Test Tag</Tag>);
    expect(screen.getByTestId('custom-tag')).toBeTruthy();
  });

  it('renders with custom children', () => {
    render(
      <Tag>
        <Text>Custom Content</Text>
      </Tag>
    );
    expect(screen.getByText('Custom Content')).toBeTruthy();
  });

  it('applies custom className', () => {
    render(<Tag className="custom-class" testID="tag">Tag</Tag>);
    const tag = screen.getByTestId('tag');
    expect(tag).toBeTruthy();
  });
});