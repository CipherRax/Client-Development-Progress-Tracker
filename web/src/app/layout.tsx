import localFont from 'next/font/local';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/providers';
import { cn } from '@/lib/utils';

// Self-hosted latin-subset woff2 (vendored at build time) — zero runtime CDN
// dependency, per the "no external fonts on the wire" design constraint.
const fraunces = localFont({
  src: [
    { path: './fonts/Fraunces-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Fraunces-600.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-fraunces',
  display: 'swap',
});

const spaceGrotesk = localFont({
  src: [
    { path: './fonts/SpaceGrotesk-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/SpaceGrotesk-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/SpaceGrotesk-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/SpaceGrotesk-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const inter = localFont({
  src: [
    { path: './fonts/Inter-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Inter-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/Inter-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/Inter-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = localFont({
  src: [
    { path: './fonts/JetBrainsMono-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/JetBrainsMono-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/JetBrainsMono-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/JetBrainsMono-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Trackly',
    template: '%s · Trackly',
  },
  description:
    'Trackly — developer-controlled client progress portal. Admins manage projects internally; clients view read-only progress dashboards through secure tokenized links.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002'),
  openGraph: {
    title: 'Trackly',
    description:
      'Developer-controlled client progress portal. Admins manage projects internally; clients view read-only progress dashboards through secure tokenized links.',
    siteName: 'Trackly',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Trackly',
    description:
      'Developer-controlled client progress portal. Admins manage projects internally; clients view read-only progress dashboards through secure tokenized links.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          fraunces.variable,
          spaceGrotesk.variable,
          inter.variable,
          jetbrainsMono.variable,
          'font-sans',
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}