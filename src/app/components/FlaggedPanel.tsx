import styles from './FlaggedPanel.module.css';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { ImageItem } from '@/lib/jobs/jobStore';

interface FlaggedPanelProps {
    images: ImageItem[];
}

export default function FlaggedPanel({ images }: FlaggedPanelProps) {
    const [collapsed, setCollapsed] = useState(true);

    const flagged = images.filter(i => i.flagged);
    if (flagged.length === 0) return null;

    return (
        <div className={`${styles.panel} ${collapsed ? styles.collapsed : ''}`}>
            <div className={styles.header} onClick={() => setCollapsed(!collapsed)}>
                <div className={styles.title}>
                    <AlertTriangle size={16} color="orange" />
                    <span>{flagged.length} Flagged Issues</span>
                </div>
                {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {!collapsed && (
                <div className={styles.list}>
                    {flagged.map(img => (
                        <div key={img.id} className={styles.item}>
                            <span className={styles.name}>{img.filename}</span>
                            <span className={styles.reason}>{img.flagReason}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
