import { Video, Shield, Sparkles } from 'lucide-react';
import styles from './LandingSection.module.css';
import Fireworks from './Fireworks';

interface LandingSectionProps {
    onLoadClick: () => void;
}

export default function LandingSection({ onLoadClick }: LandingSectionProps) {
    return (
        <div className={styles.landing}>
            <Fireworks />
            <div className={styles.content}>
                <div className={styles.brand}>From Shmulik Creations</div>

                <h1 className={styles.title}>
                    <Video className={styles.icon} size={48} />
                    Face-Lapse
                </h1>

                <p className={styles.tagline}>
                    Transform your photo collection into stunning face-aligned video montages
                </p>

                <button onClick={onLoadClick} className={styles.startButton}>
                    Get Started - Load Your Images
                </button>

                <p className={styles.subtitle}>
                    Select a folder of photos and watch Face-Lapse automatically align faces for smooth, professional results.
                </p>
            </div>

            <div className={styles.copyright}>
                © {new Date().getFullYear()} All rights reserved. Shmulik Creations
            </div>
        </div>
    );
}
