import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { SchemeChecker } from '@/components/scheme-checker'
import { CostEstimator } from '@/components/cost-estimator'
import { EquipmentPriceTable } from '@/components/equipment-price-table'
import { WebSearchSection } from '@/components/WebSearchSection'
import { FaqSection } from '@/components/faq-section'
import { SiteFooter } from '@/components/site-footer'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <SchemeChecker />
        <CostEstimator />

        {/* Free Medical Equipment — its own section + anchor */}
        <section id="equipment" className="scroll-mt-20 py-20 bg-[#f5f5f7] border-y border-black/[0.06] relative overflow-x-clip">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 space-y-8">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                กายอุปกรณ์ที่ขอรับฟรีได้
              </h2>
              <p className="text-slate-500 text-sm sm:text-base font-normal max-w-xl mx-auto">
                เตียงผู้ป่วย รถเข็น เครื่องผลิตออกซิเจน ผ้าอ้อมผู้ใหญ่ — ดูราคาและช่องทางขอฟรีจากหน่วยงานรัฐ
              </p>
            </div>
            <EquipmentPriceTable />
          </div>
        </section>

        <WebSearchSection />
        <FaqSection />
      </main>
      <SiteFooter />
    </div>
  )
}
