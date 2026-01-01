/**
 * Local Storage Utilities for User Data Persistence
 * 
 * Provides utilities to persist user biodata and preferences
 * so users don't have to create accounts repeatedly
 */

const STORAGE_KEYS = {
  USER_BIODATA: 'dating_app_user_biodata',
  USER_PREFERENCES: 'dating_app_user_preferences',
  REMEMBER_ME: 'dating_app_remember_me',
  LAST_LOGIN: 'dating_app_last_login',
  PROFILE_DRAFT: 'dating_app_profile_draft',
  SESSION_DATA: 'dating_app_session'
}

export interface UserBiodata {
  name?: string
  email?: string
  age?: number
  gender?: string
  location?: string
  bio?: string
  interests?: string[]
  photos?: string[]
}

export interface UserPreferences {
  ageRange?: { min: number; max: number }
  distance?: number
  genderPreference?: string[]
  notifications?: {
    email: boolean
    push: boolean
    matches: boolean
    messages: boolean
  }
}

/**
 * Save user biodata to localStorage
 */
export function saveBiodata(biodata: UserBiodata): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_BIODATA, JSON.stringify(biodata))
  } catch (error) {
    console.error('Error saving biodata:', error)
  }
}

/**
 * Get user biodata from localStorage
 */
export function getBiodata(): UserBiodata | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER_BIODATA)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Error getting biodata:', error)
    return null
  }
}

/**
 * Clear user biodata from localStorage
 */
export function clearBiodata(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_BIODATA)
  } catch (error) {
    console.error('Error clearing biodata:', error)
  }
}

/**
 * Save user preferences
 */
export function savePreferences(preferences: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences))
  } catch (error) {
    console.error('Error saving preferences:', error)
  }
}

/**
 * Get user preferences
 */
export function getPreferences(): UserPreferences | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Error getting preferences:', error)
    return null
  }
}

/**
 * Save remember me setting
 */
export function setRememberMe(remember: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, remember.toString())
    if (remember) {
      localStorage.setItem(STORAGE_KEYS.LAST_LOGIN, new Date().toISOString())
    }
  } catch (error) {
    console.error('Error setting remember me:', error)
  }
}

/**
 * Check if remember me is enabled
 */
export function getRememberMe(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true'
  } catch (error) {
    console.error('Error getting remember me:', error)
    return false
  }
}

/**
 * Save profile draft (for incomplete registrations)
 */
export function saveProfileDraft(draft: Partial<UserBiodata>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE_DRAFT, JSON.stringify({
      data: draft,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('Error saving profile draft:', error)
  }
}

/**
 * Get profile draft
 * Returns null if draft is older than 7 days
 */
export function getProfileDraft(): Partial<UserBiodata> | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE_DRAFT)
    if (!data) return null

    const { data: draft, timestamp } = JSON.parse(data)
    const age = Date.now() - new Date(timestamp).getTime()
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000

    if (age > SEVEN_DAYS) {
      localStorage.removeItem(STORAGE_KEYS.PROFILE_DRAFT)
      return null
    }

    return draft
  } catch (error) {
    console.error('Error getting profile draft:', error)
    return null
  }
}

/**
 * Clear profile draft
 */
export function clearProfileDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PROFILE_DRAFT)
  } catch (error) {
    console.error('Error clearing profile draft:', error)
  }
}

/**
 * Save session data
 */
export function saveSessionData(data: any): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION_DATA, JSON.stringify({
      data,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('Error saving session data:', error)
  }
}

/**
 * Get session data
 */
export function getSessionData(): any | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SESSION_DATA)
    if (!stored) return null

    const { data, timestamp } = JSON.parse(stored)
    const age = Date.now() - new Date(timestamp).getTime()
    const ONE_HOUR = 60 * 60 * 1000

    if (age > ONE_HOUR) {
      localStorage.removeItem(STORAGE_KEYS.SESSION_DATA)
      return null
    }

    return data
  } catch (error) {
    console.error('Error getting session data:', error)
    return null
  }
}

/**
 * Clear all stored data
 */
export function clearAllStoredData(): void {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  } catch (error) {
    console.error('Error clearing all data:', error)
  }
}
