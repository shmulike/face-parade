import { useState, useEffect } from 'react';
import styles from './AnimatedDemo.module.css';

const FRAMES = [
    '/images/demo/frame1.png',
    '/images/demo/frame2.png',
    '/images/demo/frame3.png',
    '/images/demo/frame4.png'
];

export default function AnimatedDemo() {
    const [currentFrame, setCurrentFrame] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentFrame((prev) => (prev + 1) % FRAMES.length);
        }, 800); // Change frame every 800ms

        return () => clearInterval(interval);
    }, []);

    return (
        <div className={styles.demoContainer}>
            {/* Left side - messy before */}
            <div className={styles.beforePanel}>
                <div className={styles.panelLabel}>BEFORE</div>
                <div className={styles.messyGrid}>
                    <img src="/images/demo/messy1.png" alt="Messy photo 1" className={styles.messyPhoto} />
                    <img src="/images/demo/messy2.png" alt="Messy photo 2" className={styles.messyPhoto} />
                    <img src="/images/demo/messy3.png" alt="Messy photo 3" className={styles.messyPhoto} />
                    <img src="/images/demo/messy4.png" alt="Messy photo 4" className={styles.messyPhoto} />
                </div>
                <div className={styles.caption}>Misaligned, Chaotic, Inconsistent</div>
            </div>

            {/* Right side - animated aligned video */}
            <div className={styles.afterPanel}>
                <div className={styles.panelLabel}>AFTER</div>
                <div className={styles.videoFrame}>
                    <img
                        src={FRAMES[currentFrame]}
                        alt={`Aligned frame ${currentFrame + 1}`}
                        className={styles.alignedPhoto}
                    />
                    <div className={styles.frameCounter}>
                        FRAME: {currentFrame + 1}/4
                    </div>
                </div>
                <div className={styles.caption}>Perfectly Aligned, Smooth, Professional</div>
            </div>
        </div>
    );
}
