/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Single Royal Blue Brand System - No mixing other blue scales
        primary: {
          900: '#0047AB', // Royal Blue (brand)
          800: '#1558B8',
          700: '#1F56C4',
          600: '#2E6FD6',
          500: '#3A84E9',
          100: '#E6F0FF',
        },

        // Status Colors
        success: '#00D4FF', // Aqua Glow
        warning: '#F5C542', // Momentum Gold
        danger: '#DC2626', // Crimson Red

        // Neutral Grays
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          400: '#9CA3AF',
          500: '#6B7280',
          900: '#111827',
        },

        // Surfaces
        white: '#FFFFFF',
        muted: '#1F1F1F',

        // Focus Ring Colors
        'focus-outer': '#0047AB',
        'focus-inner': '#9CA3AF',
      },

      // 8pt Spacing Scale - Precise measurements
      spacing: {
        1: '4px', // 4pt
        2: '8px', // 8pt
        3: '12px', // 12pt
        4: '16px', // 16pt
        5: '20px', // 20pt
        6: '24px', // 24pt
        8: '32px', // 32pt
        10: '40px', // 40pt
        // Additional spacing for specific components
        14: '56px', // CTA height
        16: '64px', // Tab bar base height
        17: '68px', // Tab bar max height
        18: '72px', // CTA container height
        20: '80px', // CTA container with inset
      },

      // Border Radius System
      borderRadius: {
        xl: '16px', // 16pt
        '2xl': '24px', // 24pt
        '3xl': '28px', // 28pt
        '4xl': '32px', // 32pt
      },

      // Shadow System
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.06)',
        cta: '0 8px 24px rgba(0,71,171,.18)',
      },

      // Typography System
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Captions: 12–13pt medium
        xs: ['12px', { lineHeight: '16px', fontWeight: '500' }],
        sm: ['13px', { lineHeight: '18px', fontWeight: '500' }],
        // Body: 15–16pt regular
        base: ['16px', { lineHeight: '24px', fontWeight: '400' }],
        lg: ['15px', { lineHeight: '22px', fontWeight: '400' }],
        // Titles: 22–24pt semibold
        xl: ['20px', { lineHeight: '28px', fontWeight: '600' }],
        '2xl': ['22px', { lineHeight: '30px', fontWeight: '600' }],
        '3xl': ['24px', { lineHeight: '32px', fontWeight: '600' }],
      },

      // Animation Timing
      transitionDuration: {
        120: '120ms', // Micro-interactions
        180: '180ms', // Content transitions
        200: '200ms', // Tab transitions
        240: '240ms', // Entrance animations
      },

      // Component-specific utilities
      minHeight: {
        14: '56px', // Minimum button height
        touch: '44px', // Minimum touch target
      },
      minWidth: {
        touch: '44px', // Minimum touch target
      },

      // Focus ring configuration
      ringWidth: {
        DEFAULT: '2px',
      },
      ringColor: {
        DEFAULT: '#0047AB',
      },
      ringOffsetWidth: {
        DEFAULT: '2px',
      },
      ringOffsetColor: {
        DEFAULT: '#9CA3AF',
      },
    },
  },
  plugins: [],
};
