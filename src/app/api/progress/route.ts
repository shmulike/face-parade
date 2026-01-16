import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/jobs/jobStore';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });

    const job = getJob(jobId);
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    // Return relevant info
    return NextResponse.json({
        status: job.status,
        progress: job.progress,
        step: job.currentStepMessage,
        error: job.error,
        resultUrl: job.status === 'COMPLETED' ? `/api/result?jobId=${jobId}` : null
    });
}
