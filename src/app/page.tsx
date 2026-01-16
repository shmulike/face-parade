'use client';

import { useState, useRef, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import GalleryGrid from './components/GalleryGrid';
import FlaggedPanel from './components/FlaggedPanel';
import GenerateModal from './components/GenerateModal';
import { ImageItem } from '@/lib/jobs/jobStore';

// Poll interval
const POLL_INTERVAL = 1000;

export default function Home() {
    const [jobId, setJobId] = useState<string>('');
    const [images, setImages] = useState<ImageItem[]>([]);
    const [density, setDensity] = useState(6);
    const [analyzing, setAnalyzing] = useState(false);
    const [renderStatus, setRenderStatus] = useState<string>('IDLE');
    const [progress, setProgress] = useState(0);
    const [stepMessage, setStepMessage] = useState('');
    const [resultUrl, setResultUrl] = useState('');
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);

    // Landmark controls
    const [showLandmarks, setShowLandmarks] = useState(false);
    const [landmarkSize, setLandmarkSize] = useState(2);
    const [landmarkColor, setLandmarkColor] = useState('#00ff00');

    // Excluded images
    const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

    const fileInputRef = useRef<HTMLInputElement>(null);
    const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleToggleExclude = (imageId: string) => {
        setExcludedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(imageId)) {
                newSet.delete(imageId);
            } else {
                newSet.add(imageId);
            }
            return newSet;
        });
    };

    // Setup directory attribute manually
    useEffect(() => {
        if (fileInputRef.current) {
            fileInputRef.current.setAttribute('webkitdirectory', '');
            fileInputRef.current.setAttribute('directory', '');
        }
    }, []);

    const handleLoadFolderClick = () => {
        fileInputRef.current?.click();
    };

    const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        // Clear existing images on new folder load?
        // "The user should load a folder and the system will take all the images in that folder"
        // Usually implies clearing previous state or resetting.
        // I will reset images. 
        setImages([]);

        const formData = new FormData();
        // We create a new job ID for a new folder load to keep things clean?
        // Or reuse? If we clear images, we effectively start fresh.
        // Let's rely on backend to create new job if we don't send one, or just send a fresh one?
        // If we keep existing JobId, backend appends.
        // Let's clear JobId to start fresh.
        setJobId('');

        // Add files
        // Filter for images only client side to avoid big upload of junk?
        // input accept="image/*" helps but directory mode might include others.

        const validFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));

        if (validFiles.length === 0) {
            alert('No images found in folder');
            return;
        }

        for (let i = 0; i < validFiles.length; i++) {
            formData.append('files', validFiles[i]);
        }

        try {
            const res = await fetch('/api/import', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.jobId) setJobId(data.jobId);

            // As implied, we replace current list
            setImages(data.images);
        } catch (err) {
            console.error(err);
            alert('Failed to upload images');
        }

        // reset input
        e.target.value = '';
    };

    const [analysisProgress, setAnalysisProgress] = useState('');

    const handleAnalyze = async () => {
        if (!jobId || images.length === 0) return;
        setAnalyzing(true);
        setAnalysisProgress(`0/${images.length}`);

        try {
            // Process in batches of 5 to avoid timeouts and show progress
            const BATCH_SIZE = 5;
            const total = images.length;
            let processed = 0;

            // We need to keep track of all images to ensure we don't lose updates
            let currentImages = [...images];

            for (let i = 0; i < total; i += BATCH_SIZE) {
                const batch = currentImages.slice(i, i + BATCH_SIZE);
                const order = batch.map(img => img.id);

                const res = await fetch('/api/analyze', {
                    method: 'POST',
                    body: JSON.stringify({ jobId, order, options: { minConfidence: 0.5 } })
                });

                if (!res.ok) throw new Error('Batch analysis failed');

                const data = await res.json();

                if (data.results) {
                    // Update the master list with results from this batch
                    currentImages = currentImages.map(img => {
                        const resItem = data.results.find((r: any) => r.id === img.id);
                        return resItem ? { ...img, ...resItem } : img;
                    });

                    // Update state immediately to show progress visually in grid
                    setImages([...currentImages]);
                }

                processed += batch.length;
                setAnalysisProgress(`${Math.min(processed, total)}/${total}`);
            }

            // Auto show landmarks after analysis
            if (!showLandmarks) setShowLandmarks(true);

        } catch (err) {
            console.error(err);
            alert('Analysis failed');
        } finally {
            setAnalyzing(false);
            setAnalysisProgress('');
        }
    };

    const handleReorder = (fromIndex: number, toIndex: number) => {
        const newOrder = [...images];
        const [moved] = newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, moved);
        setImages(newOrder);
    };

    const handleStartRender = async (options: any) => {
        if (!jobId) return;

        setError('');
        setRenderStatus('RENDERING');
        setProgress(0);

        // Filter out excluded images from the order
        const includedOrder = images
            .filter(i => !excludedIds.has(i.id))
            .map(i => i.id);

        const payload = {
            jobId,
            order: includedOrder,
            options  // Nest options instead of spreading
        };

        try {
            await fetch('/api/render', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            // Start polling
            startPolling();
        } catch (err) {
            setRenderStatus('ERROR');
            setError('Failed to start render');
        }
    };

    const startPolling = () => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        pollTimerRef.current = setInterval(async () => {
            try {
                const res = await fetch(`/api/progress?jobId=${jobId}`);
                const data = await res.json();

                if (data.error) {
                    setRenderStatus('ERROR');
                    setError(data.error);
                    stopPolling();
                    return;
                }

                setProgress(data.progress);
                setStepMessage(data.step || '');

                if (data.status === 'COMPLETED') {
                    setRenderStatus('COMPLETED');
                    setResultUrl(data.resultUrl);
                    stopPolling();
                } else if (data.status === 'ERROR') {
                    setRenderStatus('ERROR');
                    setError(data.error || 'Unknown error');
                    stopPolling();
                }
            } catch (e) {
                // ignore transient errors
            }
        }, POLL_INTERVAL);
    };

    const stopPolling = () => {
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
        }
    };

    return (
        <main>
            <Toolbar
                onLoadFolder={handleLoadFolderClick}
                onAnalyze={handleAnalyze}
                onRender={() => {
                    setRenderStatus('IDLE');
                    setProgress(0);
                    setError('');
                    setResultUrl('');
                    setShowModal(true);
                }}
                density={density}
                setDensity={setDensity}
                analyzing={analyzing}
                analysisProgress={analysisProgress}
                canRender={images.length > 0 && !analyzing}

                showLandmarks={showLandmarks}
                setShowLandmarks={setShowLandmarks}
                landmarkSize={landmarkSize}
                setLandmarkSize={setLandmarkSize}
                landmarkColor={landmarkColor}
                setLandmarkColor={setLandmarkColor}
            />

            <GalleryGrid
                images={images}
                density={density}
                onReorder={handleReorder}
                onToggleExclude={handleToggleExclude}
                excludedIds={excludedIds}
                showLandmarks={showLandmarks}
                landmarkSize={landmarkSize}
                landmarkColor={landmarkColor}
            />

            <FlaggedPanel images={images} />

            <GenerateModal
                jobId={jobId}
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onStartRender={handleStartRender}
                progress={progress}
                status={renderStatus}
                stepMessage={stepMessage}
                resultUrl={resultUrl}
                error={error}
                imageCount={images.filter(i => !excludedIds.has(i.id)).length}
            />

            <input
                type="file"
                multiple
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFiles}
                {...({ webkitdirectory: "", directory: "" } as any)}
            />
        </main>
    );
}
