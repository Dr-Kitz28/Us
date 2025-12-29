/**
 * Dating App Design System
 * Production-grade UI/UX components for India-first Gen-Z experience
 */

export const designTokens = {
  // Color palette - calm, premium, trustworthy
  colors: {
    primary: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444', // Main brand color
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  // Typography scale
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      display: 'Georgia, "Times New Roman", serif',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Spacing scale (8pt grid)
  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem',    // 96px
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',  // 4px
    md: '0.5rem',   // 8px
    lg: '0.75rem',  // 12px
    xl: '1rem',     // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },

  // Motion tokens
  motion: {
    duration: {
      fast: '150ms',
      base: '250ms',
      slow: '350ms',
    },
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Z-index layers
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    modal: 1300,
    popover: 1400,
    toast: 1500,
  },
}

export const componentStyles = {
  // Card component
  card: {
    base: 'bg-white rounded-xl shadow-md overflow-hidden',
    padding: 'p-6',
    hover: 'transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg',
  },

  // Button variants
  button: {
    base: 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    sizes: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
      xl: 'px-8 py-4 text-xl',
    },
    variants: {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
      secondary: 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300 focus:ring-neutral-500',
      outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 focus:ring-primary-500',
      ghost: 'text-primary-500 hover:bg-primary-50 focus:ring-primary-500',
      danger: 'bg-error text-white hover:bg-red-600 focus:ring-error',
    },
  },

  // Input field
  input: {
    base: 'w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all',
    error: 'border-error focus:ring-error',
    disabled: 'bg-neutral-100 cursor-not-allowed',
  },

  // Badge
  badge: {
    base: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
    variants: {
      verified: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      new: 'bg-yellow-100 text-yellow-800',
      premium: 'bg-purple-100 text-purple-800',
    },
  },

  // Avatar
  avatar: {
    base: 'relative inline-block rounded-full overflow-hidden',
    sizes: {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16',
      '2xl': 'w-24 h-24',
    },
    ring: 'ring-2 ring-white ring-offset-2',
  },

  // Modal
  modal: {
    overlay: 'fixed inset-0 bg-black bg-opacity-50 z-modal',
    container: 'fixed inset-0 z-modal flex items-center justify-center p-4',
    content: 'bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto',
  },

  // Toast notification
  toast: {
    base: 'fixed bottom-4 right-4 z-toast bg-white rounded-lg shadow-lg p-4 flex items-center space-x-3 min-w-[300px]',
    variants: {
      success: 'border-l-4 border-success',
      error: 'border-l-4 border-error',
      warning: 'border-l-4 border-warning',
      info: 'border-l-4 border-info',
    },
  },
}

// Accessibility helpers
export const a11y = {
  // Touch targets (minimum 44x44px as per iOS HIG)
  minTouchTarget: 'min-w-[44px] min-h-[44px]',
  
  // Focus visible
  focusVisible: 'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
  
  // Screen reader only
  srOnly: 'sr-only',
}

// Responsive breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}

// India-specific design considerations
export const indiaFirstDesign = {
  // Regional language support
  languages: ['en', 'hi', 'ta', 'te', 'mr', 'bn', 'gu', 'kn', 'ml', 'pa'],
  
  // Font stack for Devanagari (Hindi)
  hindiFont: '"Noto Sans Devanagari", "Helvetica Neue", Arial, sans-serif',
  
  // Cultural color meanings in India
  culturalColors: {
    auspicious: '#FF6B35',  // Saffron/Orange
    festive: '#D32F2F',      // Red
    prosperity: '#FFD700',   // Gold
    purity: '#FFFFFF',       // White
  },
  
  // Festival themes (optional seasonal updates)
  festivals: {
    diwali: { primary: '#FFD700', accent: '#D32F2F' },
    holi: { primary: '#FF1493', accent: '#00CED1' },
    eid: { primary: '#50C878', accent: '#FFD700' },
  },
}

// Animation presets
export const animations = {
  // Swipe card animations
  swipeCard: {
    enter: 'animate-slide-in-right',
    exit: 'animate-slide-out-left',
    like: 'animate-bounce-subtle',
    nope: 'animate-shake',
  },
  
  // Match celebration
  matchCelebration: {
    confetti: 'animate-confetti',
    fadeIn: 'animate-fade-in-up',
    pulse: 'animate-pulse-once',
  },
  
  // Loading states
  loading: {
    skeleton: 'animate-pulse',
    spinner: 'animate-spin',
  },
}

// Tailwind config extension
export const tailwindExtension = {
  theme: {
    extend: {
      colors: designTokens.colors,
      fontFamily: designTokens.typography.fontFamily,
      fontSize: designTokens.typography.fontSize,
      spacing: designTokens.spacing,
      borderRadius: designTokens.borderRadius,
      boxShadow: designTokens.shadows,
      zIndex: designTokens.zIndex,
      transitionDuration: designTokens.motion.duration,
      transitionTimingFunction: designTokens.motion.easing,
    },
  },
}
