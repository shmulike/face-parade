import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { getJob } from '@/lib/jobs/jobStore';
import { getJobDir } from '@/lib/jobs/tempFiles';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) return new NextResponse('Missing jobId', { status: 400 });

    const job = getJob(jobId);
    if (!job || !job.resultVideoPath) {
        return new NextResponse('Result not found', { status: 404 });
    }

    try {
        const jobDir = await getJobDir(jobId);
        const videoPath = path.join(jobDir, job.resultVideoPath);

        // Stream file
        const stats = await fs.stat(videoPath);
        const fileBuffer = await fs.readFile(videoPath);

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'video/mp4',
                'Content-Length': stats.size.toString(),
                'Content-Disposition': `attachment; filename="${job.resultVideoPath}"`
            }
        });
    } catch (error) {
        return new NextResponse('File error', { status: 500 });
    }
}
