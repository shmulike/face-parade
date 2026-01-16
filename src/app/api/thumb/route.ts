import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { getJobDir } from '@/lib/jobs/tempFiles';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    const id = searchParams.get('id');

    if (!jobId || !id) {
        return new NextResponse('Missing jobId or id', { status: 400 });
    }

    try {
        const jobDir = await getJobDir(jobId);
        const thumbPath = path.join(jobDir, 'thumbs', `${id}.jpg`);

        // Check if exists
        await fs.access(thumbPath);

        const fileBuffer = await fs.readFile(thumbPath);

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        });
    } catch (error) {
        return new NextResponse('Thumbnail not found', { status: 404 });
    }
}
