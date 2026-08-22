import { ShieldCheck, Calculator, Phone } from 'lucide-react'

export function Hero() {
  return (
    <section className="border-b border-border bg-secondary">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-4 py-16 text-center sm:px-6 md:py-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-4 py-1.5 text-sm font-medium text-primary">
          <ShieldCheck className="size-4" aria-hidden="true" />
          คนไทยทุกคนมีสิทธิรักษาพยาบาล
        </span>
        <h1 className="max-w-3xl text-balance text-4xl font-bold leading-tight text-foreground md:text-5xl">
          รู้สิทธิ รู้ค่าใช้จ่าย
          <br />
          <span className="text-primary">มั่นใจทุกการรักษา</span>
        </h1>
        <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          ตรวจสอบสิทธิประโยชน์ทางการแพทย์ของคุณ ทั้งบัตรทอง ประกันสังคม
          และสวัสดิการข้าราชการ พร้อมประมาณค่ารักษาพยาบาลล่วงหน้า
          เพื่อวางแผนการเงินด้านสุขภาพของคุณและครอบครัวอย่างมั่นใจ
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="#check-rights"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <ShieldCheck className="size-5" aria-hidden="true" />
            ตรวจสอบสิทธิของฉัน
          </a>
          <a
            href="#estimator"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 text-base font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Calculator className="size-5 text-primary" aria-hidden="true" />
            ประมาณค่ารักษาพยาบาล
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Phone className="size-4 text-primary" aria-hidden="true" />
            สายด่วน สปสช. 1330
          </span>
          <span className="flex items-center gap-2">
            <Phone className="size-4 text-primary" aria-hidden="true" />
            สายด่วนประกันสังคม 1506
          </span>
          <span className="flex items-center gap-2">
            <Phone className="size-4 text-primary" aria-hidden="true" />
            เจ็บป่วยฉุกเฉิน 1669
          </span>
        </div>
      </div>
    </section>
  )
}
