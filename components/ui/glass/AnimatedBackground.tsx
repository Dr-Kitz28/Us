'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * AnimatedBackground Component
 * Creates a dynamic gradient background with optional film grain overlay
 * Part of the Glass UI cinematic experience
 */

interface AnimatedBackgroundProps {
  variant?: 'romantic' | 'sunset' | 'night' | 'aurora' | 'cosmic'
  animate?: boolean
  filmGrain?: boolean
  children?: React.ReactNode
  className?: string
}

// Color palettes for different moods
const gradientPalettes = {
  romantic: {
    colors: [
      'rgba(255, 182, 193, 0.4)', // pink
      'rgba(255, 218, 185, 0.4)', // peach
      'rgba(230, 190, 255, 0.35)', // lavender
      'rgba(255, 192, 203, 0.45)', // light pink
    ],
    speed: 12,
  },
  sunset: {
    colors: [
      'rgba(255, 126, 95, 0.45)', // coral
      'rgba(254, 180, 123, 0.4)', // peach
      'rgba(255, 145, 77, 0.35)', // orange
      'rgba(199, 125, 255, 0.3)', // purple hint
    ],
    speed: 10,
  },
  night: {
    colors: [
      'rgba(63, 63, 116, 0.5)', // deep blue
      'rgba(48, 43, 99, 0.45)', // indigo
      'rgba(36, 36, 62, 0.5)', // dark blue
      'rgba(75, 75, 153, 0.4)', // purple
    ],
    speed: 15,
  },
  aurora: {
    colors: [
      'rgba(96, 239, 255, 0.3)', // cyan
      'rgba(164, 255, 220, 0.35)', // mint
      'rgba(99, 255, 186, 0.3)', // green
      'rgba(147, 197, 253, 0.35)', // sky blue
    ],
    speed: 8,
  },
  cosmic: {
    colors: [
      'rgba(139, 92, 246, 0.4)', // violet
      'rgba(236, 72, 153, 0.35)', // pink
      'rgba(59, 130, 246, 0.35)', // blue
      'rgba(167, 139, 250, 0.4)', // purple
    ],
    speed: 14,
  },
}

// Film grain SVG data URL (subtle noise texture)
const filmGrainSvg = `data:image/svg+xml;base64,${btoa(`
  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#grain)" opacity="0.08"/>
  </svg>
`)}`

export function AnimatedBackground({ 
  variant = 'romantic',
  animate = true,
  filmGrain = true,
  children,
  className,
}: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    if (!animate) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const palette = gradientPalettes[variant]
    let time = 0
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    
    // Animated blob positions
    const blobs = palette.colors.map((color, i) => ({
      color,
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 300 + 200,
      xSpeed: (Math.random() - 0.5) * 0.5,
      ySpeed: (Math.random() - 0.5) * 0.5,
      phase: i * (Math.PI / 2),
    }))
    
    const drawFrame = () => {
      time += 0.01
      
      // Clear and fill base
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw animated gradient blobs
      blobs.forEach((blob) => {
        // Move blob
        blob.x += blob.xSpeed + Math.sin(time + blob.phase) * 0.3
        blob.y += blob.ySpeed + Math.cos(time + blob.phase) * 0.3
        
        // Wrap around edges
        if (blob.x < -blob.radius) blob.x = canvas.width + blob.radius
        if (blob.x > canvas.width + blob.radius) blob.x = -blob.radius
        if (blob.y < -blob.radius) blob.y = canvas.height + blob.radius
        if (blob.y > canvas.height + blob.radius) blob.y = -blob.radius
        
        // Draw blob with gradient
        const gradient = ctx.createRadialGradient(
          blob.x, blob.y, 0,
          blob.x, blob.y, blob.radius * (1 + Math.sin(time + blob.phase) * 0.2)
        )
        gradient.addColorStop(0, blob.color)
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2)
        ctx.fill()
      })
      
      animationRef.current = requestAnimationFrame(drawFrame)
    }
    
    drawFrame()
    
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [variant, animate])

  if (!mounted) {
    // SSR fallback with static gradient
    return (
      <div className={cn('fixed inset-0 -z-10', className)}>
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${gradientPalettes[variant].colors.join(', ')})`,
          }}
        />
        {children}
      </div>
    )
  }

  return (
    <div className={cn('fixed inset-0 -z-10 overflow-hidden', className)}>
      {/* Animated canvas background */}
      {animate ? (
        <canvas 
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ filter: 'blur(60px)' }}
        />
      ) : (
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${gradientPalettes[variant].colors.join(', ')})`,
          }}
        />
      )}
      
      {/* Film grain overlay */}
      {filmGrain && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `url("${filmGrainSvg}")`,
            backgroundRepeat: 'repeat',
            mixBlendMode: 'overlay',
          }}
        />
      )}
      
      {/* Subtle vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.1) 100%)',
        }}
      />
      
      {children}
    </div>
  )
}

/**
 * Static gradient background for simpler use cases
 */
export function StaticGradientBackground({
  variant = 'romantic',
  children,
  className,
}: Omit<AnimatedBackgroundProps, 'animate'>) {
  return (
    <AnimatedBackground 
      variant={variant} 
      animate={false}
      className={className}
    >
      {children}
    </AnimatedBackground>
  )
}
