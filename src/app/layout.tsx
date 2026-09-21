import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: "Reem's Kitchen — Catering Staff Management",
    template: "%s · Reem's Kitchen",
  },
  description:
    'Manage catering staff, publish work opportunities, track bookings, attendance and payments.',
  /**
   * Declared here rather than via the app/icon.png file convention, because
   * only this form takes a `media` query — which is what lets the browser pick
   * the light-on-dark mark for a dark UI. Browser support varies; the first
   * entry is the fallback for those that ignore `media`.
   */
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
      {
        url: '/icon-dark.png',
        type: 'image/png',
        sizes: '512x512',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1220' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Applies the saved theme before first paint so a dark-mode user never
          sees a white flash. Kept inline and tiny for exactly that reason.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var stored = localStorage.getItem('rk-theme');
                var dark = stored
                  ? stored === 'dark'
                  : window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (dark) document.documentElement.classList.add('dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{ duration: 4000 }}
        />
      </body>
    </html>
  );
}
