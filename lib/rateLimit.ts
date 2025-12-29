type Key = string

type Bucket = {
	tokens: number
	lastRefill: number
}

const buckets = new Map<Key, Bucket>()

export type RateLimitOptions = {
	capacity: number // max tokens
	refillPerSec: number // tokens per second
}

const defaultOptions: RateLimitOptions = {
	capacity: 10,
	refillPerSec: 5 / 60, // 5 per minute
}

function getBucket(key: Key, opts: RateLimitOptions): Bucket {
	let b = buckets.get(key)
	if (!b) {
		b = { tokens: opts.capacity, lastRefill: Date.now() }
		buckets.set(key, b)
	}
	const now = Date.now()
	const elapsed = (now - b.lastRefill) / 1000
	const refill = elapsed * opts.refillPerSec
	if (refill > 0) {
		b.tokens = Math.min(opts.capacity, b.tokens + refill)
		b.lastRefill = now
	}
	return b
}

export function allow(key: Key, opts: RateLimitOptions = defaultOptions): boolean {
	const b = getBucket(key, opts)
	if (b.tokens >= 1) {
		b.tokens -= 1
		return true
	}
	return false
}

export function rateLimitKey(params: { ip?: string; userId?: string; scope?: string }) {
	const ip = params.ip ?? 'ip:unknown'
	const uid = params.userId ?? 'user:anon'
	const scope = params.scope ?? 'default'
	return `${scope}:${uid}:${ip}`
}

