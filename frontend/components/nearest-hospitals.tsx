'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
} from 'lucide-react';
import { getSessionLocation, setSessionLocation, type SessionLocation } from '@/lib/session-memory';

type LocationStatus = 'idle' | 'loading' | 'success' | 'denied' | 'error';

interface HospitalProvider {
  hcode: string;
  name: string;
  province: string;
}

interface NearestHospitalsProps {
  schemeCode: string;
  schemeName: string;
  primaryProvider: HospitalProvider;
  referralProvider?: HospitalProvider | null;
}

function providerKey(provider: HospitalProvider) {
  return `${provider.hcode}-${provider.name}`;
}

export function NearestHospitals({
  schemeCode,
  schemeName,
  primaryProvider,
  referralProvider,
}: NearestHospitalsProps) {
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [location, setLocation] = useState<SessionLocation | null>(null);
  const [selectedProviderKey, setSelectedProviderKey] = useState(providerKey(primaryProvider));

  const providers = useMemo(() => {
    const available = [primaryProvider, referralProvider].filter((provider): provider is HospitalProvider => Boolean(provider?.name));
    return available.filter((provider, index) => (
      available.findIndex((item) => item.hcode === provider.hcode || item.name === provider.name) === index
    ));
  }, [primaryProvider, referralProvider]);

  const selectedProvider = providers.find((provider) => providerKey(provider) === selectedProviderKey) ?? providers[0];
  const destination = `${selectedProvider.name} จังหวัด${selectedProvider.province}`;
  const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(destination)}&output=embed`;
  const directionsUrl = new URL('https://www.google.com/maps/dir/');
  directionsUrl.searchParams.set('api', '1');
  directionsUrl.searchParams.set('destination', destination);
  directionsUrl.searchParams.set('travelmode', 'driving');
  if (location) directionsUrl.searchParams.set('origin', `${location.latitude},${location.longitude}`);

  useEffect(() => {
    const savedLocation = getSessionLocation();
    if (!savedLocation) return;
    setLocation(savedLocation);
    setStatus('success');
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      return;
    }

    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextLocation = {
          latitude: Number(coords.latitude.toFixed(5)),
          longitude: Number(coords.longitude.toFixed(5)),
          accuracy: Math.round(coords.accuracy),
          capturedAt: new Date().toISOString(),
        };
        setSessionLocation(nextLocation);
        setLocation(nextLocation);
        setStatus('success');
      },
      (locationError) => {
        setStatus(locationError.code === locationError.PERMISSION_DENIED ? 'denied' : 'error');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  return (
    <section className="overflow-hidden rounded-[28px] border border-black/[0.08] bg-white shadow-sm">
      <div className="bg-[#edf5ff] p-6 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-8">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-[#115af2] shadow-sm">
            <LocateFixed className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#115af2]">สถานพยาบาลตามสิทธิ</p>
            <h2 className="mt-1 text-xl font-semibold text-[#1d1d1f]">สถานพยาบาลที่ไปใช้สิทธิได้ใกล้ที่สุด</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">
              แสดงเฉพาะหน่วยบริการที่พบในผลตรวจสิทธิ {schemeName} และเปิดดูเส้นทางจริงผ่าน Google Maps
            </p>
          </div>
        </div>
        {status !== 'success' && (
          <button
            type="button"
            onClick={requestLocation}
            disabled={status === 'loading'}
            className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#115af2] px-5 text-sm font-semibold text-white transition hover:bg-[#1a7bf0] disabled:cursor-wait disabled:opacity-70 sm:mt-0"
          >
            {status === 'loading' ? <><Loader2 className="size-4 animate-spin" /> กำลังหาตำแหน่ง...</> : <><MapPin className="size-4" /> ใช้ตำแหน่งของฉัน</>}
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="border-b border-black/[0.08] p-5 lg:border-b-0 lg:border-r sm:p-6">
          <div className="space-y-3" aria-label="สถานพยาบาลที่ใช้สิทธิได้">
            {providers.map((provider, index) => {
              const isSelected = providerKey(provider) === providerKey(selectedProvider);
              return (
                <button
                  key={providerKey(provider)}
                  type="button"
                  onClick={() => setSelectedProviderKey(providerKey(provider))}
                  className={`w-full rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#115af2]/15 ${isSelected ? 'border-[#115af2]/30 bg-[#eef5ff]' : 'border-black/[0.08] bg-white hover:border-[#115af2]/20 hover:bg-[#f7faff]'}`}
                >
                  <span className="flex items-start gap-3">
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${isSelected ? 'bg-[#115af2] text-white' : 'bg-[#edf5ff] text-[#115af2]'}`}>
                      <Building2 className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-sm font-semibold leading-relaxed text-[#1d1d1f]">{provider.name}</strong>
                      <span className="mt-1 block text-sm text-[#6e6e73]">จังหวัด{provider.province} · รหัส {provider.hcode}</span>
                      <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                        <CheckCircle2 className="size-4" /> {index === 0 ? 'หน่วยบริการตามสิทธิ' : 'หน่วยรับส่งต่อ'}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {status === 'success' ? (
            <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-emerald-700">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> พร้อมเปิดเส้นทางจากตำแหน่งของคุณผ่านปุ่มนำทาง
            </p>
          ) : status === 'denied' || status === 'error' ? (
            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-amber-900">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p className="text-sm leading-relaxed">
                {status === 'denied' ? 'ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง' : 'อ่านตำแหน่งไม่ได้'} แต่ยังเปิดดูสถานพยาบาลบนแผนที่ได้
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-[#6e6e73]">อนุญาตตำแหน่งเพื่อให้ Google Maps เริ่มเส้นทางจากจุดที่คุณอยู่</p>
          )}

          <a
            href={directionsUrl.toString()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#115af2] px-5 text-sm font-semibold text-white transition hover:bg-[#1a7bf0]"
          >
            <Navigation className="size-4" /> เปิดเส้นทางใน Google Maps
          </a>
        </div>

        <div className="min-h-[420px] bg-[#e5e7eb]">
          <iframe
            key={mapEmbedUrl}
            title={`แผนที่ ${selectedProvider.name}`}
            src={mapEmbedUrl}
            className="h-[420px] w-full border-0 lg:h-full lg:min-h-[500px]"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>

      <p className="border-t border-black/[0.08] px-5 py-4 text-sm leading-relaxed text-[#6e6e73] sm:px-6">
        แสดงจากหน่วยบริการที่ผูกกับสิทธิรหัส {schemeCode} หากต้องรับการส่งต่อหรือใช้บริการนอกหน่วยประจำ ควรโทรยืนยันก่อนเดินทาง
      </p>
    </section>
  );
}
