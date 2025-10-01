"use client";

import React, { useEffect, useState } from "react";
import DamagePhotosPanel, { DamagePhotoItem } from "../components/DamagePhotosPanel";
import SafeAreaSpacer from "../components/SafeAreaSpacer";

const ACC_KEY = "accidentDraft";

// ฟังก์ชันอัปโหลดไฟล์ไป Cloudinary
async function uploadToCloudinary(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET as string);

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD}/upload`,
        { method: "POST", body: formData }
    );
    if (!res.ok) throw new Error("Upload failed");

    const data = await res.json();
  
 return {
    id: data.public_id,
    file: null,
    previewUrl: data.secure_url,
    side: "ไม่ระบุ",
    total: undefined,       // ✅ ใช้ undefined
    perClass: undefined,    // ✅ เช่นเดียวกัน
    note: "",
    detecting: false,
    type: data.resource_type === "video" ? "video" : "image",
} as DamagePhotoItem;
}

interface StepProps {
    onNext: () => void;
    onBack: () => void;
}

export default function AccidentStep3({ onNext, onBack }: StepProps) {
    const [damageItems, setDamageItems] = useState<DamagePhotoItem[]>([]);
    const [agreed, setAgreed] = useState(false);

    // โหลด draft
    useEffect(() => {
        try {
            const rawAcc = localStorage.getItem(ACC_KEY);
            if (rawAcc) {
                const a = JSON.parse(rawAcc);
                if (Array.isArray(a.damagePhotos)) {
                    setDamageItems(
                        a.damagePhotos.map((d: any) => ({
                            id: d.publicId || crypto.randomUUID(),
                            file: null, // 👈 ตรงนี้ยังใช้ null ได้ เพราะ type อนุญาต
                            previewUrl: d.url,
                            side: d.side ?? "ไม่ระบุ",
                            total: d.total ?? undefined,      // 👈 แทนที่จะเป็น null ให้เป็น undefined
                            perClass: d.perClass ?? undefined, // 👈 เช่นเดียวกัน
                            note: d.note ?? "",
                            detecting: false,
                            type: d.type ?? "image",    
                        }))
                    );
                }
                setAgreed(a.agreed || false);
            }
        } catch { }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const oldDraft = JSON.parse(localStorage.getItem(ACC_KEY) || "{}");

        const payload = {
            ...oldDraft,
            damagePhotos: damageItems.map((d) => ({
                url: d.previewUrl,
                side: d.side,
                note: d.note,
                total: d.total,
                perClass: d.perClass,
                publicId: d.id,
               
            })),
            agreed,
        };

        localStorage.setItem(ACC_KEY, JSON.stringify(payload));
        onNext();
    };

    const isValid = damageItems.length > 0 && agreed;

    // ✅ handler สำหรับ panel
   const handlePanelChange = async (items: DamagePhotoItem[]) => {
  const updated: DamagePhotoItem[] = [];

  for (const item of items) {
    if (item.file) {
      try {
        const uploaded = await uploadToCloudinary(item.file);

        // 👇 merge field เดิมที่ user กรอกไว้ (side, note, total, perClass)
        updated.push({
          ...uploaded,
         side: item.side || uploaded.side, 
          note: item.note ?? uploaded.note,
          total: item.total ?? uploaded.total,
          perClass: item.perClass ?? uploaded.perClass,
        });
      } catch (err) {
        console.error("Upload failed:", err);
        updated.push(item);
      }
    } else {
      updated.push(item);
    }
  }

  setDamageItems(updated);
};


    return (
        <div className="acc-page box-border mx-auto max-w-5xl px-3 sm:px-4 md:px-6">
            <form onSubmit={handleSubmit} className="bg-white p-6 space-y-8">
                <div className="mb-5 flex items-center justify-center gap-2">
                    <h2 className="text-base sm:text-lg font-semibold text-zinc-900">
                        อัปโหลดภาพรถยนต์ที่เกิดความเสียหาย
                    </h2>
                </div>

                {/* Damage Photos Panel */}
                <div className="mt-6 min-w-0">
                    <div className="rounded-[7px] overflow-hidden">
                        <DamagePhotosPanel
                            apiBaseUrl={process.env.NEXT_PUBLIC_DETECT_API_URL as string}
                            onChange={handlePanelChange}
                            value={damageItems}
                        />
                    </div>
                </div>

                {/* Checkbox */}
                <div className="mt-6 flex items-start gap-2">
                    <input
                        id="agree"
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                    />
                    <label htmlFor="agree" className="text-sm text-zinc-700">
                        ข้าพเจ้ายืนยันว่าข้อมูลถูกต้องและอนุญาตให้ใช้เพื่อการดำเนินการเคลม
                    </label>
                </div>

                {/* ปุ่ม */}
                <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="w-full sm:w-auto rounded-[7px] bg-zinc-200 text-zinc-800 hover:bg-zinc-300 px-6 py-3 sm:py-2"
                    >
                        ย้อนกลับ
                    </button>
                    <button
                        type="submit"
                        disabled={!isValid}
                        className={`w-full sm:w-auto rounded-[7px] px-6 py-2 font-medium shadow-sm ${isValid
                                ? "bg-[#6D5BD0] hover:bg-[#433D8B] text-white"
                                : "bg-zinc-400 cursor-not-allowed text-white"
                            }`}
                    >
                        ดำเนินการต่อ
                    </button>
                </div>
            </form>

            <SafeAreaSpacer />
        </div>
    );
}
