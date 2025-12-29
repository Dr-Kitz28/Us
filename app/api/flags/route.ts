import { NextResponse } from 'next/server'
import { getAllFlags } from '@/lib/featureFlags'

export async function GET() {
  const flags = getAllFlags()
  return NextResponse.json(flags)
}
