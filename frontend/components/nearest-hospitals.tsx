'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Loader2,
  LocateFixed,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { getSessionLocation, setSessionLocation } from '@/lib/session-memory';

type LocationStatus = 'idle' | 'loading' | 'success' | 'denied' | 'error';

interface NearbyHospital {
  id: string;
  name: string;
  network: string;
  distanceKm: number;
  supportText: string;
}

interface NearestHospitalsProps {
  schemeCode: string;
  primaryProviderName: string;
}

const hospitalNames: Record<string, Array<{ name: string; network: string }>> = {
  UCS: [
    { name: 'หน่วยบริการปฐมภูมิเครือข่าย A', network: 'เครือข่าย สปสช.' },
    { name: 'โรงพยาบาลรัฐเครือข่าย B', network: 'หน่วยบริการรับส่งต่อ' },
    { name: 'ศูนย์บริการสาธารณสุข C', network: 'บริการปฐมภูมิ' },
  ],
  SSO33: [
    { name: 'โรงพยาบาลคู่สัญญาประกันสังคม A', network: 'คู่สัญญา สปส.' },
    { name: 'คลินิกเครือข่ายประกันสังคม B', network: 'เครือข่ายผู้ป่วยนอก' },
    { name: 'โรงพยาบาลเครือข่ายส่งต่อ C', network: 'เครือข่ายรับส่งต่อ' },
  ],
  SSO39: [
    { name: 'โรงพยาบาลคู่สัญญาประกันสังคม A', network: 'คู่สัญญา สปส.' },
    { name: 'คลินิกเครือข่ายประกันสังคม B', network: 'เครือข่ายผู้ป่วยนอก' },
    { name: 'โรงพยาบาลเครือข่ายส่งต่อ C', network: 'เครือข่ายรับส่งต่อ' },
  ],
  CSMBS: [
    { name: 'โรงพยาบาลรัฐเบิกจ่ายตรง A', network: 'ระบบเบิกจ่ายตรง' },
    { name: 'ศูนย์การแพทย์ภาครัฐ B', network: 'สถานพยาบาลภาครัฐ' },
    { name: 'โรงพยาบาลมหาวิทยาลัย C', network: 'ระบบเบิกจ่ายตรง' },
  ],
  REVIEW: [
    { name: 'หน่วยบริการตรวจสอบสิทธิ A', network: 'จุดประสานสิทธิ' },
    { name: 'โรงพยาบาลรัฐใกล้เคียง B', network: 'กรุณายืนยันก่อนรับบริการ' },
    { name: 'ศูนย์บริการประชาชน C', network: 'จุดประสานสิทธิ' },
  ],
};

const offsets = [
  { lat: 0.009, lng: 0.006 },
  { lat: -0.018, lng: 0.012 },
  { lat: 0.027, lng: -0.016 },
];

function toRadians(value: number) {
  return value * (Math.PI / 180);
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);
  const value = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function NearestHospitals({ schemeCode, primaryProviderName }: NearestHospitalsProps) {
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [hospitals, setHospitals] = useState<NearbyHospital[]>([]);
  const [mapsUrl, setMapsUrl] = useState('');

  const applyCoordinates = useCallback((latitude: number, longitude: number) => {
    const templates = hospitalNames[schemeCode] ?? hospitalNames.REVIEW;
    const nearby = templates.map((hospital, index) => {
      const generatedLat = latitude + offsets[index].lat;
      const generatedLng = longitude + offsets[index].lng;
      return {
        id: `${schemeCode}-${index + 1}`,
        name: hospital.name,
        network: hospital.network,
        distanceKm: distanceKm(latitude, longitude, generatedLat, generatedLng),
        supportText: schemeCode === 'REVIEW' ? 'ต้องยืนยันสิทธิก่อน' : `รองรับสิทธิ ${schemeCode}`,
      };
    }).sort((first, second) => first.distanceKm - second.distanceKm);

    setHospitals(nearby);
    setMapsUrl(`https://www.google.com/maps/search/โรงพยาบาล/@${latitude},${longitude},14z`);
    setStatus('success');
  }, [schemeCode]);

  useEffect(() => {
    const savedLocation = getSessionLocation();
    if (savedLocation) applyCoordinates(savedLocation.latitude, savedLocation.longitude);
  }, [applyCoordinates]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      return;
    }

    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setSessionLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        });
        applyCoordinates(coords.latitude, coords.longitude);
      },
      (locationError) => {
        setStatus(locationError.code === locationError.PERMISSION_DENIED ? 'denied' : 'error');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  return (
    <section className="overflow-hidden bg-white">
      <div className="bg-[#edf5ff] p-6 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-8">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#e8f1ff] text-[#115af2]"><LocateFixed className="size-5" /></span>
          <div>
            <h2 className="text-base font-semibold text-[#1d1d1f]">ค้นหาโรงพยาบาลที่ใช้สิทธิได้ใกล้ที่สุด</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#6e6e73]">ใช้ตำแหน่งที่อนุญาตตอนกรอกข้อมูลเพื่อจัดอันดับให้อัตโนมัติ และคำนวณระยะทางในเบราว์เซอร์เท่านั้น</p>
          </div>
        </div>
        {status !== 'success' && (
          <button type="button" onClick={requestLocation} disabled={status === 'loading'} className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#115af2] px-5 text-sm font-semibold text-white hover:bg-[#1a7bf0] disabled:cursor-wait disabled:opacity-70 sm:mt-0">
            {status === 'loading' ? <><Loader2 className="size-4 animate-spin" /> กำลังค้นหา...</> : <><MapPin className="size-4" /> อนุญาตตำแหน่ง</>}
          </button>
        )}
      </div>

      {status === 'idle' || status === 'loading' ? (
        <div className="p-5 sm:p-7">
          <div className="px-5 py-8 text-center">
            <Building2 className="mx-auto size-7 text-slate-400" />
            <p className="mt-2 text-sm font-black text-slate-800">ยังไม่ได้ใช้ตำแหน่งที่ตั้ง</p>
            <p className="mt-1 text-xs text-slate-500">กดอนุญาตตำแหน่งเพื่อค้นหาและจัดอันดับหน่วยบริการที่อยู่ใกล้กว่า</p>
          </div>
        </div>
      ) : status === 'success' ? (
        <div className="p-5 sm:p-7">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold text-[#072b77]"><ShieldCheck className="size-4" /> ได้รับตำแหน่งแล้ว — ไม่บันทึกพิกัดลงฐานข้อมูล</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left">
              <thead>
                <tr className="bg-[#072b77] text-white">
                  <th className="px-4 py-3 text-xs font-semibold">อันดับ</th>
                  <th className="px-4 py-3 text-xs font-semibold">โรงพยาบาลหรือหน่วยบริการ</th>
                  <th className="px-4 py-3 text-xs font-semibold">เครือข่าย</th>
                  <th className="px-4 py-3 text-xs font-semibold">ระยะทางโดยประมาณ</th>
                  <th className="px-4 py-3 text-xs font-semibold">การรองรับสิทธิ</th>
                </tr>
              </thead>
              <tbody>
                {hospitals.map((hospital, index) => (
                  <tr key={hospital.id} className={index === 0 ? 'bg-[#eef5ff]' : index % 2 === 0 ? 'bg-[#f7f9fc]' : 'bg-white'}>
                    <td className="px-4 py-4 text-xs font-semibold text-[#115af2]">{index + 1}{index === 0 ? ' · ใกล้ที่สุด' : ''}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-[#1d1d1f]">{hospital.name}</td>
                    <td className="px-4 py-4 text-xs text-[#6e6e73]">{hospital.network}</td>
                    <td className="px-4 py-4 text-xs font-semibold text-[#115af2]">{hospital.distanceKm.toFixed(1)} กม.</td>
                    <td className="px-4 py-4 text-xs text-[#115af2]"><span className="inline-flex items-center gap-1"><CheckCircle2 className="size-3.5" /> {hospital.supportText}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] leading-relaxed text-amber-700">การ์ดด้านบนเป็นข้อมูลสาธิตเพื่อแสดงการจัดอันดับ ต้องยืนยันการรองรับสิทธิก่อนเดินทาง</p>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[#115af2] px-4 text-xs font-black text-white hover:bg-[#1a7bf0]">
                <MapPin className="size-4" /> ดูโรงพยาบาลจริงบนแผนที่
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="p-5 sm:p-7">
          <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-amber-950">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <div>
              <strong className="text-sm">{status === 'denied' ? 'ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง' : 'ไม่สามารถอ่านตำแหน่งได้'}</strong>
              <p className="mt-1 text-xs leading-relaxed">ยังใช้หน่วยบริการตามทะเบียนได้: {primaryProviderName} หรืออนุญาตการใช้ตำแหน่งที่ตั้งในเบราว์เซอร์แล้วลองใหม่</p>
              <button type="button" onClick={requestLocation} className="mt-2 text-xs font-black text-amber-900 underline underline-offset-4">ลองอีกครั้ง</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
