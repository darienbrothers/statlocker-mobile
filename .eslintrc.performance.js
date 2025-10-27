/**
 * ESLint Performance Rules Configuration
 * 
 * This configuration includes rules specifically focused on performance
 * and should be used in addition to the main ESLint configuration.
 */

module.exports = {
  extends: [
    'plugin:react-hooks/recommended',
  ],
  plugins: [
    'react-hooks',
    'react-native-performance',
  ],
  rules: {
    // React Hooks Performance
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // React Performance Rules
    'react/jsx-no-bind': ['warn', {
      allowArrowFunctions: false,
      allowBind: false,
      allowFunctions: false,
    }],
    'react/jsx-no-constructed-context-values': 'warn',
    'react/no-unstable-nested-components': 'warn',
    'react/no-array-index-key': 'warn',

    // General Performance Rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',

    // Custom Performance Rules
    'no-inline-styles': 'off', // We use NativeWind classes
    'no-heavy-computations-in-render': 'off', // Custom rule (would need implementation)
    
    // React Native Specific Performance Rules
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'warn',
    'react-native/no-raw-text': 'off', // We handle this with our Text components
  },
  
  // Performance-specific overrides
  overrides: [
    {
      // Stricter rules for components
      files: ['src/components/**/*.{ts,tsx}'],
      rules: {
        'react/jsx-no-bind': 'error',
        'react/no-unstable-nested-components': 'error',
        'react/jsx-no-constructed-context-values': 'error',
      },
    },
    {
      // Relaxed rules for tests
      files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
      rules: {
        'react/jsx-no-bind': 'off',
        'no-console': 'off',
      },
    },
    {
      // Strict rules for performance-critical files
      files: ['src/lib/performance*.ts', 'src/hooks/use*.ts'],
      rules: {
        'prefer-const': 'error',
        'no-var': 'error',
        'react-hooks/exhaustive-deps': 'error',
      },
    },
  ],

  // Performance-focused environments
  env: {
    'react-native/react-native': true,
  },

  // Performance settings
  settings: {
    'react': {
      version: 'detect',
    },
    'react-native/style-sheet-object-names': ['StyleSheet', 'styles'],
  },
};