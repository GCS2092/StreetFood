import type { Metadata, Viewport } from 'next'
import { Sora, DM_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import Providers from '@/components/layout/Providers'
import Header from '@/components/layout/Header'
import Navbar from '@/components/layout/Navbar'
import './globals.css'
import 'leaflet/dist/leaflet.css'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['400', '600', '700', '800'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'StreetFood Dakar',
  description: 'Découvrez les meilleurs vendeurs de rue à Dakar',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'StreetFood Dakar',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#F97316',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${sora.variable} ${dmSans.variable}`}>
      <body className="bg-neutral-950 text-neutral-50 font-sans antialiased">
        <Providers>
          <Header />
          <main className="pb-20 md:pb-0">
            {children}
          </main>
          <Navbar />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#1a1a1a',
                color: '#fafafa',
                border: '1px solid #2a2a2a',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}