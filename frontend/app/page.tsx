import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { SchemeChecker } from '@/components/scheme-checker'
import { CostEstimator } from '@/components/cost-estimator'
import { ComparisonTable } from '@/components/comparison-table'
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
        <ComparisonTable />
        <FaqSection />
      </main>
      <SiteFooter />
    </div>
  )
}
