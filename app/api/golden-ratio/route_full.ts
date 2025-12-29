// API endpoint for Golden Ratio photo evaluation
// Handles photo upload, analysis, and scoring

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
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
    const imageUrl = `data:${imageFile.type};base64,${imageBase64}`

    // For now, we'll use mock facial landmarks
    // In production, this would use computer vision libraries like MediaPipe
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

    if (action === 'analyze') {
      // Analyze the photo using Golden Ratio principles
      const analysis = analyzer.analyzeFacialProportions(mockLandmarks)
      
      // Get neural network prediction
      let neuralScore = analysis.overallScore
      try {
        neuralScore = await analyzer.predictGoldenRatioScore(mockLandmarks)
      } catch (error) {
        console.warn('Neural network prediction failed, using traditional analysis:', error)
      }

      return NextResponse.json({
        success: true,
        analysis: {
          ...analysis,
          overallScore: neuralScore
        },
        landmarks: mockLandmarks,
        imageUrl: imageUrl.substring(0, 100) + '...' // Truncated for response
      })
    }

    if (action === 'upload') {
      // Check if user already has a photo (prevent updates as per requirement)
      const existingUser = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { 
          id: true,
          image: true,
          profile: {
            select: {
              goldenRatioScore: true,
              photoAnalyzed: true
            }
          }
        }
      })

      if (existingUser?.image && existingUser.profile?.photoAnalyzed) {
        return NextResponse.json({ 
          error: 'Photo already uploaded and analyzed. Updates not allowed.' 
        }, { status: 400 })
      }

      // Analyze the photo
      const analysis = analyzer.analyzeFacialProportions(mockLandmarks)
      let neuralScore = analysis.overallScore
      
      try {
        neuralScore = await analyzer.predictGoldenRatioScore(mockLandmarks)
      } catch (error) {
        console.warn('Neural network prediction failed, using traditional analysis:', error)
      }

      // Update user profile with photo and Golden Ratio score
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          image: imageUrl,
          profile: {
            upsert: {
              create: {
                goldenRatioScore: neuralScore,
                photoAnalyzed: true,
                photoAnalysisDate: new Date(),
                facialProportions: JSON.stringify({
                  analysis,
                  landmarks: mockLandmarks
                })
              },
              update: {
                goldenRatioScore: neuralScore,
                photoAnalyzed: true,
                photoAnalysisDate: new Date(),
                facialProportions: JSON.stringify({
                  analysis,
                  landmarks: mockLandmarks
                })
              }
            }
          }
        }
      })

      return NextResponse.json({
        success: true,
        goldenRatioScore: neuralScore,
        analysis,
        message: 'Photo uploaded and analyzed successfully!'
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

    // Get user's Golden Ratio analysis
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        image: true,
        profile: {
          select: {
            goldenRatioScore: true,
            photoAnalyzed: true,
            photoAnalysisDate: true,
            facialProportions: true
          }
        }
      }
    })

    if (!user?.profile?.photoAnalyzed) {
      return NextResponse.json({
        analyzed: false,
        message: 'No photo analysis found'
      })
    }

    const facialData = user.profile.facialProportions 
      ? JSON.parse(user.profile.facialProportions as string)
      : null

    return NextResponse.json({
      analyzed: true,
      goldenRatioScore: user.profile.goldenRatioScore,
      analysisDate: user.profile.photoAnalysisDate,
      analysis: facialData?.analysis || null,
      landmarks: facialData?.landmarks || null,
      hasImage: !!user.image
    })

  } catch (error) {
    console.error('Golden Ratio GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
