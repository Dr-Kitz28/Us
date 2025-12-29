import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'

type ImagePayload = {
  filename: string
  data: string // base64
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, images } = body as { userId?: string; images: ImagePayload[] }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 })
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

    const saved: { filename: string; url: string }[] = []
    const warnings: string[] = []

    for (const img of images) {
      const cleanBase64 = img.data.replace(/^data:image\/(png|jpeg|jpg);base64,/, '')
      const outPath = path.join(uploadsDir, img.filename)
      fs.writeFileSync(outPath, Buffer.from(cleanBase64, 'base64'))
      const url = `/uploads/${img.filename}`

      // If userId present, create Photo record only if user exists
      if (userId) {
        try {
          const userExists = await prisma.user.findUnique({ where: { id: userId } })
          if (!userExists) {
            console.warn('User not found, skipping DB create for', userId)
            warnings.push(`user not found: ${userId}`)
          } else {
            await prisma.photo.create({ data: { userId, url } })
          }
        } catch (e) {
          console.error('Error creating photo record:', e)
          warnings.push('photo create error')
        }
      }

      saved.push({ filename: img.filename, url })
    }

    return NextResponse.json({ success: true, saved, warnings })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  // simple listing for testing
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) return NextResponse.json({ files: [] })
    const files = fs.readdirSync(uploadsDir)
    return NextResponse.json({ files })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list uploads' }, { status: 500 })
  }
}
