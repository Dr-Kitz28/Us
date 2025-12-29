import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Temporarily return empty data until Pass model is properly set up
export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: 'Pass feature temporarily disabled during database setup' 
  })
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    users: [],
    count: 0
  })
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: 'Pass removal temporarily disabled' 
  })
}
