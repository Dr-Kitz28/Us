import { NextResponse } from 'next/server'
import { getRedis } from '@/lib/cache/redis'

export async function GET() {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    return NextResponse.json({ ok: false, error: 'REDIS_URL not set' }, { status: 500 })
  }

  try {
    const redis = getRedis()
    // ping the server and set a short-lived test key
    const pong = await redis.ping()
    const key = `smoke:${Date.now()}`
    await redis.set(key, '1', 'EX', 10)
    const value = await redis.get(key)

    return NextResponse.json({ ok: true, pong, value })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
