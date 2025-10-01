'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ฟอนต์ธีม
import { Prompt, Noto_Sans_Thai } from 'next/font/google';
const headingFont = Prompt({ subsets: ['thai', 'latin'], weight: ['600', '700'], display: 'swap' });
const bodyFont = Noto_Sans_Thai({ subsets: ['thai', 'latin'], weight: ['400', '500'], display: 'swap' });

import CarSelection from './CarSelection';
import AccidentStep1 from './AccidentDetails';
import AccidentStep2 from './AccidentStep2';
import AccidentStep3 from './AccidentStep3';
import ReviewConfirm from './ReviewConfirm';
import ProgressBar from "../components/ProgressBar";

import { CarFront, FileText, MapPin, UploadCloud, CircleCheckBig } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  citizen_id: string;
  phone_number: string;
  address: string;
  role: string;
}

const STEPS = [
  { label: "เลือกรถ", icon: CarFront },
  { label: "รายละเอียดอุบัติเหตุ", icon: FileText },
  { label: "รายละเอียดสถานที่", icon: MapPin },
  { label: "อัปโหลดความเสียหาย", icon: UploadCloud },
  { label: "ตรวจสอบยืนยัน", icon: CircleCheckBig },
];

export default function DetectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepFromQuery = Number(searchParams.get("step") ?? 0);
  const [step, setStep] = useState(stepFromQuery);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // -------- Auth --------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_URL_PREFIX}/api/me`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (cancelled) return;
        console.log('Auth data:', data.user);
        setUser(data.user ?? null);
        setIsAuthenticated(Boolean(data.isAuthenticated));
      } catch {
        if (!cancelled) setIsAuthenticated(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated === false) router.replace('/login');
  }, [isAuthenticated, router]);

  if (isAuthenticated === null) {
    return (
      <div
        className={`${bodyFont.className} grid min-h-screen place-items-center bg-gradient-to-b from-[#F1F5FF] via-[#F7FAFF] to-white`}
      >
        <div className="rounded-2xl bg-white px-4 py-3 text-zinc-700 ring-1 ring-zinc-200 shadow-sm">
          กำลังตรวจสอบสิทธิ์…
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  // -------- Steps --------
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <CarSelection
            onNext={() => setStep(1)}
            citizenId={user?.citizen_id}
            userId={user ? Number(user.id) : undefined}
          />
        );
      case 1:
        return <AccidentStep1 onNext={() => setStep(2)} onBack={() => setStep(0)} />;
      case 2:
        return <AccidentStep2 onNext={() => setStep(3)} onBack={() => setStep(1)} />;
      case 3:
        return <AccidentStep3 onNext={() => setStep(4)} onBack={() => setStep(2)} />;
      case 4:
        return  <ReviewConfirm
      onBack={() => setStep(3)}
      onFinish={() => router.push('/')}
      userId={user ? Number(user.id) : undefined}   
    />
      default:
        return <div className="text-zinc-700">ไม่พบขั้นตอน</div>;
    }
  };

  return (
    <div className={`${bodyFont.className} relative w-full overflow-x-hidden`}>
      <div className="fixed inset-0 -z-10 bg-white" />

      <div className="min-h-[100dvh] sm:min-h-[100svh] w-full">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-6 py-4 lg:py-8">

          {/* Progress + Content */}
          <div className="grid gap-3 sm:gap-4">
            <ProgressBar current={step} steps={STEPS} />

            <section
              className="rounded-[7px] bg-white 
                        p-3 sm:p-5 md:p-6
                        box-border max-w-full overflow-x-hidden break-words"
            >
              <div className="min-w-0">
                {renderStep()}
              </div>
            </section>

            <div className="h-4 sm:h-0 pb-[env(safe-area-inset-bottom)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
