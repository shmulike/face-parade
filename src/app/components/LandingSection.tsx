import { Video, Shield, Sparkles } from 'lucide-react';
import styles from './LandingSection.module.css';

interface LandingSectionProps {
    onLoadClick: () => void;
}

export default function LandingSection({ onLoadClick }: LandingSectionProps) {
    return (
        <div className={styles.landing}>
            <div className={styles.content}>
                <div className={styles.brand}>From Shmulik Creations</div>

                <h1 className={styles.title}>
                    <Video className={styles.icon} size={48} />
                    Face-Lapse
                </h1>

                <p className={styles.tagline}>
                    Transform your photo collection into stunning face-aligned video montages.
                    <span className={styles.highlight}> All processing happens locally on your device</span>—your
                    photos never leave your computer, ensuring complete privacy and security.
                </p>

                <div className={styles.features}>
                    <div className={styles.feature}>
                        <Shield size={24} />
                        <span>100% Private - No Uploads</span>
                    </div>
                    <div className={styles.feature}>
                        <Sparkles size={24} />
                        <span>AI-Powered Face Alignment</span>
                    </div>
                    <div className={styles.feature}>
                        <Video size={24} />
                        <span>Professional Video Export</span>
                    </div>
                </div>

                <button onClick={onLoadClick} className={styles.startButton}>
                    Get Started - Load Your Images
                </button>

                <p className={styles.subtitle}>
                    Select a folder of photos and watch Face-Lapse automatically align faces for smooth, professional results.
                </p>
            </div>
        </div>
    );
}
