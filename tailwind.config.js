/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  
  // Enable dark mode via class strategy for manual control
  darkMode: 'class',
  
  theme: {
    extend: {
      /**
       * PRISM Color System
       * 
       * Designed for WCAG 2.2 Level AAA compliance:
       * - Minimum 7:1 contrast ratio for normal text
       * - Minimum 4.5:1 contrast ratio for large text
       * - Distinct colors for colorblind accessibility
       */
      colors: {
        // Primary brand colors - passes AAA contrast
        prism: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        
        // High contrast colors for accessibility mode
        'hc': {
          'bg': '#000000',
          'bg-alt': '#1a1a1a',
          'text': '#ffffff',
          'text-muted': '#e5e5e5',
          'border': '#ffffff',
          'focus': '#ffff00', // High visibility focus ring
          'link': '#00ffff',
          'success': '#00ff00',
          'warning': '#ffff00',
          'error': '#ff6b6b',
        },
        
        // Chart colors - selected for colorblind accessibility
        chart: {
          blue: '#0077BB',    // Safe for protanopia/deuteranopia
          orange: '#EE7733',  // High contrast against blue
          cyan: '#33BBEE',    // Distinct from blue
          magenta: '#EE3377', // Distinct from all
          teal: '#009988',    // Safe alternative
          grey: '#BBBBBB',    // Neutral reference
        },
      },
      
      /**
       * Font sizing system
       * Base: 16px minimum (EN 301 549 requirement)
       * Large: 18px+ for enhanced readability
       */
      fontSize: {
        'xs': ['0.875rem', { lineHeight: '1.5' }],     // 14px - use sparingly
        'sm': ['1rem', { lineHeight: '1.5' }],         // 16px - minimum body
        'base': ['1.125rem', { lineHeight: '1.6' }],   // 18px - default body
        'lg': ['1.25rem', { lineHeight: '1.6' }],      // 20px
        'xl': ['1.5rem', { lineHeight: '1.5' }],       // 24px
        '2xl': ['1.875rem', { lineHeight: '1.4' }],    // 30px
        '3xl': ['2.25rem', { lineHeight: '1.3' }],     // 36px
        '4xl': ['3rem', { lineHeight: '1.2' }],        // 48px
      },
      
      /**
       * Spacing for touch targets
       * Minimum 44x44px touch targets (WCAG 2.5.5)
       */
      spacing: {
        'touch': '44px',
        'touch-lg': '48px',
      },
      
      /**
       * Focus ring styling
       * High visibility for keyboard navigation
       */
      ringWidth: {
        'focus': '3px',
      },
      ringOffsetWidth: {
        'focus': '2px',
      },
      
      /**
       * Animation - respects prefers-reduced-motion
       */
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
      },
      
      /**
       * Border radius for consistent UI
       */
      borderRadius: {
        'prism': '8px',
      },
      
      /**
       * Box shadows with focus states
       */
      boxShadow: {
        'focus-ring': '0 0 0 3px rgba(14, 165, 233, 0.5)',
        'focus-ring-hc': '0 0 0 3px #ffff00',
      },
    },
  },
  
  plugins: [
    /**
     * Custom plugin for accessibility utilities
     */
    function({ addUtilities, addVariant }) {
      // Screen reader only content
      addUtilities({
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: '0',
        },
        '.not-sr-only': {
          position: 'static',
          width: 'auto',
          height: 'auto',
          padding: '0',
          margin: '0',
          overflow: 'visible',
          clip: 'auto',
          whiteSpace: 'normal',
        },
        // Focus visible utility
        '.focus-visible-ring': {
          '&:focus-visible': {
            outline: 'none',
            boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.5)',
          },
        },
        // High contrast focus
        '.focus-visible-ring-hc': {
          '&:focus-visible': {
            outline: '3px solid #ffff00',
            outlineOffset: '2px',
          },
        },
        // Minimum touch target
        '.touch-target': {
          minWidth: '44px',
          minHeight: '44px',
        },
      });
      
      // Reduced motion variant
      addVariant('motion-safe', '@media (prefers-reduced-motion: no-preference)');
      addVariant('motion-reduce', '@media (prefers-reduced-motion: reduce)');
      
      // High contrast mode variant
      addVariant('high-contrast', '@media (prefers-contrast: more)');
      addVariant('forced-colors', '@media (forced-colors: active)');
    },
  ],
};
