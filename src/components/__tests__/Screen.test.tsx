/**
 * Screen Component Tests
 */

import React from 'react';
import { Text, View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Screen } from '../Screen';

describe('Screen Component', () => {
  it('renders children correctly', () => {
    render(
      <Screen>
        <Text>Test Content</Text>
      </Screen>
    );

    expect(screen.getByText('Test Content')).toBeTruthy();
  });

  it('renders title when provided', () => {
    render(
      <Screen title="Test Screen">
        <Text>Content</Text>
      </Screen>
    );

    expect(screen.getByText('Test Screen')).toBeTruthy();
  });

  it('does not render header when title is not provided', () => {
    render(
      <Screen>
        <Text>Content</Text>
      </Screen>
    );

    // Should not find any header text
    expect(screen.queryByText('Test Screen')).toBeNull();
  });

  it('renders sticky CTA when provided', () => {
    render(
      <Screen
        stickyCta={
          <View testID="sticky-cta">
            <Text>CTA Button</Text>
          </View>
        }
      >
        <Text>Content</Text>
      </Screen>
    );

    expect(screen.getByTestId('sticky-cta')).toBeTruthy();
    expect(screen.getByText('CTA Button')).toBeTruthy();
  });

  it('applies custom className', () => {
    render(
      <Screen className="custom-class" testID="screen">
        <Text>Content</Text>
      </Screen>
    );

    const screenElement = screen.getByTestId('screen');
    expect(screenElement.props.className).toContain('custom-class');
  });

  it('applies correct testID', () => {
    render(
      <Screen testID="test-screen">
        <Text>Content</Text>
      </Screen>
    );

    expect(screen.getByTestId('test-screen')).toBeTruthy();
  });

  it('renders with scroll by default', () => {
    const { UNSAFE_getByType } = render(
      <Screen>
        <Text>Content</Text>
      </Screen>
    );

    // Should render ScrollView by default
    expect(() => UNSAFE_getByType('ScrollView')).not.toThrow();
  });

  it('renders without scroll when scroll=false', () => {
    const { UNSAFE_queryByType } = render(
      <Screen scroll={false}>
        <Text>Content</Text>
      </Screen>
    );

    // Should not render ScrollView when scroll is false
    expect(UNSAFE_queryByType('ScrollView')).toBeNull();
  });

  it('renders with gradient option', () => {
    render(
      <Screen
        stickyCta={<Text>CTA</Text>}
        gradientUnderCta={true}
      >
        <Text>Content</Text>
      </Screen>
    );

    // Should render CTA when provided
    expect(screen.getByText('CTA')).toBeTruthy();
  });

  it('handles keyboard avoiding behavior', () => {
    const { UNSAFE_getByType } = render(
      <Screen>
        <Text>Content</Text>
      </Screen>
    );

    // Should render KeyboardAvoidingView
    expect(() => UNSAFE_getByType('KeyboardAvoidingView')).not.toThrow();
  });
});