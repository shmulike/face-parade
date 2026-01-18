#!/usr/bin/env node

/**
 * Direct test script for Face-Lapse
 * Bypasses the UI and tests the full pipeline with a folder of images
 */

const path = require('path');
const fs = require('fs');

// Find set_2 folder
const possiblePaths = [
    '/home/shmulik/set_2',
    '/home/shmulik/Desktop/set_2',
    '/home/shmulik/Pictures/set_2',
    '/home/shmulik/Downloads/set_2',
    '/tmp/set_2'
];

let imageFolder = process.argv[2];

if (!imageFolder) {
    console.log('Searching for set_2 folder...');
    for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
            imageFolder = testPath;
            console.log('Found:', imageFolder);
            break;
        }
    }
}

if (!imageFolder || !fs.existsSync(imageFolder)) {
    console.error('Error: Please provide the path to set_2 folder');
    console.error('Usage: node scripts/test-set2.js /path/to/set_2');
    process.exit(1);
}

console.log(`Testing Face-Lapse with folder: ${imageFolder}\n`);

async function testPipeline() {
    const baseUrl = 'http://localhost:3000';

    // Step 1: Import images
    console.log('Step 1: Importing images...');
    const files = fs.readdirSync(imageFolder)
        .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
        .map(f => path.join(imageFolder, f));

    console.log(`Found ${files.length} images`);

    const FormData = require('form-data');
    const formData = new FormData();

    for (const file of files) {
        formData.append('files', fs.createReadStream(file), path.basename(file));
    }

    const importResponse = await fetch(`${baseUrl}/api/import`, {
        method: 'POST',
        body: formData
    });

    const importData = await importResponse.json();
    console.log('✓ Import complete. Job ID:', importData.jobId);
    console.log(`  Loaded ${importData.images.length} images\n`);

    // Step 2: Analyze faces
    console.log('Step 2: Analyzing faces...');
    const analyzeResponse = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: importData.jobId })
    });

    const analyzeData = await analyzeResponse.json();
    const validFaces = analyzeData.results.filter(r => !r.flagged);
    console.log('✓ Analysis complete');
    console.log(`  Valid faces: ${validFaces.length}/${analyzeData.results.length}`);
    console.log(`  Flagged: ${analyzeData.results.filter(r => r.flagged).length}\n`);

    // Step 3: Render video
    console.log('Step 3: Rendering video...');
    const renderResponse = await fetch(`${baseUrl}/api/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jobId: importData.jobId,
            options: {
                fps: 4,
                width: 1080,
                height: 1920,
                format: 'mp4'
            }
        })
    });

    await renderResponse.json();
    console.log('✓ Render started, polling for progress...\n');

    // Poll for completion
    let status = 'RENDERING';
    while (status !== 'COMPLETED' && status !== 'ERROR') {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const progressResponse = await fetch(`${baseUrl}/api/progress?jobId=${importData.jobId}`);
        const progressData = await progressResponse.json();

        status = progressData.status;
        console.log(`  Status: ${status} | Progress: ${progressData.progress}% | ${progressData.currentStepMessage || ''}`);

        if (status === 'ERROR') {
            console.error('\n✗ Render failed:', progressData.error);
            process.exit(1);
        }
    }

    console.log('\n✓ Video generation complete!');
    console.log(`  Download: ${baseUrl}/api/result?jobId=${importData.jobId}`);
}

testPipeline().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
