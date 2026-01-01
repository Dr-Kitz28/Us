'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * Glass Card Component
 * Frosted glass aesthetic with subtle animations
 */

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  variant?: 'default' | 'elevated' | 'outlined' | 'solid'
  blur?: 'sm' | 'md' | 'lg' | 'xl'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
  children: React.ReactNode
}

const blurLevels = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
}

const paddingLevels = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
}

const variantStyles = {
  default: 'bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/50',
  elevated: 'bg-white/80 dark:bg-slate-900/80 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50',
  outlined: 'bg-transparent border-2 border-slate-200/50 dark:border-slate-700/50',
  solid: 'bg-white dark:bg-slate-900 shadow-lg',
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ 
    variant = 'default',
    blur = 'md',
    padding = 'md',
    hover = false,
    className,
    children,
    ...props
  }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-2xl overflow-hidden',
          'transition-all duration-300',
          variantStyles[variant],
          blurLevels[blur],
          paddingLevels[padding],
          hover && 'hover:shadow-2xl hover:-translate-y-1',
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

GlassCard.displayName = 'GlassCard'

// Profile Card variant with image support
interface ProfileGlassCardProps extends GlassCardProps {
  imageUrl?: string
  imageAlt?: string
  imagePosition?: 'top' | 'left' | 'background'
}

export const ProfileGlassCard = forwardRef<HTMLDivElement, ProfileGlassCardProps>(
  ({
    imageUrl,
    imageAlt = 'Profile',
    imagePosition = 'top',
    children,
    className,
    ...props
  }, ref) => {
    if (imagePosition === 'background') {
      return (
        <GlassCard
          ref={ref}
          padding="none"
          className={cn('relative overflow-hidden', className)}
          {...props}
        >
          {imageUrl && (
            <div className="absolute inset-0">
              <img 
                src={imageUrl} 
                alt={imageAlt}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>
          )}
          <div className="relative z-10 p-6">
            {children}
          </div>
        </GlassCard>
      )
    }

    return (
      <GlassCard
        ref={ref}
        padding="none"
        className={cn(
          imagePosition === 'left' && 'flex flex-row',
          className
        )}
        {...props}
      >
        {imageUrl && (
          <div className={cn(
            'overflow-hidden',
            imagePosition === 'top' && 'h-48 w-full',
            imagePosition === 'left' && 'w-1/3 min-h-full'
          )}>
            <img 
              src={imageUrl} 
              alt={imageAlt}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-4 flex-1">
          {children}
        </div>
      </GlassCard>
    )
  }
)

ProfileGlassCard.displayName = 'ProfileGlassCard'

export default GlassCard
