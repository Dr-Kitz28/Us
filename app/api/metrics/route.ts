import { NextRequest, NextResponse } from 'next/server'
// metrics endpoint needs Node runtime for monitoring utilities
export const runtime = 'nodejs'
import { metrics } from '@/lib/observability/monitoring'

export async function GET(_req: NextRequest) {
  try {
    const body = metrics.getMetrics()
    return new NextResponse(body, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; version=0.0.4' }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to collect metrics' }, { status: 500 })
  }
}
