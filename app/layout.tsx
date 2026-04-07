import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SAFE Calculator - Free, Open-Source SAFE Note Calculator',
  description:
    'Free SAFE note calculator that handles multiple stacking SAFEs, post-money, pre-money, and MFN. Built for founders by a founder.',
  authors: [{ name: 'Michael Batko', url: 'https://batko.ai' }],
  openGraph: {
    title: 'SAFE Calculator',
    description:
      'Free SAFE note calculator. Handles stacked SAFEs, post-money, pre-money, MFN. Open-source.',
    url: 'https://batkotron.github.io/safe-calculator',
    siteName: 'SAFE Calculator',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
