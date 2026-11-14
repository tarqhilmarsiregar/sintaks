import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'STMIK TIME — CP ARENA | Klub Akademik Programming (Problem Solving)',
  description: 'Platform Gamifikasi Pembelajaran Competitive Programming & Problem Solving STMIK TIME Medan. Dibina oleh Tarq Hilmar Siregar, S.Kom.',
  icons: {
    icon: '/logo-stmik-time.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <Script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js" strategy="lazyOnload" />
      </head>
      <body className="bg-[#090d16] text-[#f1f5f9] min-h-screen antialiased selection:bg-blue-600 selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
