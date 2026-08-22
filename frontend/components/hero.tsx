import { ShieldCheck, Globe, Phone, Sparkles } from 'lucide-react'

export function Hero() {
  return (
    <section className="border-b border-border bg-secondary">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-4 py-16 text-center sm:px-6 md:py-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-4 py-1.5 text-sm font-semibold text-primary shadow-xs">
          <Sparkles className="size-4 text-emerald-600" aria-hidden="true" />
          CarePulse AI — ผู้ช่วยค้นหาสิทธิสุขภาพและสวัสดิการข้ามกระทรวง
        </span>
        <h1 className="max-w-3xl text-balance text-4xl font-black leading-tight text-foreground md:text-5xl">
          ไม่พลาดทุกสิทธิการรักษา
          <br />
          <span className="text-primary">ทั้งสปสช. พม. และกายอุปกรณ์ชุมชน</span>
        </h1>
        <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          แก้ปัญหาการไม่รู้สิทธิ (Information Asymmetry) รวบรวมสวัสดิการข้ามกระทรวง ทั้งบัตรทอง ประกันสังคม กองทุนสุขภาพตำบล และ พม. พร้อมระบบประเมินสิทธิขอรับกายอุปกรณ์ (ผ้าอ้อมผู้ใหญ่ เตียงผู้ป่วย รถเข็น เครื่องผลิตออกซิเจน) และประมาณค่าใช้จ่ายล่วงหน้า
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="/assessment"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-bold text-primary-foreground transition-opacity hover:opacity-90 shadow-md"
          >
            <ShieldCheck className="size-5" aria-hidden="true" />
            ประเมินสิทธิสุขภาพ
          </a>
          <a
            href="/scan"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-white px-6 text-base font-bold text-emerald-800 transition-colors hover:bg-emerald-50 shadow-sm"
          >
            <Sparkles className="size-5 text-emerald-600" aria-hidden="true" />
            สแกนใบรับรองแพทย์ (AI)
          </a>
          <a
            href="/search"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 text-base font-bold text-foreground transition-colors hover:bg-muted shadow-sm"
          >
            <Globe className="size-5 text-emerald-700" aria-hidden="true" />
            ค้นหาข้อมูลออนไลน์
          </a>
        </div>

        {/* Multi-Agency Hotlines */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs sm:text-sm text-muted-foreground pt-2">
          <span className="flex items-center gap-1.5 font-medium">
            <Phone className="size-4 text-emerald-600" aria-hidden="true" />
            สปสช. บัตรทอง <strong>1330</strong>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Phone className="size-4 text-teal-600" aria-hidden="true" />
            พม. สวัสดิการ/คนพิการ <strong>1300</strong>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Phone className="size-4 text-blue-600" aria-hidden="true" />
            ประกันสังคม <strong>1506</strong>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Phone className="size-4 text-red-600" aria-hidden="true" />
            ฉุกเฉินวิกฤต UCEP <strong>1669</strong>
          </span>
        </div>
      </div>
    </section>
  )
}
