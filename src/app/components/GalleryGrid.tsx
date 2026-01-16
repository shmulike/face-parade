import { useState } from 'react';
import styles from './GalleryGrid.module.css';
import { ImageItem } from '@/lib/jobs/jobStore';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface GalleryGridProps {
    images: ImageItem[];
    density: number;
    onReorder: (fromIndex: number, toIndex: number) => void;
    onToggleExclude?: (imageId: string) => void;
    excludedIds?: Set<string>;
    showLandmarks?: boolean;
    landmarkSize?: number;
    landmarkColor?: string;
}

export default function GalleryGrid({
    images,
    density,
    onReorder,
    onToggleExclude,
    excludedIds = new Set(),
    showLandmarks = false,
    landmarkSize = 2,
    landmarkColor = '#00ff00'
}: GalleryGridProps) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        // Firefox requires data to be set
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null) return;
        if (draggedIndex !== targetIndex) {
            onReorder(draggedIndex, targetIndex);
        }
        setDraggedIndex(null);
    };

    if (images.length === 0) {
        return (
            <div className={styles.empty}>
                <p>No images loaded. Click "Load Images" or drag files here.</p>
            </div>
        );
    }

    return (
        <div
            className={styles.grid}
            style={{ gridTemplateColumns: `repeat(${density}, 1fr)` }}
        >
            {images.map((img, index) => {
                const isExcluded = excludedIds.has(img.id);

                return (
                    <div
                        key={img.id}
                        className={`${styles.item} ${img.flagged ? styles.flagged : ''} ${isExcluded ? styles.excluded : ''} ${draggedIndex === index ? styles.dragging : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                    >
                        {/* Filename at top */}
                        <div className={styles.filenameTop}>
                            <span className={styles.filenameText} title={img.filename}>{img.filename}</span>
                            {onToggleExclude && (
                                <label
                                    className={styles.checkboxLabel}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <input
                                        type="checkbox"
                                        checked={!isExcluded}
                                        onChange={() => onToggleExclude(img.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        className={styles.checkbox}
                                    />
                                    <span className={styles.checkboxText}>Include</span>
                                </label>
                            )}
                        </div>

                        <div className={styles.thumbWrapper}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.thumbUrl} alt="" className={styles.thumb} loading="lazy" />

                            {showLandmarks && img.landmarks && (
                                <LandmarkOverlay landmarks={img.landmarks} size={landmarkSize} color={landmarkColor} />
                            )}

                            <div className={styles.overlay}>
                                <span className={styles.index}>{index + 1}</span>
                                {img.flagged && (
                                    <span className={styles.flagIcon} title={img.flagReason || 'Flagged'}>
                                        <AlertTriangle size={16} color="orange" />
                                    </span>
                                )}
                                {!img.flagged && img.faceCount === 1 && (
                                    <span className={styles.flagIcon}>
                                        <CheckCircle size={16} color="#22c55e" />
                                    </span>
                                )}
                            </div>
                            {img.flagged && <div className={styles.flagOverlay} />}
                            {isExcluded && <div className={styles.excludedOverlay} />}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function LandmarkOverlay({ landmarks, size = 2, color = '#00ff00' }: { landmarks: { x: number, y: number }[], size?: number, color?: string }) {
    // Landmarks are normalized 0-1
    return (
        <svg className={styles.overlayCanvas} viewBox="0 0 100 100" preserveAspectRatio="none">
            {landmarks.map((p, i) => (
                <circle
                    key={i}
                    cx={p.x * 100}
                    cy={p.y * 100}
                    r={size / 5} /* simple scaling */
                    fill={color}
                />
            ))}
        </svg>
    );
}
