// API route for submitting safety reports
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { logger, metrics } from '@/lib/observability/monitoring';
import { SafetyEngine } from '@/lib/safety/trustAndSafety';

const safetyEngine = new SafetyEngine();

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reporter = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!reporter) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { reportedUserId, category, reason, description, evidence } = body;

    if (!reportedUserId || !category || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: reportedUserId, category, reason' },
        { status: 400 }
      );
    }

    logger.info('Safety report submission', {
      reporterId: reporter.id,
      reportedUserId,
      category,
      requestId,
    });

    // Submit report through SafetyEngine
    const report = await safetyEngine.submitReport({
      reporterId: reporter.id,
      reportedId: reportedUserId,
      category,
      reason,
      description,
      evidence: evidence ? JSON.stringify(evidence) : null,
    });

    metrics.incrementCounter('safety.reports_submitted', 1, {
      category,
      priority: String(report.priority),
      env: process.env.NODE_ENV || 'development',
      userId: reporter.id,
    });

    metrics.recordHistogram('api.response_time', Date.now() - startTime, {
      route: '/api/safety/report',
      status: 'success',
      env: process.env.NODE_ENV || 'development',
    });

    return NextResponse.json({
      success: true,
      reportId: report.reportId,
      priority: report.priority,
      message: report.autoEnforced
        ? 'Report submitted and auto-enforced'
        : 'Report submitted for review',
    });
  } catch (error) {
    logger.error('Safety report submission failed', { error, requestId });
    metrics.incrementCounter('api.errors', 1, { route: '/api/safety/report', env: process.env.NODE_ENV || 'development' });

    return NextResponse.json(
      { error: 'Failed to submit report', requestId },
      { status: 500 }
    );
  }
}
