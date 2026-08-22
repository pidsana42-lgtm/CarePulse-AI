import Link from 'next/link';
import { ShieldCheck, HeartPulse, Camera, ClipboardList } from 'lucide-react';
import FontScaler from './FontScaler';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-slate-800">CarePulse</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">AI</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">ระบบประเมินสิทธิการรักษาพยาบาล</p>
          </div>
        </Link>

        {/* Action Controls & Accessibility */}
        <div className="flex items-center flex-wrap justify-center gap-3">
          <FontScaler />
          
          <nav className="flex items-center gap-1">
            <Link
              href="/scan"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span>ถ่ายรูปเอกสาร</span>
            </Link>

            <Link
              href="/assessment"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              <span>ประเมินสิทธิ</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
