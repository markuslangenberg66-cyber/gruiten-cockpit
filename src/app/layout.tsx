import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gruitener Cockpit',
  description: 'Dein persönliches Cockpit für die tägliche Pendlerstrecke Haan–Düsseldorf.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Gruitener Cockpit',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover', // iPhone-Notch / Dynamic Island
  themeColor: '#0b0f19',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <main className="min-h-screen min-h-dvh relative overflow-hidden bg-[var(--color-dark-bg)] text-white">
          {/* Hintergrund-Glow */}
          <div className="fixed top-[-15%] left-[-15%] w-[60%] h-[60%] bg-[var(--color-accent-subtle)] rounded-full blur-[180px] pointer-events-none opacity-40 z-0" />
          <div className="fixed bottom-[-15%] right-[-15%] w-[60%] h-[60%] bg-[#6366f1]/15 rounded-full blur-[180px] pointer-events-none opacity-40 z-0" />

          <div className="relative z-10 max-w-7xl mx-auto
                          px-3 sm:px-6 lg:px-8
                          pt-safe-top pb-safe-bottom
                          py-4 sm:py-6 md:py-10">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}
