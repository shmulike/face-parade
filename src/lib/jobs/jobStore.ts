import fs from 'fs';
import path from 'path';
import os from 'os';

export type FlagReason = 'NO_FACE' | 'MULTI_FACE' | 'LOW_CONFIDENCE' | 'LANDMARK_FAIL';

export interface ImageItem {
    id: string;
    filename: string;
    originalPath: string;
    thumbUrl: string;
    faceCount?: number;
    confidence?: number;
    flagged?: boolean;
    flagReason?: FlagReason | null;
    landmarks?: { x: number; y: number; z: number }[];
}

export type JobStep = 'UPLOADING' | 'ANALYZING' | 'ALIGNING' | 'ENCODING' | 'COMPLETED' | 'ERROR';

export interface JobState {
    id: string;
    created: number;
    images: ImageItem[];
    status: JobStep;
    progress: number;
    currentStepMessage?: string;
    error?: string;
    resultVideoPath?: string;
}

const TEMP_BASE = path.join(os.tmpdir(), 'facelapse');
const DATA_FILE = path.join(TEMP_BASE, 'jobs.json');

// Helper to load/save
function readStore(): Map<string, JobState> {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const content = fs.readFileSync(DATA_FILE, 'utf8');
            const obj = JSON.parse(content);
            return new Map(Object.entries(obj));
        }
    } catch (e) {
        console.error('Failed to read job store:', e);
    }
    return new Map();
}

function writeStore(jobs: Map<string, JobState>) {
    try {
        if (!fs.existsSync(TEMP_BASE)) fs.mkdirSync(TEMP_BASE, { recursive: true });
        const obj = Object.fromEntries(jobs);
        fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2));
    } catch (e) {
        console.error('Failed to write job store:', e);
    }
}

export function createJob(id: string): JobState {
    const jobs = readStore();
    const job: JobState = {
        id,
        created: Date.now(),
        images: [],
        status: 'UPLOADING',
        progress: 0
    };
    jobs.set(id, job);
    writeStore(jobs);
    return job;
}

export function getJob(id: string): JobState | undefined {
    const jobs = readStore();
    return jobs.get(id);
}

export function updateJob(id: string, updates: Partial<JobState>) {
    const jobs = readStore();
    const job = jobs.get(id);
    if (job) {
        Object.assign(job, updates);
        writeStore(jobs);
    }
}

export function updateImageInJob(jobId: string, imageId: string, updates: Partial<ImageItem>) {
    const jobs = readStore();
    const job = jobs.get(jobId);
    if (job) {
        const img = job.images.find(i => i.id === imageId);
        if (img) {
            Object.assign(img, updates);
            writeStore(jobs);
        }
    }
}

export function addImagesToJob(id: string, newImages: ImageItem[]) {
    const jobs = readStore();
    const job = jobs.get(id);
    if (job) {
        job.images.push(...newImages);
        writeStore(jobs);
    }
}
