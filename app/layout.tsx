import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Silenced Voices · Chapter 01',
  description: 'An immersive exhibition about aphasia, family care, and the right to expression.',
  openGraph: { title: 'Silenced Voices · Chapter 01', description: 'Who is losing a voice? Enter the first room of an immersive exhibition about aphasia and care.', images: ['/og.jpg'] },
  twitter: { card: 'summary_large_image', images: ['/og.jpg'] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
