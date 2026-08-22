import { ShieldCheck, Stethoscope, Phone, ArrowRight, Sparkles } from 'lucide-react'

const HOTLINES = [
  { color: 'text-emerald-700 bg-emerald-50/80 border-emerald-200/60', number: '1330', label: 'สปสช. บัตรทอง' },
  { color: 'text-teal-700 bg-teal-50/80 border-teal-200/60', number: '1300', label: 'พม. สวัสดิการ' },
  { color: 'text-blue-700 bg-blue-50/80 border-blue-200/60', number: '1506', label: 'ประกันสังคม' },
  { color: 'text-rose-700 bg-rose-50/80 border-rose-200/60', number: '1669', label: 'ฉุกเฉิน UCEP' },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-black/[0.06] bg-[#fbfbfd] py-16 sm:py-24">
      {/* Apple Ambient Radial Glows */}
      <div className="apple-ambient-glow -top-40 -left-20" />
      <div className="apple-ambient-glow -bottom-40 -right-20 bg-teal-500/10" />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-4 sm:px-6 text-center">

        {/* Apple Pill Badge */}
        <div className="animate-apple-fade-in inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/80 px-4 py-1.5 text-xs font-semibold text-slate-800 shadow-xs backdrop-blur-md transition-all duration-300 hover:border-emerald-500/30 hover:scale-105">
          <Sparkles className="size-3.5 text-emerald-600 animate-pulse" />
          <span>Proactive Healthcare Welfare Navigator</span>
        </div>

        {/* Headline */}
        <div className="space-y-5 max-w-3xl animate-apple-fade-in" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl md:text-7xl leading-[1.08]">
            ไม่พลาดทุกสิทธิ<br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
              การรักษาและสวัสดิการ
            </span>
          </h1>
          <p className="text-base sm:text-xl leading-relaxed text-slate-600 max-w-2xl mx-auto font-normal">
            แก้ปัญหา <strong className="font-semibold text-slate-900">Information Asymmetry</strong> เชื่อมต่อสิทธิข้ามกระทรวง
            ทั้งบัตรทอง ประกันสังคม กองทุนสุขภาพตำบล และ พม.
            พร้อมประเมินสิทธิขอรับกายอุปกรณ์ฟรีด้วย AI
          </p>
        </div>

        {/* Apple CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3.5 w-full max-w-md animate-apple-fade-in" style={{ animationDelay: '0.2s' }}>
          <a
            href="/assessment"
            className="apple-button-primary flex-1 flex items-center justify-center gap-2 py-4 px-6 text-sm sm:text-base font-bold shadow-lg shadow-emerald-700/20"
          >
            <ShieldCheck className="size-5" />
            <span>ประเมินสิทธิสุขภาพ</span>
            <ArrowRight className="size-4 opacity-80" />
          </a>
          <a
            href="/scan"
            className="apple-button-secondary flex-1 flex items-center justify-center gap-2 py-4 px-6 text-sm sm:text-base font-bold text-slate-900 shadow-sm"
          >
            <Stethoscope className="size-5 text-emerald-600" />
            <span>สแกนใบรับรองแพทย์</span>
          </a>
        </div>

        {/* Hotlines Grid / Pills */}
        <div className="pt-6 border-t border-black/[0.06] w-full max-w-3xl animate-apple-fade-in" style={{ animationDelay: '0.3s' }}>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
            สายด่วนประสานสิทธิทางการ
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {HOTLINES.map((h, i) => (
              <div
                key={i}
                className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-2xl border text-xs font-semibold backdrop-blur-sm transition-all duration-300 hover:scale-105 ${h.color}`}
              >
                <span className="text-[11px] opacity-80">{h.label}</span>
                <span className="text-base font-black tracking-tight mt-0.5">{h.number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
