/**
 * Easter Eggs System
 * Seasonal specials, hidden features, and rewards
 */

export interface EasterEgg {
  id: string
  name: string
  trigger: 'date' | 'gesture' | 'context' | 'hotspot'
  condition: () => boolean
  reward: {
    type: 'cosmetic' | 'content' | 'perk' | 'feature'
    value: string
    description: string
  }
  expiry?: Date
  icon?: string
}

// Storage for discovered eggs
const DISCOVERED_EGGS_KEY = 'dating_app_discovered_eggs'

export class EasterEggSystem {
  private static eggs: EasterEgg[] = [
    // Holiday Eggs
    {
      id: 'new_year_2026',
      name: 'New Year Celebration',
      trigger: 'date',
      condition: () => {
        const date = new Date()
        return date.getMonth() === 0 && date.getDate() === 1
      },
      reward: {
        type: 'cosmetic',
        value: 'fireworks_theme',
        description: 'Fireworks animation theme'
      },
      expiry: new Date('2026-01-02'),
      icon: '🎆'
    },
    {
      id: 'valentines_2026',
      name: "Valentine's Day Special",
      trigger: 'date',
      condition: () => {
        const date = new Date()
        return date.getMonth() === 1 && date.getDate() === 14
      },
      reward: {
        type: 'perk',
        value: 'free_spotlight',
        description: 'Free 24-hour profile spotlight'
      },
      expiry: new Date('2026-02-15'),
      icon: '💝'
    },
    {
      id: 'christmas_2026',
      name: 'Christmas Magic',
      trigger: 'date',
      condition: () => {
        const date = new Date()
        return date.getMonth() === 11 && date.getDate() === 25
      },
      reward: {
        type: 'cosmetic',
        value: 'snow_theme',
        description: 'Falling snow animation'
      },
      expiry: new Date('2026-12-26'),
      icon: '🎄'
    },
    
    // Gesture Eggs
    {
      id: 'seven_taps',
      name: 'Secret Developer Mode',
      trigger: 'gesture',
      condition: () => false, // Triggered manually via tap counter
      reward: {
        type: 'feature',
        value: 'dev_mode',
        description: 'Access to advanced settings'
      },
      icon: '🔧'
    },
    
    // Context Eggs
    {
      id: 'first_match_valentine',
      name: 'Valentine Match',
      trigger: 'context',
      condition: () => false, // Triggered manually
      reward: {
        type: 'perk',
        value: 'duo_discount',
        description: '50% off duo date tickets'
      },
      icon: '💑'
    },
    {
      id: 'midnight_match',
      name: 'Midnight Connection',
      trigger: 'context',
      condition: () => {
        const hour = new Date().getHours()
        return hour === 0 // Midnight
      },
      reward: {
        type: 'content',
        value: 'midnight_story',
        description: 'Unlock exclusive midnight story'
      },
      icon: '🌙'
    }
  ]

  /**
   * Check all easter eggs and return active ones
   */
  static checkEasterEggs(): EasterEgg[] {
    const now = new Date()
    return this.eggs.filter(egg => {
      // Check expiry
      if (egg.expiry && now > egg.expiry) {
        return false
      }
      
      // Check condition
      return egg.condition()
    })
  }

  /**
   * Get discovered eggs from localStorage
   */
  static getDiscoveredEggs(): string[] {
    try {
      const stored = localStorage.getItem(DISCOVERED_EGGS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      return []
    }
  }

  /**
   * Mark an egg as discovered
   */
  static discoverEgg(eggId: string): boolean {
    try {
      const discovered = this.getDiscoveredEggs()
      if (discovered.includes(eggId)) {
        return false // Already discovered
      }
      
      discovered.push(eggId)
      localStorage.setItem(DISCOVERED_EGGS_KEY, JSON.stringify(discovered))
      return true
    } catch (error) {
      console.error('Error saving discovered egg:', error)
      return false
    }
  }

  /**
   * Check if an egg is discovered
   */
  static isDiscovered(eggId: string): boolean {
    return this.getDiscoveredEggs().includes(eggId)
  }

  /**
   * Get an egg by ID
   */
  static getEgg(eggId: string): EasterEgg | undefined {
    return this.eggs.find(egg => egg.id === eggId)
  }

  /**
   * Get all eggs (for admin/debug)
   */
  static getAllEggs(): EasterEgg[] {
    return this.eggs
  }

  /**
   * Trigger a context-based egg manually
   */
  static triggerContextEgg(eggId: string): boolean {
    const egg = this.getEgg(eggId)
    if (!egg || egg.trigger !== 'context') {
      return false
    }
    
    return this.discoverEgg(eggId)
  }
}

/**
 * Hook for using Easter eggs in React components
 */
export function useEasterEggs() {
  const [activeEggs, setActiveEggs] = useState<EasterEgg[]>([])
  const [discovered, setDiscovered] = useState<string[]>([])

  useEffect(() => {
    // Check for active eggs
    const active = EasterEggSystem.checkEasterEggs()
    setActiveEggs(active)
    
    // Load discovered eggs
    setDiscovered(EasterEggSystem.getDiscoveredEggs())
    
    // Check every minute for new date-based eggs
    const interval = setInterval(() => {
      const newActive = EasterEggSystem.checkEasterEggs()
      setActiveEggs(newActive)
    }, 60000)
    
    return () => clearInterval(interval)
  }, [])

  const discoverEgg = (eggId: string) => {
    const wasNew = EasterEggSystem.discoverEgg(eggId)
    if (wasNew) {
      setDiscovered(EasterEggSystem.getDiscoveredEggs())
      return true
    }
    return false
  }

  const isDiscovered = (eggId: string) => {
    return discovered.includes(eggId)
  }

  return {
    activeEggs,
    discovered,
    discoverEgg,
    isDiscovered
  }
}

// Import React for the hook
import { useState, useEffect } from 'react'
