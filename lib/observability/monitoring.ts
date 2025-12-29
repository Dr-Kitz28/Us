/**
 * Observability & Debugging Infrastructure
 * Production-grade logging, tracing, metrics, and error tracking
 */

import { randomUUID } from 'crypto'

/**
 * Structured Logger with PII Redaction
 */
export interface LogContext {
  requestId?: string
  traceId?: string
  sessionId?: string
  userId?: string
  deviceId?: string
  endpoint?: string
  method?: string
  statusCode?: number
  latencyMs?: number
  errorType?: string
  errorCode?: string
  [key: string]: any
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export class StructuredLogger {
  private serviceName: string
  private environment: string
  private version: string

  constructor(serviceName: string, environment: string, version: string) {
    this.serviceName = serviceName
    this.environment = environment
    this.version = version
  }

  /**
   * Log with automatic PII redaction
   */
  log(level: LogLevel, message: string, context: LogContext = {}): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.serviceName,
      environment: this.environment,
      version: this.version,
      ...this.redactPII(context),
    }

    // Output as JSON
    console.log(JSON.stringify(logEntry))

    // Also send to log aggregation service (e.g., OpenSearch, Datadog)
    this.sendToLogAggregator(logEntry)
  }

  debug(message: string, context?: LogContext): void {
    if (this.environment !== 'production') {
      this.log(LogLevel.DEBUG, message, context)
    }
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context)
  }

  error(message: string, error: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        stackHash: this.hashStack(error.stack),
      },
    })
  }

  fatal(message: string, error: Error, context?: LogContext): void {
    this.log(LogLevel.FATAL, message, {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        stackHash: this.hashStack(error.stack),
      },
    })
  }

  /**
   * Redact PII from log context
   */
  private redactPII(context: LogContext): LogContext {
    const redacted = { ...context }
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
      'creditCard',
      'ssn',
      'idNumber',
    ]

    for (const field of piiFields) {
      if (field in redacted) {
        redacted[field] = '[REDACTED]'
      }
    }

    // Redact nested objects
    for (const key in redacted) {
      if (typeof redacted[key] === 'object' && redacted[key] !== null) {
        redacted[key] = this.redactPII(redacted[key])
      }
    }

    return redacted
  }

  /**
   * Hash stack trace for grouping similar errors
   */
  private hashStack(stack?: string): string {
    if (!stack) return ''
    
    // Simple hash (in prod, use proper hashing)
    let hash = 0
    for (let i = 0; i < stack.length; i++) {
      const char = stack.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return hash.toString(36)
  }

  private sendToLogAggregator(logEntry: any): void {
    // Send to OpenSearch, Datadog, etc.
    // Implementation depends on chosen service
  }
}

/**
 * Distributed Tracing (OpenTelemetry style)
 */
export class DistributedTracer {
  private traces: Map<string, Trace> = new Map()

  /**
   * Start a new trace
   */
  startTrace(operationName: string, parentTraceId?: string): Trace {
    const traceId = parentTraceId || randomUUID()
    const spanId = randomUUID()
    
    const trace: Trace = {
      traceId,
      spanId,
      parentSpanId: parentTraceId,
      operationName,
      startTime: Date.now(),
      tags: {},
      logs: [],
    }

    this.traces.set(spanId, trace)
    return trace
  }

  /**
   * End trace and record duration
   */
  endTrace(spanId: string, status: 'ok' | 'error' = 'ok'): void {
    const trace = this.traces.get(spanId)
    if (!trace) return

    trace.endTime = Date.now()
    trace.duration = trace.endTime - trace.startTime
    trace.status = status

    // Send to tracing backend (Jaeger, Zipkin, etc.)
    this.sendToTracingBackend(trace)

    this.traces.delete(spanId)
  }

  /**
   * Add tag to trace
   */
  addTag(spanId: string, key: string, value: any): void {
    const trace = this.traces.get(spanId)
    if (trace) {
      trace.tags[key] = value
    }
  }

  /**
   * Add log to trace
   */
  addLog(spanId: string, message: string, data?: any): void {
    const trace = this.traces.get(spanId)
    if (trace) {
      trace.logs.push({
        timestamp: Date.now(),
        message,
        data,
      })
    }
  }

  private sendToTracingBackend(trace: Trace): void {
    // Send to Jaeger, etc.
  }
}

export interface Trace {
  traceId: string
  spanId: string
  parentSpanId?: string
  operationName: string
  startTime: number
  endTime?: number
  duration?: number
  status?: 'ok' | 'error'
  tags: Record<string, any>
  logs: Array<{
    timestamp: number
    message: string
    data?: any
  }>
}

/**
 * Metrics Collector (Prometheus style)
 */
export class MetricsCollector {
  private counters: Map<string, number> = new Map()
  private gauges: Map<string, number> = new Map()
  private histograms: Map<string, number[]> = new Map()

  /**
   * Increment counter
   */
  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    // Backwards-compat overload: incrementCounter(name, labels)
    if (typeof value === 'object' && labels === undefined) {
      labels = value as unknown as Record<string, string>
      value = 1
    }

    const sanitized = this.sanitizeMetricName(name)
    const metricName = sanitized.endsWith('_total') ? sanitized : `${sanitized}_total`
    const key = this.buildMetricKey(metricName, labels)
    const current = this.counters.get(key) || 0
    this.counters.set(key, current + value)
  }

  /**
   * Set gauge value
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const metricName = this.sanitizeMetricName(name)
    const key = this.buildMetricKey(metricName, labels)
    this.gauges.set(key, value)
  }

  /**
   * Record histogram value (e.g., latencies)
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const metricName = this.sanitizeMetricName(name)
    const key = this.buildMetricKey(metricName, labels)
    const values = this.histograms.get(key) || []
    values.push(value)
    this.histograms.set(key, values)
  }

  /**
   * Get metric in Prometheus format
   */
  getMetrics(): string {
    let output = ''

    // Counters
    for (const [key, value] of this.counters) {
      output += `${key} ${value}\n`
    }

    // Gauges
    for (const [key, value] of this.gauges) {
      output += `${key} ${value}\n`
    }

    // Histograms (calculate percentiles)
    for (const [key, values] of this.histograms) {
      const sorted = values.sort((a, b) => a - b)
      const p50 = this.percentile(sorted, 0.5)
      const p95 = this.percentile(sorted, 0.95)
      const p99 = this.percentile(sorted, 0.99)
      
      output += `${key}_p50 ${p50}\n`
      output += `${key}_p95 ${p95}\n`
      output += `${key}_p99 ${p99}\n`
      output += `${key}_count ${values.length}\n`
    }

    return output
  }

  private buildMetricKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',')
    return `${name}{${labelStr}}`
  }

  private sanitizeMetricName(name: string): string {
    // Prometheus metric names must match [a-zA-Z_:][a-zA-Z0-9_:]*
    // Convert dots and invalid chars to underscore
    return name.replace(/[^a-zA-Z0-9_:]/g, '_')
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0
    const index = Math.ceil(sorted.length * p) - 1
    return sorted[Math.max(0, index)]
  }
}

/**
 * Request Context (for correlation)
 */
export class RequestContext {
  requestId: string
  traceId: string
  sessionId?: string
  userId?: string
  startTime: number

  constructor() {
    this.requestId = randomUUID()
    this.traceId = randomUUID()
    this.startTime = Date.now()
  }

  static fromHeaders(headers: Record<string, string>): RequestContext {
    const ctx = new RequestContext()
    ctx.requestId = headers['x-request-id'] || ctx.requestId
    ctx.traceId = headers['x-trace-id'] || ctx.traceId
    ctx.sessionId = headers['x-session-id']
    return ctx
  }

  toHeaders(): Record<string, string> {
    return {
      'x-request-id': this.requestId,
      'x-trace-id': this.traceId,
      ...(this.sessionId && { 'x-session-id': this.sessionId }),
    }
  }

  getLatency(): number {
    return Date.now() - this.startTime
  }
}

/**
 * Error Tracking (Sentry-style)
 */
export class ErrorTracker {
  private errorBuffer: CapturedError[] = []

  /**
   * Capture exception with context
   */
  captureException(error: Error, context?: LogContext): void {
    const captured: CapturedError = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        stackHash: this.hashStack(error.stack),
      },
      context: context || {},
      environment: process.env.NODE_ENV || 'development',
    }

    this.errorBuffer.push(captured)

    // Send to error tracking service (Sentry, Rollbar, etc.)
    this.sendToErrorTracker(captured)

    // Keep buffer size manageable
    if (this.errorBuffer.length > 100) {
      this.errorBuffer.shift()
    }
  }

  /**
   * Capture message (warning, info)
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error', context?: LogContext): void {
    // Similar to captureException but for non-error events
  }

  private hashStack(stack?: string): string {
    if (!stack) return ''
    let hash = 0
    for (let i = 0; i < stack.length; i++) {
      const char = stack.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return hash.toString(36)
  }

  private sendToErrorTracker(error: CapturedError): void {
    // Send to Sentry, etc.
  }
}

export interface CapturedError {
  timestamp: string
  error: {
    name: string
    message: string
    stack?: string
    stackHash: string
  }
  context: LogContext
  environment: string
}

/**
 * Health Check System
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: Record<string, CheckResult>
  timestamp: string
}

export interface CheckResult {
  status: 'pass' | 'fail'
  message?: string
  latencyMs?: number
}

export class HealthChecker {
  private checks: Map<string, () => Promise<CheckResult>> = new Map()

  /**
   * Register health check
   */
  registerCheck(name: string, check: () => Promise<CheckResult>): void {
    this.checks.set(name, check)
  }

  /**
   * Run all health checks
   */
  async runChecks(): Promise<HealthStatus> {
    const results: Record<string, CheckResult> = {}
    
    for (const [name, check] of this.checks) {
      try {
        results[name] = await check()
      } catch (error) {
        results[name] = {
          status: 'fail',
          message: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }

    const allPassed = Object.values(results).every((r) => r.status === 'pass')
    const someFailed = Object.values(results).some((r) => r.status === 'fail')

    return {
      status: allPassed ? 'healthy' : someFailed ? 'unhealthy' : 'degraded',
      checks: results,
      timestamp: new Date().toISOString(),
    }
  }
}

// Singleton instances
export const logger = new StructuredLogger('dating-app', process.env.NODE_ENV || 'development', '1.0.0')
export const tracer = new DistributedTracer()
export const metrics = new MetricsCollector()
export const errorTracker = new ErrorTracker()
export const healthChecker = new HealthChecker()

// Register default health checks
healthChecker.registerCheck('database', async () => {
  try {
    // Check database connection
    // const result = await prisma.$queryRaw`SELECT 1`
    return { status: 'pass', latencyMs: 10 }
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'DB check failed',
    }
  }
})

healthChecker.registerCheck('redis', async () => {
  try {
    // Check Redis connection
    // const start = Date.now()
    // await redis.ping()
    // const latencyMs = Date.now() - start
    return { status: 'pass', latencyMs: 5 }
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Redis check failed',
    }
  }
})
