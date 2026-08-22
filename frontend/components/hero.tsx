import { ShieldCheck, Stethoscope, Phone, ArrowRight, Sparkles, HeartPulse, FileSearch } from 'lucide-react'

const HOTLINES = [
  { color: 'bg-emerald-500/10 text-emerald-900 border-emerald-500/20', number: '1330', label: 'สปสช. บัตรทอง' },
  { color: 'bg-teal-500/10 text-teal-900 border-teal-500/20', number: '1300', label: 'พม. สวัสดิการ' },
  { color: 'bg-blue-500/10 text-blue-900 border-blue-500/20', number: '1506', label: 'ประกันสังคม' },
  { color: 'bg-rose-500/10 text-rose-900 border-rose-500/20', number: '1669', label: 'ฉุกเฉิน UCEP' },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
      {/* Dynamic Liquid Mesh Gradient Orbs (Visible through Liquid Glass) */}
      <div className="liquid-mesh-orb-1 top-0 -left-20" />
      <div className="liquid-mesh-orb-2 top-20 right-0" />
      <div className="liquid-mesh-orb-3 bottom-0 left-1/3" />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-4 sm:px-6 text-center">

        {/* Liquid Pill Badge */}
        <div className="animate-apple-fade-in liquid-glass-pill px-4 py-1.5 inline-flex items-center gap-2 text-xs font-extrabold text-slate-800 shadow-md">
          <Sparkles className="size-3.5 text-emerald-600 animate-pulse" />
          <span>Proactive Healthcare Welfare Navigator</span>
        </div>

        {/* Headline */}
        <div className="space-y-5 max-w-3xl animate-apple-fade-in" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-6xl md:text-7xl leading-[1.08]">
            ไม่พลาดทุกสิทธิ<br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent drop-shadow-xs">
              การรักษาและสวัสดิการ
            </span>
          </h1>
          <p className="text-base sm:text-xl leading-relaxed text-slate-600 max-w-2xl mx-auto font-medium">
            แก้ปัญหา <strong className="font-bold text-slate-900">Information Asymmetry</strong> เชื่อมต่อสิทธิข้ามกระทรวง
            ทั้งบัตรทอง ประกันสังคม กองทุนสุขภาพตำบล และ พม.
            พร้อมประเมินสิทธิขอรับกายอุปกรณ์ฟรีด้วย AI
          </p>
        </div>

        {/* Liquid Glass CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3.5 w-full max-w-md animate-apple-fade-in" style={{ animationDelay: '0.2s' }}>
          <a
            href="/assessment"
            className="liquid-btn-primary flex-1 flex items-center justify-center gap-2 py-4 px-6 text-sm sm:text-base font-extrabold"
          >
            <ShieldCheck className="size-5" />
            <span>ประเมินสิทธิสุขภาพ</span>
            <ArrowRight className="size-4 opacity-80" />
          </a>
          <a
            href="/scan"
            className="liquid-btn-secondary flex-1 flex items-center justify-center gap-2 py-4 px-6 text-sm sm:text-base font-extrabold text-slate-900"
          >
            <Stethoscope className="size-5 text-emerald-600" />
            <span>สแกนใบรับรองแพทย์</span>
          </a>
        </div>

        {/* Hotlines Liquid Glass Grid */}
        <div className="pt-6 w-full max-w-3xl animate-apple-fade-in" style={{ animationDelay: '0.3s' }}>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-3">
            สายด่วนประสานสิทธิทางการ
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {HOTLINES.map((h, i) => (
              <div
                key={i}
                className={`liquid-glass-card rounded-[22px] p-3.5 text-xs font-bold transition-all duration-300 ${h.color}`}
              >
                <span className="text-[11px] opacity-75 block">{h.label}</span>
                <span className="text-lg font-black tracking-tight mt-0.5 block">{h.number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
