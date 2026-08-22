import { HeartPulse, Globe, ShieldCheck } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:justify-between">
        <div className="flex max-w-sm flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary shadow-xs">
              <HeartPulse
                className="size-4 text-primary-foreground"
                aria-hidden="true"
              />
            </span>
            <span className="font-extrabold text-foreground text-lg">CarePulse AI</span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            ผู้ช่วย AI ค้นหาสิทธิสุขภาพและสวัสดิการข้ามกระทรวง (สปสช. พม. กองทุนสุขภาพตำบล ประกันสังคม กรมบัญชีกลาง) เพื่อแก้ปัญหา Information Asymmetry และช่วยเหลือกลุ่มเปราะบาง
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-foreground">
              สายด่วนภาครัฐ 24 ชั่วโมง
            </h3>
            <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              <li>สปสช. (บัตรทอง 30 บาท) <strong>1330</strong></li>
              <li>กระทรวง พม. (สวัสดิการ/คนพิการ) <strong>1300</strong></li>
              <li>ประกันสังคม (สปส.) <strong>1506</strong></li>
              <li>เจ็บป่วยฉุกเฉินวิกฤต (UCEP) <strong>1669</strong></li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-foreground">เครื่องมือ & เมนู</h3>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <a
                  href="/search"
                  className="text-emerald-700 font-semibold transition-colors hover:text-emerald-900 flex items-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5" />
                  ค้นหาสิทธิออนไลน์ (Web Search)
                </a>
              </li>
              <li>
                <a
                  href="/assessment"
                  className="text-emerald-700 font-semibold transition-colors hover:text-emerald-900 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  ประเมินสิทธิ & กายอุปกรณ์
                </a>
              </li>
              <li>
                <a
                  href="/#estimator"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  ประมาณค่ารักษาพยาบาล
                </a>
              </li>
              <li>
                <a
                  href="/#faq"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  คำถามที่พบบ่อย
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        CarePulse AI — พัฒนาเพื่อคนไทยทุกคน | ฐานข้อมูลเชื่อมโยง สปสช., กระทรวง พม., กองทุนสุขภาพตำบล (กปท.), สปส. และกรมบัญชีกลาง
      </div>
    </footer>
  )
}
