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
`
