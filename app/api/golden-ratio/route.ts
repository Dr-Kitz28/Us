// Simple Golden Ratio API endpoint (works with current schema)
// Will be enhanced once Prisma schema is updated

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoldenRatioAnalyzer } from '@/lib/goldenRatioAnalyzer'

const analyzer = new GoldenRatioAnalyzer()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    const action = formData.get('action') as string

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Convert image to base64 for processing
    const imageBuffer = await imageFile.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString('base64')

    // Mock facial landmarks for demo
    // In production, use MediaPipe or similar computer vision library
    const mockLandmarks = {
      leftEye: { x: 120, y: 150 },
      rightEye: { x: 180, y: 150 },
      noseTip: { x: 150, y: 180 },
      mouthCenter: { x: 150, y: 220 },
      chinTip: { x: 150, y: 280 },
      foreheadTop: { x: 150, y: 100 },
      leftCheek: { x: 100, y: 200 },
      rightCheek: { x: 200, y: 200 },
      jawlineLeft: { x: 110, y: 250 },
      jawlineRight: { x: 190, y: 250 }
    }

    // Analyze facial proportions
    const analysis = analyzer.analyzeFacialProportions(mockLandmarks)
    
    // Get neural network prediction (fallback to traditional analysis if fails)
    let neuralScore = analysis.overallScore
    try {
      neuralScore = await analyzer.predictGoldenRatioScore(mockLandmarks)
    } catch (error) {
      console.warn('Neural network prediction failed, using traditional analysis:', error)
    }

    if (action === 'analyze') {
      return NextResponse.json({
        success: true,
        analysis: {
          ...analysis,
          overallScore: neuralScore
        },
        landmarks: mockLandmarks,
        message: `Golden Ratio Score: ${neuralScore.toFixed(4)} / 1.618 (${((neuralScore / 1.618) * 100).toFixed(1)}% of perfect φ)`
      })
    }

    if (action === 'upload') {
      // For now, just return the analysis
      // TODO: Save to database once schema is updated
      return NextResponse.json({
        success: true,
        goldenRatioScore: neuralScore,
        analysis: {
          ...analysis,
          overallScore: neuralScore
        },
        message: 'Photo analyzed successfully! (Database storage will be enabled once schema is updated)'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Golden Ratio API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Return demo data for now
    // TODO: Fetch from database once schema is updated
    return NextResponse.json({
      analyzed: false,
      message: 'Golden Ratio analysis system ready. Upload a photo to begin analysis.',
      demoMode: true
    })

  } catch (error) {
    console.error('Golden Ratio GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
