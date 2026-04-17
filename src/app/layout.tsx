import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { AppToaster } from '@/shared/ui/app-toaster';
import './globals.css';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aibonacci',
  description:
    'AI-assisted planning with Bitrix24 sync — each step builds on project history, like Fibonacci terms build on the previous ones.',
  icons: {
    icon: [{ url: '/aibonacci-logo.png', type: 'image/png' }],
    apple: '/aibonacci-logo.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans">
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
