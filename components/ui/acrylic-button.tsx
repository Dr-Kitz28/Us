'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * Acrylic Button Component
 * Paint-stroke aesthetic with glass morphism
 * Uses SVG masks for organic edges
 */

interface AcrylicButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  glow?: boolean
  ripple?: boolean
  children: React.ReactNode
}

const variants = {
  primary: {
    bg: 'bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600',
    text: 'text-white',
    shadow: 'shadow-lg shadow-rose-500/30',
    hoverShadow: 'hover:shadow-xl hover:shadow-rose-500/40',
    glow: 'before:bg-rose-400',
  },
  secondary: {
    bg: 'bg-gradient-to-br from-slate-100 via-white to-slate-200',
    text: 'text-slate-800',
    shadow: 'shadow-lg shadow-slate-300/50',
    hoverShadow: 'hover:shadow-xl hover:shadow-slate-400/40',
    glow: 'before:bg-slate-300',
  },
  accent: {
    bg: 'bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600',
    text: 'text-white',
    shadow: 'shadow-lg shadow-amber-500/30',
    hoverShadow: 'hover:shadow-xl hover:shadow-amber-500/40',
    glow: 'before:bg-amber-400',
  },
  ghost: {
    bg: 'bg-white/10 backdrop-blur-sm border border-white/20',
    text: 'text-slate-700 dark:text-white',
    shadow: 'shadow-sm',
    hoverShadow: 'hover:bg-white/20 hover:shadow-md',
    glow: 'before:bg-white',
  },
  danger: {
    bg: 'bg-gradient-to-br from-red-500 via-red-600 to-red-700',
    text: 'text-white',
    shadow: 'shadow-lg shadow-red-500/30',
    hoverShadow: 'hover:shadow-xl hover:shadow-red-500/40',
    glow: 'before:bg-red-400',
  },
}

const sizes = {
  sm: 'px-4 py-2 text-sm min-h-[36px]',
  md: 'px-6 py-2.5 text-base min-h-[44px]',
  lg: 'px-8 py-3 text-lg min-h-[52px]',
  xl: 'px-10 py-4 text-xl min-h-[60px]',
}

export const AcrylicButton = forwardRef<HTMLButtonElement, AcrylicButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    glow = false,
    ripple = true,
    className, 
    children, 
    disabled,
    ...props 
  }, ref) => {
    const variantStyles = variants[variant]
    const sizeStyles = sizes[size]

    return (
      <motion.button
        ref={ref}
        className={cn(
          // Base styles
          'relative inline-flex items-center justify-center',
          'font-semibold tracking-wide',
          'rounded-2xl overflow-hidden',
          'transition-all duration-300 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
          
          // Acrylic paint stroke mask effect
          'before:absolute before:inset-0 before:rounded-2xl before:opacity-0',
          glow && 'before:blur-xl before:transition-opacity before:duration-300',
          glow && 'hover:before:opacity-30',
          
          // Variant and size
          variantStyles.bg,
          variantStyles.text,
          variantStyles.shadow,
          !disabled && variantStyles.hoverShadow,
          glow && variantStyles.glow,
          sizeStyles,
          
          className
        )}
        whileHover={disabled ? {} : { 
          scale: 1.02,
          y: -2,
        }}
        whileTap={disabled ? {} : { 
          scale: 0.98,
          y: 0,
        }}
        disabled={disabled}
        {...props}
      >
        {/* SVG paint stroke overlay for organic feel */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none opacity-10"
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="brushTexture">
              <feTurbulence 
                type="fractalNoise" 
                baseFrequency="0.04" 
                numOctaves="3" 
                result="noise"
              />
              <feDisplacementMap 
                in="SourceGraphic" 
                in2="noise" 
                scale="3" 
              />
            </filter>
          </defs>
          <rect 
            width="100%" 
            height="100%" 
            fill="currentColor" 
            filter="url(#brushTexture)"
            opacity="0.3"
          />
        </svg>

        {/* Content with slight glass effect */}
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>

        {/* Shimmer effect on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
          initial={false}
          whileHover={{ 
            translateX: '100%',
            transition: { duration: 0.6, ease: 'easeInOut' }
          }}
        />
      </motion.button>
    )
  }
)

AcrylicButton.displayName = 'AcrylicButton'

// Icon button variant
interface AcrylicIconButtonProps extends Omit<AcrylicButtonProps, 'size'> {
  size?: 'sm' | 'md' | 'lg'
}

const iconSizes = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-14 h-14',
}

export const AcrylicIconButton = forwardRef<HTMLButtonElement, AcrylicIconButtonProps>(
  ({ size = 'md', className, children, ...props }, ref) => {
    return (
      <AcrylicButton
        ref={ref}
        size="sm"
        className={cn(
          'rounded-full p-0',
          iconSizes[size],
          className
        )}
        {...props}
      >
        {children}
      </AcrylicButton>
    )
  }
)

AcrylicIconButton.displayName = 'AcrylicIconButton'

export default AcrylicButton
