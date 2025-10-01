'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CarItem = {
  id: number;
  car_path: string;
  car_brand: string;
  car_model: string;
  car_year: string | number;
  car_license_plate: string;
  coverage_start_date: string; // ✅ เพิ่ม
  coverage_end_date: string;   // ✅ เพิ่ม
};

export default function CarList({ citizenId }: { citizenId: string }) {
  const [cars, setCars] = useState<CarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_PREFIX = useMemo(
    () => process.env.NEXT_PUBLIC_URL_PREFIX?.replace(/\/$/, "") || "",
    []
  );

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_PREFIX}/api/policy/${citizenId}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`โหลดข้อมูลรถไม่สำเร็จ (HTTP ${res.status})`);
        const data = (await res.json()) as CarItem[];
        setCars(data || []);
      } catch (err: any) {
        setError(err.message || "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [API_PREFIX, citizenId]);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const { clientWidth } = scrollRef.current;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -clientWidth : clientWidth,
      behavior: "smooth",
    });
  };

  const calcCoverage = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const today = new Date();

    const totalDays = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const remainingDays = Math.max(
      0,
      Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    );

    const percent = Math.min(100, Math.max(0, (remainingDays / totalDays) * 100));
    return { remainingDays, percent };
  };

  if (loading) return <p className="text-center">กำลังโหลด...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (!cars.length) return <p className="text-center">ไม่พบข้อมูลรถ</p>;

  return (
<div
          className="-mx-3 px-3 py-3 sm:mx-0 sm:px-0 chip-scroller flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth"
          style={{
            scrollbarWidth: "thin", // Firefox
            scrollbarColor: "#6D5BD0 #E5E7EB", // สี thumb / track
          }}
        >
  {cars.map((car) => {
    const { remainingDays, percent } = calcCoverage(
      car.coverage_start_date,
      car.coverage_end_date
    );

    return (
      <Link
        key={car.id}
        href={" "}
        // href={`/user/car/${car.id}`}
        className="w-[250px] flex-shrink-0 rounded-[7px] p-4 bg-white hover:bg-[#f1f1f1] transition text-center shadow-sm"
      >
        <img
          src={car.car_path?.startsWith("http") ? car.car_path : `/${car.car_path}`}
          alt={`${car.car_brand} ${car.car_model}`}
          className="w-full h-40 object-cover rounded-[7px] mb-3"
        />
        <div className="font-semibold text-zinc-800">
          {car.car_brand} {car.car_model}
        </div>
        <div className="text-sm text-zinc-600">ปี {car.car_year}</div>
        <span className="mt-2 inline-block rounded-[7px] px-3 py-1 text-sm bg-[#DDDDDD] text-black">
          {car.car_license_plate}
        </span>

        {/* Progress bar */}
        {/* <div className="mt-3">
          <div className="w-full h-3 bg-gray-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#6D5BD0] rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-right text-zinc-700">
            สิ้นสุดความคุ้มครองในอีก {remainingDays} วัน
          </div>
        </div> */}
      </Link>
    );
  })}
</div>




  );
}
