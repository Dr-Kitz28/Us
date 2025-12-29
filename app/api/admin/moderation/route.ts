// API route for moderation queue and review
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { logger, metrics } from '@/lib/observability/monitoring';
import { SafetyEngine } from '@/lib/safety/trustAndSafety';

const safetyEngine = new SafetyEngine();

// GET - Fetch moderation queue
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add proper moderator role check
    // For now, any authenticated user can access (change in production)

    const { searchParams } = new URL(req.url);
    const priority = searchParams.get('priority') || undefined;
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = { status };
    if (priority) {
      where.priority = priority;
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        reporter: {
          select: { id: true, name: true, email: true },
        },
        reported: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [
        { priority: 'desc' }, // critical first
        { createdAt: 'asc' },  // oldest first
      ],
      take: limit,
    });

    metrics.recordHistogram('api.response_time', Date.now() - startTime, {
      route: '/api/admin/moderation',
      status: 'success',
      env: process.env.NODE_ENV || 'development',
    });

    return NextResponse.json({
      reports,
      count: reports.length,
    });
  } catch (error) {
    logger.error('Moderation queue fetch failed', error as Error, { requestId });
    metrics.incrementCounter('api.errors', 1, { route: '/api/admin/moderation' });

    return NextResponse.json(
      { error: 'Failed to fetch moderation queue', requestId },
      { status: 500 }
    );
  }
}

// POST - Review and take action on report
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const moderator = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!moderator) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { reportId, action, notes } = body;

    if (!reportId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: reportId, action' },
        { status: 400 }
      );
    }

    logger.info('Moderation review', {
      moderatorId: moderator.id,
      reportId,
      action,
      requestId,
    });

    // Review report through SafetyEngine
    const result = await safetyEngine.reviewReport(reportId, moderator.id, action)

    metrics.incrementCounter('safety.reports_reviewed', 1, {
      action,
      result: result.success ? 'success' : 'failure',
      env: process.env.NODE_ENV || 'development',
      moderatorId: moderator.id,
    });

    metrics.recordHistogram('api.response_time', Date.now() - startTime, {
      route: '/api/admin/moderation/review',
      status: 'success',
    });

    return NextResponse.json({
      success: result.success,
      action: result.action,
      message: result.message,
    });
  } catch (error) {
    logger.error('Moderation review failed', error as Error, { requestId });
    metrics.incrementCounter('api.errors', 1, { route: '/api/admin/moderation/review', env: process.env.NODE_ENV || 'development' });

    return NextResponse.json(
      { error: 'Failed to review report', requestId },
      { status: 500 }
    );
  }
}
