import { NextResponse } from 'next/server';
import { getJob, updateJob, ImageItem } from '@/lib/jobs/jobStore';
import { getJobDir } from '@/lib/jobs/tempFiles';
import { getCenter, distance } from '@/lib/face/computeTransform';
import { alignImage } from '@/lib/face/applyTransform';
import { encodeVideo } from '@/lib/video/encodeMp4';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
    try {
        const { jobId, options } = await req.json();

        runRenderJob(jobId, options).catch(err => {
            console.error('[RENDER API] Background render job failed:', err);
        });

        return NextResponse.json({ success: true, jobId });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function runRenderJob(jobId: string, inputOptions: any) {
    try {
        const options = inputOptions || {};
        const job = getJob(jobId);
        if (!job) {
            console.error(`Job ${jobId} not found`);
            return;
        }

        const images = job.images;
        const width = options.width || 1080;
        const height = options.height || 1920;

        const validImages = images.filter(img => img.landmarks && img.landmarks.length > 0);

        if (validImages.length === 0) {
            updateJob(jobId, { status: 'ERROR', error: 'No analyzed images with faces found' });
            return;
        }

        updateJob(jobId, { status: 'ALIGNING', progress: 0, currentStepMessage: 'Computing reference...' });

        const LEFT_EYE = [33, 133];
        const RIGHT_EYE = [362, 263];

        const landmarkCache = new Map<string, any>();
        let validCount = 0;
        let totalEyeDist = 0;

        for (const img of validImages) {
            if (img.landmarks) {
                landmarkCache.set(img.id, img.landmarks);
                try {
                    const left = getCenter(img.landmarks, LEFT_EYE);
                    const right = getCenter(img.landmarks, RIGHT_EYE);
                    totalEyeDist += distance(left, right);
                    validCount++;
                } catch (e: any) {
                    console.warn(`Ref compute failed for ${img.id}: ${e.message}`);
                }
            }
        }

        if (validCount === 0) {
            updateJob(jobId, { status: 'ERROR', error: 'Could not compute face geometry' });
            return;
        }

        const avgRefDistNorm = totalEyeDist / validCount;
        const targetRefEyeDist = width * 0.2;
        const targetRefCenter = {
            x: (width * 0.5) + (options.offset?.x || 0),
            y: (height * 0.45) + (options.offset?.y || 0)
        };

        const jobDir = await getJobDir(jobId);
        const alignedDir = path.join(jobDir, 'aligned');
        await fsp.rm(alignedDir, { recursive: true, force: true });
        await fsp.mkdir(alignedDir, { recursive: true });

        let encodedCount = 0;
        let lastError = '';

        for (let i = 0; i < validImages.length; i++) {
            const img = validImages[i];
            const lm = landmarkCache.get(img.id);
            if (!lm) continue;

            try {
                const seqName = String(encodedCount).padStart(5, '0') + '.jpg';
                const outPath = path.join(alignedDir, seqName);

                await alignImage(img.originalPath, outPath, lm, {
                    width,
                    height,
                    refEyeDist: targetRefEyeDist,
                    refCenter: targetRefCenter,
                    includeLandmarks: options.includeLandmarks || false
                });

                encodedCount++;
                if (i % 5 === 0) {
                    updateJob(jobId, { progress: 10 + Math.round((i / validImages.length) * 40) });
                }
            } catch (e: any) {
                lastError = e.message;
                console.error(`Align fail for ${img.id}: ${e.message}`);
            }
        }

        if (encodedCount === 0) {
            updateJob(jobId, { status: 'ERROR', error: `Alignment failed: ${lastError || 'Unknown error'}` });
            return;
        }

        updateJob(jobId, { status: 'ENCODING', progress: 50 });

        const fps = options.fps || 4;
        const format = options.format || 'mp4';
        const outputFilename = options.filename || `facelapse_${Date.now()}.${format}`;
        const outputPath = path.join(jobDir, outputFilename);

        await encodeVideo({
            inputDir: alignedDir,
            outputFile: outputPath,
            fps,
            width,
            height,
            format,
            onProgress: (p) => {
                updateJob(jobId, { progress: 50 + Math.round(p / 2) });
            }
        });

        updateJob(jobId, {
            status: 'COMPLETED',
            resultVideoPath: outputFilename,
            currentStepMessage: 'Success!',
            progress: 100
        });

    } catch (err: any) {
        console.error(`FATAL: ${err.message}`);
        updateJob(jobId, { status: 'ERROR', error: err.message });
    }
}
