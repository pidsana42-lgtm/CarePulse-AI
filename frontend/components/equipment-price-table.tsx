'use client';

import React, { useState } from 'react';
import { Building2, ChevronDown, ExternalLink } from 'lucide-react';

interface EquipmentItem {
  item: string;
  retailPrice: string;
  freeVia: string;
  note: string;
  category: 'เตียงและที่นอน' | 'เดินและเคลื่อนที่' | 'อุปกรณ์ทางการแพทย์' | 'การดูแลผู้ป่วยติดเตียง';
}

const EQUIPMENT: EquipmentItem[] = [
  {
    item: 'เตียงผู้ป่วยมือหมุน (2 ล้อกันตก)',
    retailPrice: '9,000 - 15,000 บาท',
    freeVia: 'พม. / กองทุนฟื้นฟูสมรรถภาพคนพิการ',
    note: 'คนพิการที่มีบัตรประจำตัวขึ้นทะเบียน ขอผ่านศูนย์ พม. จังหวัด / โรงพยาบาลรัฐ',
    category: 'เตียงและที่นอน',
  },
  {
    item: 'เตียงผู้ป่วยไฟฟ้าปรับมุมได้',
    retailPrice: '35,000 - 80,000 บาท',
    freeVia: 'พม. (กรณีความพิการรุนแรง) / กองทุนสุขภาพตำบล',
    note: 'พิจารณาเป็นรายกรณีตามการประเมินแพทย์/นักกายภาพ',
    category: 'เตียงและที่นอน',
  },
  {
    item: 'ที่นอนลมลดแผลกดทับ',
    retailPrice: '4,000 - 15,000 บาท',
    freeVia: 'สปสช. (บริการผู้ป่วยในที่บ้าน) / พม.',
    note: 'ผู้ป่วยติดเตียงหรือมีแผลกดทับ ประเมินโดยทีมดูแลผู้ป่วยที่บ้านของ รพ.สต. หรือโรงพยาบาลในเครือข่าย',
    category: 'เตียงและที่นอน',
  },
  {
    item: 'รถเข็นมาตรฐานแบบพับได้',
    retailPrice: '2,500 - 6,000 บาท',
    freeVia: 'พม. (คนพิการขึ้นทะเบียน)',
    note: 'ขอฟรีทุกคนที่มีบัตรประจำตัวคนพิการ ผ่านศูนย์บริการคนพิการจังหวัด หรือสายด่วน 1300',
    category: 'เดินและเคลื่อนที่',
  },
  {
    item: 'รถเข็นพิเศษเฉพาะอาการ (CP / หลังโรคหลอดเลือดสมอง)',
    retailPrice: '8,000 - 25,000 บาท',
    freeVia: 'พม. / กองทุนฟื้นฟูสมรรถภาพคนพิการ',
    note: 'ต้องมีใบรับรองแพทย์/นักกายภาพบำบัดระบุชนิดที่เหมาะสม',
    category: 'เดินและเคลื่อนที่',
  },
  {
    item: 'ไม้เท้า / ไม้ค้ำยืน (Walker)',
    retailPrice: '500 - 2,000 บาท',
    freeVia: 'พม. / รพ.สต. ในพื้นที่',
    note: 'อุปกรณ์พื้นฐานที่ขอได้เร็ว สอบถาม รพ.สต. ประจำตำบลได้เลย',
    category: 'เดินและเคลื่อนที่',
  },
  {
    item: 'เครื่องผลิตออกซิเจน (5 ลิตร)',
    retailPrice: '25,000 - 45,000 บาท',
    freeVia: 'สปสช. (ผู้ป่วยติดเตียง / โรคปอดเรื้อรัง)',
    note: 'ผ่านสิทธิผู้ป่วยโรคเรื้อรังหรือบริการดูแลระยะยาว ติดต่อหน่วยบริการประจำที่ลงทะเบียนไว้',
    category: 'อุปกรณ์ทางการแพทย์',
  },
  {
    item: 'เครื่องดูดเสมหะแบบพกพา',
    retailPrice: '6,000 - 15,000 บาท',
    freeVia: 'สปสช. (ผู้ป่วยในที่บ้าน) / พม.',
    note: 'กรณีผู้ป่วยติดเตียงที่มีปัญหาการหายใจหรือการกลืน ประเมินโดยทีมดูแลผู้ป่วยที่บ้าน',
    category: 'อุปกรณ์ทางการแพทย์',
  },
  {
    item: 'ผ้าอ้อมผู้ใหญ่ทิ้ง',
    retailPrice: '1,200 - 2,000 บาท/เดือน',
    freeVia: 'กองทุนสุขภาพตำบล (กปท.) / สปสช. บริการดูแลระยะยาว',
    note: 'ผู้สูงอายุติดเตียงขึ้นทะเบียนบริการดูแลระยะยาว อาจได้รับเฉลี่ย 3-6 ชิ้นต่อวันตามงบประมาณของพื้นที่ สมัครที่ รพ.สต.',
    category: 'การดูแลผู้ป่วยติดเตียง',
  },
  {
    item: 'เก้าอี้/รถอาบน้ำผู้ป่วย',
    retailPrice: '2,500 - 8,000 บาท',
    freeVia: 'พม. / กองทุนสุขภาพตำบล',
    note: 'สำหรับผู้พิการ/ผู้สูงอายุที่ช่วยเหลือตัวเองได้บางส่วน',
    category: 'การดูแลผู้ป่วยติดเตียง',
  },
];

const CATEGORIES = ['ทั้งหมด', 'เตียงและที่นอน', 'เดินและเคลื่อนที่', 'อุปกรณ์ทางการแพทย์', 'การดูแลผู้ป่วยติดเตียง'] as const;

export function EquipmentPriceTable() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('ทั้งหมด');
  const items = category === 'ทั้งหมด' ? EQUIPMENT : EQUIPMENT.filter((e) => e.category === category);
  const totalValue = '150,000+ บาท';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xl">
          เทียบราคาซื้อเองกับสิทธิขอรับฟรีจากหน่วยงานรัฐ — อ้างอิงราคากลางจัดซื้อของ พม. และอัตราจ่าย สปสช.
        </p>
        <div className="liquid-glass-pill px-4 py-2 text-xs font-black text-cyan-900 shrink-0">
          มูลค่าที่ขอฟรีได้ต่อคน: {totalValue}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 ${
              category === c
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-black/[0.03] text-slate-600 hover:bg-black/[0.06]'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Price Rows */}
      <div className="space-y-2.5">
        {items.map((e) => (
          <div key={e.item} className="liquid-glass-card rounded-2xl p-4 sm:p-5 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-sm font-black text-slate-900">{e.item}</p>
              <span className="text-[11px] font-bold text-slate-400 bg-black/[0.03] px-2.5 py-0.5 rounded-full shrink-0">
                {e.category}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-rose-500 font-black mt-0.5">ซื้อเอง:</span>
                <span className="font-bold text-slate-800">{e.retailPrice}</span>
              </div>
              <div className="flex items-start gap-2">
                <Building2 className="w-3.5 h-3.5 text-cyan-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-black text-cyan-700">ขอฟรีได้:</span>{' '}
                  <span className="font-bold text-slate-800">{e.freeVia}</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-relaxed flex items-start gap-1.5">
              <ChevronDown className="w-3 h-3 rotate-[-90deg] mt-0.5 shrink-0 text-cyan-500" />
              {e.note}
            </p>
          </div>
        ))}
      </div>

      {/* Sources */}
      <div className="pt-3 border-t border-black/[0.05] flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-400 font-medium">
        <span>แหล่งอ้างอิงทางการ:</span>
        <a
          href="https://dep.go.th/th/news/procurement-standard-price"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-cyan-700 hover:text-cyan-900 font-bold"
        >
          ประกาศราคากลาง พม. <ExternalLink className="w-3 h-3" />
        </a>
        <a
          href="https://www.nhso.go.th/th/nhso-payment-medical-services-fees-per-person"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-cyan-700 hover:text-cyan-900 font-bold"
        >
          อัตราค่าบริการทางการแพทย์ สปสช. <ExternalLink className="w-3 h-3" />
        </a>
        <span className="w-full text-slate-400">
          * ราคาเป็นช่วงโดยประมาณ อาจแตกต่างตามรุ่นและผู้จัดจำหน่าย วงเงินขอรับฟรีขึ้นกับเกณฑ์และงบประมาณของแต่ละหน่วยงานในแต่ละปี
        </span>
      </div>
    </div>
  );
}
