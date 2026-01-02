'use client'

import { forwardRef, useState, useRef, useCallback } from 'react'
import { motion, useAnimation, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Interactive Glass Button with Hover/Press Animations
 * Features: Ripple effect, Glow pulse, Haptic feedback simulation
 * Supports Easter Egg hooks for special interactions
 */

interface InteractiveButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'love'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  glow?: boolean
  ripple?: boolean
  bounce?: boolean
  easterEgg?: {
    trigger: 'triple-tap' | 'long-press' | 'swipe-up'
    onTrigger: () => void
  }
  children: React.ReactNode
}

const variants = {
  primary: {
    base: 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600',
    text: 'text-white',
    shadow: 'shadow-lg shadow-rose-500/30',
    glow: 'rose-500',
    rippleColor: 'rgba(255, 255, 255, 0.4)',
  },
  secondary: {
    base: 'bg-white/20 backdrop-blur-md border border-white/30',
    text: 'text-slate-800 dark:text-white',
    shadow: 'shadow-md shadow-slate-200/30 dark:shadow-none',
    glow: 'white',
    rippleColor: 'rgba(0, 0, 0, 0.1)',
  },
  ghost: {
    base: 'bg-transparent hover:bg-white/10',
    text: 'text-slate-700 dark:text-white',
    shadow: '',
    glow: 'slate-300',
    rippleColor: 'rgba(100, 100, 100, 0.2)',
  },
  accent: {
    base: 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500',
    text: 'text-white',
    shadow: 'shadow-lg shadow-amber-500/30',
    glow: 'amber-400',
    rippleColor: 'rgba(255, 255, 255, 0.4)',
  },
  love: {
    base: 'bg-gradient-to-r from-pink-500 via-red-500 to-rose-500',
    text: 'text-white',
    shadow: 'shadow-lg shadow-red-500/40',
    glow: 'red-400',
    rippleColor: 'rgba(255, 255, 255, 0.5)',
  },
}

const sizes = {
  sm: 'px-4 py-2 text-sm rounded-xl min-h-[36px]',
  md: 'px-6 py-3 text-base rounded-2xl min-h-[44px]',
  lg: 'px-8 py-4 text-lg rounded-2xl min-h-[52px]',
  xl: 'px-10 py-5 text-xl rounded-3xl min-h-[60px]',
}

export const InteractiveButton = forwardRef<HTMLButtonElement, InteractiveButtonProps>(
  ({ 
    variant = 'primary',
    size = 'md',
    glow = true,
    ripple = true,
    bounce = true,
    easterEgg,
    children,
    className,
    disabled,
    onClick,
    ...props 
  }, ref) => {
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])
    const [isPressed, setIsPressed] = useState(false)
    const [tapCount, setTapCount] = useState(0)
    const tapTimer = useRef<NodeJS.Timeout>()
    const longPressTimer = useRef<NodeJS.Timeout>()
    const controls = useAnimation()
    const buttonRef = useRef<HTMLButtonElement>(null)
    
    const variantStyles = variants[variant]
    const sizeStyles = sizes[size]
    
    // Handle ripple effect
    const createRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (!ripple) return
      
      const button = e.currentTarget
      const rect = button.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const id = Date.now()
      
      setRipples(prev => [...prev, { x, y, id }])
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id))
      }, 600)
    }, [ripple])
    
    // Easter egg: Triple tap detection
    const handleTripleTap = useCallback(() => {
      if (easterEgg?.trigger !== 'triple-tap') return
      
      setTapCount(prev => prev + 1)
      
      if (tapTimer.current) clearTimeout(tapTimer.current)
      tapTimer.current = setTimeout(() => setTapCount(0), 500)
      
      if (tapCount >= 2) {
        easterEgg.onTrigger()
        setTapCount(0)
        // Visual feedback
        controls.start({
          scale: [1, 1.1, 0.95, 1.05, 1],
          rotate: [0, -5, 5, -3, 0],
        })
      }
    }, [easterEgg, tapCount, controls])
    
    // Easter egg: Long press detection
    const handleLongPressStart = useCallback(() => {
      if (easterEgg?.trigger !== 'long-press') return
      
      longPressTimer.current = setTimeout(() => {
        easterEgg.onTrigger()
        // Haptic-like visual feedback
        controls.start({
          scale: [1, 0.95, 1.05, 1],
          transition: { duration: 0.3 },
        })
      }, 800)
    }, [easterEgg, controls])
    
    const handleLongPressEnd = useCallback(() => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }, [])
    
    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      createRipple(e)
      handleTripleTap()
      onClick?.(e as any)
    }, [createRipple, handleTripleTap, onClick])
    
    return (
      <motion.button
        ref={ref}
        className={cn(
          // Base styles
          'relative inline-flex items-center justify-center',
          'font-semibold overflow-hidden',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
          'select-none touch-manipulation',
          
          // Variant and size styles
          variantStyles.base,
          variantStyles.text,
          variantStyles.shadow,
          sizeStyles,
          
          className
        )}
        animate={controls}
        whileHover={!disabled && bounce ? { scale: 1.03, y: -2 } : {}}
        whileTap={!disabled ? { scale: 0.97 } : {}}
        onMouseDown={() => {
          setIsPressed(true)
          handleLongPressStart()
        }}
        onMouseUp={() => {
          setIsPressed(false)
          handleLongPressEnd()
        }}
        onMouseLeave={() => {
          setIsPressed(false)
          handleLongPressEnd()
        }}
        onClick={handleClick}
        disabled={disabled}
        {...props}
      >
        {/* Glow effect on hover */}
        {glow && (
          <motion.div
            className="absolute inset-0 rounded-inherit opacity-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, rgba(255,255,255,0.25) 0%, transparent 70%)`,
            }}
            animate={{ opacity: isPressed ? 0.5 : 0 }}
            whileHover={{ opacity: 0.3 }}
          />
        )}
        
        {/* Ripple effects */}
        {ripples.map(({ x, y, id }) => (
          <motion.span
            key={id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: x,
              top: y,
              backgroundColor: variantStyles.rippleColor,
            }}
            initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0.6 }}
            animate={{
              width: 200,
              height: 200,
              x: -100,
              y: -100,
              opacity: 0,
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
        
        {/* Shine sweep effect on hover */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
          }}
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />
        
        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </motion.button>
    )
  }
)

InteractiveButton.displayName = 'InteractiveButton'

/**
 * Icon Button variant with circular shape
 */
interface IconButtonProps extends Omit<InteractiveButtonProps, 'size'> {
  size?: 'sm' | 'md' | 'lg'
}

export const GlassIconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = 'md', className, children, ...props }, ref) => {
    const sizeMap = {
      sm: 'w-10 h-10',
      md: 'w-12 h-12',
      lg: 'w-14 h-14',
    }
    
    return (
      <InteractiveButton
        ref={ref}
        variant="secondary"
        className={cn(
          '!rounded-full !p-0',
          sizeMap[size],
          className
        )}
        {...props}
      >
        {children}
      </InteractiveButton>
    )
  }
)

GlassIconButton.displayName = 'GlassIconButton'

/**
 * Love/Like Button with heart animation
 */
interface LoveButtonProps extends Omit<InteractiveButtonProps, 'variant'> {
  liked?: boolean
  onLikeChange?: (liked: boolean) => void
}

export function LoveButton({ liked = false, onLikeChange, className, ...props }: LoveButtonProps) {
  const controls = useAnimation()
  
  const handleClick = async () => {
    if (!liked) {
      // Heart burst animation
      await controls.start({
        scale: [1, 0.8, 1.3, 1],
        transition: { duration: 0.4 },
      })
    }
    onLikeChange?.(!liked)
  }
  
  return (
    <motion.button
      animate={controls}
      onClick={handleClick}
      className={cn(
        'relative w-16 h-16 rounded-full',
        'flex items-center justify-center',
        'transition-colors duration-300',
        liked 
          ? 'bg-gradient-to-br from-rose-500 to-red-500 shadow-lg shadow-rose-500/40' 
          : 'bg-white/20 backdrop-blur-md border border-white/30',
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className={cn(
          'w-8 h-8 transition-colors duration-300',
          liked ? 'fill-white' : 'fill-none stroke-slate-600 stroke-2'
        )}
        animate={liked ? { scale: [1, 1.2, 1] } : {}}
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </motion.svg>
      
      {/* Heart particles on like */}
      {liked && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-rose-400 rounded-full"
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos((i * 60 * Math.PI) / 180) * 40,
                y: Math.sin((i * 60 * Math.PI) / 180) * 40,
                opacity: 0,
                scale: 0,
              }}
              transition={{ duration: 0.5, delay: 0.1 }}
            />
          ))}
        </>
      )}
    </motion.button>
  )
}
