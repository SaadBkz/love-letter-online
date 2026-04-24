import type { Metadata, Viewport } from 'next';
import { Cinzel, Geist_Mono, Great_Vibes, Lora } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const cinzel = Cinzel({
  variable: '--font-cinzel',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

const greatVibes = Great_Vibes({
  variable: '--font-script',
  subsets: ['latin'],
  weight: ['400'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Saad Letter',
  description: 'Jeu de cartes inspiré de Love Letter, en ligne, multijoueur temps réel.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#3d0e13',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${cinzel.variable} ${lora.variable} ${greatVibes.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          position="top-center"
          theme="dark"
          toastOptions={{
            style: {
              background: 'var(--color-ink)',
              color: 'var(--color-parchment)',
              border: '1px solid var(--color-gold-deep)',
            },
          }}
        />
      </body>
    </html>
  );
}
