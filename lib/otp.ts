/**
 * OTP (One-Time Password) Generation and Validation System
 * 
 * Provides OTP generation, storage, validation, and expiration logic
 * for account verification during registration
 */

import { createHash } from 'crypto'

// In-memory storage for OTPs (in production, use Redis or database)
const otpStore = new Map<string, {
  otp: string
  hashedOTP: string
  email: string
  purpose: string
  expiresAt: number
  attempts: number
  createdAt: number
}>()

const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
  MAX_ATTEMPTS: 3,
  COOLDOWN_SECONDS: 60, // Cooldown between OTP requests
  RATE_LIMIT_PER_HOUR: 5 // Max OTPs per email per hour
}

/**
 * Generate a 6-digit OTP
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Hash OTP for secure storage
 */
function hashOTP(otp: string, email: string): string {
  return createHash('sha256')
    .update(`${otp}:${email}:${process.env.JWT_SECRET || 'default-secret'}`)
    .digest('hex')
}

/**
 * Check rate limiting for OTP generation
 */
function checkRateLimit(email: string): { allowed: boolean; remainingAttempts: number; waitTime: number } {
  const now = Date.now()
  const oneHourAgo = now - (60 * 60 * 1000)
  
  // Count OTPs generated in the last hour
  let count = 0
  let lastRequestTime = 0
  
  for (const [key, value] of otpStore.entries()) {
    if (value.email === email && value.createdAt > oneHourAgo) {
      count++
      lastRequestTime = Math.max(lastRequestTime, value.createdAt)
    }
  }
  
  // Check cooldown
  const timeSinceLastRequest = now - lastRequestTime
  const cooldownRemaining = (OTP_CONFIG.COOLDOWN_SECONDS * 1000) - timeSinceLastRequest
  
  if (cooldownRemaining > 0) {
    return {
      allowed: false,
      remainingAttempts: OTP_CONFIG.RATE_LIMIT_PER_HOUR - count,
      waitTime: Math.ceil(cooldownRemaining / 1000)
    }
  }
  
  // Check rate limit
  if (count >= OTP_CONFIG.RATE_LIMIT_PER_HOUR) {
    return {
      allowed: false,
      remainingAttempts: 0,
      waitTime: Math.ceil((lastRequestTime + (60 * 60 * 1000) - now) / 1000)
    }
  }
  
  return {
    allowed: true,
    remainingAttempts: OTP_CONFIG.RATE_LIMIT_PER_HOUR - count - 1,
    waitTime: 0
  }
}

/**
 * Generate and store OTP for an email
 */
export function generateOTPForEmail(
  email: string,
  purpose: 'registration' | 'login' | 'password_reset' = 'registration'
): { success: boolean; otpId?: string; otp?: string; error?: string; waitTime?: number } {
  // Check rate limiting
  const rateLimitCheck = checkRateLimit(email)
  if (!rateLimitCheck.allowed) {
    return {
      success: false,
      error: `Too many OTP requests. Please wait ${rateLimitCheck.waitTime} seconds before trying again.`,
      waitTime: rateLimitCheck.waitTime
    }
  }
  
  // Generate OTP
  const otp = generateOTP()
  const otpId = createHash('sha256').update(`${email}:${Date.now()}`).digest('hex')
  const hashedOTP = hashOTP(otp, email)
  const expiresAt = Date.now() + (OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000)
  
  // Store OTP
  otpStore.set(otpId, {
    otp, // In production, don't store plain OTP
    hashedOTP,
    email,
    purpose,
    expiresAt,
    attempts: 0,
    createdAt: Date.now()
  })
  
  // Clean up expired OTPs
  cleanupExpiredOTPs()
  
  return {
    success: true,
    otpId,
    otp // Return OTP for sending via email/SMS (in production, only send, don't return)
  }
}

/**
 * Verify OTP
 */
export function verifyOTP(
  otpId: string,
  otp: string,
  email: string
): { success: boolean; error?: string } {
  const storedOTP = otpStore.get(otpId)
  
  if (!storedOTP) {
    return {
      success: false,
      error: 'Invalid or expired OTP. Please request a new one.'
    }
  }
  
  // Check if expired
  if (Date.now() > storedOTP.expiresAt) {
    otpStore.delete(otpId)
    return {
      success: false,
      error: 'OTP has expired. Please request a new one.'
    }
  }
  
  // Check email match
  if (storedOTP.email !== email) {
    return {
      success: false,
      error: 'OTP does not match the email address.'
    }
  }
  
  // Check attempts
  if (storedOTP.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
    otpStore.delete(otpId)
    return {
      success: false,
      error: 'Maximum attempts exceeded. Please request a new OTP.'
    }
  }
  
  // Increment attempts
  storedOTP.attempts++
  
  // Verify OTP
  const hashedInput = hashOTP(otp, email)
  if (hashedInput !== storedOTP.hashedOTP) {
    return {
      success: false,
      error: `Incorrect OTP. ${OTP_CONFIG.MAX_ATTEMPTS - storedOTP.attempts} attempts remaining.`
    }
  }
  
  // OTP is valid - delete it
  otpStore.delete(otpId)
  
  return {
    success: true
  }
}

/**
 * Resend OTP (generates new OTP with same ID)
 */
export function resendOTP(
  email: string,
  purpose: 'registration' | 'login' | 'password_reset' = 'registration'
): { success: boolean; otpId?: string; otp?: string; error?: string; waitTime?: number } {
  // Find and delete existing OTP for this email and purpose
  for (const [key, value] of otpStore.entries()) {
    if (value.email === email && value.purpose === purpose) {
      otpStore.delete(key)
    }
  }
  
  // Generate new OTP
  return generateOTPForEmail(email, purpose)
}

/**
 * Get OTP status (for debugging/admin purposes)
 */
export function getOTPStatus(otpId: string): {
  exists: boolean
  expiresIn?: number
  attemptsRemaining?: number
} {
  const storedOTP = otpStore.get(otpId)
  
  if (!storedOTP) {
    return { exists: false }
  }
  
  const expiresIn = Math.max(0, storedOTP.expiresAt - Date.now())
  const attemptsRemaining = Math.max(0, OTP_CONFIG.MAX_ATTEMPTS - storedOTP.attempts)
  
  return {
    exists: true,
    expiresIn,
    attemptsRemaining
  }
}

/**
 * Clean up expired OTPs (runs automatically)
 */
function cleanupExpiredOTPs(): void {
  const now = Date.now()
  const toDelete: string[] = []
  
  for (const [key, value] of otpStore.entries()) {
    if (now > value.expiresAt) {
      toDelete.push(key)
    }
  }
  
  toDelete.forEach(key => otpStore.delete(key))
}

/**
 * Send OTP via email (mock implementation)
 * In production, integrate with SendGrid, AWS SES, or similar
 */
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    // Mock email sending
    console.log(`📧 Sending OTP to ${email}: ${otp}`)
    
    // In production, use an email service:
    /*
    await emailService.send({
      to: email,
      subject: 'Your Dating App Verification Code',
      html: `
        <h1>Your Verification Code</h1>
        <p>Your 6-digit verification code is:</p>
        <h2>${otp}</h2>
        <p>This code will expire in ${OTP_CONFIG.EXPIRY_MINUTES} minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      `
    })
    */
    
    return true
  } catch (error) {
    console.error('Error sending OTP email:', error)
    return false
  }
}

/**
 * Send OTP via SMS (mock implementation)
 * In production, integrate with Twilio, AWS SNS, or similar
 */
export async function sendOTPSMS(phone: string, otp: string): Promise<boolean> {
  try {
    // Mock SMS sending
    console.log(`📱 Sending OTP to ${phone}: ${otp}`)
    
    // In production, use an SMS service:
    /*
    await smsService.send({
      to: phone,
      body: `Your Dating App verification code is: ${otp}. Valid for ${OTP_CONFIG.EXPIRY_MINUTES} minutes.`
    })
    */
    
    return true
  } catch (error) {
    console.error('Error sending OTP SMS:', error)
    return false
  }
}

// Auto-cleanup every 5 minutes
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000)
