'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CostEstimator } from '@/components/cost-estimator';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { AssessmentResult, MockInsurancePolicy } from '@/types';
import type { SchemeId } from '@/lib/health-data';
import { getSessionAssessment } from '@/lib/session-memory';

function schemeFromResult(result: AssessmentResult | null): SchemeId {
  const code = result?.registry_response?.entitlement.scheme_code;
  if (code === 'UCS') return 'ucs';
  if (code === 'SSO33' || code === 'SSO39') return 'sso';
  if (code === 'CSMBS') return 'csmbs';
  return 'none';
}

export default function EstimatePage() {
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    setAssessment(getSessionAssessment());
  }, []);

  const healthPolicy: MockInsurancePolicy | undefined = assessment?.registry_response?.private_policies.find((policy) => policy.policy_type === 'HEALTH');
  const lifePolicy: MockInsurancePolicy | undefined = assessment?.registry_response?.private_policies.find((policy) => policy.policy_type === 'LIFE');
  const scheme = schemeFromResult(assessment);

  return (
    <div className="apple-page relative min-h-screen overflow-x-clip">
      <SiteHeader />

      <main className="relative z-10 pb-12">
        <section className="w-full px-5 pt-6 sm:px-8 lg:px-10 2xl:px-14">
          <Link href="/results" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#115af2] hover:underline"><ArrowLeft className="size-4" /> กลับไปหน้าสิทธิ</Link>

          <div className="mt-6 overflow-hidden rounded-[32px] border border-black/[0.06] bg-white px-6 py-10 text-center shadow-[0_18px_55px_-38px_rgba(7,43,119,0.45)] sm:px-8 sm:py-14">
            <div className="mx-auto max-w-4xl">
              <p className="apple-eyebrow">ระบบวิเคราะห์ค่ารักษา CarePulse</p>
              <h1 className="apple-headline mt-3 text-4xl sm:text-5xl">จาก “มีสิทธิอะไร”<br /><span className="text-[#115af2]">สู่ “ต้องจ่ายจริงเท่าไร”</span></h1>
              <p className="apple-subhead mx-auto mt-4 max-w-3xl text-sm sm:text-base">เลือกการรักษาและประเภทโรงพยาบาล แล้วระบบจะแสดงยอดที่สิทธิและประกันช่วยจ่าย พร้อมยอดที่เหลือต้องจ่ายเองอย่างชัดเจน</p>
            </div>
          </div>
        </section>

        <CostEstimator
          initialScheme={scheme}
          detectedSchemeName={assessment?.registry_response?.entitlement.scheme_name}
          privateHealthPolicy={healthPolicy ? { planName: healthPolicy.plan_name, sumInsured: healthPolicy.sum_insured } : undefined}
          lifePolicyName={lifePolicy?.plan_name}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
