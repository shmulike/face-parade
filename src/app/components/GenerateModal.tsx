import { X, Download, AlertCircle, Video } from 'lucide-react';
import styles from './GenerateModal.module.css';
import { useState, useEffect } from 'react';

interface GenerateModalProps {
    jobId: string;
    isOpen: boolean;
    onClose: () => void;
    onStartRender: (options: any) => Promise<void>;
    progress: number;
    status: string; // 'IDLE', 'RENDERING', 'COMPLETED', 'ERROR'
    stepMessage: string;
    resultUrl?: string;
    error?: string;
    imageCount: number;
}

const RESOLUTIONS = [
    { label: '1080p Portrait (1080×1920)', width: 1080, height: 1920 },
    { label: '1080p Landscape (1920×1080)', width: 1920, height: 1080 },
    { label: '720p Portrait (720×1280)', width: 720, height: 1280 },
    { label: 'Square (1080×1080)', width: 1080, height: 1080 },
    { label: 'Custom', width: 0, height: 0 }
];

export default function GenerateModal({
    jobId,
    isOpen,
    onClose,
    onStartRender,
    progress,
    status,
    stepMessage,
    resultUrl,
    error,
    imageCount
}: GenerateModalProps) {
    const [filename, setFilename] = useState('');
    const [format, setFormat] = useState<'mp4' | 'avi' | 'webm'>('mp4');
    const [durationMode, setDurationMode] = useState<'perPhoto' | 'total'>('perPhoto');
    const [perPhotoDuration, setPerPhotoDuration] = useState(0.25);
    const [totalDuration, setTotalDuration] = useState(5);
    const [includeLandmarks, setIncludeLandmarks] = useState(false);
    const [selectedResIndex, setSelectedResIndex] = useState(0);
    const [customWidth, setCustomWidth] = useState(1080);
    const [customHeight, setCustomHeight] = useState(1920);

    // Default filename on open
    useEffect(() => {
        if (isOpen && status === 'IDLE') {
            const d = new Date();
            const pad = (n: number) => n.toString().padStart(2, '0');
            const day = pad(d.getDate());
            const month = pad(d.getMonth() + 1);
            const year = d.getFullYear();
            const hours = pad(d.getHours());
            const minutes = pad(d.getMinutes());
            const dateStr = `${day}${month}${year}${hours}${minutes}`;
            setFilename(`video_output_${dateStr}`);
        }
    }, [isOpen, status]);

    // Calculate derived values
    const effectiveImageCount = imageCount || 1;
    const calculatedPerPhoto = durationMode === 'total'
        ? totalDuration / effectiveImageCount
        : perPhotoDuration;

    const calculatedTotal = durationMode === 'perPhoto'
        ? perPhotoDuration * effectiveImageCount
        : totalDuration;

    const fps = Math.max(1, Math.round(1 / calculatedPerPhoto));

    const finalWidth = RESOLUTIONS[selectedResIndex].width || customWidth;
    const finalHeight = RESOLUTIONS[selectedResIndex].height || customHeight;

    if (!isOpen) return null;

    const handleStart = () => {
        onStartRender({
            width: finalWidth,
            height: finalHeight,
            fps,
            format,
            includeLandmarks,
            filename: `${filename}.${format}`
        });
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3>Generate Video</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>

                <div className={styles.body}>
                    {status === 'IDLE' && (
                        <div className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Output Filename</label>
                                <input
                                    type="text"
                                    value={filename}
                                    onChange={e => setFilename(e.target.value)}
                                    className={styles.input}
                                    placeholder="video_output_..."
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Format</label>
                                <select value={format} onChange={(e) => setFormat(e.target.value as any)} className={styles.input}>
                                    <option value="mp4">MP4 (H.264 - Best compatibility)</option>
                                    <option value="avi">AVI</option>
                                    <option value="webm">WebM</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Resolution</label>
                                <select
                                    value={selectedResIndex}
                                    onChange={(e) => setSelectedResIndex(Number(e.target.value))}
                                    className={styles.input}
                                >
                                    {RESOLUTIONS.map((res, i) => (
                                        <option key={i} value={i}>{res.label}</option>
                                    ))}
                                </select>
                            </div>

                            {RESOLUTIONS[selectedResIndex].label === 'Custom' && (
                                <div className={styles.resolutionRow}>
                                    <input
                                        type="number"
                                        value={customWidth}
                                        onChange={(e) => setCustomWidth(Number(e.target.value))}
                                        className={styles.input}
                                        placeholder="Width"
                                    />
                                    <span>×</span>
                                    <input
                                        type="number"
                                        value={customHeight}
                                        onChange={(e) => setCustomHeight(Number(e.target.value))}
                                        className={styles.input}
                                        placeholder="Height"
                                    />
                                </div>
                            )}

                            <div className={styles.formGroup}>
                                <label>Duration Logic</label>
                                <select value={durationMode} onChange={(e) => setDurationMode(e.target.value as any)} className={styles.input}>
                                    <option value="perPhoto">Delay between Photos</option>
                                    <option value="total">Target Total Duration</option>
                                </select>
                            </div>

                            {durationMode === 'perPhoto' ? (
                                <div className={styles.formGroup}>
                                    <label>Photo Delay (seconds)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        value={perPhotoDuration}
                                        onChange={(e) => setPerPhotoDuration(parseFloat(e.target.value) || 0.1)}
                                        className={styles.input}
                                    />
                                    <small className={styles.hint}>Total: ~{calculatedTotal.toFixed(1)}s for {imageCount} photos ({fps} FPS)</small>
                                </div>
                            ) : (
                                <div className={styles.formGroup}>
                                    <label>Total Duration (seconds)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        value={totalDuration}
                                        onChange={(e) => setTotalDuration(parseFloat(e.target.value) || 0.1)}
                                        className={styles.input}
                                    />
                                    <small className={styles.hint}>Delay: ~{calculatedPerPhoto.toFixed(2)}s per photo ({fps} FPS)</small>
                                </div>
                            )}

                            <div className={styles.checkboxRow}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={includeLandmarks}
                                        onChange={(e) => setIncludeLandmarks(e.target.checked)}
                                    />
                                    Include Landmarks in Video
                                </label>
                            </div>
                        </div>
                    )}

                    {status === 'RENDERING' && (
                        <div className={styles.progress}>
                            <div className={styles.barContainer}>
                                <div className={styles.bar} style={{ width: `${progress}%` }} />
                            </div>
                            <p className={styles.step}>{stepMessage} ({progress}%)</p>
                        </div>
                    )}

                    {status === 'COMPLETED' && (
                        <div className={styles.completed}>
                            <CheckCircleBig size={48} color="#22c55e" />
                            <h4>Success!</h4>
                            <p>Video rendered successfully.</p>
                            <a href={resultUrl} className={styles.downloadBtn} download={filename + '.' + format}>
                                <Download size={18} /> Download
                            </a>
                        </div>
                    )}

                    {status === 'ERROR' && (
                        <div className={styles.error}>
                            <AlertCircle size={48} color="#ef4444" />
                            <h4>Error</h4>
                            <p>{error}</p>
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    {status === 'IDLE' && (
                        <button className={styles.primaryBtn} onClick={handleStart}>
                            <Video size={16} /> Render Video
                        </button>
                    )}
                    {status !== 'RENDERING' && status !== 'IDLE' && (
                        <button className={styles.secondaryBtn} onClick={onClose}>Close</button>
                    )}
                </div>
            </div>
        </div>
    );
}

function CheckCircleBig({ size, color }: any) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
}
