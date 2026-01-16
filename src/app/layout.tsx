import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Face-Lapse',
    description: 'Create face-aligned video montages locally in your browser'
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
