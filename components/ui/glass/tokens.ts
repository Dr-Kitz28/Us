/**
 * Glass UI Design Tokens
 * Premium cinematic design system with frosted glass aesthetics
 */

export const glassUI = {
  // Background gradients
  background: {
    gradient: 'linear-gradient(135deg, rgba(255,182,193,0.15) 0%, rgba(173,216,230,0.15) 100%)',
    gradientDark: 'linear-gradient(135deg, rgba(139,0,139,0.2) 0%, rgba(0,0,139,0.2) 100%)',
    noise: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iLjA1Ii8+PC9zdmc+',
  },
  
  // Glass panel styles
  glass: {
    background: 'rgba(255, 255, 255, 0.1)',
    backgroundDark: 'rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(10px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderDark: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    borderRadius: '16px',
  },
  
  // Depth/parallax layers
  depth: {
    near: 'translateZ(50px)',
    mid: 'translateZ(25px)',
    far: 'translateZ(0px)',
  },
  
  // Motion easing
  motion: {
    snappy: 'cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    dramatic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  
  // Animation durations
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  
  // Shimmer effect
  shimmer: {
    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
    animation: 'shimmer 2s infinite',
  },
}

export const glassClasses = {
  // Base glass panel
  panel: [
    'relative',
    'bg-white/10',
    'backdrop-blur-md',
    'backdrop-saturate-180',
    'border border-white/20',
    'rounded-2xl',
    'shadow-2xl',
  ].join(' '),
  
  // Glass panel with hover effect
  panelHover: [
    'relative',
    'bg-white/10',
    'backdrop-blur-md',
    'backdrop-saturate-180',
    'border border-white/20',
    'rounded-2xl',
    'shadow-2xl',
    'transition-all duration-300',
    'hover:bg-white/15',
    'hover:border-white/30',
    'hover:shadow-3xl',
  ].join(' '),
  
  // Glass button
  button: [
    'relative',
    'bg-white/10',
    'backdrop-blur-md',
    'backdrop-saturate-180',
    'border border-white/20',
    'rounded-full',
    'px-6 py-3',
    'transition-all duration-200',
    'hover:bg-white/20',
    'hover:scale-105',
    'active:scale-95',
  ].join(' '),
  
  // Glass input
  input: [
    'relative',
    'bg-white/10',
    'backdrop-blur-md',
    'backdrop-saturate-180',
    'border border-white/20',
    'rounded-lg',
    'px-4 py-2',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-white/40',
    'focus:border-transparent',
  ].join(' '),
}

// Enhanced design tokens for Glass UI system
export const glassDesignTokens = {
  // Animation timings
  timing: {
    instant: '100ms',
    fast: '200ms',
    normal: '300ms',
    slow: '500ms',
    cinematic: '800ms',
  },
  
  // Easing curves
  easing: {
    snappy: 'cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    dramatic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    bounce: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
  },
  
  // Glass blur levels
  blur: {
    subtle: '4px',
    light: '8px',
    medium: '12px',
    strong: '20px',
    heavy: '40px',
  },
  
  // Opacity levels for glass
  opacity: {
    whisper: 0.05,
    subtle: 0.1,
    light: 0.2,
    medium: 0.4,
    strong: 0.6,
    solid: 0.8,
  },
  
  // Glow/shadow presets
  glow: {
    soft: '0 0 20px rgba(255, 255, 255, 0.2)',
    medium: '0 0 40px rgba(255, 255, 255, 0.3)',
    strong: '0 0 60px rgba(255, 255, 255, 0.4)',
    rose: '0 0 40px rgba(244, 63, 94, 0.4)',
    amber: '0 0 40px rgba(251, 191, 36, 0.4)',
    violet: '0 0 40px rgba(139, 92, 246, 0.4)',
  },
  
  // Border styles
  border: {
    subtle: '1px solid rgba(255, 255, 255, 0.1)',
    light: '1px solid rgba(255, 255, 255, 0.2)',
    medium: '1px solid rgba(255, 255, 255, 0.3)',
    strong: '2px solid rgba(255, 255, 255, 0.4)',
    glow: '1px solid rgba(255, 255, 255, 0.5)',
  },
  
  // Gradient presets
  gradients: {
    romantic: 'linear-gradient(135deg, rgba(244, 63, 94, 0.3), rgba(236, 72, 153, 0.3))',
    sunset: 'linear-gradient(135deg, rgba(251, 146, 60, 0.3), rgba(244, 63, 94, 0.3))',
    night: 'linear-gradient(135deg, rgba(79, 70, 229, 0.3), rgba(139, 92, 246, 0.3))',
    aurora: 'linear-gradient(135deg, rgba(34, 211, 238, 0.3), rgba(74, 222, 128, 0.3))',
    cosmic: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3))',
  },
  
  // Z-index layers
  layers: {
    background: -10,
    base: 0,
    cards: 10,
    elevated: 20,
    overlay: 30,
    modal: 40,
    intro: 45,
    idle: 50,
    toast: 60,
  },
}

// Keyframes for animations (add to global CSS)
export const glassAnimations = `
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(255, 255, 255, 0.5);
  }
}

@keyframes heartbeat {
  0%, 100% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.1);
  }
  50% {
    transform: scale(1);
  }
  75% {
    transform: scale(1.05);
  }
}

@keyframes dvd-bounce {
  0% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(calc(100vw - 120px), calc(50vh - 60px));
  }
  50% {
    transform: translate(calc(50vw - 60px), calc(100vh - 60px));
  }
  75% {
    transform: translate(0, calc(50vh - 30px));
  }
  100% {
    transform: translate(0, 0);
  }
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-10vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}
`
