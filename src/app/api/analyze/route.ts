import { NextRequest, NextResponse } from 'next/server';
import { getJob, updateImageInJob, FlagReason } from '@/lib/jobs/jobStore';
import { detectLandmarks } from '@/lib/face/detectLandmarks';

// Simple semaphore
async function mapConcurrent<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
    const results: R[] = [];
    const executing = new Set<Promise<void>>();

    for (const item of items) {
        const p = Promise.resolve().then(() => fn(item));
        results.push(p as unknown as R); // We'll wait for them later. Actually this logic is flawed for results order.

        // Better logic:
        // We want to limit active promises.
    }
    return Promise.all(results);
}

// Correct semaphore implementation
const limit = (concurrency: number) => {
    let active = 0;
    const queue: (() => void)[] = [];

    const next = () => {
        active--;
        if (queue.length > 0) {
            active++;
            const run = queue.shift()!;
            run();
        }
    };

    return async <T>(fn: () => Promise<T>): Promise<T> => {
        if (active >= concurrency) {
            await new Promise<void>(resolve => queue.push(resolve));
        }
        active++;
        try {
            return await fn();
        } finally {
            next();
        }
    };
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { jobId, order, options } = body;

        if (!jobId || !order || !Array.isArray(order)) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        const job = getJob(jobId);
        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        const minConfidence = options?.minConfidence ?? 0.5;
        const results = [];

        // Process images
        const limiter = limit(3); // Process 3 at a time to avoid CPU choke

        const tasks = order.map(imageId => limiter(async () => {
            const image = job.images.find(img => img.id === imageId);
            if (!image) return null;

            try {
                const { faceCount, confidence, landmarks } = await detectLandmarks(image.originalPath);

                let flagged = false;
                let flagReason: FlagReason | null = null;

                if (faceCount === 0) {
                    flagged = true;
                    flagReason = 'NO_FACE';
                } else if (faceCount > 1) {
                    flagged = true;
                    flagReason = 'MULTI_FACE';
                } else if (confidence < minConfidence) {
                    flagged = true;
                    flagReason = 'LOW_CONFIDENCE';
                }

                // Save results
                // We are NOT saving landmarks to store yet to save memory, 
                // but we might need them for rendering.
                // For MVP, we'll re-compute or save to a file if needed.
                // The spec says "Output per image: ...".
                // Since "Render" needs them, and re-computing is expensive, 
                // we should probably cache them.
                // But strict "Analysis" output doesn't require saving them to disk yet.
                // We'll update the in-memory store.

                // Flatten landmarks for JSON (MediaPipe returns list of lists for multi-face, we take first face or all?)
                // We'll take the first face's landmarks for simplicity if present.
                const flatLandmarks = landmarks && landmarks.length > 0 ? landmarks[0] : undefined;

                updateImageInJob(jobId, imageId, {
                    faceCount,
                    confidence,
                    flagged,
                    flagReason,
                    landmarks: flatLandmarks
                });

                return {
                    id: imageId,
                    faceCount,
                    confidence,
                    flagged,
                    reason: flagReason,
                    landmarks: flatLandmarks
                };

            } catch (err: any) {
                console.error(`Analyze error for ${imageId}:`, err);
                const errorMessage = err?.message || String(err);
                updateImageInJob(jobId, imageId, {
                    flagged: true,
                    flagReason: 'LANDMARK_FAIL'
                });
                return {
                    id: imageId,
                    faceCount: 0,
                    confidence: 0,
                    flagged: true,
                    reason: `LANDMARK_FAIL: ${errorMessage}`
                };
            }
        }));

        const rawResults = await Promise.all(tasks);
        const apiResults = rawResults.filter(r => r !== null);

        return NextResponse.json({ results: apiResults });

    } catch (error) {
        console.error('Analyze error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
