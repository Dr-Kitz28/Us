/**
 * Instrumentation Module
 * Event logging and analytics for ML training
 */

export { 
  analytics, 
  getEventLogger, 
  hashUserId, 
  generateContextHash 
} from './events'

export type {
  EventType,
  AnalyticsEvent,
  ImpressionEvent,
  SwipeEvent,
  MatchEvent,
  MessageMetaEvent,
  BlockEvent,
  ReportEvent,
  ProfileViewEvent,
} from './events'
