import { NextRequest, NextResponse } from 'next/server'
import { resendOTP, sendOTPEmail } from '@/lib/otp'

export const runtime = 'nodejs'

/**
 * Resend OTP for user registration/verification
 * POST /api/auth/otp/resend
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, purpose = 'registration' } = body

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Resend OTP
    const result = resendOTP(email, purpose)

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          waitTime: result.waitTime
        },
        { status: 429 }
      )
    }

    // Send OTP via email
    const emailSent = await sendOTPEmail(email, result.otp!)

    if (!emailSent) {
      return NextResponse.json(
        { success: false, error: 'Failed to send OTP email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      otpId: result.otpId,
      message: 'OTP resent successfully',
      // For development only - remove in production
      ...(process.env.NODE_ENV === 'development' && { otp: result.otp })
    })
  } catch (error) {
    console.error('Error resending OTP:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to resend OTP' },
      { status: 500 }
    )
  }
}
