/**
 * Trust & Safety System
 * Production-grade moderation, abuse prevention, and user protection
 */

export interface SafetyReport {
  id: string
  reporterId: string
  reportedUserId: string
  category: ReportCategory
  reason: string
  evidence?: {
    messageIds?: string[]
    photoUrls?: string[]
    description: string
  }
  status: ReportStatus
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt: Date
  reviewedAt?: Date
  reviewerId?: string
  action?: ModerationAction
}

export enum ReportCategory {
  HARASSMENT = 'harassment',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  SPAM = 'spam',
  FAKE_PROFILE = 'fake_profile',
  SCAM = 'scam',
  UNDERAGE = 'underage',
  VIOLENCE_THREAT = 'violence_threat',
  HATE_SPEECH = 'hate_speech',
  CATFISH = 'catfish',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export interface ModerationAction {
  type: 'warn' | 'restrict' | 'suspend' | 'ban' | 'none'
  duration?: number // in seconds
  reason: string
  appealable: boolean
}

export interface UserSafetyFlags {
  userId: string
  verified: boolean
  photoVerified: boolean
  idVerified: boolean
  trustScore: number // 0-1
  reportsAgainstCount: number
  reportsFiledCount: number
  strikes: number
  restricted: boolean
  suspended: boolean
  suspendedUntil?: Date
  banned: boolean
  bannedReason?: string
  lastReportedAt?: Date
  lastActivityAt: Date
}

/**
 * Safety Enforcement Engine
 */
export class SafetyEngine {
  /**
   * Submit a report
   */
  async submitReport(report: Omit<SafetyReport, 'id' | 'status' | 'createdAt' | 'priority'>): Promise<{ reportId: string; priority: 'low' | 'medium' | 'high' | 'critical'; autoEnforced: boolean }> {
    const reportId = this.generateReportId()
    
    const fullReport: SafetyReport = {
      ...report,
      id: reportId,
      status: ReportStatus.PENDING,
      createdAt: new Date(),
      priority: 'low',
    }

    // Determine priority based on category (overwrite placeholder)
    fullReport.priority = this.determinePriority(report.category)

    // Store report
    await this.storeReport(fullReport)

    // Auto-action for critical reports
    let autoEnforced = false
    if (fullReport.priority === 'critical') {
      await this.autoEnforceAction(fullReport)
      autoEnforced = true
    }

    // Notify moderation queue
    await this.notifyModerationQueue(fullReport)

    // Send confirmation to reporter
    await this.notifyReporter(report.reporterId, reportId)

    return { reportId, priority: fullReport.priority, autoEnforced }
  }

  /**
   * Determine report priority
   */
  private determinePriority(category: ReportCategory): 'low' | 'medium' | 'high' | 'critical' {
    const criticalCategories = [
      ReportCategory.UNDERAGE,
      ReportCategory.VIOLENCE_THREAT,
      ReportCategory.SCAM,
    ]
    const highCategories = [
      ReportCategory.HARASSMENT,
      ReportCategory.HATE_SPEECH,
      ReportCategory.FAKE_PROFILE,
    ]

    if (criticalCategories.includes(category)) return 'critical'
    if (highCategories.includes(category)) return 'high'
    if (category === ReportCategory.SPAM) return 'low'
    return 'medium'
  }

  /**
   * Auto-enforce action for repeat offenders or critical reports
   */
  private async autoEnforceAction(report: SafetyReport): Promise<void> {
    const safetyFlags = await this.getUserSafetyFlags(report.reportedUserId)

    // Critical: underage, violence threats -> immediate suspend
    if (
      report.category === ReportCategory.UNDERAGE ||
      report.category === ReportCategory.VIOLENCE_THREAT
    ) {
      await this.suspendUser(report.reportedUserId, 'pending_review', null)
      return
    }

    // Scam: shadow-restrict (reduce visibility)
    if (report.category === ReportCategory.SCAM) {
      await this.restrictUser(report.reportedUserId, 'scam_detection')
    }

    // Strike system: 3 strikes = auto-suspend
    if (safetyFlags.strikes >= 3) {
      await this.suspendUser(report.reportedUserId, 'repeated_violations', 7 * 24 * 3600) // 7 days
    }
  }

  /**
   * Review report (moderator action)
   */
  async reviewReport(
    reportId: string,
    reviewerId: string,
    action: ModerationAction
  ): Promise<{ success: boolean; action?: ModerationAction; message?: string }> {
    const report = await this.getReport(reportId)
    if (!report) throw new Error('Report not found')

    report.status = ReportStatus.IN_REVIEW
    report.reviewedAt = new Date()
    report.reviewerId = reviewerId
    report.action = action

    // Execute action
    switch (action.type) {
      case 'warn':
        await this.warnUser(report.reportedUserId, action.reason)
        break
      case 'restrict':
        await this.restrictUser(report.reportedUserId, action.reason)
        break
      case 'suspend':
        await this.suspendUser(report.reportedUserId, action.reason, action.duration ?? null)
        break
      case 'ban':
        await this.banUser(report.reportedUserId, action.reason)
        break
      case 'none':
        // Dismiss report
        report.status = ReportStatus.DISMISSED
        break
    }

    // Update report
    await this.updateReport(report)

    // Notify users
    await this.notifyReporter(report.reporterId, reportId)
    if (action.type !== 'none') {
      await this.notifyReportedUser(report.reportedUserId, action)
    }

    return { success: true, action, message: 'Report reviewed' }
  }

  /**
   * Warn user
   */
  private async warnUser(userId: string, reason: string): Promise<void> {
    const flags = await this.getUserSafetyFlags(userId)
    flags.strikes += 1
    await this.updateSafetyFlags(flags)

    // Send warning notification
    await this.sendNotification(userId, {
      type: 'warning',
      title: 'Community Guidelines Warning',
      message: `You've received a warning for: ${reason}. Further violations may result in account suspension.`,
    })
  }

  /**
   * Restrict user (shadow ban / reduce visibility)
   */
  private async restrictUser(userId: string, reason: string): Promise<void> {
    const flags = await this.getUserSafetyFlags(userId)
    flags.restricted = true
    flags.strikes += 1
    await this.updateSafetyFlags(flags)

    // Clear user from recommendation feeds
    await this.removeFromDiscoverFeeds(userId)
  }

  /**
   * Suspend user (temporary ban)
   */
  private async suspendUser(
    userId: string,
    reason: string,
    durationSeconds: number | null
  ): Promise<void> {
    const flags = await this.getUserSafetyFlags(userId)
    flags.suspended = true
    flags.strikes += 2
    
    if (durationSeconds) {
      flags.suspendedUntil = new Date(Date.now() + durationSeconds * 1000)
    }
    
    await this.updateSafetyFlags(flags)

    // Revoke active sessions
    await this.revokeUserSessions(userId)

    // Remove from all feeds
    await this.removeFromDiscoverFeeds(userId)

    // Notify user
    await this.sendNotification(userId, {
      type: 'suspension',
      title: 'Account Suspended',
      message: `Your account has been suspended for: ${reason}. ${
        durationSeconds
          ? `Suspension will be lifted on ${flags.suspendedUntil}`
          : 'This suspension is pending review.'
      }`,
    })
  }

  /**
   * Ban user (permanent)
   */
  private async banUser(userId: string, reason: string): Promise<void> {
    const flags = await this.getUserSafetyFlags(userId)
    flags.banned = true
    flags.bannedReason = reason
    await this.updateSafetyFlags(flags)

    // Revoke all sessions
    await this.revokeUserSessions(userId)

    // Delete user from discovery
    await this.removeFromDiscoverFeeds(userId)

    // Anonymize user data (GDPR-compliant)
    await this.anonymizeUserData(userId)
  }

  /**
   * Check if user is allowed to perform action
   */
  async checkUserPermissions(userId: string): Promise<{
    canLike: boolean
    canMessage: boolean
    canUploadPhotos: boolean
    canBeDiscovered: boolean
    reason?: string
  }> {
    const flags = await this.getUserSafetyFlags(userId)

    if (flags.banned) {
      return {
        canLike: false,
        canMessage: false,
        canUploadPhotos: false,
        canBeDiscovered: false,
        reason: 'Account banned',
      }
    }

    if (flags.suspended) {
      if (flags.suspendedUntil && new Date() > flags.suspendedUntil) {
        // Suspension expired - lift it
        await this.liftSuspension(userId)
      } else {
        return {
          canLike: false,
          canMessage: false,
          canUploadPhotos: false,
          canBeDiscovered: false,
          reason: 'Account suspended',
        }
      }
    }

    if (flags.restricted) {
      return {
        canLike: true,
        canMessage: true,
        canUploadPhotos: false,
        canBeDiscovered: false, // Shadow ban
        reason: 'Account under review',
      }
    }

    return {
      canLike: true,
      canMessage: true,
      canUploadPhotos: true,
      canBeDiscovered: true,
    }
  }

  /**
   * Lift suspension
   */
  private async liftSuspension(userId: string): Promise<void> {
    const flags = await this.getUserSafetyFlags(userId)
    flags.suspended = false
    flags.suspendedUntil = undefined
    await this.updateSafetyFlags(flags)
  }

  // Placeholder implementations (would connect to real services)
  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36)}`
  }

  private async storeReport(report: SafetyReport): Promise<void> {
    // Store in database
  }

  private async getReport(_reportId: string): Promise<SafetyReport | null> {
    // Fetch from database
    return null
  }

  private async updateReport(_report: SafetyReport): Promise<void> {
    // Update in database
  }

  private async getUserSafetyFlags(userId: string): Promise<UserSafetyFlags> {
    // Fetch from database/cache
    return {
      userId,
      verified: false,
      photoVerified: false,
      idVerified: false,
      trustScore: 1.0,
      reportsAgainstCount: 0,
      reportsFiledCount: 0,
      strikes: 0,
      restricted: false,
      suspended: false,
      banned: false,
      lastActivityAt: new Date(),
    }
  }

  private async updateSafetyFlags(_flags: UserSafetyFlags): Promise<void> {
    // Update in database + invalidate cache
  }

  private async notifyModerationQueue(_report: SafetyReport): Promise<void> {
    // Publish event to moderation queue (Kafka/SQS)
  }

  private async notifyReporter(_reporterId: string, _reportId: string): Promise<void> {
    // Send notification to reporter
  }

  private async notifyReportedUser(_userId: string, _action: ModerationAction): Promise<void> {
    // Send notification to reported user
  }

  private async sendNotification(userId: string, notification: any): Promise<void> {
    // Send push/email notification
  }

  private async revokeUserSessions(userId: string): Promise<void> {
    // Revoke all JWT tokens / sessions
  }

  private async removeFromDiscoverFeeds(userId: string): Promise<void> {
    // Remove user from all recommendation feeds (clear cache)
  }

  private async anonymizeUserData(userId: string): Promise<void> {
    // Anonymize PII while preserving analytics
  }
}

/**
 * Content Moderation (AI-powered)
 */
export class ContentModerator {
  /**
   * Moderate text content (messages, bio, prompts)
   */
  async moderateText(text: string): Promise<{
    approved: boolean
    flags: string[]
    confidence: number
  }> {
    // Use ML model or third-party API (e.g., OpenAI Moderation, Perspective API)
    
    const toxicPatterns = [
      /\b(hate|kill|die|violent|assault)\b/i,
      /\b(scam|money|bitcoin|investment|crypto)\b/i,
      /\b(whatsapp|telegram|snapchat)\b/i, // Off-platform solicitation
    ]

    const flags: string[] = []
    for (const pattern of toxicPatterns) {
      if (pattern.test(text)) {
        flags.push('potential_violation')
      }
    }

    return {
      approved: flags.length === 0,
      flags,
      confidence: 0.8,
    }
  }

  /**
   * Moderate image content
   */
  async moderateImage(imageUrl: string): Promise<{
    approved: boolean
    flags: string[]
    confidence: number
  }> {
    // Use ML model (e.g., AWS Rekognition, Google Vision API)
    // Detect: nudity, violence, hate symbols, underage

    return {
      approved: true,
      flags: [],
      confidence: 0.9,
    }
  }
}

/**
 * Block Management
 */
export class BlockManager {
  /**
   * Block user
   */
  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    // Store block relationship
    await this.storeBlock(blockerId, blockedId)

    // Remove from feeds immediately
    await this.removeFromUserFeed(blockerId, blockedId)
    await this.removeFromUserFeed(blockedId, blockerId)

    // Delete existing match if any
    await this.deleteMatch(blockerId, blockedId)

    // Delete conversation
    await this.deleteConversation(blockerId, blockedId)
  }

  /**
   * Unblock user
   */
  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    await this.removeBlock(blockerId, blockedId)
  }

  /**
   * Check if blocked
   */
  async isBlocked(userId1: string, userId2: string): Promise<boolean> {
    // Check both directions
    const blocked1 = await this.checkBlock(userId1, userId2)
    const blocked2 = await this.checkBlock(userId2, userId1)
    return blocked1 || blocked2
  }

  // Placeholder implementations
  private async storeBlock(_blockerId: string, _blockedId: string): Promise<void> {}
  private async removeBlock(_blockerId: string, _blockedId: string): Promise<void> {}
  private async checkBlock(_userId1: string, _userId2: string): Promise<boolean> {
    return false
  }
  private async removeFromUserFeed(_userId: string, _excludeId: string): Promise<void> {}
  private async deleteMatch(_userId1: string, _userId2: string): Promise<void> {}
  private async deleteConversation(_userId1: string, _userId2: string): Promise<void> {}
}

// Export all safety utilities
export const TrustAndSafety = {
  SafetyEngine,
  ContentModerator,
  BlockManager,
}
