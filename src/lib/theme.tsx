/**
 * StatLocker Theme Provider
 *
 * Provides runtime access to design tokens throughout the app.
 * Use this when you need dynamic theming or runtime token access.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { colors, spacing, typography, shadows, utils } from './tokens';

interface ThemeContextValue {
  colors: typeof colors;
  spacing: typeof spacing;
  typography: typeof typography;
  shadows: typeof shadows;
  utils: typeof utils;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme: ThemeContextValue = {
    colors,
    spacing,
    typography,
    shadows,
    utils,
  };

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

/**
 * Hook to access design tokens in components
 *
 * @example
 * const { colors, spacing, utils } = useTheme();
 * const primaryColor = utils.getColor('primary.900');
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

/**
 * Higher-order component to inject theme props
 *
 * @example
 * const MyComponent = withTheme(({ theme, ...props }) => (
 *   <View style={{ backgroundColor: theme.colors.primary[900] }}>
 *     {props.children}
 *   </View>
 * ));
 */
export function withTheme<P extends object>(
  Component: React.ComponentType<P & { theme: ThemeContextValue }>
) {
  return function ThemedComponent(props: P) {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };
}
