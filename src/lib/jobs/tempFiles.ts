import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const TEMP_BASE = path.join(os.tmpdir(), 'facelapse');

export async function initTempDir() {
    try {
        await fs.mkdir(TEMP_BASE, { recursive: true });
    } catch (error) {
        console.error('Failed to create base temp dir:', error);
    }
}

export async function createJobDir(jobId: string) {
    const dir = path.join(TEMP_BASE, jobId);
    await fs.mkdir(dir, { recursive: true });
    await fs.mkdir(path.join(dir, 'original'), { recursive: true });
    await fs.mkdir(path.join(dir, 'thumbs'), { recursive: true });
    await fs.mkdir(path.join(dir, 'aligned'), { recursive: true });
    return dir;
}

export async function getJobDir(jobId: string) {
    return path.join(TEMP_BASE, jobId);
}

export async function deleteJobDir(jobId: string) {
    const dir = path.join(TEMP_BASE, jobId);
    try {
        await fs.rm(dir, { recursive: true, force: true });
    } catch (error) {
        console.error(`Failed to cleanup job dir ${jobId}:`, error);
    }
}

// Simple cleanup for directories older than 1 hour
export async function cleanupOldJobs() {
    try {
        const entries = await fs.readdir(TEMP_BASE, { withFileTypes: true });
        const now = Date.now();
        const TTL = 3600 * 1000; // 1 hour

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const dirPath = path.join(TEMP_BASE, entry.name);
                const stats = await fs.stat(dirPath);
                if (now - stats.mtimeMs > TTL) {
                    console.log(`Cleaning up old job: ${entry.name}`);
                    await fs.rm(dirPath, { recursive: true, force: true });
                }
            }
        }
    } catch (error) {
        console.error('Cleanup failed:', error);
    }
}
