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
  title: 'Silenced Voices · Complete Exhibition',
  description: 'Walk through the complete immersive exhibition about aphasia, family care, rehabilitation, and the right to expression.',
  openGraph: { title: 'Silenced Voices · Complete Exhibition', description: 'Enter twelve connected rooms and explore 54 exhibition boards and continuous spreads.', images: ['/og.jpg'] },
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
