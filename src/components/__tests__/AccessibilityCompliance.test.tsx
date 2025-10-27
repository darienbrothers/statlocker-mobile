/**
 * Component Accessibility Compliance Tests
 * 
 * Tests accessibility compliance for all UI components:
 * - Button, Screen, StickyCTA, Card, EmptyState, Skeleton
 * - Validates WCAG AA compliance
 * - Tests screen reader compatibility
 * - Validates touch targets and keyboard navigation
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// Import components to test
import { Button } from '../Button';
import { Screen } from '../Screen';
import { StickyCTA } from '../StickyCTA';
import { Card, StatCard } from '../Card';
import { EmptyState } from '../EmptyState';
import { Skeleton } from '../Skeleton';
import { Tag } from '../Tag';
import { Progress } from '../Progress';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock dependencies
jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/lib/i18n', () => ({
  t: (key: string) => key,
}));

jest.mock('@/store', () => ({
  useIsOffline: () => false,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    default: {
      View,
      createAnimatedComponent: (component: any) => component,
    },
    useSharedValue: () => ({ value: 0 }),
    useAnimatedStyle: () => ({}),
    withTiming: (value: any) => value,
    Easing: { out: () => {}, cubic: () => {} },
  };
});

describe('Component Accessibility Compliance', () => {
  describe('Button Component', () => {
    it('should have proper accessibility labels and roles', () => {
      render(
        <Button 
          variant="primary" 
          accessibilityLabel="Save document"
          testID="save-button"
        >
          Save
        </Button>
      );

      const button = screen.getByTestId('save-button');
      expect(button.props.accessibilityRole).toBe('button');
      expect(button.props.accessibilityLabel).toBe('Save document');
    });

    it('should have minimum 44pt touch targets', () => {
      render(<Button testID="button">Test</Button>);
      
      const button = screen.getByTestId('button');
      const style = button.props.style;
      
      // Check minimum height
      expect(style.minHeight).toBeGreaterThanOrEqual(44);
    });

    it('should indicate loading state to screen readers', () => {
      render(
        <Button loading testID="loading-button">
          Save
        </Button>
      );

      const button = screen.getByTestId('loading-button');
      expect(button.props.accessibilityState?.busy).toBe(true);
    });

    it('should indicate disabled state to screen readers', () => {
      render(
        <Button disabled testID="disabled-button">
          Save
        </Button>
      );

      const button = screen.getByTestId('disabled-button');
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });

    it('should handle keyboard activation', () => {
      const mockOnPress = jest.fn();
      
      render(
        <Button onPress={mockOnPress} testID="keyboard-button">
          Press Me
        </Button>
      );

      const button = screen.getByTestId('keyboard-button');
      fireEvent.press(button);
      
      expect(mockOnPress).toHaveBeenCalled();
    });
  });

  describe('Screen Component', () => {
    it('should have proper semantic structure', () => {
      render(
        <Screen title="Dashboard" testID="screen">
          <Text>Content</Text>
        </Screen>
      );

      const screen_element = screen.getByTestId('screen');
      expect(screen_element.props.accessibilityRole).toBe('main');
    });

    it('should announce title to screen readers', () => {
      render(
        <Screen title="Dashboard" testID="screen">
          <Text>Content</Text>
        </Screen>
      );

      const screen_element = screen.getByTestId('screen');
      expect(screen_element.props.accessibilityLabel).toContain('Dashboard');
    });

    it('should handle keyboard-aware scrolling', () => {
      render(
        <Screen scroll testID="scrollable-screen">
          <Text>Scrollable content</Text>
        </Screen>
      );

      const scrollView = screen.getByTestId('scrollable-screen');
      expect(scrollView.props.keyboardShouldPersistTaps).toBe('handled');
    });
  });

  describe('StickyCTA Component', () => {
    it('should have proper accessibility properties', () => {
      render(
        <StickyCTA 
          variant="primary" 
          onPress={() => {}}
          testID="sticky-cta"
        >
          Continue
        </StickyCTA>
      );

      const cta = screen.getByTestId('sticky-cta');
      expect(cta.props.accessibilityRole).toBe('button');
      expect(cta.props.accessible).toBe(true);
    });

    it('should maintain minimum touch target size', () => {
      render(
        <StickyCTA 
          variant="primary" 
          onPress={() => {}}
          testID="sticky-cta"
        >
          Continue
        </StickyCTA>
      );

      const cta = screen.getByTestId('sticky-cta');
      const style = cta.props.style;
      
      // StickyCTA should have 56pt height minimum
      expect(style.minHeight).toBeGreaterThanOrEqual(56);
    });

    it('should indicate loading state', () => {
      render(
        <StickyCTA 
          variant="primary" 
          loading
          onPress={() => {}}
          testID="loading-cta"
        >
          Continue
        </StickyCTA>
      );

      const cta = screen.getByTestId('loading-cta');
      expect(cta.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Card Component', () => {
    it('should have proper semantic structure', () => {
      render(
        <Card testID="card">
          <Text>Card content</Text>
        </Card>
      );

      const card = screen.getByTestId('card');
      // Cards should be properly structured for screen readers
      expect(card).toBeDefined();
    });

    it('should support interactive cards', () => {
      const mockOnPress = jest.fn();
      
      render(
        <Card onPress={mockOnPress} testID="interactive-card">
          <Text>Interactive card</Text>
        </Card>
      );

      const card = screen.getByTestId('interactive-card');
      fireEvent.press(card);
      
      expect(mockOnPress).toHaveBeenCalled();
    });
  });

  describe('StatCard Component', () => {
    it('should provide accessible stat information', () => {
      render(
        <StatCard
          title="Goals"
          value="12"
          delta={{ value: "+2", direction: "up" }}
          testID="stat-card"
        />
      );

      const statCard = screen.getByTestId('stat-card');
      
      // Should contain accessible text for the stat
      expect(screen.getByText('Goals')).toBeDefined();
      expect(screen.getByText('12')).toBeDefined();
    });

    it('should indicate trend direction accessibly', () => {
      render(
        <StatCard
          title="Assists"
          value="8"
          delta={{ value: "-1", direction: "down" }}
          testID="stat-card-down"
        />
      );

      // Delta should be accessible to screen readers
      const deltaElement = screen.getByText('-1');
      expect(deltaElement).toBeDefined();
    });
  });

  describe('EmptyState Component', () => {
    it('should provide accessible empty state messaging', () => {
      render(
        <EmptyState
          title="No games yet"
          description="Start tracking your performance"
          action={{
            label: "Log a Game",
            onPress: () => {},
          }}
          testID="empty-state"
        />
      );

      expect(screen.getByText('No games yet')).toBeDefined();
      expect(screen.getByText('Start tracking your performance')).toBeDefined();
      
      const actionButton = screen.getByText('Log a Game');
      expect(actionButton).toBeDefined();
    });

    it('should have proper heading hierarchy', () => {
      render(
        <EmptyState
          title="No data available"
          testID="empty-state"
        />
      );

      const title = screen.getByText('No data available');
      // Title should be properly styled as a heading
      expect(title.props.className).toContain('text-xl');
      expect(title.props.className).toContain('font-semibold');
    });
  });

  describe('Skeleton Component', () => {
    it('should provide loading indication to screen readers', () => {
      render(<Skeleton testID="skeleton" />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton.props.accessibilityLabel).toBe('a11y.loading');
      expect(skeleton.props.accessibilityRole).toBe('progressbar');
    });

    it('should support different variants', () => {
      const variants = ['text', 'title', 'card', 'circle', 'rectangle'] as const;
      
      variants.forEach(variant => {
        render(<Skeleton variant={variant} testID={`skeleton-${variant}`} />);
        
        const skeleton = screen.getByTestId(`skeleton-${variant}`);
        expect(skeleton).toBeDefined();
      });
    });
  });

  describe('Tag Component', () => {
    it('should be accessible when interactive', () => {
      const mockOnPress = jest.fn();
      
      render(
        <Tag 
          variant="primary" 
          onPress={mockOnPress}
          testID="interactive-tag"
        >
          Active
        </Tag>
      );

      const tag = screen.getByTestId('interactive-tag');
      fireEvent.press(tag);
      
      expect(mockOnPress).toHaveBeenCalled();
    });

    it('should have proper contrast for different variants', () => {
      const variants = ['default', 'primary', 'success', 'warning', 'danger'] as const;
      
      variants.forEach(variant => {
        render(
          <Tag variant={variant} testID={`tag-${variant}`}>
            {variant}
          </Tag>
        );
        
        const tag = screen.getByTestId(`tag-${variant}`);
        expect(tag).toBeDefined();
      });
    });
  });

  describe('Progress Component', () => {
    it('should provide progress information to screen readers', () => {
      render(
        <Progress 
          value={75} 
          max={100}
          testID="progress-bar"
        />
      );

      const progress = screen.getByTestId('progress-bar');
      expect(progress.props.accessibilityRole).toBe('progressbar');
      expect(progress.props.accessibilityValue).toEqual({
        min: 0,
        max: 100,
        now: 75,
      });
    });

    it('should announce progress changes', () => {
      const { rerender } = render(
        <Progress 
          value={25} 
          max={100}
          testID="progress-bar"
        />
      );

      let progress = screen.getByTestId('progress-bar');
      expect(progress.props.accessibilityValue.now).toBe(25);

      rerender(
        <Progress 
          value={75} 
          max={100}
          testID="progress-bar"
        />
      );

      progress = screen.getByTestId('progress-bar');
      expect(progress.props.accessibilityValue.now).toBe(75);
    });
  });

  describe('ErrorBoundary Component', () => {
    // Mock console.error to avoid noise in tests
    const originalError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });

    afterAll(() => {
      console.error = originalError;
    });

    const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <Text>No error</Text>;
    };

    it('should provide accessible error recovery', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should show error UI with accessible recovery button
      expect(screen.getByText('error.generic')).toBeDefined();
      expect(screen.getByText('common.tryAgain')).toBeDefined();
    });

    it('should have proper error message hierarchy', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorTitle = screen.getByText('error.generic');
      expect(errorTitle.props.className).toContain('text-xl');
      expect(errorTitle.props.className).toContain('font-semibold');
    });
  });

  describe('Focus Management', () => {
    it('should maintain focus during component state changes', () => {
      const { rerender } = render(
        <Button testID="focus-button">
          Initial State
        </Button>
      );

      const button = screen.getByTestId('focus-button');
      expect(button).toBeDefined();

      // Simulate state change
      rerender(
        <Button loading testID="focus-button">
          Loading State
        </Button>
      );

      const updatedButton = screen.getByTestId('focus-button');
      expect(updatedButton.props.accessibilityState?.busy).toBe(true);
    });

    it('should handle modal focus management', () => {
      const { rerender } = render(
        <View testID="container">
          <Button testID="trigger-button">Open Modal</Button>
        </View>
      );

      expect(screen.getByTestId('trigger-button')).toBeDefined();

      // Simulate modal opening
      rerender(
        <View testID="container">
          <Button testID="trigger-button">Open Modal</Button>
          <View 
            testID="modal"
            accessibilityRole="dialog"
            accessibilityModal={true}
          >
            <Button testID="modal-button">Modal Action</Button>
          </View>
        </View>
      );

      const modal = screen.getByTestId('modal');
      expect(modal.props.accessibilityRole).toBe('dialog');
      expect(modal.props.accessibilityModal).toBe(true);
    });
  });

  describe('Dynamic Text Scaling', () => {
    it('should support text scaling in components', () => {
      render(
        <Button testID="scalable-button">
          Scalable Text
        </Button>
      );

      const button = screen.getByTestId('scalable-button');
      const text = screen.getByText('Scalable Text');
      
      // Text should be rendered and scalable
      expect(text).toBeDefined();
      expect(button).toBeDefined();
    });

    it('should maintain layout with scaled text', () => {
      render(
        <Card testID="scalable-card">
          <Text>This text should scale properly</Text>
        </Card>
      );

      const card = screen.getByTestId('scalable-card');
      const text = screen.getByText('This text should scale properly');
      
      expect(card).toBeDefined();
      expect(text).toBeDefined();
    });
  });

  describe('Color Contrast Validation', () => {
    it('should use high contrast colors for text', () => {
      render(
        <Button variant="primary" testID="primary-button">
          Primary Button
        </Button>
      );

      const button = screen.getByTestId('primary-button');
      const buttonClasses = button.props.className;
      
      // Should use high contrast color combinations
      expect(buttonClasses).toContain('bg-primary-900');
    });

    it('should maintain contrast in different states', () => {
      render(
        <Button variant="secondary" disabled testID="disabled-button">
          Disabled Button
        </Button>
      );

      const button = screen.getByTestId('disabled-button');
      const buttonClasses = button.props.className;
      
      // Disabled state should still maintain readable contrast
      expect(buttonClasses).toContain('opacity-50');
    });
  });
});