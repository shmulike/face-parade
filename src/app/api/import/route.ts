import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { createJob, addImagesToJob, getJob, ImageItem } from '@/lib/jobs/jobStore';
import { createJobDir, getJobDir } from '@/lib/jobs/tempFiles';
import { sortNatural } from '@/lib/sortNatural';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        // Get or create Job ID
        let jobId = formData.get('jobId') as string;
        if (!jobId) {
            jobId = uuidv4();
            createJob(jobId);
            await createJobDir(jobId);
        } else {
            // Ensure job exists and dir exists
            if (!getJob(jobId)) {
                createJob(jobId);
                await createJobDir(jobId); // Ensure dir exists
            }
        }

        const jobDir = await getJobDir(jobId);
        const files = formData.getAll('files') as File[];
        const newImages: ImageItem[] = [];

        for (const file of files) {
            if (!file.name) continue;

            const fileId = uuidv4();
            const buffer = Buffer.from(await file.arrayBuffer());
            const originalPath = path.join(jobDir, 'original', `${fileId}${path.extname(file.name)}`);

            // Save original
            await fs.writeFile(originalPath, buffer);

            // Generate thumb
            const thumbPath = path.join(jobDir, 'thumbs', `${fileId}.jpg`);
            await sharp(buffer)
                .resize(300, 300, { fit: 'cover' })
                .jpeg({ quality: 80 })
                .toFile(thumbPath);

            newImages.push({
                id: fileId,
                filename: file.name,
                originalPath,
                thumbUrl: `/api/thumb?jobId=${jobId}&id=${fileId}`
            });
        }

        // Sort by filename naturally
        newImages.sort((a, b) => sortNatural(a.filename, b.filename));

        // Update job store
        addImagesToJob(jobId, newImages);

        return NextResponse.json({
            jobId,
            images: newImages
        });

    } catch (error) {
        console.error('Import error:', error);
        return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 });
    }
}
