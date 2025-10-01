// components/ReviewConfirm.tsx
"use client";

import React, { useMemo, useState } from "react";
import EvidenceGallery from "../components/EvidenceGallery";
import MapPreview from "../components/MapPreview";
// ---------- Types ----------
type Car = {
  id: number;
  car_brand: string;
  car_model: string;
  car_year: string | number;
  car_license_plate: string;
  insurance_type: string;
  insured_name: string;
  policy_number: string;
  coverage_end_date: string;
  car_path?: string;
  chassis_number: string;
  registration_province: string;
};

type MediaItem = { url: string; type?: "image" | "video"; publicId?: string };

type DamagePhoto = MediaItem & {
  side?: "ซ้าย" | "ขวา" | "หน้า" | "หลัง" | "ไม่ระบุ";
  total?: number | null;
  perClass?: Record<string, number> | null;
  note?: string;
};

type AccidentDraft = {
  accidentType: string;
  accident_date: string;
  accident_time: string;
  province: string | null;
  district: string | null;
  road?: string | null;
  area_type: string;
  nearby?: string | null;
  details?: string | null;
  location: { lat: number; lng: number; accuracy?: number | null };
  evidenceMedia?: MediaItem[];
  damagePhotos?: DamagePhoto[];
};

interface ReviewConfirmProps {
  onBack: () => void;
  onFinish: () => void;
  userId?: number;
}

// ---------- Dictionaries / Labels ----------
const DAMAGE_EN2TH: Record<string, string> = {
  "crack": "ร้าว",
  "dent": "บุบ",
  "glass shatter": "กระจกแตก",
  "lamp broken": "ไฟแตก",
  "scratch": "ขีดข่วน",
  "tire flat": "ยางแบน",
};
const toTHDamage = (s?: string) => (!s ? "" : DAMAGE_EN2TH[s] ?? s);

const CAR_KEY = "claimSelectedCar";
const ACC_KEY = "accidentDraft";

// ---------- Helpers ----------
function isVideoUrl(url: string) {
  const u = url.toLowerCase();
  return u.endsWith(".mp4") || u.endsWith(".mov") || u.endsWith(".webm") || u.includes("video/upload");
}
function normalizeMediaItem<T extends { url: string; type?: "image" | "video" }>(m: string | T): T {
  if (typeof m === "string") {
    return { url: m, type: isVideoUrl(m) ? "video" : "image" } as T;
  }
  if (!m.type) {
    return { ...m, type: isVideoUrl(m.url) ? "video" : "image" };
  }
  return m;
}
function formatSide(side?: DamagePhoto["side"]) {
  return side ?? "ไม่ระบุ";
}

function topClasses(perClass?: Record<string, number> | null, topN = 5) {
  if (!perClass) return [];
  return Object.entries(perClass)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, topN);
}

function normalizeStatus(s?: string): string {
  if (!s) return "pending";

  switch (s) {
    case "ข้อมูลไม่ครบ":
      return "incomplete";
    case "อนุมัติ":
      return "approved";
    case "ไม่อนุมัติ":
      return "rejected";
    default:
      return s; // ถ้าได้ค่าอังกฤษมาอยู่แล้วก็คืนกลับ
  }
}


// ---------- Component ----------
export default function ReviewConfirm({ onBack, onFinish, userId }: ReviewConfirmProps) {
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);


  const car: Car | null = useMemo(() => {
    try {
      const raw = localStorage.getItem(CAR_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const draft: AccidentDraft | null = useMemo(() => {
    try {
      const raw = localStorage.getItem(ACC_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  const claimStatus = normalizeStatus((draft as any)?.status);
  console.log("🚗 Draft claim status:", claimStatus);


  // รูปหลักฐาน (เดิม) -> ใช้ PrettyEvidenceGallery แทน เพื่อความสวยงาม + modal
  const evidenceList: (string | MediaItem)[] = useMemo(() => {
    if (!draft) return [];
    if (Array.isArray(draft.evidenceMedia) && draft.evidenceMedia.length > 0) {
      return draft.evidenceMedia.map(normalizeMediaItem);
    }
    return [];
  }, [draft]);

  // รูปความเสียหาย: เก็บ metadata (side/total/perClass/note)
  const damageList: DamagePhoto[] = useMemo(() => {
    if (!draft?.damagePhotos || draft.damagePhotos.length === 0) return [];
    return draft.damagePhotos
      .filter((d) => !!d?.url)
      .map((d, idx) =>
        normalizeMediaItem<DamagePhoto>({
          url: d.url,
          type: d.type,
          publicId: d.publicId || `damage-${idx}`,
          side: d.side,
          total: d.total,
          perClass: d.perClass,
          note: d.note,
        })
      );
  }, [draft?.damagePhotos]);

  const handleSubmit = async () => {
    if (!agree || !car || !draft) return;

    setSubmitting(true);
    try {
      const claimId = (draft as any)?.claim_id ?? null;

      let url = "";
      let method: "POST" | "PUT" = "POST";

      if (claimId && claimStatus === "incomplete") {
        // ✅ เคสเก่า incomplete → update
        url = `${process.env.NEXT_PUBLIC_URL_PREFIX}/api/claim-submit/update/${claimId}`;
        method = "PUT";
      } else {
        // ✅ เคสใหม่ → create
        url = `${process.env.NEXT_PUBLIC_URL_PREFIX}/api/claim-submit/submit`;
        method = "POST";
      }

      const accidentPayload = {
        ...draft,
        date: draft.accident_date,
        time: draft.accident_time,
        area_type: draft.area_type,  // ✅ map เป็น snake_case ให้ backend
      };

      // ลบ field ที่ frontend ใช้เองออกกันสับสน
      delete (accidentPayload as any).accident_date;
      delete (accidentPayload as any).accident_time;
      console.log("📤 Accident payload:", accidentPayload);
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          user_id: userId,
          selected_car_id: car.id,
          accident: accidentPayload,   // ✅ ส่ง field ตามที่ backend รอรับ
          agreed: agree,
          status: claimStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        alert(data?.message || "ส่งคำขอไม่สำเร็จ");
        return;
      }

      localStorage.removeItem(ACC_KEY);
      localStorage.removeItem(CAR_KEY);
      onFinish();
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดระหว่างส่งคำขอ");
    } finally {
      setSubmitting(false);
    }
  };



  if (!car || !draft) {
    return (
      <div className="mx-auto max-w-3xl text-center p-6">
        <p className="text-zinc-300">ไม่พบข้อมูลรถหรือรายละเอียดอุบัติเหตุ</p>
        <button onClick={onBack} className="mt-4 rounded-lg bg-zinc-700 px-4 py-2">
          ย้อนกลับ
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl bg-white rounded-2xl shadow-lg p-6">

      <div className="bg-[#333333] h-auto text-white rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ซ้าย: ตรวจสอบการเคลม */}
        <div>
          <h2 className="text-lg font-bold">ตรวจสอบการเคลมของคุณ</h2>
          <p className="mt-2 text-sm">
            ผู้เอาประกัน
          </p>
          <span className="font-semibold">{car.insured_name}</span>

          <p className="text-sm"> {car.policy_number}</p>
        </div>

        {/* กลาง: รถยนต์ที่ทำประกัน */}
        <div>
          <div><br /></div>
          <p className="mt-2 text-sm">
            รถยนต์ที่ทำประกัน
          </p>
          <span className="font-semibold">{car.car_brand} {car.car_model} {car.car_year}</span>
          <p className="text-sm">{car.car_license_plate} {car.registration_province}</p>
          <p className="text-sm">{car.chassis_number}</p>


        </div>

        {/* ขวา: รูปรถ */}
        <div className="rounded-[7px] h-[15opxaaaaaaaaaa] flex items-center justify-center">
          <img
            src={car.car_path}
            alt="Car"
            className="h-full object-contain rounded-md"
          />
        </div>
      </div>

      {/* Content 3 Columns */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-black">

        <div className="bg-zinc-50 rounded-lg p-4 space-y-3">
          <h2 className="font-semibold mb-3">รายละเอียดที่เกิดเหตุ</h2>
          <div className="w-full h-[200px] bg-zinc-200 flex items-center justify-center rounded overflow-hidden">
            <MapPreview
              lat={parseFloat(String(draft.location.lat))}
              lng={parseFloat(String(draft.location.lng))}
            />
          </div>
          <p className="text-sm"><span className="font-medium">วัน/เวลา:</span> {draft.accident_date} {draft.accident_time}</p>
          <p className="text-sm"><span className="font-medium">สถานที่:</span> {draft.province} {draft.district} {draft.road}</p>
          <p className="text-sm"><span className="font-medium">ประเภทพื้นที่:</span> {draft.area_type}</p>
          <p className="text-sm"><span className="font-medium">จุดสังเกต:</span> {draft.nearby}</p>
          {draft.details && (
            <p className="text-sm"><span className="font-medium">รายละเอียด:</span> {draft.details}</p>
          )}
        </div>

        {/* กลาง: ประเภทอุบัติเหตุ */}
        <div className="bg-zinc-50 rounded-lg p-4 space-y-3">
          <h2 className="font-semibold mb-3">รายละเอียดอุบัติเหตุ</h2>

          <p className="text-sm"><span className="font-medium">ประเภทอุบัติเหตุ:</span> {draft.accidentType}</p>
          <div>
            <p className="text-sm font-medium">รายละเอียดเพิ่มเติม:</p>
            <p className="text-sm">{draft.details}</p>
          </div>
          {evidenceList.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">หลักฐานภาพ/วิดีโอ</p>
              <EvidenceGallery media={evidenceList} />
            </div>
          )}
        </div>

        {/* ขวา: ความเสียหาย */}
        <div className="bg-zinc-50 rounded-lg p-4 space-y-3">
          <h2 className="font-semibold mb-3">รูปความเสียหาย</h2>
          {/* รูปความเสียหาย */}
          {damageList.length > 0 && (
            <section className="mt-6">


              <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                {damageList.map((d, idx) => {
                  const classes = topClasses(d.perClass, 5);
                  const hasNote = !!(d.note && d.note.trim().length > 0);

                  return (
                    <div
                      key={`${d.publicId || d.url}-${idx}`}
                      className="relative overflow-hidden rounded-xl ring-1 ring-zinc-200/70 bg-zinc-50"
                    >
                      <div className="aspect-video w-full bg-black/5">
                        {d.type === "video" ? (
                          <video
                            src={d.url}
                            controls
                            className="h-full w-full object-cover"
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={d.url}
                            alt={`damage-${idx}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>

                      {/* Badges มุมบนซ้าย */}
                      <div className="absolute left-2 top-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-zinc-900/80 text-white text-xs px-2 py-1">
                          ด้าน: {formatSide(d.side)}
                        </span>
                        {d.total !== undefined && d.total !== null && (
                          <span className="rounded-full bg-indigo-600 text-white text-xs px-2 py-1">
                            รวม: {d.total} ตำแหน่ง
                          </span>
                        )}
                      </div>

                      {/* รายละเอียดความเสียหาย */}
                      <div className="p-3 space-y-2">
                        {/* {classes.length > 0 ? (
                          <div className="space-y-1">
                            <div className="text-xs text-zinc-500">ความเสียหายที่ตรวจพบ</div>
                            <ul className="text-sm">
                              {classes.map(([name, score]) => (
                                <li key={name} className="flex items-center justify-between py-0.5">
                                  <span className="truncate">{toTHDamage(name)}</span>
                                  <span className="ml-3 tabular-nums text-zinc-600">{score} ตำแหน่ง</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div className="text-sm text-zinc-500">ไม่มีข้อมูลจำแนกความเสียหาย</div>
                        )} */}

                        {hasNote && (
                          <div className="text-sm">
                            <div className="text-xs text-zinc-500">รายระเอียดความเสียหาย</div>
                            <div className="whitespace-pre-wrap">{d.note}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        </div>
      </div>



      {/* ยืนยัน */}
      <div className="flex items-start gap-3 mt-4">
        <input
          id="agree"
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="mt-1"
        />
        <label htmlFor="agree" className="text-sm text-black">
          ตรวจสอบข้อมูลข้างต้นครบถ้วนแล้ว และยืนยันการส่งคำขอเคลม
        </label>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onBack} className=" rounded-[7px] bg-zinc-200 px-4 py-2 text-black  hover:bg-zinc-200/60">
          แก้ไขข้อมูล
        </button>
        <button
          onClick={handleSubmit}
          disabled={!agree || submitting}
          className={`rounded-lg px-4 py-2  font-medium text-white ${!agree || submitting ? "bg-[#6F47E4]" : "bg-[#6F47E4] hover:bg-[#6F47E4]/80"
            }`}
        >
          {submitting
            ? "กำลังส่ง..."
            : claimStatus === "incomplete"
              ? "ยืนยันการแก้ไข"
              : "ยืนยันส่งเรื่อง"}
        </button>
      </div>
    </div>
  );
}

// ---------- Small presentational helpers ----------
function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <div className="text-zinc-500">{k}</div>
      <div className="font-medium text-right">{v}</div>
    </div>
  );
}
