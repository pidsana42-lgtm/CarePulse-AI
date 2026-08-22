import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Thai } from 'next/font/google'
import './globals.css'
import AiAdvisor from '@/components/AiAdvisor'

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  variable: '--font-ibm-plex-sans-thai',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CarePulse AI | ผู้ช่วยค้นหาสิทธิสุขภาพและสวัสดิการข้ามกระทรวง (สปสช. พม. กองทุนสุขภาพตำบล)',
  description:
    'แก้ปัญหาการไม่รู้สิทธิ (Information Asymmetry) ค้นหาสิทธิบัตรทอง ประกันสังคม กองทุนสุขภาพตำบล และ พม. พร้อมระบบขอรับกายอุปกรณ์ (ผ้าอ้อมผู้ใหญ่ เตียง รถเข็น) และเครื่องมือ Web Search',
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
  themeColor: '#0f766e',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th" className={`bg-background ${ibmPlexSansThai.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <AiAdvisor />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

