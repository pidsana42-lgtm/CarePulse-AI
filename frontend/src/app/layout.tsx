import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'CarePulse AI - ระบบประเมินสิทธิการรักษาพยาบาลและสิทธิสุขภาพ',
  description: 'ระบบประเมินสิทธิการรักษาพยาบาลอัจฉริยะ ใช้งานง่าย ชัดเจน รองรับสมาร์ตโฟน และคุ้มครองข้อมูลส่วนบุคคล (PDPA)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="min-h-screen flex flex-col antialiased bg-slate-50 text-slate-800">
        <Navbar />
        
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-emerald-700 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>คุ้มครองข้อมูลส่วนบุคคล (PDPA Enforced & On-Premise Secure Processing)</span>
            </div>
            <div>© 2026 CarePulse AI. All rights reserved.</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
