'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * DVD Bounce Idle Mode
 * Classic DVD screensaver-style animation that activates after inactivity
 * Changes color on corner bounces - triggers easter egg on perfect corner hit
 */

interface IdleBounceProps {
  idleTimeout?: number // ms before activation
  onCornerHit?: () => void // Easter egg callback for perfect corner hit
  logo?: React.ReactNode
  className?: string
}

const colors = [
  'from-rose-500 to-pink-500',
  'from-violet-500 to-purple-500',
  'from-cyan-500 to-blue-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-green-500',
  'from-red-500 to-rose-500',
]

export function IdleBounce({ 
  idleTimeout = 60000, // 1 minute default
  onCornerHit,
  logo,
  className 
}: IdleBounceProps) {
  const [isIdle, setIsIdle] = useState(false)
  const [colorIndex, setColorIndex] = useState(0)
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const [velocity, setVelocity] = useState({ x: 2, y: 1.5 })
  const [cornerHitCount, setCornerHitCount] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  const idleTimerRef = useRef<NodeJS.Timeout>()
  
  const logoSize = 120
  
  // Reset idle timer on any user activity
  const resetIdleTimer = useCallback(() => {
    setIsIdle(false)
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => setIsIdle(true), idleTimeout)
  }, [idleTimeout])
  
  // Set up activity listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => document.addEventListener(event, resetIdleTimer))
    
    // Initial timer
    resetIdleTimer()
    
    return () => {
      events.forEach(event => document.removeEventListener(event, resetIdleTimer))
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [resetIdleTimer])
  
  // Animation loop
  useEffect(() => {
    if (!isIdle || !containerRef.current) return
    
    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    const maxX = rect.width - logoSize
    const maxY = rect.height - logoSize
    
    let x = position.x
    let y = position.y
    let vx = velocity.x
    let vy = velocity.y
    
    const animate = () => {
      x += vx
      y += vy
      
      let bounced = false
      let cornerDistance = Infinity
      
      // Check bounds and bounce
      if (x <= 0 || x >= maxX) {
        vx = -vx
        x = Math.max(0, Math.min(maxX, x))
        bounced = true
      }
      
      if (y <= 0 || y >= maxY) {
        vy = -vy
        y = Math.max(0, Math.min(maxY, y))
        bounced = true
      }
      
      if (bounced) {
        setColorIndex(prev => (prev + 1) % colors.length)
        
        // Check if it's a corner hit (within 10px of corner)
        const corners = [
          { x: 0, y: 0 },
          { x: maxX, y: 0 },
          { x: 0, y: maxY },
          { x: maxX, y: maxY },
        ]
        
        cornerDistance = Math.min(...corners.map(c => 
          Math.sqrt(Math.pow(x - c.x, 2) + Math.pow(y - c.y, 2))
        ))
        
        if (cornerDistance < 10) {
          setCornerHitCount(prev => prev + 1)
          onCornerHit?.()
        }
      }
      
      setPosition({ x, y })
      setVelocity({ x: vx, y: vy })
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isIdle, onCornerHit])
  
  if (!isIdle) return null
  
  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'fixed inset-0 z-40 bg-black/90 cursor-pointer',
        className
      )}
      onClick={() => setIsIdle(false)}
    >
      {/* Instructions */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-sm">
        Click anywhere to resume
      </div>
      
      {/* Corner hit counter (easter egg) */}
      {cornerHitCount > 0 && (
        <div className="absolute top-6 right-6 text-white/60 text-sm">
          Corner hits: {cornerHitCount} 🎯
        </div>
      )}
      
      {/* Bouncing logo */}
      <motion.div
        className={cn(
          'absolute w-[120px] h-[60px] rounded-xl',
          'bg-gradient-to-r',
          colors[colorIndex],
          'flex items-center justify-center',
          'shadow-lg shadow-current/50',
          'transition-colors duration-300'
        )}
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        {logo || (
          <span className="text-white font-bold text-2xl" style={{ fontFamily: 'Georgia, serif' }}>
            Us
          </span>
        )}
      </motion.div>
    </motion.div>
  )
}

/**
 * Easter Egg Engine
 * Manages hidden features, secret codes, and holiday specials
 */

interface EasterEgg {
  id: string
  trigger: 'konami' | 'shake' | 'tap-sequence' | 'date' | 'word' | 'corner-hit'
  unlocked: boolean
  reward?: React.ReactNode
  message?: string
}

interface EasterEggEngineProps {
  onUnlock?: (egg: EasterEgg) => void
  children?: React.ReactNode
}

// Konami code sequence
const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a'
]

export function EasterEggEngine({ onUnlock, children }: EasterEggEngineProps) {
  const [eggs, setEggs] = useState<EasterEgg[]>([
    { id: 'konami', trigger: 'konami', unlocked: false, message: '🎮 You know the code!' },
    { id: 'shaker', trigger: 'shake', unlocked: false, message: '📱 Shake it off!' },
    { id: 'corner-master', trigger: 'corner-hit', unlocked: false, message: '🎯 Perfect Corner!' },
    { id: 'valentines', trigger: 'date', unlocked: false, message: '💕 Happy Valentine\'s!' },
    { id: 'love-typed', trigger: 'word', unlocked: false, message: '💝 Love is in the air!' },
  ])
  const [showReward, setShowReward] = useState<EasterEgg | null>(null)
  const [konamiProgress, setKonamiProgress] = useState<string[]>([])
  const shakeRef = useRef({ x: 0, y: 0, z: 0, shakeCount: 0 })
  
  // Check for holiday dates
  useEffect(() => {
    const today = new Date()
    const month = today.getMonth()
    const day = today.getDate()
    
    // Valentine's Day
    if (month === 1 && day === 14) {
      unlockEgg('valentines')
    }
  }, [])
  
  // Konami code listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key
      const newProgress = [...konamiProgress, key].slice(-10)
      setKonamiProgress(newProgress)
      
      if (newProgress.join(',') === KONAMI_CODE.join(',')) {
        unlockEgg('konami')
        setKonamiProgress([])
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [konamiProgress])
  
  // Device shake detection
  useEffect(() => {
    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return
    
    const handleMotion = (e: DeviceMotionEvent) => {
      const { x, y, z } = e.accelerationIncludingGravity || {}
      if (x === null || y === null || z === null) return
      
      const ref = shakeRef.current
      const deltaX = Math.abs((x || 0) - ref.x)
      const deltaY = Math.abs((y || 0) - ref.y)
      const deltaZ = Math.abs((z || 0) - ref.z)
      
      if (deltaX + deltaY + deltaZ > 30) {
        ref.shakeCount++
        if (ref.shakeCount > 5) {
          unlockEgg('shaker')
          ref.shakeCount = 0
        }
      }
      
      ref.x = x || 0
      ref.y = y || 0
      ref.z = z || 0
    }
    
    window.addEventListener('devicemotion', handleMotion)
    return () => window.removeEventListener('devicemotion', handleMotion)
  }, [])
  
  const unlockEgg = useCallback((id: string) => {
    setEggs(prev => {
      const egg = prev.find(e => e.id === id)
      if (!egg || egg.unlocked) return prev
      
      const updated = prev.map(e => 
        e.id === id ? { ...e, unlocked: true } : e
      )
      
      // Show reward
      const unlockedEgg = updated.find(e => e.id === id)
      if (unlockedEgg) {
        setShowReward(unlockedEgg)
        setTimeout(() => setShowReward(null), 3000)
        onUnlock?.(unlockedEgg)
      }
      
      return updated
    })
  }, [onUnlock])
  
  // Expose unlock function for external triggers
  useEffect(() => {
    (window as any).__unlockEasterEgg = unlockEgg
    return () => {
      // ensure cleanup returns void (delete returns boolean)
      // avoid returning the result of `delete` which is a boolean
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete (window as any).__unlockEasterEgg
    }
  }, [unlockEgg])
  
  return (
    <>
      {children}
      
      {/* Easter Egg Reward Toast */}
      {showReward && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-gradient-to-r from-violet-500 to-purple-500 text-white px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <div className="font-bold">Easter Egg Found!</div>
              <div className="text-sm opacity-90">{showReward.message}</div>
            </div>
          </div>
        </motion.div>
      )}
    </>
  )
}

/**
 * Confetti burst effect for celebrations
 */
export function ConfettiBurst({ trigger }: { trigger: boolean }) {
  const controls = useAnimation()
  
  useEffect(() => {
    if (trigger) {
      controls.start('animate')
    }
  }, [trigger, controls])
  
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: ['#f43f5e', '#ec4899', '#a855f7', '#3b82f6', '#22c55e', '#eab308'][i % 6],
    angle: (i / 50) * 360,
    distance: 100 + Math.random() * 100,
  }))
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute left-1/2 top-1/2 w-3 h-3 rounded-full"
          style={{ backgroundColor: particle.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          variants={{
            animate: {
              x: Math.cos((particle.angle * Math.PI) / 180) * particle.distance,
              y: Math.sin((particle.angle * Math.PI) / 180) * particle.distance,
              opacity: 0,
              scale: 0,
              transition: { duration: 1, ease: 'easeOut' },
            },
          }}
          animate={controls}
        />
      ))}
    </div>
  )
}
