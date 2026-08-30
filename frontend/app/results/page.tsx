'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Eye,
  FileHeart,
  FileSearch,
  Sparkles,
  X,
} from 'lucide-react';
import { NearestHospitals } from '@/components/nearest-hospitals';
import { AssessmentResult, MockInsurancePolicy } from '@/types';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { getSessionAssessment } from '@/lib/session-memory';

function formatThaiDate(value?: string | null, withTime = false) {
  if (!value) return 'ไม่ระบุวันสิ้นสุด';
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' as const } : {}),
  }).format(new Date(value));
}

export default function ResultsPage() {
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [selectedCoverage, setSelectedCoverage] = useState<{ kind: 'government' } | { kind: 'policy'; policy: MockInsurancePolicy } | null>(null);

  useEffect(() => {
    setResult(getSessionAssessment());
  }, []);

  useEffect(() => {
    if (!selectedCoverage) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedCoverage(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [selectedCoverage]);

  if (!result) {
    return (
      <div className="apple-page flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
          <span className="flex size-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-800"><AlertTriangle className="size-8" /></span>
          <h1 className="mt-5 text-2xl font-black text-slate-950">ยังไม่มีผลการตรวจสิทธิ</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">กรอกชื่อและเลขบัตรประชาชนตัวอย่างก่อน ระบบจึงจะแสดงสิทธิและความคุ้มครองที่พบ</p>
          <Link href="/assessment" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#115af2] px-6 py-3 text-sm font-black text-white hover:bg-[#1a7bf0]">
            เริ่มตรวจสอบสิทธิ <FileSearch className="size-4" />
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const registry = result.registry_response;
  const policies = registry?.private_policies ?? [];
  const nhsoDetail = registry?.entitlement.nhso_detail;

  return (
    <div className="apple-page relative min-h-screen overflow-x-clip print:bg-white">
      <div className="print:hidden"><SiteHeader /></div>

      {/* Full-width Hero Section */}
      <section className="relative w-full overflow-hidden bg-[#eaf4ff] py-10 sm:py-14 print:bg-white">
        <div className="pointer-events-none absolute -right-20 -top-32 size-80 rounded-full bg-[#9be8fd]/50 blur-2xl" />
        <div className="pointer-events-none absolute -left-20 -top-32 size-80 rounded-full bg-[#9be8fd]/30 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 right-[18%] size-44 rounded-full bg-white/70 blur-xl" />
        <div className="relative mx-auto max-w-[1440px] px-4 text-center sm:px-8">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f1ff] px-3 py-1 text-xs font-semibold text-[#115af2]">
              <CheckCircle2 className="size-3.5" /> ตรวจสอบข้อมูลสำเร็จ
            </span>
            <span className="rounded-full bg-[#f5f5f7] px-3 py-1 text-xs font-semibold text-[#424245]">พบ {1 + policies.length} รายการ</span>
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-[#6e6e73]">ข้อมูลสาธิต</span>
          </div>
          <h1 className="apple-headline mt-5 text-4xl sm:text-5xl">สิทธิและความคุ้มครอง<br />ของคุณ</h1>
          {registry && (
            <p className="mt-3 text-sm text-[#6e6e73]">
              {registry.person.display_name} <span className="mx-1 text-[#86868b]">•</span> <span className="font-mono">{registry.person.citizen_id_masked}</span>
            </p>
          )}
        </div>
      </section>

      <main className="relative z-10 mx-auto w-full max-w-[1440px] space-y-6 px-4 py-8 sm:px-8 sm:py-12 print:max-w-none print:p-0">

        {registry && (
          <section className="bg-white px-1 py-8 sm:px-4 sm:py-10">
            <div>
              <div className="mb-5">
                <p className="text-xs font-semibold text-[#115af2]">สิทธิและกรมธรรม์ที่ตรวจพบ</p>
                <h2 className="mt-1 text-2xl font-semibold text-[#1d1d1f]">ตารางความคุ้มครองของคุณ</h2>
                <p className="mt-2 text-xs text-[#6e6e73]">กดรายการในตารางเพื่อดูข้อมูลสิทธิ หน่วยบริการ และเงื่อนไขฉบับเต็ม</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left">
                  <thead>
                    <tr className="bg-[#072b77] text-white">
                      <th className="px-4 py-3 text-xs font-semibold">ประเภท</th>
                      <th className="px-4 py-3 text-xs font-semibold">ชื่อสิทธิหรือแผน</th>
                      <th className="px-4 py-3 text-xs font-semibold">หน่วยงานหรือบริษัท</th>
                      <th className="px-4 py-3 text-xs font-semibold">เลขอ้างอิง</th>
                      <th className="px-4 py-3 text-xs font-semibold">วงเงินหรือความคุ้มครอง</th>
                      <th className="px-4 py-3 text-xs font-semibold">สถานะ</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold">รายละเอียด</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      className="cursor-pointer bg-[#eef5ff] transition hover:bg-[#dfeeff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#115af2]"
                      tabIndex={0}
                      onClick={() => setSelectedCoverage({ kind: 'government' })}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedCoverage({ kind: 'government' });
                        }
                      }}
                    >
                      <td className="px-4 py-4"><span className="rounded-full bg-[#dff8ff] px-2.5 py-1 text-[10px] font-semibold text-[#072b77]">สิทธิภาครัฐ</span></td>
                      <td className="px-4 py-4 text-sm font-semibold text-[#1d1d1f]">{registry.entitlement.scheme_name}</td>
                      <td className="px-4 py-4 text-xs text-[#424245]">{result.primary_right.responsible_agency || 'หน่วยงานเจ้าของสิทธิ'}</td>
                      <td className="px-4 py-4 font-mono text-xs text-[#115af2]">{registry.entitlement.scheme_code}</td>
                      <td className="max-w-72 px-4 py-4 text-xs leading-relaxed text-[#424245]">{result.primary_right.coverage_summary}</td>
                      <td className="px-4 py-4"><span className="text-xs font-semibold text-[#115af2]">{registry.entitlement.status === 'ACTIVE' ? 'มีสิทธิ' : 'รอยืนยัน'}</span></td>
                      <td className="px-4 py-4 text-right"><span className="inline-flex items-center gap-1 text-xs font-semibold text-[#115af2]"><Eye className="size-3.5" /> ดูรายละเอียด</span></td>
                    </tr>
                    {policies.map((policy, index) => (
                      <tr
                        key={policy.policy_number_masked}
                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#f7f9fc]'} cursor-pointer transition hover:bg-[#eef5ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#115af2]`}
                        tabIndex={0}
                        onClick={() => setSelectedCoverage({ kind: 'policy', policy })}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedCoverage({ kind: 'policy', policy });
                          }
                        }}
                      >
                        <td className="px-4 py-4"><span className="rounded-full bg-[#eaf4ff] px-2.5 py-1 text-[10px] font-semibold text-[#072b77]">{policy.policy_type === 'LIFE' ? 'ประกันชีวิต' : 'ประกันสุขภาพ'}</span></td>
                        <td className="px-4 py-4 text-sm font-semibold text-[#1d1d1f]">{policy.plan_name}</td>
                        <td className="px-4 py-4 text-xs text-[#424245]">{policy.insurer_name}</td>
                        <td className="px-4 py-4 font-mono text-xs font-semibold text-[#115af2]">{policy.policy_number_masked}</td>
                        <td className="px-4 py-4 text-sm font-semibold text-[#1d1d1f]">{policy.sum_insured}</td>
                        <td className="px-4 py-4"><span className="text-xs font-semibold text-[#115af2]">มีผลคุ้มครอง</span></td>
                        <td className="px-4 py-4 text-right"><span className="inline-flex items-center gap-1 text-xs font-semibold text-[#115af2]"><Eye className="size-3.5" /> ดูรายละเอียด</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </section>
        )}

        {registry && <NearestHospitals schemeCode={registry.entitlement.scheme_code} primaryProviderName={registry.entitlement.primary_provider.name} />}
      </main>

      {/* Full-width Estimate Banner Section */}
      <section className="relative w-full overflow-hidden bg-[#072b77] py-12 text-white print:hidden">
        <div className="pointer-events-none absolute -right-20 -top-32 size-80 rounded-full bg-[#115af2]/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-32 size-80 rounded-full bg-[#9be8fd]/20 blur-3xl" />
        <div className="relative mx-auto w-full px-4 text-center sm:px-8">
          <div className="flex flex-col items-center">
            <p className="mt-4 text-xs font-semibold text-[#9be8fd]">ระบบวิเคราะห์อัจฉริยะ CarePulse</p>
            <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">ประเมินค่ารักษาที่คุณต้องจ่ายจริง</h2>
            <span className="mt-2 max-w-2xl text-xs leading-relaxed text-white/75 sm:text-sm">
              รวมราคาการรักษา สิทธิภาครัฐ ประกันสุขภาพ และประเภทโรงพยาบาล แล้วแยกให้เห็นว่าระบบช่วยจ่ายเท่าไร เหลือจ่ายเองเท่าไร
            </span>
            <Link
              href="/estimate"
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#072b77] shadow transition hover:bg-[#eaf4ff]"
            >
              คำนวณค่ารักษา <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto w-full max-w-[1440px] space-y-6 px-4 py-8 sm:px-8 sm:py-12 print:max-w-none print:p-0">
        <section className="grid gap-4 md:grid-cols-2 print:hidden">
          <div className="bg-white flex px-2 py-7 sm:px-6">
            <div className="flex flex-1 flex-col">
              <span className="flex size-11 items-center justify-center rounded-full bg-[#e8f1ff] text-[#115af2]"><Bot className="size-6" /></span>
              <h2 className="mt-4 text-base font-semibold text-[#1d1d1f]">ถาม CarePulse AI เรื่องสิทธิ</h2>
              <p className="mt-1 min-h-10 text-xs leading-relaxed text-[#6e6e73]">ให้ AI สรุปเอกสาร ขั้นตอน และเงื่อนไขจากผลนี้เป็นภาษาง่าย</p>
            </div>
            <Link href={`/search?from=results&q=${encodeURIComponent(registry ? `ช่วยอธิบายสิทธิ ${registry.entitlement.scheme_name} และบอกเอกสารกับขั้นตอนที่ควรทำต่อ` : 'ช่วยอธิบายสิทธิสุขภาพและขั้นตอนที่ควรทำต่อ')}`} className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-[#115af2] px-4 text-xs font-semibold text-white">
              <Sparkles className="size-4" /> ถามจากผลนี้
            </Link>
          </div>

          <div className="flex items-start gap-4 bg-white px-2 py-7 sm:px-6">
            <div className="flex flex-1 flex-col">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[#dff8ff] text-[#115af2]"><FileHeart className="size-6" /></span>
              <h2 className="mt-4 text-base font-black text-slate-950">มีใบรับรองแพทย์? ให้ AI ค้นหาสิทธิเพิ่ม</h2>
              <p className="mt-1 min-h-10 text-xs leading-relaxed text-slate-600">อ่านการวินิจฉัย ภาวะพึ่งพิง และอุปกรณ์ที่แพทย์แนะนำ <br />เพื่อจับคู่สิทธิฟื้นฟู การดูแลระยะยาว หรือเครื่องช่วย</p>
            </div>
            <Link href="/scan" className="mt-1 inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#115af2] px-4 text-xs font-black text-white hover:bg-[#1a7bf0]">
              <FileSearch className="size-4" /> อ่านใบรับรองแพทย์
            </Link>
          </div>
        </section>

        <p className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-[11px] leading-relaxed text-amber-950"><strong>ข้อมูลสาธิต:</strong> ระบบยังไม่ได้เชื่อมข้อมูลรายบุคคลจริงจากหน่วยงานรัฐ บริษัทประกัน หรือรายชื่อโรงพยาบาล กรุณายืนยันข้อมูลก่อนใช้บริการจริง</p>
      </div>

      {registry && selectedCoverage && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#072b77]/55 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedCoverage(null);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="coverage-detail-title" className="max-h-[90vh] w-full overflow-y-auto bg-white shadow-2xl sm:max-w-3xl sm:rounded-[28px]">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 bg-[#072b77] px-6 py-5 text-white sm:px-8 sm:py-6">
              <div>
                <p className="text-xs font-semibold text-[#9be8fd]">{selectedCoverage.kind === 'government' ? 'รายละเอียดสิทธิภาครัฐ' : selectedCoverage.policy.policy_type === 'LIFE' ? 'รายละเอียดประกันชีวิต' : 'รายละเอียดประกันสุขภาพ'}</p>
                <h2 id="coverage-detail-title" className="mt-1 text-xl font-semibold sm:text-2xl">{selectedCoverage.kind === 'government' ? registry.entitlement.scheme_name : selectedCoverage.policy.plan_name}</h2>
              </div>
              <button type="button" onClick={() => setSelectedCoverage(null)} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="ปิดรายละเอียด">
                <X className="size-5" />
              </button>
            </header>

            <div className="space-y-7 p-6 sm:p-8">
              {selectedCoverage.kind === 'government' ? (
                <>
                  <p className="text-sm leading-relaxed text-[#424245]">{result.primary_right.coverage_summary}</p>
                  <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                    {[
                      ['ประเภทสิทธิ', registry.entitlement.sub_scheme_name],
                      ['สถานะ', 'มีสิทธิใช้งาน'],
                      ['วันที่เริ่มมีสิทธิ', formatThaiDate(registry.entitlement.effective_date)],
                      ['วันที่สิ้นสุดสิทธิ', formatThaiDate(registry.entitlement.expiry_date)],
                      ['หน่วยงานเจ้าของสิทธิ', result.primary_right.responsible_agency || 'หน่วยงานเจ้าของสิทธิ'],
                      ['รหัสบัตรประกันสุขภาพ', nhsoDetail?.health_card_number_masked || 'ไม่พบข้อมูล'],
                      ['จังหวัดที่ลงทะเบียนรักษา', nhsoDetail?.registered_province || registry.entitlement.primary_provider.province],
                      ['หน่วยบริการปฐมภูมิ', nhsoDetail?.primary_care_provider ? `${nhsoDetail.primary_care_provider.name} (${nhsoDetail.primary_care_provider.hcode})` : `${registry.entitlement.primary_provider.name} (${registry.entitlement.primary_provider.hcode})`],
                      ['หน่วยบริการที่รับการส่งต่อ', nhsoDetail?.referral_provider
                        ? nhsoDetail.primary_care_provider?.hcode === nhsoDetail.referral_provider.hcode
                          ? 'ใช้หน่วยเดียวกับหน่วยบริการปฐมภูมิ'
                          : `${nhsoDetail.referral_provider.name} (${nhsoDetail.referral_provider.hcode})`
                        : 'ไม่พบข้อมูล'],
                      ['จำนวนครั้งที่เปลี่ยนหน่วยบริการ', nhsoDetail ? `${nhsoDetail.provider_change_count} ครั้ง` : 'ไม่พบข้อมูล'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs text-[#6e6e73]">{label}</dt>
                        <dd className="mt-1 text-sm font-semibold leading-relaxed text-[#1d1d1f]">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="bg-[#f7f9fc] p-5">
                    <h3 className="text-sm font-semibold text-[#1d1d1f]">สิ่งที่ควรทำต่อ</h3>
                    <ol className="mt-3 space-y-2">
                      {result.recommendations.map((recommendation, index) => (
                        <li key={recommendation} className="flex items-start gap-2 text-xs leading-relaxed text-[#424245]"><span className="font-semibold text-[#115af2]">{index + 1}.</span>{recommendation}</li>
                      ))}
                    </ol>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm leading-relaxed text-[#424245]">{selectedCoverage.policy.coverage_summary}</p>
                  <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                    {[
                      ['ประเภทกรมธรรม์', selectedCoverage.policy.policy_type === 'LIFE' ? 'ประกันชีวิต' : 'ประกันสุขภาพ'],
                      ['บริษัทผู้รับประกัน', selectedCoverage.policy.insurer_name],
                      ['เลขกรมธรรม์', selectedCoverage.policy.policy_number_masked],
                      ['สถานะ', selectedCoverage.policy.status === 'ACTIVE' ? 'มีผลคุ้มครอง' : 'สิ้นสุดความคุ้มครอง'],
                      ['วันที่เริ่มคุ้มครอง', formatThaiDate(selectedCoverage.policy.effective_date)],
                      ['วันที่สิ้นสุดความคุ้มครอง', formatThaiDate(selectedCoverage.policy.expiry_date)],
                      ['วงเงินโดยสรุป', selectedCoverage.policy.sum_insured],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs text-[#6e6e73]">{label}</dt>
                        <dd className="mt-1 text-sm font-semibold leading-relaxed text-[#1d1d1f]">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="bg-[#fff7e5] p-4 text-xs leading-relaxed text-amber-950">รายละเอียดนี้เป็นข้อมูลสาธิต กรุณาตรวจสอบเงื่อนไข ความคุ้มครอง ข้อยกเว้น และวงเงินกับบริษัทประกันก่อนใช้สิทธิจริง</p>
                </>
              )}

              <div className="flex justify-end">
                <button type="button" onClick={() => setSelectedCoverage(null)} className="h-10 rounded-full bg-[#115af2] px-5 text-sm font-semibold text-white hover:bg-[#1a7bf0]">ปิดรายละเอียด</button>
              </div>
            </div>
          </section>
        </div>
      )}

      <div className="print:hidden"><SiteFooter /></div>
    </div>
  );
}
