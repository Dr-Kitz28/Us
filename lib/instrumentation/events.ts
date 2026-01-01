/**
 * Event Instrumentation System
 * Canonical event logging for ML training and analytics
 * 
 * Key principles:
 * - Never log raw PII (emails, names, phone numbers)
 * - Use hashed IDs for analytics
 * - Enforce retention windows
 * - Sample non-essential analytics
 */

import { createHash } from 'crypto'

// ============================================
// Types
// ============================================

export type EventType = 
  | 'impression'
  | 'swipe'
  | 'match'
  | 'message_meta'
  | 'block'
  | 'report'
  | 'session_start'
  | 'session_end'
  | 'profile_view'
  | 'photo_view'

export interface BaseEvent {
  eventType: EventType
  timestamp: string
  sessionId: string
  contextHash: string
}

export interface ImpressionEvent extends BaseEvent {
  eventType: 'impression'
  userId: string
  candidateIds: string[]
  positions: number[]
  algorithmVersion: string
}

export interface SwipeEvent extends BaseEvent {
  eventType: 'swipe'
  userId: string
  candidateId: string
  action: 'like' | 'pass' | 'super_like'
  durationMs: number
  photoIndex: number
}

export interface MatchEvent extends BaseEvent {
  eventType: 'match'
  userAId: string
  userBId: string
  matchType: 'mutual_like' | 'super_like'
}

export interface MessageMetaEvent extends BaseEvent {
  eventType: 'message_meta'
  senderId: string
  receiverId: string
  matchId: string
  messageLength: number
  responseLatencyMs?: number
  isFirstMessage: boolean
}

export interface BlockEvent extends BaseEvent {
  eventType: 'block'
  blockerId: string
  blockedId: string
  reason?: string
}

export interface ReportEvent extends BaseEvent {
  eventType: 'report'
  reporterId: string
  reportedId: string
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface ProfileViewEvent extends BaseEvent {
  eventType: 'profile_view'
  viewerId: string
  viewedId: string
  durationMs: number
  scrollDepth: number
  photosViewed: number
}

export type AnalyticsEvent = 
  | ImpressionEvent
  | SwipeEvent
  | MatchEvent
  | MessageMetaEvent
  | BlockEvent
  | ReportEvent
  | ProfileViewEvent

// ============================================
// Configuration
// ============================================

interface InstrumentationConfig {
  enabled: boolean
  samplingRate: number  // 0.0 to 1.0
  hashSalt: string
  retentionDays: number
  batchSize: number
  flushIntervalMs: number
}

const defaultConfig: InstrumentationConfig = {
  enabled: true,
  samplingRate: 1.0,  // 100% for essential events
  hashSalt: process.env.ANALYTICS_SALT || 'uz_analytics_salt',
  retentionDays: 90,
  batchSize: 100,
  flushIntervalMs: 5000,
}

// ============================================
// Privacy Helpers
// ============================================

/**
 * Hash a user ID for analytics (one-way, non-reversible)
 */
export function hashUserId(userId: string, salt: string = defaultConfig.hashSalt): string {
  return createHash('sha256')
    .update(`${salt}:${userId}`)
    .digest('hex')
    .substring(0, 16)
}

/**
 * Generate a context hash for reproducibility
 */
export function generateContextHash(context: Record<string, unknown>): string {
  const sorted = Object.keys(context).sort().map(k => `${k}:${context[k]}`).join('|')
  return createHash('sha256')
    .update(sorted)
    .digest('hex')
    .substring(0, 12)
}

/**
 * Check if an event should be sampled
 */
function shouldSample(rate: number): boolean {
  return Math.random() < rate
}

// ============================================
// Event Logger
// ============================================

class EventLogger {
  private config: InstrumentationConfig
  private buffer: AnalyticsEvent[] = []
  private flushTimer: ReturnType<typeof setInterval> | null = null

  constructor(config: Partial<InstrumentationConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
    
    if (typeof window === 'undefined') {
      // Server-side: set up periodic flush
      this.startFlushTimer()
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) clearInterval(this.flushTimer)
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.config.flushIntervalMs)
  }

  /**
   * Log an impression event (profiles shown to user)
   */
  logImpression(params: {
    userId: string
    candidateIds: string[]
    algorithmVersion: string
    sessionId: string
  }): void {
    if (!this.config.enabled) return

    const event: ImpressionEvent = {
      eventType: 'impression',
      timestamp: new Date().toISOString(),
      sessionId: params.sessionId,
      contextHash: generateContextHash({ algo: params.algorithmVersion }),
      userId: hashUserId(params.userId),
      candidateIds: params.candidateIds.map(id => hashUserId(id)),
      positions: params.candidateIds.map((_, i) => i + 1),
      algorithmVersion: params.algorithmVersion,
    }

    this.addToBuffer(event)
  }

  /**
   * Log a swipe event (like/pass)
   */
  logSwipe(params: {
    userId: string
    candidateId: string
    action: 'like' | 'pass' | 'super_like'
    durationMs: number
    photoIndex: number
    sessionId: string
  }): void {
    if (!this.config.enabled) return

    const event: SwipeEvent = {
      eventType: 'swipe',
      timestamp: new Date().toISOString(),
      sessionId: params.sessionId,
      contextHash: generateContextHash({ action: params.action }),
      userId: hashUserId(params.userId),
      candidateId: hashUserId(params.candidateId),
      action: params.action,
      durationMs: params.durationMs,
      photoIndex: params.photoIndex,
    }

    this.addToBuffer(event)
  }

  /**
   * Log a match event
   */
  logMatch(params: {
    userAId: string
    userBId: string
    matchType: 'mutual_like' | 'super_like'
    sessionId: string
  }): void {
    if (!this.config.enabled) return

    const event: MatchEvent = {
      eventType: 'match',
      timestamp: new Date().toISOString(),
      sessionId: params.sessionId,
      contextHash: generateContextHash({ type: params.matchType }),
      userAId: hashUserId(params.userAId),
      userBId: hashUserId(params.userBId),
      matchType: params.matchType,
    }

    this.addToBuffer(event)
  }

  /**
   * Log message metadata (NOT content)
   */
  logMessageMeta(params: {
    senderId: string
    receiverId: string
    matchId: string
    messageLength: number
    responseLatencyMs?: number
    isFirstMessage: boolean
    sessionId: string
  }): void {
    if (!this.config.enabled) return
    
    // Sample non-essential message analytics
    if (!shouldSample(0.1)) return

    const event: MessageMetaEvent = {
      eventType: 'message_meta',
      timestamp: new Date().toISOString(),
      sessionId: params.sessionId,
      contextHash: generateContextHash({ first: params.isFirstMessage }),
      senderId: hashUserId(params.senderId),
      receiverId: hashUserId(params.receiverId),
      matchId: hashUserId(params.matchId),
      messageLength: params.messageLength,
      responseLatencyMs: params.responseLatencyMs,
      isFirstMessage: params.isFirstMessage,
    }

    this.addToBuffer(event)
  }

  /**
   * Log a block event
   */
  logBlock(params: {
    blockerId: string
    blockedId: string
    reason?: string
    sessionId: string
  }): void {
    if (!this.config.enabled) return

    const event: BlockEvent = {
      eventType: 'block',
      timestamp: new Date().toISOString(),
      sessionId: params.sessionId,
      contextHash: generateContextHash({ reason: params.reason || 'none' }),
      blockerId: hashUserId(params.blockerId),
      blockedId: hashUserId(params.blockedId),
      reason: params.reason,
    }

    this.addToBuffer(event)
  }

  /**
   * Log a report event
   */
  logReport(params: {
    reporterId: string
    reportedId: string
    category: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    sessionId: string
  }): void {
    if (!this.config.enabled) return

    const event: ReportEvent = {
      eventType: 'report',
      timestamp: new Date().toISOString(),
      sessionId: params.sessionId,
      contextHash: generateContextHash({ cat: params.category, sev: params.severity }),
      reporterId: hashUserId(params.reporterId),
      reportedId: hashUserId(params.reportedId),
      category: params.category,
      severity: params.severity,
    }

    this.addToBuffer(event)
  }

  /**
   * Log a profile view event
   */
  logProfileView(params: {
    viewerId: string
    viewedId: string
    durationMs: number
    scrollDepth: number
    photosViewed: number
    sessionId: string
  }): void {
    if (!this.config.enabled) return
    
    // Sample profile views at 10%
    if (!shouldSample(0.1)) return

    const event: ProfileViewEvent = {
      eventType: 'profile_view',
      timestamp: new Date().toISOString(),
      sessionId: params.sessionId,
      contextHash: generateContextHash({}),
      viewerId: hashUserId(params.viewerId),
      viewedId: hashUserId(params.viewedId),
      durationMs: params.durationMs,
      scrollDepth: params.scrollDepth,
      photosViewed: params.photosViewed,
    }

    this.addToBuffer(event)
  }

  private addToBuffer(event: AnalyticsEvent): void {
    this.buffer.push(event)
    
    if (this.buffer.length >= this.config.batchSize) {
      this.flush()
    }
  }

  /**
   * Flush buffered events to storage
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return

    const events = [...this.buffer]
    this.buffer = []

    try {
      // In production, send to analytics endpoint or write to database
      if (process.env.NODE_ENV === 'production') {
        await this.persistEvents(events)
      } else {
        // In development, just log
        console.log(`[Analytics] Flushed ${events.length} events`)
      }
    } catch (error) {
      // On error, put events back in buffer (with limit)
      console.error('[Analytics] Failed to flush events:', error)
      this.buffer = [...events.slice(-50), ...this.buffer].slice(-100)
    }
  }

  private async persistEvents(events: AnalyticsEvent[]): Promise<void> {
    // This would write to your analytics store
    // Options: 
    // - Direct to Postgres (simple)
    // - To Kafka/Event Hub (scale)
    // - To analytics service (managed)
    
    // For now, we'll use a simple API endpoint
    const response = await fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    })

    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status}`)
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    this.flush()
  }
}

// ============================================
// Singleton Instance
// ============================================

let eventLogger: EventLogger | null = null

export function getEventLogger(config?: Partial<InstrumentationConfig>): EventLogger {
  if (!eventLogger) {
    eventLogger = new EventLogger(config)
  }
  return eventLogger
}

// Convenience exports
export const analytics = {
  logImpression: (params: Parameters<EventLogger['logImpression']>[0]) => 
    getEventLogger().logImpression(params),
  logSwipe: (params: Parameters<EventLogger['logSwipe']>[0]) => 
    getEventLogger().logSwipe(params),
  logMatch: (params: Parameters<EventLogger['logMatch']>[0]) => 
    getEventLogger().logMatch(params),
  logMessageMeta: (params: Parameters<EventLogger['logMessageMeta']>[0]) => 
    getEventLogger().logMessageMeta(params),
  logBlock: (params: Parameters<EventLogger['logBlock']>[0]) => 
    getEventLogger().logBlock(params),
  logReport: (params: Parameters<EventLogger['logReport']>[0]) => 
    getEventLogger().logReport(params),
  logProfileView: (params: Parameters<EventLogger['logProfileView']>[0]) => 
    getEventLogger().logProfileView(params),
  flush: () => getEventLogger().flush(),
}

export default analytics
