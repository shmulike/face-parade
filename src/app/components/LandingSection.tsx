import { Video, Shield, Sparkles, FolderInput, Zap, Download, ArrowDown } from 'lucide-react';
import styles from './LandingSection.module.css';
import Fireworks from './Fireworks';
import AnimatedDemo from './AnimatedDemo';

interface LandingSectionProps {
    onLoadClick: () => void;
}

export default function LandingSection({ onLoadClick }: LandingSectionProps) {
    const scrollToDemo = () => {
        document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className={styles.landing}>
            <Fireworks />

            {/* HERO SECTION */}
            <section className={styles.hero}>
                <div className={styles.content}>
                    <div className={styles.brand}>From Shmulik Creations</div>

                    <h1 className={styles.title}>
                        <Video className={styles.icon} size={48} />
                        Face-Lapse
                    </h1>

                    <h2 className={styles.headline}>
                        Bring Your Memories into Focus.
                    </h2>

                    <p className={styles.tagline}>
                        Transform your photo collection into stunning face-aligned video montages
                    </p>

                    <div className={styles.ctaGroup}>
                        <button onClick={onLoadClick} className={styles.startButton}>
                            Get Started - Load Your Images
                        </button>
                    </div>

                    <p className={styles.subtitle}>
                        Select a folder of photos and watch Face-Lapse automatically align faces for smooth, professional results.
                    </p>

                    <button className={styles.scrollIndicator} onClick={scrollToDemo}>
                        <span>Learn how it works</span>
                        <ArrowDown size={20} />
                    </button>
                </div>
            </section>

            {/* DEMO COMPARISON SECTION */}
            <section id="demo-section" className={styles.demoSection}>
                <div className={styles.content}>
                    <h3 className={styles.sectionTitle}>From Chaos to Cinema</h3>
                    <AnimatedDemo />
                </div>
            </section>

            <div className={styles.footerWrap}>
                <div className={styles.copyright}>
                    © {new Date().getFullYear()} All rights reserved. Shmulik Creations
                </div>
            </div>
        </div>
    );
}
