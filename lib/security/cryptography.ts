/**
 * Cryptography & Security Layer
 * Production-grade encryption, hashing, and key management
 * 
 * NEVER INVENT CRYPTO - Uses proven libraries and standard protocols
 */

import crypto from 'crypto'

/**
 * Encryption at Rest (Field-Level Encryption)
 * Uses AES-256-GCM (AEAD) with envelope encryption pattern
 */
export class FieldEncryption {
  private kek: Buffer // Key Encryption Key (from KMS or env)
  private algorithm = 'aes-256-gcm'
  private keyLength = 32 // 256 bits
  private ivLength = 16 // 128 bits
  private tagLength = 16 // 128 bits

  constructor(kekBase64: string) {
    this.kek = Buffer.from(kekBase64, 'base64')
    if (this.kek.length !== this.keyLength) {
      throw new Error('KEK must be 256 bits (32 bytes)')
    }
  }

  /**
   * Encrypt sensitive field value
   * Returns: base64(version|nonce|tag|ciphertext)
   */
  encrypt(plaintext: string): string {
    // Generate random Data Encryption Key (DEK)
    const dek = crypto.randomBytes(this.keyLength)
    
    // Generate random IV/nonce
    const iv = crypto.randomBytes(this.ivLength)
    
    // Encrypt plaintext with DEK
    const cipher = crypto.createCipheriv(this.algorithm, dek, iv)
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ])
    const tag = (cipher as any).getAuthTag()

    // Encrypt DEK with KEK (envelope encryption)
    const wrappedDek = this.wrapKey(dek)

    // Assemble: version(1) | wrappedDek(48) | iv(16) | tag(16) | ciphertext
    const version = Buffer.from([0x01])
    const assembled = Buffer.concat([version, wrappedDek, iv, tag, ciphertext])
    
    return assembled.toString('base64')
  }

  /**
   * Decrypt encrypted field value
   */
  decrypt(encryptedBase64: string): string {
    const assembled = Buffer.from(encryptedBase64, 'base64')
    
    // Parse components
    const version = assembled.readUInt8(0)
    if (version !== 0x01) {
      throw new Error('Unsupported encryption version')
    }

    const wrappedDekLength = 48
    const offset1 = 1
    const offset2 = offset1 + wrappedDekLength
    const offset3 = offset2 + this.ivLength
    const offset4 = offset3 + this.tagLength

    const wrappedDek = assembled.slice(offset1, offset2)
    const iv = assembled.slice(offset2, offset3)
    const tag = assembled.slice(offset3, offset4)
    const ciphertext = assembled.slice(offset4)

    // Unwrap DEK with KEK
    const dek = this.unwrapKey(wrappedDek)

    // Decrypt ciphertext with DEK
    const decipher = crypto.createDecipheriv(this.algorithm, dek, iv)
    ;(decipher as any).setAuthTag(tag)
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ])

    return plaintext.toString('utf8')
  }

  /**
   * Wrap DEK with KEK (simple AES-256-GCM)
   */
  private wrapKey(dek: Buffer): Buffer {
    const iv = crypto.randomBytes(this.ivLength)
    const cipher = crypto.createCipheriv(this.algorithm, this.kek, iv)
    const wrapped = Buffer.concat([cipher.update(dek), cipher.final()])
    const tag = (cipher as any).getAuthTag()
    // Return: iv(16) | tag(16) | wrapped(32) = 64 bytes
    return Buffer.concat([iv, tag, wrapped])
  }

  /**
   * Unwrap DEK with KEK
   */
  private unwrapKey(wrappedDek: Buffer): Buffer {
    const iv = wrappedDek.slice(0, this.ivLength)
    const tag = wrappedDek.slice(this.ivLength, this.ivLength + this.tagLength)
    const wrapped = wrappedDek.slice(this.ivLength + this.tagLength)

    const decipher = crypto.createDecipheriv(this.algorithm, this.kek, iv)
    ;(decipher as any).setAuthTag(tag)
    const dek = Buffer.concat([decipher.update(wrapped), decipher.final()])
    
    return dek
  }
}

/**
 * Hashing for Lookup (without revealing plaintext)
 * Uses HMAC-SHA256 for deterministic indexing
 */
export class SecureHashing {
  private hmacKey: Buffer

  constructor(hmacKeyBase64: string) {
    this.hmacKey = Buffer.from(hmacKeyBase64, 'base64')
  }

  /**
   * Hash for lookup index (phone, email)
   * Normalize first, then HMAC
   */
  hashForLookup(value: string, normalize: (v: string) => string): string {
    const normalized = normalize(value)
    const hmac = crypto.createHmac('sha256', this.hmacKey)
    hmac.update(normalized)
    return hmac.digest('base64')
  }

  /**
   * Normalize phone (E.164 format)
   */
  normalizePhone(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '')
    // Assume India if no country code
    if (digits.length === 10) {
      return `+91${digits}`
    }
    if (digits.startsWith('91') && digits.length === 12) {
      return `+${digits}`
    }
    return `+${digits}`
  }

  /**
   * Normalize email (lowercase, trim)
   */
  normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
  }

  /**
   * Hash phone for lookup
   */
  hashPhone(phone: string): string {
    return this.hashForLookup(phone, this.normalizePhone)
  }

  /**
   * Hash email for lookup
   */
  hashEmail(email: string): string {
    return this.hashForLookup(email, this.normalizeEmail)
  }
}

/**
 * Password Hashing (Argon2 or bcrypt)
 * Using bcrypt for now (Node.js standard)
 */
import bcrypt from 'bcryptjs'

export class PasswordHasher {
  private saltRounds: number

  constructor(saltRounds: number = 12) {
    this.saltRounds = saltRounds
  }

  async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds)
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
  }
}

/**
 * Token Generation (OTP, session tokens, etc.)
 */
export class TokenGenerator {
  /**
   * Generate cryptographically random OTP
   */
  generateOTP(length: number = 6): string {
    const digits = '0123456789'
    let otp = ''
    const randomBytes = crypto.randomBytes(length)
    
    for (let i = 0; i < length; i++) {
      otp += digits[randomBytes[i] % digits.length]
    }
    
    return otp
  }

  /**
   * Generate secure random token (for sessions, reset tokens, etc.)
   */
  generateSecureToken(bytes: number = 32): string {
    return crypto.randomBytes(bytes).toString('base64url')
  }

  /**
   * Generate CUID-like identifier
   */
  generateId(): string {
    const timestamp = Date.now().toString(36)
    const randomPart = crypto.randomBytes(12).toString('base64url')
    return `${timestamp}-${randomPart}`
  }
}

/**
 * JWT Token Management (for API auth)
 */
import jwt from 'jsonwebtoken'

export interface JWTPayload {
  userId: string
  email?: string
  role?: string
  sessionId?: string
}

export class JWTManager {
  constructor(
    private secret: string,
    private accessTokenExpiry: string = '15m',
    private refreshTokenExpiry: string = '7d'
  ) {}

  /**
   * Sign access token (short-lived)
   */
  signAccessToken(payload: JWTPayload): string {
    return (jwt as any).sign(payload, this.secret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'dating-app',
      audience: 'dating-app-api',
    })
  }

  /**
   * Sign refresh token (long-lived)
   */
  signRefreshToken(payload: JWTPayload): string {
    return (jwt as any).sign(payload, this.secret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'dating-app',
      audience: 'dating-app-refresh',
    })
  }

  /**
   * Verify and decode token
   */
  verify(token: string): JWTPayload {
    try {
      const decoded = (jwt as any).verify(token, this.secret, {
        issuer: 'dating-app',
      }) as JWTPayload
      return decoded
    } catch (error) {
      throw new Error('Invalid token')
    }
  }

  /**
   * Decode without verification (for debugging)
   */
  decode(token: string): JWTPayload | null {
    const decoded = jwt.decode(token)
    return decoded as JWTPayload | null
  }
}

/**
 * HMAC Signature Verification (for webhooks, API requests)
 */
export class HMACVerifier {
  constructor(private secret: string) {}

  /**
   * Generate HMAC signature
   */
  sign(data: string): string {
    const hmac = crypto.createHmac('sha256', this.secret)
    hmac.update(data)
    return hmac.digest('hex')
  }

  /**
   * Verify HMAC signature (constant-time comparison)
   */
  verify(data: string, signature: string): boolean {
    const expected = this.sign(data)
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    )
  }
}

/**
 * Data Redaction Helper (for logs)
 */
export class DataRedactor {
  /**
   * Redact PII from object
   */
  redactPII(obj: any): any {
    const piiFields = [
      'password',
      'phone',
      'email',
      'phoneHash',
      'emailHash',
      'otp',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'apiKey',
    ]

    const redacted = { ...obj }

    for (const field of piiFields) {
      if (field in redacted) {
        redacted[field] = '[REDACTED]'
      }
    }

    return redacted
  }

  /**
   * Redact partial (show last 4 chars)
   */
  redactPartial(value: string, showLast: number = 4): string {
    if (value.length <= showLast) return '*'.repeat(value.length)
    return '*'.repeat(value.length - showLast) + value.slice(-showLast)
  }

  /**
   * Mask phone number
   */
  maskPhone(phone: string): string {
    // Show country code and last 4 digits
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length <= 4) return '*'.repeat(cleaned.length)
    const last4 = cleaned.slice(-4)
    const countryCode = cleaned.slice(0, 2)
    return `+${countryCode}******${last4}`
  }

  /**
   * Mask email
   */
  maskEmail(email: string): string {
    const [local, domain] = email.split('@')
    if (!domain) return '*'.repeat(email.length)
    
    const maskedLocal =
      local.length <= 2
        ? '*'.repeat(local.length)
        : local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
    
    return `${maskedLocal}@${domain}`
  }
}

/**
 * Secure Random Number Generator
 */
export class SecureRandom {
  /**
   * Generate random integer in range [min, max)
   */
  randomInt(min: number, max: number): number {
    const range = max - min
    if (range <= 0) throw new Error('Invalid range')
    
    const bytesNeeded = Math.ceil(Math.log2(range) / 8)
    const maxValid = Math.floor(256 ** bytesNeeded / range) * range
    
    let randomValue: number
    do {
      const randomBytes = crypto.randomBytes(bytesNeeded)
      randomValue = randomBytes.readUIntBE(0, bytesNeeded)
    } while (randomValue >= maxValid)
    
    return min + (randomValue % range)
  }

  /**
   * Shuffle array (Fisher-Yates with crypto random)
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i + 1)
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }
}

/**
 * Secure Storage Interface (for client-side)
 */
export interface SecureStorage {
  set(key: string, value: string): Promise<void>
  get(key: string): Promise<string | null>
  remove(key: string): Promise<void>
  clear(): Promise<void>
}

/**
 * Example: Browser Secure Storage (localStorage with encryption)
 */
export class BrowserSecureStorage implements SecureStorage {
  constructor(private encryption: FieldEncryption) {}

  async set(key: string, value: string): Promise<void> {
    const encrypted = this.encryption.encrypt(value)
    localStorage.setItem(key, encrypted)
  }

  async get(key: string): Promise<string | null> {
    const encrypted = localStorage.getItem(key)
    if (!encrypted) return null
    
    try {
      return this.encryption.decrypt(encrypted)
    } catch {
      return null
    }
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(key)
  }

  async clear(): Promise<void> {
    localStorage.clear()
  }
}

// Export all crypto utilities
export const cryptoUtils = {
  FieldEncryption,
  SecureHashing,
  PasswordHasher,
  TokenGenerator,
  JWTManager,
  HMACVerifier,
  DataRedactor,
  SecureRandom,
}
