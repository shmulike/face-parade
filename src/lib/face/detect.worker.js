
const { parentPort } = require('worker_threads');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { FaceLandmarker, FilesetResolver } = require('@mediapipe/tasks-vision');
console.log('Worker: Modules loaded');

// POLYFILLS (Safe inside worker)
console.log('Worker: Applying polyfills');
global.document = {
    createElement: () => ({
        getContext: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        appendChild: () => { },
        style: {}
    }),
    addEventListener: () => { },
    removeEventListener: () => { },
    appendChild: () => { },
    body: { appendChild: () => { }, style: {} },
    head: { appendChild: () => { } }
};

global.window = global;
global.window.location = { protocol: 'https:', href: 'https://localhost' };
global.window.navigator = { userAgent: 'Node.js' };
global.navigator = global.window.navigator;
global.location = global.window.location;
if (!global.self) global.self = global;

let landmarker = null;

async function getLandmarker(modelPath, wasmDir) {
    if (landmarker) return landmarker;

    const vision = await FilesetResolver.forVisionTasks(wasmDir);
    landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: modelPath,
            delegate: 'CPU'
        },
        outputFaceBlendshapes: false,
        runningMode: 'IMAGE',
        numFaces: 5,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    return landmarker;
}

parentPort.on('message', async (task) => {
    console.log('Worker: Received task');
    try {
        const { imagePath, modelPath, wasmDir } = task;
        console.log('Worker: Getting landmarker...');

        const lm = await getLandmarker(modelPath, wasmDir);
        console.log('Worker: Landmarker ready, processing image...');

        // Process image
        const { data, info } = await sharp(imagePath)
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        const imageData = {
            data: new Uint8ClampedArray(data),
            width: info.width,
            height: info.height,
            colorSpace: 'srgb',
        };

        const result = await lm.detect(imageData);

        // Send back result
        // We only send plain objects
        parentPort.postMessage({
            success: true,
            faceCount: result.faceLandmarks.length,
            landmarks: result.faceLandmarks,
            confidence: result.faceLandmarks.length > 0 ? 1.0 : 0.0
        });

    } catch (err) {
        parentPort.postMessage({
            success: false,
            error: err.message || String(err),
            stack: err.stack
        });
    }
});
