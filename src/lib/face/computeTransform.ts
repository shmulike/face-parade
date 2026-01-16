export interface Point {
    x: number; // 0-1 normalized
    y: number; // 0-1 normalized
}

// MediaPipe 468 Mesh specific indices
const LEFT_EYE_INDICES = [33, 133]; // Corners
const RIGHT_EYE_INDICES = [362, 263]; // Corners

export function getCenter(landmarks: Point[], indices: number[]): Point {
    let x = 0, y = 0;
    for (const idx of indices) {
        x += landmarks[idx].x;
        y += landmarks[idx].y;
    }
    return { x: x / indices.length, y: y / indices.length };
}

export function distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function angle(p1: Point, p2: Point): number {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

export interface TransformParams {
    rotation: number; // degrees
    scale: number;
    tx: number; // pixels
    ty: number; // pixels
}

export function computeAlignment(
    landmarks: Point[],
    width: number,
    height: number,
    refEyeDist: number, // pixels
    refCenter: { x: number, y: number } // pixels
): TransformParams {
    // 1. Get current eye centers in pixels
    const rawLeft = getCenter(landmarks, LEFT_EYE_INDICES);
    const rawRight = getCenter(landmarks, RIGHT_EYE_INDICES);

    const left = { x: rawLeft.x * width, y: rawLeft.y * height };
    const right = { x: rawRight.x * width, y: rawRight.y * height };

    // 2. Calculate current stats
    const curDist = distance(left, right);
    const curAngle = angle(left, right); // radians
    const curCenter = { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 };

    // 3. Compute Rotation (we want angle to be 0)
    // Check sign: if curAngle is positive (eyes tilted down-right), we need to rotate negative.
    // Actually, we want to rotate by -curAngle to make it 0.
    const rotationRad = -curAngle;
    const rotationDeg = rotationRad * (180 / Math.PI);

    // 4. Compute Scale
    const scale = refEyeDist / curDist;

    // 5. Compute Translation
    // After rotation and scale, the current center should move to refCenter.
    // We need to match the center of eyes.
    // Logic: 
    //   NewPos = Scale * Rotate * (OldPos - CenterOfRotation) + CenterOfRotation?
    //   Usually easier: transform image so that EyeCenter is at RefCenter.

    // Actually `sharp` rotate is around center of image.
    // This complicates things.
    // Simplified affine transform logic:
    //   We want a composite transform T.
    //   T(left) = refLeft, T(right) = refRight.

    // Since we are using independent steps (Rotate -> Resize -> Crop),
    // we need to be careful.

    // Let's return just the geometric parameters needed for the pipeline.
    // The pipeline will likely:
    // 1. Rotate image by `rotationDeg` (around image center usually, or specified).
    // 2. If rotated around center, the eye center moves.
    // This is complex to do perfectly with simple commands.
    // Best is to use a matrix and `sharp.affine`.

    return {
        rotation: rotationDeg,
        scale,
        tx: 0, // Placeholder, calculated later or implied
        ty: 0
    };
}
