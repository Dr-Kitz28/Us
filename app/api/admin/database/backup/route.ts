import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'

const execAsync = promisify(exec)

export async function POST() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = path.join(process.cwd(), 'backups')
    const backupFile = path.join(backupDir, `backup-${timestamp}.db`)

    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // Copy the SQLite database file
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    fs.copyFileSync(dbPath, backupFile)

    return NextResponse.json({
      success: true,
      message: 'Database backup created successfully',
      file: backupFile,
      timestamp
    })
  } catch (error) {
    console.error('Database backup error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to backup database' },
      { status: 500 }
    )
  }
}
