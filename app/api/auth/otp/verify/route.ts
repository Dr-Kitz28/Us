import { NextRequest, NextResponse } from 'next/server'
import { verifyOTP } from '@/lib/otp'

export const runtime = 'nodejs'

/**
 * Verify OTP for user registration/verification
 * POST /api/auth/otp/verify
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { otpId, otp, email } = body

    if (!otpId || !otp || !email) {
      return NextResponse.json(
        { success: false, error: 'OTP ID, OTP, and email are required' },
        { status: 400 }
      )
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, error: 'OTP must be a 6-digit number' },
        { status: 400 }
      )
    }

    // Verify OTP
    const result = verifyOTP(otpId, otp, email)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      verified: true
    })
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify OTP' },
      { status: 500 }
    )
  }
}
