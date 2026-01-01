'use client'

import { motion } from 'framer-motion'

/**
 * Watercolor Background Component
 * Art-forward layered SVG washes for premium aesthetic
 * Performance: Pure SVG, no heavy images, ~5KB total
 */

interface WatercolorBackgroundProps {
  variant?: 'warm' | 'cool' | 'sunset' | 'aurora'
  intensity?: 'subtle' | 'medium' | 'vivid'
  animated?: boolean
  className?: string
}

const colorPalettes = {
  warm: {
    primary: '#FFE4E6',    // rose-100
    secondary: '#FED7AA',  // orange-200
    tertiary: '#FECACA',   // red-200
    accent: '#FEF3C7',     // amber-100
  },
  cool: {
    primary: '#DBEAFE',    // blue-100
    secondary: '#E0E7FF',  // indigo-100
    tertiary: '#CFFAFE',   // cyan-100
    accent: '#F0FDFA',     // teal-50
  },
  sunset: {
    primary: '#FEE2E2',    // red-100
    secondary: '#FFEDD5',  // orange-100
    tertiary: '#FEF9C3',   // yellow-100
    accent: '#FCE7F3',     // pink-100
  },
  aurora: {
    primary: '#ECFDF5',    // emerald-50
    secondary: '#E0F2FE',  // sky-100
    tertiary: '#F3E8FF',   // purple-100
    accent: '#FDF4FF',     // fuchsia-50
  },
}

const opacityLevels = {
  subtle: { base: 0.3, layer: 0.2 },
  medium: { base: 0.5, layer: 0.35 },
  vivid: { base: 0.7, layer: 0.5 },
}

export function WatercolorBackground({
  variant = 'warm',
  intensity = 'medium',
  animated = true,
  className = '',
}: WatercolorBackgroundProps) {
  const colors = colorPalettes[variant]
  const opacity = opacityLevels[intensity]

  const floatAnimation = animated ? {
    y: [0, -10, 0],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  } : {}

  const driftAnimation = animated ? {
    x: [0, 5, 0],
    transition: {
      duration: 12,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  } : {}

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden ${className}`}>
      {/* Base gradient wash */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${colors.primary}${Math.round(opacity.base * 255).toString(16).padStart(2, '0')}, ${colors.secondary}${Math.round(opacity.base * 255).toString(16).padStart(2, '0')})`,
        }}
      />

      {/* Layer 1: Large organic blob - top left */}
      <motion.svg
        className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4"
        viewBox="0 0 400 400"
        animate={floatAnimation}
      >
        <defs>
          <filter id="watercolor1" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="30" />
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>
        <ellipse
          cx="200"
          cy="200"
          rx="180"
          ry="160"
          fill={colors.primary}
          opacity={opacity.layer}
          filter="url(#watercolor1)"
        />
      </motion.svg>

      {/* Layer 2: Medium blob - bottom right */}
      <motion.svg
        className="absolute -bottom-1/4 -right-1/4 w-2/3 h-2/3"
        viewBox="0 0 400 400"
        animate={driftAnimation}
      >
        <defs>
          <filter id="watercolor2" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="25" />
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <ellipse
          cx="200"
          cy="200"
          rx="170"
          ry="150"
          fill={colors.secondary}
          opacity={opacity.layer}
          filter="url(#watercolor2)"
        />
      </motion.svg>

      {/* Layer 3: Accent blob - center */}
      <motion.svg
        className="absolute top-1/4 left-1/3 w-1/2 h-1/2"
        viewBox="0 0 400 400"
        animate={{
          ...floatAnimation,
          transition: { ...floatAnimation.transition, delay: 2 },
        }}
      >
        <defs>
          <filter id="watercolor3" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="20" />
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>
        <ellipse
          cx="200"
          cy="200"
          rx="140"
          ry="120"
          fill={colors.tertiary}
          opacity={opacity.layer * 0.7}
          filter="url(#watercolor3)"
        />
      </motion.svg>

      {/* Layer 4: Small accent blob */}
      <motion.svg
        className="absolute bottom-1/3 left-1/4 w-1/3 h-1/3"
        viewBox="0 0 400 400"
        animate={{
          ...driftAnimation,
          transition: { ...driftAnimation.transition, delay: 4 },
        }}
      >
        <defs>
          <filter id="watercolor4" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="15" />
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        <ellipse
          cx="200"
          cy="200"
          rx="120"
          ry="100"
          fill={colors.accent}
          opacity={opacity.layer * 0.5}
          filter="url(#watercolor4)"
        />
      </motion.svg>

      {/* Noise texture overlay for paper feel */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03] mix-blend-multiply pointer-events-none">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
    </div>
  )
}

export default WatercolorBackground
