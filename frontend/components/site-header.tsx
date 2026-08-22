import { HeartPulse, Globe, ShieldCheck } from 'lucide-react'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary shadow-xs">
            <HeartPulse className="size-5 text-primary-foreground" aria-hidden="true" />
          </span>
          <span className="text-lg font-extrabold text-foreground">CarePulse AI</span>
        </a>
        <nav aria-label="เมนูหลัก" className="hidden items-center gap-6 md:flex">
          <a
            href="/assessment"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            ประเมินสิทธิสุขภาพ
          </a>
          <a
            href="/scan"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            สแกนใบรับรองแพทย์ (AI)
          </a>
          <a
            href="/search"
            className="text-sm font-bold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1.5"
          >
            <Globe className="w-4 h-4 text-emerald-600" />
            ค้นหาข้อมูลออนไลน์ (Web Search)
          </a>
          <a
            href="/#estimator"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            ประมาณค่ารักษา
          </a>
          <a
            href="/#compare"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            เปรียบเทียบสิทธิ
          </a>
          <a
            href="/#faq"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            คำถามที่พบบ่อย
          </a>
        </nav>
        <div className="flex items-center gap-2.5">
          <a
            href="/search"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-600/30 bg-emerald-50 px-3.5 text-sm font-bold text-emerald-800 transition-opacity hover:opacity-90"
          >
            <Globe className="w-3.5 h-3.5" />
            Web Search
          </a>
          <a
            href="/assessment"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            เริ่มประเมินสิทธิ
          </a>
        </div>
      </div>
    </header>
  )
}
