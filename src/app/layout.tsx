import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'FaceParade',
    description: 'Create face montages locally',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
