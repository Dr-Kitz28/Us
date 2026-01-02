'use client'

import { ReactNode, forwardRef, useState, useRef } from 'react'
import { motion, HTMLMotionProps, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Enhanced Glass Card with 3D Parallax and Edge Highlights
 * Creates depth perception with mouse tracking and soft shadows
 */

interface GlassCard3DProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  children: ReactNode
  intensity?: 'subtle' | 'normal' | 'dramatic'
  glowColor?: string
  specularHighlight?: boolean
  tiltEnabled?: boolean
  className?: string
}

const intensitySettings = {
  subtle: { tilt: 5, scale: 1.01, glow: 0.1 },
  normal: { tilt: 10, scale: 1.02, glow: 0.2 },
  dramatic: { tilt: 20, scale: 1.03, glow: 0.35 },
}

export const GlassCard3D = forwardRef<HTMLDivElement, GlassCard3DProps>(
  ({ 
    children, 
    intensity = 'normal',
    glowColor = 'rgba(255, 255, 255, 0.4)',
    specularHighlight = true,
    tiltEnabled = true,
    className,
    ...props 
  }, ref) => {
    const cardRef = useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false)
    
    const settings = intensitySettings[intensity]
    
    // Motion values for smooth tracking
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    
    // Spring physics for natural movement
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [settings.tilt, -settings.tilt]), {
      stiffness: 150,
      damping: 20,
    })
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-settings.tilt, settings.tilt]), {
      stiffness: 150,
      damping: 20,
    })
    
    // Specular highlight position
    const highlightX = useSpring(useTransform(mouseX, [-0.5, 0.5], [20, 80]), {
      stiffness: 100,
      damping: 15,
    })
    const highlightY = useSpring(useTransform(mouseY, [-0.5, 0.5], [20, 80]), {
      stiffness: 100,
      damping: 15,
    })
    
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!tiltEnabled || !cardRef.current) return
      
      const rect = cardRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      mouseX.set((e.clientX - centerX) / rect.width)
      mouseY.set((e.clientY - centerY) / rect.height)
    }
    
    const handleMouseLeave = () => {
      setIsHovered(false)
      mouseX.set(0)
      mouseY.set(0)
    }
    
    return (
      <motion.div
        ref={cardRef}
        className={cn(
          'relative rounded-3xl overflow-hidden',
          'bg-white/10 dark:bg-black/20',
          'backdrop-blur-xl backdrop-saturate-150',
          'border border-white/20 dark:border-white/10',
          className
        )}
        style={{
          transformStyle: 'preserve-3d',
          perspective: '1000px',
          rotateX: tiltEnabled ? rotateX : 0,
          rotateY: tiltEnabled ? rotateY : 0,
        }}
        whileHover={{ scale: settings.scale }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {/* Frosted glass base layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 dark:from-white/5 dark:to-white/3" />
        
        {/* Soft shadow layer for depth */}
        <div 
          className={cn(
            'absolute inset-0 transition-opacity duration-300',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
          style={{
            boxShadow: `
              0 20px 50px -15px rgba(0, 0, 0, 0.3),
              0 10px 20px -10px rgba(0, 0, 0, 0.2),
              inset 0 1px 1px rgba(255, 255, 255, 0.3)
            `,
          }}
        />
        
        {/* Specular edge highlight */}
        {specularHighlight && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(
                circle at ${highlightX}% ${highlightY}%,
                ${glowColor} 0%,
                transparent 50%
              )`,
              opacity: isHovered ? settings.glow : 0,
            }}
          />
        )}
        
        {/* Top edge specular line */}
        <div 
          className="absolute top-0 left-4 right-4 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
          }}
        />
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    )
  }
)

GlassCard3D.displayName = 'GlassCard3D'

/**
 * Floating Glass Element
 * Adds a subtle floating animation with depth
 */
interface FloatingGlassProps {
  children: ReactNode
  delay?: number
  amplitude?: number
  className?: string
}

export function FloatingGlass({ 
  children, 
  delay = 0,
  amplitude = 10,
  className 
}: FloatingGlassProps) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -amplitude, 0],
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Parallax Glass Layers
 * Creates depth with multiple glass layers that respond to scroll/mouse
 */
interface ParallaxLayerProps {
  children: ReactNode
  depth: 'front' | 'mid' | 'back'
  className?: string
}

const depthMultipliers = {
  front: 1.2,
  mid: 0.8,
  back: 0.4,
}

export function ParallaxLayer({ children, depth, className }: ParallaxLayerProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const multiplier = depthMultipliers[depth]
  
  const translateX = useTransform(x, (val) => val * multiplier)
  const translateY = useTransform(y, (val) => val * multiplier)
  
  return (
    <motion.div
      className={cn('will-change-transform', className)}
      style={{ x: translateX, y: translateY }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        x.set((e.clientX - centerX) * 0.02)
        y.set((e.clientY - centerY) * 0.02)
      }}
      onMouseLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}
