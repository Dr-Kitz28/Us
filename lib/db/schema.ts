/**
 * Drizzle ORM Schema - Prisma Alternative
 * 
 * Benefits over Prisma:
 * - No code generation (faster builds)
 * - ~3x faster queries
 * - Native serverless support (no prepared statement collisions)
 * - SQL-like API
 * - TypeScript-first with Zod integration
 * 
 * Designed for 100k MAU with <75ms response time
 */

import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  real,
  unique,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

// ============================================================================
// USERS
// ============================================================================
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  // Indexes for 100k MAU performance
  emailIdx: index('users_email_idx').on(table.email),
  createdAtIdx: index('users_created_at_idx').on(table.createdAt),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  photos: many(photos),
  likesGiven: many(likes, { relationName: 'likes_given' }),
  likesReceived: many(likes, { relationName: 'likes_received' }),
  passesGiven: many(passes, { relationName: 'passes_given' }),
  passesReceived: many(passes, { relationName: 'passes_received' }),
  matches1: many(matches, { relationName: 'user1_matches' }),
  matches2: many(matches, { relationName: 'user2_matches' }),
  messages: many(messages),
  blocksInitiated: many(blocks, { relationName: 'blocks_initiated' }),
  blocksReceived: many(blocks, { relationName: 'blocks_received' }),
  reportsFiled: many(reports, { relationName: 'reports_filed' }),
  reportsAgainst: many(reports, { relationName: 'reports_against' }),
  strikes: many(strikes),
  safetyFlags: many(safetyFlags),
}))

// ============================================================================
// PROFILES
// ============================================================================
export const profiles = pgTable('profiles', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().unique().references(() => users.id),
  bio: text('bio'),
  interests: text('interests'), // JSON or comma-separated
  gender: text('gender'),
  location: text('location'),
  age: integer('age'),
  
  // Golden Ratio Analysis Fields
  goldenRatioScore: real('golden_ratio_score'),
  photoAnalyzed: boolean('photo_analyzed').default(false).notNull(),
  photoAnalysisDate: timestamp('photo_analysis_date'),
  facialProportions: text('facial_proportions'), // JSON string
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  // Indexes for feed queries (100k MAU optimization)
  userIdIdx: index('profiles_user_id_idx').on(table.userId),
  genderIdx: index('profiles_gender_idx').on(table.gender),
  ageIdx: index('profiles_age_idx').on(table.age),
  locationIdx: index('profiles_location_idx').on(table.location),
  goldenRatioIdx: index('profiles_golden_ratio_idx').on(table.goldenRatioScore),
}))

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}))

// ============================================================================
// PHOTOS
// ============================================================================
export const photos = pgTable('photos', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  url: text('url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  userIdIdx: index('photos_user_id_idx').on(table.userId),
}))

export const photosRelations = relations(photos, ({ one }) => ({
  user: one(users, {
    fields: [photos.userId],
    references: [users.id],
  }),
}))

// ============================================================================
// LIKES (Swipe Right)
// ============================================================================
export const likes = pgTable('likes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  fromId: text('from_id').notNull().references(() => users.id),
  toId: text('to_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueLike: unique('likes_from_to_unique').on(table.fromId, table.toId),
  // Critical indexes for match detection (< 75ms)
  fromIdIdx: index('likes_from_id_idx').on(table.fromId),
  toIdIdx: index('likes_to_id_idx').on(table.toId),
  // Composite index for mutual like check
  mutualIdx: index('likes_mutual_idx').on(table.toId, table.fromId),
}))

export const likesRelations = relations(likes, ({ one }) => ({
  from: one(users, {
    fields: [likes.fromId],
    references: [users.id],
    relationName: 'likes_given',
  }),
  to: one(users, {
    fields: [likes.toId],
    references: [users.id],
    relationName: 'likes_received',
  }),
}))

// ============================================================================
// PASSES (Swipe Left)
// ============================================================================
export const passes = pgTable('passes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  fromId: text('from_id').notNull().references(() => users.id),
  toId: text('to_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniquePass: unique('passes_from_to_unique').on(table.fromId, table.toId),
  fromIdIdx: index('passes_from_id_idx').on(table.fromId),
  toIdIdx: index('passes_to_id_idx').on(table.toId),
}))

export const passesRelations = relations(passes, ({ one }) => ({
  from: one(users, {
    fields: [passes.fromId],
    references: [users.id],
    relationName: 'passes_given',
  }),
  to: one(users, {
    fields: [passes.toId],
    references: [users.id],
    relationName: 'passes_received',
  }),
}))

// ============================================================================
// MATCHES
// ============================================================================
export const matches = pgTable('matches', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  user1Id: text('user1_id').notNull().references(() => users.id),
  user2Id: text('user2_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  uniqueMatch: unique('matches_users_unique').on(table.user1Id, table.user2Id),
  user1Idx: index('matches_user1_idx').on(table.user1Id),
  user2Idx: index('matches_user2_idx').on(table.user2Id),
  // Composite index for finding all matches for a user
  bothUsersIdx: index('matches_both_users_idx').on(table.user1Id, table.user2Id),
}))

export const matchesRelations = relations(matches, ({ one, many }) => ({
  user1: one(users, {
    fields: [matches.user1Id],
    references: [users.id],
    relationName: 'user1_matches',
  }),
  user2: one(users, {
    fields: [matches.user2Id],
    references: [users.id],
    relationName: 'user2_matches',
  }),
  messages: many(messages),
}))

// ============================================================================
// MESSAGES
// ============================================================================
export const messages = pgTable('messages', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  matchId: text('match_id').notNull().references(() => matches.id),
  senderId: text('sender_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  deliveredAt: timestamp('delivered_at'),
  seenAt: timestamp('seen_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  matchIdIdx: index('messages_match_id_idx').on(table.matchId),
  senderIdIdx: index('messages_sender_id_idx').on(table.senderId),
  // Composite for chat history pagination
  chatHistoryIdx: index('messages_chat_history_idx').on(table.matchId, table.createdAt),
}))

export const messagesRelations = relations(messages, ({ one }) => ({
  match: one(matches, {
    fields: [messages.matchId],
    references: [matches.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}))

// ============================================================================
// BLOCKS
// ============================================================================
export const blocks = pgTable('blocks', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  blockerId: text('blocker_id').notNull().references(() => users.id),
  blockedId: text('blocked_id').notNull().references(() => users.id),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueBlock: unique('blocks_unique').on(table.blockerId, table.blockedId),
  blockerIdx: index('blocks_blocker_idx').on(table.blockerId),
  blockedIdx: index('blocks_blocked_idx').on(table.blockedId),
}))

export const blocksRelations = relations(blocks, ({ one }) => ({
  blocker: one(users, {
    fields: [blocks.blockerId],
    references: [users.id],
    relationName: 'blocks_initiated',
  }),
  blocked: one(users, {
    fields: [blocks.blockedId],
    references: [users.id],
    relationName: 'blocks_received',
  }),
}))

// ============================================================================
// REPORTS
// ============================================================================
export const reports = pgTable('reports', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  reporterId: text('reporter_id').notNull().references(() => users.id),
  reportedId: text('reported_id').notNull().references(() => users.id),
  category: text('category').notNull(), // harassment, fake_profile, etc.
  reason: text('reason').notNull(),
  description: text('description'),
  evidence: text('evidence'), // JSON array of evidence URLs
  priority: text('priority').default('medium').notNull(), // critical, high, medium, low
  status: text('status').default('pending').notNull(), // pending, reviewing, resolved, dismissed
  reviewerId: text('reviewer_id'),
  reviewerNotes: text('reviewer_notes'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  reporterIdx: index('reports_reporter_idx').on(table.reporterId),
  reportedIdx: index('reports_reported_idx').on(table.reportedId),
  statusIdx: index('reports_status_idx').on(table.status),
  priorityIdx: index('reports_priority_idx').on(table.priority),
}))

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
    relationName: 'reports_filed',
  }),
  reported: one(users, {
    fields: [reports.reportedId],
    references: [users.id],
    relationName: 'reports_against',
  }),
}))

// ============================================================================
// STRIKES
// ============================================================================
export const strikes = pgTable('strikes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  reportId: text('report_id'),
  reason: text('reason').notNull(),
  severity: text('severity').notNull(), // warning, restrict, suspend, ban
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('strikes_user_id_idx').on(table.userId),
  severityIdx: index('strikes_severity_idx').on(table.severity),
}))

export const strikesRelations = relations(strikes, ({ one }) => ({
  user: one(users, {
    fields: [strikes.userId],
    references: [users.id],
  }),
}))

// ============================================================================
// SAFETY FLAGS
// ============================================================================
export const safetyFlags = pgTable('safety_flags', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  flagType: text('flag_type').notNull(), // auto_moderated, manual_review, high_risk, verified_safe
  reason: text('reason'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('safety_flags_user_id_idx').on(table.userId),
  flagTypeIdx: index('safety_flags_type_idx').on(table.flagType),
  activeIdx: index('safety_flags_active_idx').on(table.isActive),
}))

export const safetyFlagsRelations = relations(safetyFlags, ({ one }) => ({
  user: one(users, {
    fields: [safetyFlags.userId],
    references: [users.id],
  }),
}))

// ============================================================================
// ML/Analytics Tables (for 100k MAU scale)
// ============================================================================

// User embeddings for ML-based matching
export const userEmbeddings = pgTable('user_embeddings', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().unique().references(() => users.id),
  vector: text('vector').notNull(), // JSON array of floats
  version: text('version').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('embeddings_user_id_idx').on(table.userId),
  versionIdx: index('embeddings_version_idx').on(table.version),
}))

// Candidate sets (pre-computed for performance)
export const candidateSets = pgTable('candidate_sets', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().unique().references(() => users.id),
  candidatesJson: text('candidates_json').notNull(), // JSON array of user IDs with scores
  version: text('version').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('candidates_user_id_idx').on(table.userId),
}))

// Risk scores for safety
export const riskScores = pgTable('risk_scores', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().unique().references(() => users.id),
  score: real('score').notNull(),
  reasonsJson: text('reasons_json'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('risk_user_id_idx').on(table.userId),
  scoreIdx: index('risk_score_idx').on(table.score),
}))

// Impressions (exposure logging for ML)
export const impressions = pgTable('impressions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  viewerId: text('viewer_id').notNull().references(() => users.id),
  viewedId: text('viewed_id').notNull().references(() => users.id),
  position: integer('position').notNull(), // Rank position shown
  context: text('context'), // JSON with context data
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  viewerIdx: index('impressions_viewer_idx').on(table.viewerId),
  viewedIdx: index('impressions_viewed_idx').on(table.viewedId),
  // Time-based partitioning hint for analytics
  createdAtIdx: index('impressions_created_at_idx').on(table.createdAt),
}))

// ============================================================================
// Type Exports
// ============================================================================
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert
export type Photo = typeof photos.$inferSelect
export type NewPhoto = typeof photos.$inferInsert
export type Like = typeof likes.$inferSelect
export type NewLike = typeof likes.$inferInsert
export type Pass = typeof passes.$inferSelect
export type NewPass = typeof passes.$inferInsert
export type Match = typeof matches.$inferSelect
export type NewMatch = typeof matches.$inferInsert
export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
export type Block = typeof blocks.$inferSelect
export type NewBlock = typeof blocks.$inferInsert
export type Report = typeof reports.$inferSelect
export type NewReport = typeof reports.$inferInsert
export type Strike = typeof strikes.$inferSelect
export type NewStrike = typeof strikes.$inferInsert
export type SafetyFlag = typeof safetyFlags.$inferSelect
export type NewSafetyFlag = typeof safetyFlags.$inferInsert
