import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.content}>
                <div className={styles.section}>
                    <h3>Legal Disclaimer</h3>
                    <p>
                        <strong>No Warranty:</strong> This software is provided "AS IS" without warranty of any kind,
                        express or implied. Use at your own risk.
                    </p>
                    <p>
                        <strong>No Liability:</strong> Shmulik Creations shall not be liable for any damages, data loss,
                        or other issues arising from the use of this software.
                    </p>
                    <p>
                        <strong>Privacy:</strong> FaceParade processes all images locally in your browser. No data is
                        uploaded to external servers. However, we take no responsibility for any data security issues
                        that may arise from your device or network configuration.
                    </p>
                    <p>
                        <strong>User Responsibility:</strong> You are solely responsible for ensuring you have the right
                        to use and process any images you upload. Shmulik Creations is not responsible for any copyright
                        violations, privacy breaches, or misuse of the software.
                    </p>
                </div>

                <div className={styles.section}>
                    <h3>Terms of Use</h3>
                    <p>
                        By using FaceParade, you agree to use this software for lawful purposes only and in compliance
                        with all applicable laws and regulations.
                    </p>
                    <p>
                        This software is intended for personal, non-commercial use. Any commercial use requires
                        explicit permission from Shmulik Creations.
                    </p>
                </div>

                <div className={styles.section}>
                    <h3>Intellectual Property</h3>
                    <p>
                        Copyright © {new Date().getFullYear()} Shmulik Creations. All rights reserved.
                    </p>
                    <p>
                        Face-Lapse name, logo, and original code are proprietary to Shmulik Creations.
                        Third-party libraries and components are subject to their respective licenses.
                    </p>
                </div>

                <div className={styles.section}>
                    <h3>Data & Privacy Policy</h3>
                    <p>
                        <strong>No Data Collection:</strong> We do not collect, store, or transmit any personal data,
                        images, or usage analytics.
                    </p>
                    <p>
                        <strong>Local Processing:</strong> All image processing and AI computation occurs entirely
                        within your browser. Your photos are never sent to our servers or any third party.
                    </p>
                    <p>
                        <strong>No Cookies:</strong> We do not use cookies or any tracking mechanisms.
                    </p>
                    <p>
                        <strong>Your Security:</strong> While we've designed Face-Lapse to be secure and private,
                        we cannot guarantee absolute security and are not responsible for any data breaches or
                        security incidents on your device or network.
                    </p>
                </div>

                <div className={styles.divider}></div>

                <div className={styles.brand}>
                    <p className={styles.signature}>Made with ❤️ by <strong>Shmulik Creations</strong></p>
                    <p className={styles.tagline}>Building privacy-first creative tools</p>
                </div>
            </div>
        </footer>
    );
}
