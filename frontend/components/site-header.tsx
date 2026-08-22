import { HeartPulse } from 'lucide-react'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary">
            <HeartPulse className="size-5 text-primary-foreground" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold text-foreground">สิทธิ์ดี</span>
        </a>
        <nav aria-label="เมนูหลัก" className="hidden items-center gap-6 md:flex">
          <a
            href="/#check-rights"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            ตรวจสอบสิทธิ
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
            href="/scan"
            className="text-sm font-semibold text-primary transition-colors hover:opacity-80"
          >
            ถ่ายรูปเอกสาร (OCR)
          </a>
          <a
            href="/#faq"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            คำถามที่พบบ่อย
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="/scan"
            className="inline-flex h-9 items-center rounded-lg border border-primary/40 bg-secondary px-3.5 text-sm font-medium text-primary transition-opacity hover:opacity-90"
          >
            ถ่ายรูปเอกสาร
          </a>
          <a
            href="/#estimator"
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            เริ่มคำนวณ
          </a>
        </div>
      </div>
    </header>
  )
}
