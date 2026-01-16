import { FolderOpen, Play, Grid as GridIcon, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import styles from './Toolbar.module.css';

interface ToolbarProps {
    onLoadFolder: () => void;
    onAnalyze: () => void;
    onRender: () => void;
    density: number;
    setDensity: (d: number) => void;
    analyzing: boolean;
    analysisProgress?: string;
    canRender: boolean;

    showLandmarks: boolean;
    setShowLandmarks: (v: boolean) => void;
    landmarkSize: number;
    setLandmarkSize: (v: number) => void;
    landmarkColor: string;
    setLandmarkColor: (v: string) => void;
}

export default function Toolbar({
    onLoadFolder,
    onAnalyze,
    onRender,
    density,
    setDensity,
    analyzing,
    analysisProgress,
    canRender,
    showLandmarks,
    setShowLandmarks,
    landmarkSize,
    setLandmarkSize,
    landmarkColor,
    setLandmarkColor
}: ToolbarProps) {
    return (
        <div className={styles.toolbar}>
            <div className={styles.left}>
                <div className={styles.brand}>Face-Lapse</div>
                <button className={styles.btn} onClick={onLoadFolder}>
                    <FolderOpen size={18} /> Load Folder
                </button>
            </div>

            <div className={styles.center}>
                <div className={styles.group} title="Grid Density">
                    <GridIcon size={16} />
                    <input
                        type="range"
                        min="3"
                        max="12"
                        value={density}
                        onChange={(e) => setDensity(Number(e.target.value))}
                    />
                </div>

                <div className={styles.divider} />

                <div className={styles.group} title="Landmarks">
                    <button className={styles.iconBtn} onClick={() => setShowLandmarks(!showLandmarks)}>
                        {showLandmarks ? <Eye size={16} className={styles.activeIcon} /> : <EyeOff size={16} />}
                    </button>

                    {showLandmarks && (
                        <>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={landmarkSize}
                                onChange={(e) => setLandmarkSize(Number(e.target.value))}
                                className={styles.miniSlider}
                                title="Landmark Size"
                            />
                            <input
                                type="color"
                                value={landmarkColor}
                                onChange={(e) => setLandmarkColor(e.target.value)}
                                className={styles.colorPicker}
                                title="Landmark Color"
                            />
                        </>
                    )}
                </div>

                <div className={styles.divider} />

                <button className={styles.btn} onClick={onAnalyze} disabled={analyzing}>
                    {analyzing ? <RefreshCw className={styles.spin} size={18} /> : <AlertCircle size={18} />}
                    {analyzing && analysisProgress ? `Analyzing (${analysisProgress})` : 'Analyze'}
                </button>
            </div>

            <div className={styles.right}>
                <button className={`${styles.btn} ${styles.primary}`} onClick={onRender} disabled={!canRender}>
                    <Play size={18} fill="currentColor" /> Generate
                </button>
            </div>
        </div>
    );
}
