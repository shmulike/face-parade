import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const PYTHON_SCRIPT = path.join(process.cwd(), 'scripts/detect_face.py');

export interface LandmarkResult {
    faceCount: number;
    confidence: number;
    landmarks: { x: number; y: number; z: number }[][];
}

export async function detectLandmarks(imagePath: string): Promise<LandmarkResult> {
    try {
        const { stdout, stderr } = await execAsync(`python3 "${PYTHON_SCRIPT}" "${imagePath}"`);

        if (stderr) {
            console.error('Python stderr:', stderr);
        }

        const result = JSON.parse(stdout);

        if (result.error) {
            throw new Error(result.error);
        }

        return result;
    } catch (error: any) {
        console.error('Detection error:', error);
        throw new Error(`Face detection failed: ${error.message}`);
    }
}
