'use client';

import { useEffect, useRef } from 'react';
import styles from './Fireworks.module.css';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
}

interface Rocket {
    x: number;
    y: number;
    vx: number;
    vy: number;
    target: number;
    color: string;
}

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export default function Fireworks() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        const rockets: Rocket[] = [];
        const particles: Particle[] = [];

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const createRocket = () => {
            const x = Math.random() * canvas.width;
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8; // Random angle upward
            const speed = 8 + Math.random() * 4;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const target = canvas.height * (0.2 + Math.random() * 0.3); // Explode in upper portion

            rockets.push({
                x,
                y: canvas.height,
                vx,
                vy,
                target,
                color: COLORS[Math.floor(Math.random() * COLORS.length)]
            });
        };

        const explode = (rocket: Rocket) => {
            const particleCount = 80 + Math.floor(Math.random() * 40);

            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
                const speed = 2 + Math.random() * 4;
                const size = 8 + Math.floor(Math.random() * 8); // Big pixelated particles

                particles.push({
                    x: rocket.x,
                    y: rocket.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1,
                    maxLife: 60 + Math.random() * 40,
                    size,
                    color: rocket.color
                });
            }
        };

        const animate = () => {
            ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update and draw rockets
            for (let i = rockets.length - 1; i >= 0; i--) {
                const r = rockets[i];
                r.x += r.vx;
                r.y += r.vy;
                r.vy += 0.15; // Gravity

                // Draw pixelated rocket trail
                ctx.fillStyle = r.color;
                ctx.fillRect(Math.floor(r.x / 6) * 6, Math.floor(r.y / 6) * 6, 6, 12);

                if (r.y <= r.target || r.vy > 0) {
                    explode(r);
                    rockets.splice(i, 1);
                }
            }

            // Update and draw particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.08; // Gravity
                p.vx *= 0.99; // Air resistance
                p.life++;

                const alpha = 1 - (p.life / p.maxLife);

                // Draw pixelated particles
                ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                ctx.fillRect(
                    Math.floor(p.x / 6) * 6,
                    Math.floor(p.y / 6) * 6,
                    p.size,
                    p.size
                );

                if (p.life >= p.maxLife) {
                    particles.splice(i, 1);
                }
            }

            animationId = requestAnimationFrame(animate);
        };

        // Launch fireworks at intervals
        const launchInterval = setInterval(() => {
            if (Math.random() > 0.3) {
                createRocket();
            }
        }, 600);

        // Initial rocket
        createRocket();
        animate();

        return () => {
            cancelAnimationFrame(animationId);
            clearInterval(launchInterval);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    return <canvas ref={canvasRef} className={styles.canvas} />;
}
