import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
import Redis from 'ioredis'

function maskUrl(u?: string) {
  if (!u) return undefined
  return u.replace(/:\/\/.*@/, '://:*****@')
}

export async function GET() {
  const raw = process.env.REDIS_URL
  if (!raw) return NextResponse.json({ ok: false, error: 'REDIS_URL not set' }, { status: 500 })

  const results: Record<string, any> = { url: maskUrl(raw) }

  // Try using the URL as-is (use provider scheme)
  try {
    const r = new Redis(raw, { connectTimeout: 3000 })
    await r.ping()
    await r.quit()
    results.asIs = { ok: true }
  } catch (err) {
    results.asIs = { ok: false, error: String(err) }
  }

  // Try forcing plain redis:// (no TLS)
  try {
    const plain = raw.replace(/^rediss:\/\//i, 'redis://')
    const rPlain = new Redis(plain, { tls: undefined, connectTimeout: 3000 })
    await rPlain.ping()
    await rPlain.quit()
    results.plain = { ok: true }
  } catch (err) {
    results.plain = { ok: false, error: String(err) }
  }

  // Try forcing rediss:// (TLS)
  try {
    const tlsUrl = raw.replace(/^redis:\/\//i, 'rediss://')
    const rTls = new Redis(tlsUrl, { tls: {} as any, connectTimeout: 3000 })
    await rTls.ping()
    await rTls.quit()
    results.tls = { ok: true }
  } catch (err) {
    results.tls = { ok: false, error: String(err) }
  }

  return NextResponse.json({ ok: true, results })
}
