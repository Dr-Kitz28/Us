/**
 * Glass UI Component Library
 * Premium cinematic design system for the dating app
 * 
 * Features:
 * - Animated gradient backgrounds with film grain
 * - 3D glass cards with parallax and specular highlights
 * - Interactive buttons with ripple, glow, and Easter egg hooks
 * - Grand Intro gameplay sequence
 * - DVD bounce idle mode
 * - Easter Egg Engine
 * - Landscape 7-avatar lineup
 * - Intermission mini-games
 * - AI-assisted introductions
 */

// Core Glass Components
export { GlassPanel, GlassButton, GlassInput } from './GlassPanel'
export { glassUI, glassClasses } from './tokens'

// Enhanced Background System
export { 
  AnimatedBackground, 
  StaticGradientBackground 
} from './AnimatedBackground'

// 3D Glass Cards with Parallax
export { 
  GlassCard3D, 
  FloatingGlass, 
  ParallaxLayer 
} from './GlassCard3D'

// Interactive Elements
export { 
  InteractiveButton, 
  GlassIconButton, 
  LoveButton 
} from './InteractiveButton'

// Grand Intro (Onboarding)
export { 
  GrandIntro, 
  QuickIntro 
} from './GrandIntro'

// Idle Mode & Easter Eggs
export { 
  IdleBounce, 
  EasterEggEngine, 
  ConfettiBurst 
} from './IdleAndEasterEggs'

// Landscape Mode Features
export { 
  LandscapeLineup, 
  useLandscapeDetection, 
  AvatarStrip 
} from './LandscapeLineup'

// Intermission & Mini-Games
export { 
  IntermissionMode, 
  FunLoadingSpinner 
} from './IntermissionMiniGames'

// AI-Assisted Features
export { 
  AIIntroGenerator, 
  QuickMessageSuggestions 
} from './AIIntroGenerator'

// Type exports
export type { } from './GrandIntro'
