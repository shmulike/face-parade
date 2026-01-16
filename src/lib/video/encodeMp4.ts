import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import { execSync } from 'child_process';

// Try ffmpeg-static first, fallback to system ffmpeg
let resolvedFfmpegPath = ffmpegPath;

// Check if ffmpeg-static path is valid
if (!resolvedFfmpegPath || resolvedFfmpegPath.includes('/ROOT/')) {
    try {
        // Try to find system ffmpeg
        const systemFfmpeg = execSync('which ffmpeg', { encoding: 'utf-8' }).trim();
        if (systemFfmpeg) {
            resolvedFfmpegPath = systemFfmpeg;
            console.log('Using system ffmpeg:', systemFfmpeg);
        }
    } catch (e) {
        console.error('Could not find ffmpeg. Please install ffmpeg or ffmpeg-static.');
    }
}

if (resolvedFfmpegPath) {
    console.log('Setting ffmpeg path to:', resolvedFfmpegPath);
    ffmpeg.setFfmpegPath(resolvedFfmpegPath);
}

export interface EncodeOptions {
    inputDir: string;
    outputFile: string;
    fps: number;
    width: number;
    height: number;
    format: 'mp4' | 'avi' | 'webm';
    onProgress?: (percent: number) => void;
}

export function encodeVideo(options: EncodeOptions): Promise<void> {
    return new Promise((resolve, reject) => {
        // Input pattern: %05d.jpg
        const inputPattern = path.join(options.inputDir, '%05d.jpg');

        const command = ffmpeg()
            .input(inputPattern)
            .inputFPS(options.fps)
            .fps(30); // Force standard 30 FPS output for maximum compatibility behavior

        if (options.format === 'avi') {
            command.videoCodec('libxvid').outputOptions(['-q:v 5', '-r 30']);
        } else if (options.format === 'webm') {
            command.videoCodec('libvpx-vp9').outputOptions(['-crf 30', '-b:v 0']);
        } else {
            // Standard H.264 (High Profile) - Better for desktop players
            command
                .videoCodec('libx264')
                .outputOptions([
                    '-pix_fmt yuv420p',
                    '-profile:v high',
                    '-level 4.0',
                    '-movflags +faststart',
                    `-s ${options.width}x${options.height}`,
                    '-preset medium',
                    '-crf 23',
                ]);
        }

        // Add metadata for file managers
        command
            .outputOptions([
                '-metadata', 'title=Face Parade Video',
                '-metadata', 'description=Generated face montage video',
                '-metadata', `creation_time=${new Date().toISOString()}`,
                '-metadata', 'tool=FaceParade'
            ])
            .output(options.outputFile);

        if (options.onProgress) {
            command.on('progress', (progress) => {
                if (progress.percent) {
                    options.onProgress!(progress.percent);
                }
            });
        }

        command
            .on('start', (cmdLine) => {
                console.log('Spawned Ffmpeg with command: ' + cmdLine);
            })
            .on('end', () => resolve())
            .on('error', (err) => {
                console.error('Ffmpeg error:', err);
                reject(err);
            })
            .run();
    });
}
