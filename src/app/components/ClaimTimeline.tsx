"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { ClaimStatus, Car, AccidentDraft, DamagePhoto, MediaItem } from "@/types/claim";
import ClaimReportPreview from "../reports/ClaimReportPreview";
type TimelineProps = {
    claimId: string;
    status: ClaimStatus | "pending" | "incomplete" | "rejected" | "approved";
    created_at?: string | null;
    updated_at?: string | null;
    approved_at?: string | null;
    admin_note?: string | null;
    onOpenPdf?: () => void;
};

function formatDateTime(iso?: string | null) {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleString("th-TH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// -------------------- Mapper จาก API -> Car / AccidentDraft --------------------
type DetailAPI = {
    claim_id: string | number;
    user_id: number;
    status: string;
    selected_car_id: number;
    accident_detail_id: number;
    created_at?: string;
    accident_type?: string;
    accident_date?: string;   // ISO
    accident_time?: string;
    area_type?: string;
    province?: string;
    district?: string;
    road?: string;
    nearby?: string;
    details?: string;
    latitude?: string | number | null;
    longitude?: string | number | null;
    accuracy?: string | number | null;
    evidence_file_url?: string | null;
    media_type?: "image" | "video" | string | null;

    car_brand?: string;
    car_model?: string;
    car_year?: number | string;
    license_plate?: string;
    insurance_type?: string;
    policy_number?: string;
    coverage_end_date?: string;
    insured_name?: string;
    car_path?: string;

    damage_images?: Array<{
        id: number;
        original_url: string;
        damage_note?: string | null;
        side?: "ซ้าย" | "ขวา" | "หน้า" | "หลัง" | string | null;
        is_annotated?: boolean;
        annotations?: any[];
    }>;
};

function isVideoUrl(url?: string | null) {
    if (!url) return false;
    const u = url.toLowerCase();
    return u.endsWith(".mp4") || u.endsWith(".mov") || u.endsWith(".webm") || u.includes("video/upload");
}

function mapToCar(d: DetailAPI): Car {
    return {
        id: Number(d.selected_car_id ?? 0),
        car_brand: d.car_brand ?? "-",
        car_model: d.car_model ?? "-",
        car_year: d.car_year ?? "",
        car_license_plate: d.license_plate ?? "-",
        insurance_type: d.insurance_type ?? "-",
        insured_name: d.insured_name ?? "-",
        policy_number: d.policy_number ?? "-",
        coverage_end_date: d.coverage_end_date ?? "",
        car_path: d.car_path ?? "",
        chassis_number: "", // ถ้า API ไม่มี ให้เว้นว่าง
        registration_province: d.province ?? "",
    };
}

function mapToDraft(d: DetailAPI): AccidentDraft {
    const lat = d.latitude != null ? Number(d.latitude) : NaN;
    const lng = d.longitude != null ? Number(d.longitude) : NaN;

    const evidenceMedia: MediaItem[] = [];
    if (d.evidence_file_url) {
        evidenceMedia.push({
            id: 1,
            url: d.evidence_file_url,
            type: isVideoUrl(d.evidence_file_url) ? "video" : "image",
        } as any);
    }

    const damagePhotos: DamagePhoto[] = Array.isArray(d.damage_images)
        ? d.damage_images.map((img, i) => ({
            id: img.id ?? i + 1,
            url: img.original_url,
            type: "image",
            side: (img.side as any) ?? "ไม่ระบุ",
            note: img.damage_note ?? undefined,
            total: null,
            perClass: null,
            annotations: [],
        }))
        : [];

    return {
        accidentType: d.accident_type ?? "-",
        accident_date: d.accident_date ?? "",
        accident_time: d.accident_time ?? "",
        province: d.province ?? null,
        district: d.district ?? null,
        road: d.road ?? null,
        areaType: d.area_type ?? "-",
        nearby: d.nearby ?? null,
        details: d.details ?? null,
        location: {
            lat: !Number.isNaN(lat) ? lat : (null as any),
            lng: !Number.isNaN(lng) ? lng : (null as any),
            accuracy: d.accuracy != null ? Number(d.accuracy) : null,
        },
        evidenceMedia,
        damagePhotos,
    };
}
// -----------------------------------------------------------------------------

export default function ClaimTimeline({
    claimId,
    status,
    created_at,
    updated_at,
    approved_at,
    admin_note,
}: TimelineProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [car, setCar] = useState<Car | null>(null);
    const [draft, setDraft] = useState<AccidentDraft | null>(null);
    const [error, setError] = useState<string | null>(null);

    // เปิด/ปิด modal → ล็อคสกอลล์หน้าหลัง
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    // โหลดรายละเอียดเมื่อเปิด modal
    useEffect(() => {
        if (!open) return;
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await fetch(
                    `http://localhost:3001/api/claim-requests/detail?claim_id=${claimId}`,
                    { credentials: "include", cache: "no-store" }
                );
                const json = await res.json();
                if (!alive) return;
                if (!res.ok || !json?.ok) throw new Error(json?.message || "โหลดรายละเอียดไม่สำเร็จ");
                const data: DetailAPI = json.data;
                setCar(mapToCar(data));
                setDraft(mapToDraft(data));
            } catch (e: any) {
                if (alive) setError(e?.message ?? "เกิดข้อผิดพลาด");
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [open, claimId]);

    const steps: { key: string; time: string; label: React.ReactNode; highlight?: boolean }[] = [];

    if (created_at) {
        steps.push({
            key: "pending",
            time: formatDateTime(created_at),
            label: (
                <div>
                    <div>สร้างเอกสารการเคลมสำเร็จ รอการตรวจสอบจากเจ้าหน้าที่</div>
                    <button
                        onClick={() => setOpen(true)}
                        className="mt-1 rounded-lg bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                        📄 ดูรายงาน
                    </button>
                </div>
            ),
        });
    }

    if ((status === "เอกสารต้องแก้ไขเพิ่มเติม" || status === "incomplete") && updated_at) {
        steps.push({
            key: "incomplete",
            time: formatDateTime(updated_at),
            label: (
                <div>
                    <div>เจ้าหน้าที่ตีคืนเอกสาร</div>
                    <div className="text-xs text-zinc-600">หมายเหตุ: {admin_note ?? "-"}</div>
                </div>
            ),
            highlight: true,
        });
    }

    if ((status === "เอกสารไม่ผ่านการตรวจสอบ" || status === "rejected") && updated_at) {
        steps.push({
            key: "rejected",
            time: formatDateTime(updated_at),
            label: (
                <div>
                    <div>เจ้าหน้าที่ปฏิเสธเอกสาร</div>
                    <div className="text-xs text-zinc-600">หมายเหตุ: {admin_note ?? "-"}</div>
                </div>
            ),
            highlight: true,
        });
    }

    if (status === "สำเร็จ" || status === "approved") {
        const approvedTime = approved_at || updated_at;
        steps.push({
            key: "approved",
            time: formatDateTime(approvedTime),
            label: <div>เอกสารถูกยืนยันจากเจ้าหน้าที่แล้ว</div>,
        });
    }

    return (
        <>
            {/* ไทม์ไลน์ */}
            <div className="space-y-5">
                {steps.map((step, i) => {
                    const isLast = i === steps.length - 1;
                    return (
                        <div key={i} className="flex items-start gap-3">
                            <div
                                className={`mt-1 h-3 w-3 rounded-full ${step.highlight
                                        ? "bg-orange-500"
                                        : isLast
                                            ? "bg-indigo-600 ring-4 ring-indigo-200"
                                            : "bg-green-500"
                                    }`}
                            />
                            <div className="text-sm">
                                <div className="text-xs text-zinc-500">{step.time}</div>
                                <div
                                    className={`${step.highlight
                                            ? "text-orange-600 font-semibold"
                                            : isLast
                                                ? "text-indigo-700 font-semibold"
                                                : "text-zinc-800"
                                        }`}
                                >
                                    {step.label}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal (Popup) */}
            {open && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 print:p-0"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="relative mx-auto w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-xl bg-white shadow-2xl print:rounded-none"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between gap-2 border-b px-4 py-3 print:hidden">
                            <div className="text-base font-semibold">เอกสารคำขอเคลม</div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
                                >
                                    🖨️ พิมพ์
                                </button>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="rounded-md bg-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-300"
                                >
                                    ✕ ปิด
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 print:p-0">
                            {loading ? (
                                <div className="py-14 text-center text-zinc-500">กำลังโหลดข้อมูล…</div>
                            ) : error ? (
                                <div className="py-14 text-center text-rose-600">{error}</div>
                            ) : (
                                <ClaimReportPreview car={car} draft={draft} />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
