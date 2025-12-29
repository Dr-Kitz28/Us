import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST() {
  try {
    // Run Prisma migrations
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
      cwd: process.cwd()
    })

    return NextResponse.json({
      success: true,
      message: 'Migrations completed successfully',
      output: stdout,
      errors: stderr || null
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to run migrations',
      details: error.message
    }, { status: 500 })
  }
}
