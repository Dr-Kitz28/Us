# Cinematic Dating App UI/UX Implementation Guide

## Overview
This document outlines the implementation of a premium, cinematic dating experience inspired by Shopify Editions and Naked City Films aesthetic principles.

## Core Philosophy
**"Dating as a premiere, not a feed"**

Transform the dating app from a generic swipe feed into a narrative, chaptered experience with progression, easter eggs, and premium aesthetics.

## 1. Glass UI Design System

### Visual Foundation
```typescript
// Design tokens for Glass UI
export const glassUI = {
  background: {
    gradient: 'linear-gradient(135deg, rgba(255,182,193,0.1) 0%, rgba(173,216,230,0.1) 100%)',
    noise: 'url(/textures/grain.png)', // Subtle film grain
  },
  glass: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  },
  depth: {
    near: 'translateZ(50px)',
    mid: 'translateZ(25px)',
    far: 'translateZ(0px)',
  }
}
```

### Implementation Steps
1. Create glass panel component (`/components/ui/GlassPanel.tsx`)
2. Add animated gradient background to layouts
3. Implement parallax depth layers
4. Add specular edge highlights
5. Support "Reduce transparency" accessibility mode

## 2. Grand Intro/Premiere Sequence

### Flow (30-45 seconds)
```
Scene 1: Title Card (5s)
  - Logo reveal with ambient music
  - "Season 01" subtitle
  - Fade in from black

Scene 2: Vibe Selection (10s)
  - Choose personality: Cozy / Chaos / Serious / Funny / Slow-burn
  - Affects matching algorithm and UI theme

Scene 3: Character Setup (10s)
  - Photo → Avatar preview
  - Name/Pronouns input
  - Animated transitions

Scene 4: Rules Explanation (10s)
  - Matching logic visualization
  - Safety controls preview
  - Trust & authenticity promise

Scene 5: Tutorial as Story (5-10s)
  - First "casting call" lineup
  - Interactive swipe tutorial
  - Transition to main app
```

### State Machine
```typescript
type IntroState = 
  | 'title_card'
  | 'vibe_selection'
  | 'character_setup'
  | 'rules_explanation'
  | 'tutorial'
  | 'completed'

const transitions = {
  title_card: 'vibe_selection',
  vibe_selection: 'character_setup',
  character_setup: 'rules_explanation',
  rules_explanation: 'tutorial',
  tutorial: 'completed'
}
```

## 3. Easter Eggs System

### Types of Easter Eggs
1. **Holiday Specials**: Auto-triggered on dates
2. **Gesture Sequences**: Tap logo 7 times
3. **Context Triggers**: First match during Valentine's week
4. **Hidden Hotspots**: Clickable areas in UI

### Rewards
- Cosmetic themes (snow, festival lights, confetti)
- Hidden "episode" stories
- Duo ticket discounts/coupons
- Exclusive mini-games

### Implementation
```typescript
interface EasterEgg {
  id: string
  trigger: 'date' | 'gesture' | 'context' | 'hotspot'
  condition: () => boolean
  reward: {
    type: 'cosmetic' | 'content' | 'perk'
    value: string
  }
  expiry?: Date
}

// Example: Valentine's Day egg
{
  id: 'valentines_2026',
  trigger: 'date',
  condition: () => {
    const date = new Date()
    return date.getMonth() === 1 && date.getDate() === 14
  },
  reward: {
    type: 'cosmetic',
    value: 'heart_confetti_theme'
  },
  expiry: new Date('2026-02-15')
}
```

## 4. Interactive Button Animations

### Button Behavior
- **Default**: Glass pill with subtle shimmer
- **Hover (web)**: Micro-illustration plays (spark, film scratch, neon underline)
- **Press (mobile)**: Haptic feedback + animation
- **Long-press**: Radial menu for secondary actions

### Implementation with Rive/Lottie
```typescript
// components/ui/AnimatedButton.tsx
import { useRive } from '@rive-app/react-canvas'

export function AnimatedButton({ children, onClick, animation }) {
  const { RiveComponent } = useRive({
    src: animation,
    stateMachines: 'hover',
    autoplay: true,
  })

  return (
    <button 
      className="relative glass-button"
      onClick={onClick}
      onMouseEnter={() => /* trigger hover state */}
    >
      <RiveComponent className="absolute inset-0" />
      <span className="relative z-10">{children}</span>
    </button>
  )
}
```

## 5. DVD Bounce Idle Mode

### Behavior
- Triggers after N seconds of inactivity
- Company logo/name bounces like DVD screensaver
- Tap anywhere to unlock tiny tip or easter egg
- Collision detection avoids notches/safe areas

### Implementation
```typescript
const useDVDBounce = (inactivityTimeout = 60000) => {
  const [isIdle, setIsIdle] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [velocity, setVelocity] = useState({ x: 2, y: 2 })
  
  useEffect(() => {
    if (!isIdle) return
    
    const interval = setInterval(() => {
      setPosition(prev => {
        let newX = prev.x + velocity.x
        let newY = prev.y + velocity.y
        
        // Bounce off edges
        if (newX <= 0 || newX >= window.innerWidth - 100) {
          setVelocity(v => ({ ...v, x: -v.x }))
        }
        if (newY <= 0 || newY >= window.innerHeight - 50) {
          setVelocity(v => ({ ...v, y: -v.y }))
        }
        
        return { x: newX, y: newY }
      })
    }, 16)
    
    return () => clearInterval(interval)
  }, [isIdle, velocity])
  
  return { isIdle, position }
}
```

## 6. Landscape Mode: 7-Avatar Lineup

### Dual Mode Design

**Portrait (Default)**
- Single cinematic profile card
- Swipe left/right
- "Beats" per profile: Photo + Prompt + Music clip + Optional intro

**Landscape (Casting Lineup)**
- 7 avatars in horizontal scroll
- Scroll right → New candidates
- Scroll left → History basket (viewed profiles)
- Tap avatar → Opens side panel with full profile

### Implementation
```typescript
const useOrientation = () => {
  const [isLandscape, setIsLandscape] = useState(false)
  
  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return isLandscape
}

// Queue model
interface FeedQueue {
  forwardStack: Profile[]  // Upcoming candidates
  backwardStack: Profile[] // History basket
  current: Profile | null
}
```

## 7. AI-Assisted Introductions

### User Choices
1. **No intro** ("Quiet mode")
2. **Manual intro** (User writes)
3. **AI assist** (Draft + user edits)

### Trust-First Guardrails
- **Source chips**: Show what AI used
- **Accuracy slider**: Literal → Lightly stylized
- **Explicit approval**: No auto-post
- **Blacklist**: "Don't mention" topics

### Implementation
```typescript
interface AIIntro {
  draft: string
  sources: Array<{
    type: 'profile' | 'interests' | 'photos'
    confidence: number
  }>
  accuracyLevel: number // 0-100
  blacklist: string[]
}

async function generateIntro(profile: Profile, settings: AIIntroSettings): Promise<AIIntro> {
  // Call AI service with profile data
  // Apply accuracy slider
  // Filter blacklisted topics
  // Return draft with source attribution
}
```

## 8. Offline Mini-Games + Ambient Audio

### Mini-Games (Dating-Relevant)
1. **Conversation Builder**: Choose responses, learn tone
2. **Two Truths & a Lie**: Pre-made packs
3. **Chill Puzzles**: Match-the-vibe games
4. **Memory Lane**: Private journaling prompts

### Audio System
- **Built-in ambient loops** (offline)
- **Spotify integration** (online):
  - Vibe matching via top artists/genres
  - Shared playlist on match
  - Profile anthem preview

### Implementation
```typescript
const AudioEngine = {
  ambientLoops: [
    'soft_piano.mp3',
    'nature_sounds.mp3',
    'lo_fi_beats.mp3'
  ],
  
  crossfade: (from: string, to: string, duration: number) => {
    // Smooth audio transition
  },
  
  duck: (volume: number) => {
    // Lower volume for notifications
  },
  
  mute: () => {
    // One-tap global mute
  }
}

// Spotify integration
async function connectSpotify() {
  // OAuth flow
  // Fetch top artists/genres
  // Generate compatibility score
}
```

## 9. Avatar Generation System

### Pipeline
1. User uploads 3-6 photos
2. Server checks: Face present, lighting quality
3. Generate 3 stylized variants (proprietary art style)
4. User selects one; can opt out anytime

### Trust Features
- "Looks like me" confirmation
- "Too different" report
- No body/face exaggerations
- Identity-preserving stylization

### Implementation
```typescript
interface AvatarGenerationRequest {
  photos: string[] // URLs or base64
  style: 'artistic' | 'minimal' | 'realistic'
}

interface AvatarGenerationResponse {
  variants: Array<{
    url: string
    style: string
    confidence: number
  }>
  warnings?: string[]
}

// API endpoint
POST /api/avatar/generate
```

## 10. Spotify Integration

### Features
1. **Profile Connection**: Display top artists
2. **Vibe Matching**: Compare music taste
3. **Shared Playlists**: Auto-generated on match
4. **Anthem Preview**: 30s clip on profile

### OAuth Flow
```typescript
const SPOTIFY_SCOPES = [
  'user-top-read',
  'playlist-modify-public',
  'user-read-recently-played'
]

async function authorizeSpotify() {
  const authUrl = `https://accounts.spotify.com/authorize?` +
    `client_id=${CLIENT_ID}&` +
    `response_type=code&` +
    `redirect_uri=${REDIRECT_URI}&` +
    `scope=${SPOTIFY_SCOPES.join(' ')}`
  
  // Redirect to Spotify
  window.location.href = authUrl
}
```

## File Structure

```
/app
  /premiere          # Grand intro sequence
  /app
    /feed           # Enhanced with landscape mode
    /intermission   # Mini-games + idle mode
  
/components
  /ui
    /glass          # Glass UI components
    /animated       # Interactive buttons
  /easter-eggs      # Easter egg system
  /audio            # Audio engine
  /avatar           # Avatar generation
  
/lib
  /premiere         # Intro state machine
  /easter-eggs      # Trigger system
  /audio-engine     # Audio management
  /spotify          # Spotify integration
  
/public
  /textures         # Film grain, etc.
  /audio            # Ambient loops
  /animations       # Rive/Lottie files
```

## Implementation Priority

### Phase 1: Foundation (High Priority)
1. Glass UI system
2. Basic easter eggs (holiday)
3. Interactive button animations

### Phase 2: Experience (Medium Priority)
1. Grand intro sequence
2. DVD bounce idle mode
3. Landscape lineup view

### Phase 3: Advanced (Lower Priority)
1. AI-assisted introductions
2. Offline mini-games
3. Avatar generation
4. Spotify integration

## Testing Checklist

- [ ] Glass UI works on low-end Android
- [ ] Intro sequence can be skipped
- [ ] Easter eggs don't break core functionality
- [ ] Animations respect "Reduce Motion"
- [ ] Audio mutes properly
- [ ] Landscape mode on tablets
- [ ] AI intro respects blacklist
- [ ] Spotify OAuth flow
- [ ] Avatar generation quality
- [ ] Offline mode works

## Performance Targets

- **First paint**: < 1.5s on 3G
- **Intro skippable**: Always
- **Animation FPS**: 60fps on mid-range devices
- **Audio latency**: < 100ms
- **Avatar generation**: < 30s
- **Cache strategy**: Aggressive for static assets

## Accessibility

- **Reduce Motion**: Disable non-essential animations
- **Reduce Transparency**: Solid backgrounds instead of glass
- **Screen Readers**: Full support for all features
- **Keyboard Navigation**: Complete keyboard control
- **Color Contrast**: WCAG AAA compliance

## Notes

- All animations are opt-out via accessibility settings
- Easter eggs never block core functionality
- AI features have explicit user consent
- Spotify integration is optional
- Audio defaults to muted on first load
- Offline mode gracefully degrades features

---

**Implementation Status**: Planning Complete ✓
**Next Steps**: Begin Phase 1 (Glass UI + Basic Easter Eggs)
