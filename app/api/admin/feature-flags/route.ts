import { NextRequest, NextResponse } from 'next/server'
// Admin APIs rely on Node runtime
export const runtime = 'nodejs'
import { getFeatureFlag, setFeatureFlag } from '@/lib/featureFlags'

// All available feature flags with metadata
const FEATURE_FLAGS = [
  {
    key: 'FEATURE_RSBM_MATCHING',
    name: 'RSBM Matching Algorithm',
    description: 'Research-backed stable marriage matching algorithm',
    category: 'Matching'
  },
  {
    key: 'FEATURE_GOLDEN_RATIO',
    name: 'Golden Ratio Facial Analysis',
    description: 'Neural network-based facial proportion analysis',
    category: 'Matching'
  },
  {
    key: 'FEATURE_VOICE_PROMPTS',
    name: 'Voice Prompts',
    description: 'Voice-based profile prompts for Gen-Z users',
    category: 'Profiles'
  },
  {
    key: 'FEATURE_VIDEO_PROFILES',
    name: 'Video Profiles',
    description: 'Short video introductions on profiles',
    category: 'Profiles'
  },
  {
    key: 'FEATURE_ADVANCED_FILTERS',
    name: 'Advanced Filters',
    description: 'Extended filtering options for search',
    category: 'Discovery'
  },
  {
    key: 'FEATURE_BOOST',
    name: 'Profile Boost',
    description: 'Temporary profile visibility boost',
    category: 'Monetization'
  },
  {
    key: 'FEATURE_SUPER_LIKE',
    name: 'Super Like',
    description: 'Priority notification for special likes',
    category: 'Engagement'
  },
  {
    key: 'FEATURE_READ_RECEIPTS',
    name: 'Read Receipts',
    description: 'Show when messages are read',
    category: 'Messaging'
  },
  {
    key: 'FEATURE_ICEBREAKERS',
    name: 'AI Icebreakers',
    description: 'AI-generated conversation starters',
    category: 'Messaging'
  },
  {
    key: 'FEATURE_SAFETY_CENTER',
    name: 'Safety Center',
    description: 'Enhanced safety features and reporting',
    category: 'Safety'
  }
]

export async function GET() {
  try {
    const flags = FEATURE_FLAGS.map(flag => ({
      ...flag,
      enabled: getFeatureFlag(flag.key as any)
    }))

    return NextResponse.json({
      success: true,
      flags
    })
  } catch (error) {
    console.error('Get feature flags error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feature flags' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json()

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Flag key required' },
        { status: 400 }
      )
    }

    // Toggle the flag
    const currentValue = getFeatureFlag(key as any)
    setFeatureFlag(key, !currentValue)

    return NextResponse.json({
      success: true,
      key,
      enabled: !currentValue
    })
  } catch (error) {
    console.error('Toggle feature flag error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to toggle feature flag' },
      { status: 500 }
    )
  }
}
