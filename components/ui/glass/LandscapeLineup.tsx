'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useAnimation, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { GlassCard3D } from './GlassCard3D'

/**
 * Landscape 7-Avatar Lineup
 * Shows 7 potential matches in a cinematic spread when device is rotated to landscape
 * Inspired by dating show reveals and game character selection screens
 */

interface Avatar {
  id: string
  name: string
  age: number
  imageUrl: string
  tagline?: string
  compatibility?: number
}

interface LandscapeLineupProps {
  avatars: Avatar[]
  onSelect: (avatar: Avatar) => void
  onLike: (avatar: Avatar) => void
  onPass: (avatar: Avatar) => void
  isLandscape?: boolean
}

export function LandscapeLineup({ 
  avatars, 
  onSelect, 
  onLike, 
  onPass,
  isLandscape = false 
}: LandscapeLineupProps) {
  const [selectedIndex, setSelectedIndex] = useState(3) // Center avatar
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controls = useAnimation()
  
  // Take first 7 avatars
  const displayAvatars = avatars.slice(0, 7)
  
  // Calculate positions for cinematic spread
  const getAvatarStyle = (index: number) => {
    const centerIndex = 3
    const offset = index - centerIndex
    const isSelected = index === selectedIndex
    const isHovered = index === hoveredIndex
    
    // Positions spread out from center
    const baseX = offset * 130 // Horizontal spacing
    const baseScale = isSelected ? 1.15 : isHovered ? 1.05 : 1 - Math.abs(offset) * 0.08
    const baseZ = isSelected ? 50 : -Math.abs(offset) * 20
    const baseY = Math.abs(offset) * 8 // Slight arc
    const rotation = offset * -3 // Slight tilt away from center
    
    return {
      x: baseX,
      y: baseY,
      scale: baseScale,
      rotateY: rotation,
      zIndex: isSelected ? 10 : 7 - Math.abs(offset),
      opacity: 1 - Math.abs(offset) * 0.1,
    }
  }
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setSelectedIndex(prev => Math.max(0, prev - 1))
    } else if (e.key === 'ArrowRight') {
      setSelectedIndex(prev => Math.min(displayAvatars.length - 1, prev + 1))
    } else if (e.key === 'Enter') {
      if (displayAvatars[selectedIndex]) {
        onSelect(displayAvatars[selectedIndex])
      }
    }
  }
  
  useEffect(() => {
    if (isLandscape) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isLandscape, selectedIndex, displayAvatars])
  
  // Entry animation
  useEffect(() => {
    if (isLandscape) {
      controls.start(i => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { delay: i * 0.1, type: 'spring', damping: 15 },
      }))
    }
  }, [isLandscape, controls])
  
  if (!isLandscape) return null
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-violet-900/50 to-slate-900 overflow-hidden"
    >
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 2,
              repeat: Infinity,
            }}
          />
        ))}
      </div>
      
      {/* Header */}
      <div className="absolute top-6 left-0 right-0 text-center z-20">
        <motion.h2
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-bold text-white"
        >
          Choose Your Match
        </motion.h2>
        <motion.p
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 0.7 }}
          transition={{ delay: 0.2 }}
          className="text-white/70 text-sm"
        >
          Use ← → to browse • Enter to view profile
        </motion.p>
      </div>
      
      {/* Avatar Lineup */}
      <div 
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{ perspective: '1200px' }}
      >
        <div className="relative flex items-center justify-center">
          {displayAvatars.map((avatar, index) => {
            const style = getAvatarStyle(index)
            const isSelected = index === selectedIndex
            
            return (
              <motion.div
                key={avatar.id}
                custom={index}
                animate={style}
                initial={{ opacity: 0, y: 100, scale: 0.5 }}
                transition={{ type: 'spring', damping: 20, stiffness: 150 }}
                className="absolute cursor-pointer"
                onClick={() => {
                  setSelectedIndex(index)
                  onSelect(avatar)
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ 
                  transformStyle: 'preserve-3d',
                  zIndex: style.zIndex,
                }}
              >
                <div
                  className={cn(
                    'relative w-32 h-44 rounded-2xl overflow-hidden',
                    'transition-shadow duration-300',
                    isSelected && 'ring-4 ring-rose-400 shadow-2xl shadow-rose-500/30'
                  )}
                >
                  {/* Avatar Image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${avatar.imageUrl})` }}
                  />
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <div className="font-semibold text-sm truncate">
                      {avatar.name}, {avatar.age}
                    </div>
                    {avatar.compatibility && (
                      <div className="text-xs text-rose-300">
                        {avatar.compatibility}% match
                      </div>
                    )}
                  </div>
                  
                  {/* Selection indicator */}
                  {isSelected && (
                    <motion.div
                      layoutId="selection-glow"
                      className="absolute inset-0 border-2 border-rose-400 rounded-2xl"
                      initial={false}
                    />
                  )}
                </div>
                
                {/* Name plate for selected */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
                    >
                      <span className="text-white/90 text-sm font-medium">
                        {avatar.tagline || 'Tap to view profile'}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
      
      {/* Action buttons for selected avatar */}
      <AnimatePresence>
        {displayAvatars[selectedIndex] && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-6"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onPass(displayAvatars[selectedIndex])}
              className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-2xl"
            >
              ✕
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onLike(displayAvatars[selectedIndex])}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-rose-500/40"
            >
              ♥
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(displayAvatars[selectedIndex])}
              className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-xl"
            >
              👤
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Close/rotate hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        className="absolute bottom-4 right-4 text-white/50 text-xs"
      >
        Rotate device to return to normal view
      </motion.div>
    </motion.div>
  )
}

/**
 * Hook to detect landscape orientation
 */
export function useLandscapeDetection() {
  const [isLandscape, setIsLandscape] = useState(false)
  
  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window !== 'undefined') {
        setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth > 768)
      }
    }
    
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)
    
    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])
  
  return isLandscape
}

/**
 * Compact avatar strip for portrait mode
 */
interface AvatarStripProps {
  avatars: Avatar[]
  onSelect: (avatar: Avatar) => void
  className?: string
}

export function AvatarStrip({ avatars, onSelect, className }: AvatarStripProps) {
  const displayAvatars = avatars.slice(0, 5)
  
  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto py-2 px-4', className)}>
      {displayAvatars.map((avatar, index) => (
        <motion.button
          key={avatar.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(avatar)}
          className="relative flex-shrink-0 w-16 h-16 rounded-full overflow-hidden ring-2 ring-white/30 hover:ring-rose-400 transition-all"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${avatar.imageUrl})` }}
          />
          {avatar.compatibility && avatar.compatibility > 90 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-xs text-white">
              ⭐
            </div>
          )}
        </motion.button>
      ))}
      
      {avatars.length > 5 && (
        <div className="flex-shrink-0 w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 text-sm">
          +{avatars.length - 5}
        </div>
      )}
    </div>
  )
}
