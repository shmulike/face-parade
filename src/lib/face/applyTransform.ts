import sharp from 'sharp';
import path from 'path';
import { Point, getCenter, distance, angle } from './computeTransform';

// Indices
const LEFT_EYE_INDICES = [33, 133];
const RIGHT_EYE_INDICES = [362, 263];

interface AlignOptions {
    width: number; // Output width
    height: number; // Output height
    refEyeDist: number; // Target eye distance in pixels
    refCenter: { x: number; y: number }; // Target center (midpoint between eyes) in output coordinates
    includeLandmarks?: boolean; // Whether to draw landmarks on the output
}

export async function alignImage(
    inputPath: string,
    outputPath: string,
    landmarks: Point[],
    options: AlignOptions
) {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) throw new Error('Invalid image metadata');

    const w = metadata.width;
    const h = metadata.height;

    // 1. Get current geometry
    const rawLeft = getCenter(landmarks, LEFT_EYE_INDICES);
    const rawRight = getCenter(landmarks, RIGHT_EYE_INDICES);

    const eyeL = { x: rawLeft.x * w, y: rawLeft.y * h };
    const eyeR = { x: rawRight.x * w, y: rawRight.y * h };
    const curCenter = { x: (eyeL.x + eyeR.x) / 2, y: (eyeL.y + eyeR.y) / 2 };

    // 2. Compute Rotation
    const curAngle = angle(eyeL, eyeR);
    const rotationDeg = -curAngle * (180 / Math.PI);

    // 3. Current distance
    const curDist = distance(eyeL, eyeR);

    // 4. Scale factor
    const scale = options.refEyeDist / (curDist || 1);

    const rad = rotationDeg * (Math.PI / 180);
    const cx = w / 2;
    const cy = h / 2;

    const dx = curCenter.x - cx;
    const dy = curCenter.y - cy;

    const sinAg = Math.sin(rad);
    const cosAg = Math.cos(rad);

    // Rotated offset
    const dx_rot = dx * cosAg - dy * sinAg;
    const dy_rot = dx * sinAg + dy * cosAg;

    // We perform the rotate now to get the ACTUAL buffer and metadata
    const buffer1 = await image.rotate(rotationDeg, { background: '#000000' }).toBuffer();
    const img2 = sharp(buffer1);
    const meta2 = await img2.metadata();
    const w2 = meta2.width!;
    const h2 = meta2.height!;

    const realNewCenterX = (w2 / 2) + dx_rot;
    const realNewCenterY = (h2 / 2) + dy_rot;

    // Resize - Force exact dimensions to match our math
    const w3 = Math.round(w2 * scale);
    const h3 = Math.round(h2 * scale);
    const buffer2 = await img2.resize(w3, h3, { fit: 'fill' }).toBuffer();

    const realScaledCenterX = realNewCenterX * scale;
    const realScaledCenterY = realNewCenterY * scale;

    // Final Stabilized Extraction
    const padW = options.width;
    const padH = options.height;

    // Actual coordinates in the padded image space
    const cropLeft = Math.round(realScaledCenterX + padW - options.refCenter.x);
    const cropTop = Math.round(realScaledCenterY + padH - options.refCenter.y);

    // We MUST use toBuffer() to force Sharp to apply 'extend' before 'extract'
    const extendedBuffer = await sharp(buffer2)
        .extend({
            top: padH,
            bottom: padH,
            left: padW,
            right: padW,
            background: { r: 0, g: 0, b: 0, alpha: 1 }
        })
        .toBuffer();

    let finalImage = sharp(extendedBuffer)
        .extract({
            left: Math.max(0, cropLeft),
            top: Math.max(0, cropTop),
            width: options.width,
            height: options.height
        });

    // Add landmark overlay if requested
    if (options.includeLandmarks) {
        // Transform landmarks to output coordinates
        const transformedPoints: { x: number; y: number }[] = [];

        for (const lm of landmarks) {
            // Original coordinates in pixels
            const origX = lm.x * w;
            const origY = lm.y * h;

            // Apply rotation
            const dxOrig = origX - cx;
            const dyOrig = origY - cy;
            const rotX = cx + (dxOrig * cosAg - dyOrig * sinAg);
            const rotY = cy + (dxOrig * sinAg + dyOrig * cosAg);

            // After rotation, shift by the rotation expansion
            const absC = Math.abs(cosAg);
            const absS = Math.abs(sinAg);
            const shiftedX = rotX + (w2 - w * absC - h * absS) / 2;
            const shiftedY = rotY + (h2 - h * absC - w * absS) / 2;

            // Apply scale
            const scaledX = shiftedX * scale;
            const scaledY = shiftedY * scale;

            // Apply padding and crop offset
            const finalX = scaledX + padW - Math.max(0, cropLeft);
            const finalY = scaledY + padH - Math.max(0, cropTop);

            transformedPoints.push({ x: finalX, y: finalY });
        }

        // Generate SVG overlay
        const circles = transformedPoints
            .map(p => `<circle cx="${p.x}" cy="${p.y}" r="2" fill="lime" opacity="0.8"/>`)
            .join('\n');

        const svgOverlay = Buffer.from(`
            <svg width="${options.width}" height="${options.height}">
                ${circles}
            </svg>
        `);

        finalImage = finalImage.composite([{
            input: svgOverlay,
            top: 0,
            left: 0
        }]);
    }

    await finalImage.toFile(outputPath);
}
