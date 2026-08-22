import { HeartPulse, Globe, ShieldCheck, Stethoscope } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-black/[0.06] bg-white/40 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:justify-between">
        <div className="flex max-w-sm flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 shadow-md ring-2 ring-white/60">
              <HeartPulse
                className="size-4 text-white"
                aria-hidden="true"
              />
            </span>
            <span className="font-black text-slate-900 text-lg tracking-tight">CarePulse AI</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-500 font-medium">
            ผู้ช่วย AI ค้นหาสิทธิสุขภาพและสวัสดิการข้ามกระทรวง (สปสช. พม. กองทุนสุขภาพตำบล ประกันสังคม กรมบัญชีกลาง) เพื่อแก้ปัญหา Information Asymmetry และช่วยเหลือกลุ่มเปราะบาง
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              สายด่วนภาครัฐ 24 ชั่วโมง
            </h3>
            <ul className="flex flex-col gap-2 text-xs text-slate-600 font-medium">
              <li>สปสช. (บัตรทอง 30 บาท) <strong className="text-emerald-700 font-bold">1330</strong></li>
              <li>กระทรวง พม. (สวัสดิการ/คนพิการ) <strong className="text-teal-700 font-bold">1300</strong></li>
              <li>ประกันสังคม (สปส.) <strong className="text-blue-700 font-bold">1506</strong></li>
              <li>เจ็บป่วยฉุกเฉินวิกฤต (UCEP) <strong className="text-rose-600 font-bold">1669</strong></li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">เครื่องมือ & เมนู</h3>
            <ul className="flex flex-col gap-2.5 text-xs">
              <li>
                <a
                  href="/search"
                  className="text-emerald-700 font-bold hover:text-emerald-900 flex items-center gap-1.5 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  สืบค้นข้อมูลออนไลน์ (Web Search)
                </a>
              </li>
              <li>
                <a
                  href="/assessment"
                  className="text-emerald-700 font-bold hover:text-emerald-900 flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  ประเมินสิทธิ & กายอุปกรณ์
                </a>
              </li>
              <li>
                <a
                  href="/scan"
                  className="text-emerald-700 font-bold hover:text-emerald-900 flex items-center gap-1.5 transition-colors"
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  สแกนใบรับรองแพทย์ AI
                </a>
              </li>
              <li>
                <a
                  href="/#faq"
                  className="text-slate-500 font-medium hover:text-slate-900 transition-colors"
                >
                  คำถามที่พบบ่อย (FAQ)
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-black/[0.04] py-4 text-center text-[11px] font-medium text-slate-400">
        CarePulse AI — พัฒนาเพื่อคนไทยทุกคน | ฐานข้อมูลเชื่อมโยง สปสช., กระทรวง พม., กองทุนสุขภาพตำบล (กปท.), สปส. และกรมบัญชีกลาง
      </div>
    </footer>
  )
}
