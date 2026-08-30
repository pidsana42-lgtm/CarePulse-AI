import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import PageTransition from '@/components/PageTransition'
import AiAdvisor from '@/components/AiAdvisor'

export const metadata: Metadata = {
  title: 'CarePulse AI | รวมสิทธิสุขภาพและความคุ้มครอง',
  description:
    'กรอกข้อมูลครั้งเดียวเพื่อดูสิทธิสุขภาพ กรมธรรม์ โรงพยาบาลใกล้เคียง และค้นหาสิทธิเสริมจากใบรับรองแพทย์ด้วย AI',
  generator: 'CarePulse AI',

  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#115af2',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th" className="bg-background" data-scroll-behavior="smooth">
      <body className="font-sans antialiased">
        <PageTransition>
          {children}
        </PageTransition>
        <AiAdvisor />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
