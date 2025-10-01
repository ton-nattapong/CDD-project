"use client";

import React from "react";
import type { Car, AccidentDraft } from "@/types/claim";
import EvidenceGallery from "@/app/components/EvidenceGallery";
import MapPreview from "@/app/components/MapPreview";

type Props = {
  car: Car | null;
  draft: AccidentDraft | null;
};

export default function ClaimReportPreview({ car, draft }: Props) {
  if (!car || !draft) {
    return (
      <div className="p-6 text-center text-zinc-500">
        ไม่พบข้อมูลสำหรับแสดงรายงาน
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl bg-white rounded-2xl shadow-lg p-6">
      {/* Header (เหมือน ReviewConfirm) */}
      <div className="bg-[#333333] text-white rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ซ้าย */}
        <div>
          <h2 className="text-lg font-bold">ตรวจสอบการเคลมของคุณ</h2>
          <p className="mt-2 text-sm">ผู้เอาประกัน</p>
          <span className="font-semibold">{car.insured_name}</span>
          <p className="text-sm">{car.policy_number}</p>
        </div>

        {/* กลาง */}
        <div>
          <p className="mt-2 text-sm">รถยนต์ที่ทำประกัน</p>
          <span className="font-semibold">{car.car_brand} {car.car_model} {car.car_year}</span>
          <p className="text-sm">{car.car_license_plate} {car.registration_province}</p>
          <p className="text-sm">{car.chassis_number}</p>
        </div>

        {/* ขวา */}
        <div className="flex items-center justify-center">
          {car.car_path ? (
            <img src={car.car_path} alt="Car" className="h-[120px] object-contain rounded-md" />
          ) : (
            <div className="text-zinc-400">ไม่มีรูป</div>
          )}
        </div>
      </div>

      {/* Content 3 คอลัมน์ */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-black">
        {/* ซ้าย: สถานที่ */}
        <div className="bg-zinc-50 rounded-lg p-4 space-y-3">
          <h2 className="font-semibold mb-3">รายละเอียดที่เกิดเหตุ</h2>
          <div className="w-full h-[200px] bg-zinc-200 flex items-center justify-center rounded overflow-hidden">
            {draft.location?.lat && draft.location?.lng ? (
              <MapPreview lat={draft.location.lat} lng={draft.location.lng} />
            ) : (
              <div className="text-zinc-500">ไม่มีพิกัด</div>
            )}
          </div>
          <p className="text-sm"><span className="font-medium">วัน/เวลา:</span> {draft.date} {draft.time}</p>
          <p className="text-sm"><span className="font-medium">สถานที่:</span> {draft.province} {draft.district} {draft.road}</p>
          <p className="text-sm"><span className="font-medium">ประเภทพื้นที่:</span> {draft.areaType}</p>
          <p className="text-sm"><span className="font-medium">จุดสังเกต:</span> {draft.nearby}</p>
          {draft.details && (
            <p className="text-sm"><span className="font-medium">รายละเอียด:</span> {draft.details}</p>
          )}
        </div>

        {/* กลาง: หลักฐาน */}
        <div className="bg-zinc-50 rounded-lg p-4 space-y-3">
          <h2 className="font-semibold mb-3">รายละเอียดอุบัติเหตุ</h2>
          <p className="text-sm"><span className="font-medium">ประเภทอุบัติเหตุ:</span> {draft.accidentType}</p>
          {draft.evidenceMedia?.length ? (
            <>
              <p className="text-sm font-medium mb-1">หลักฐานภาพ/วิดีโอ</p>
              <EvidenceGallery media={draft.evidenceMedia} />
            </>
          ) : null}
        </div>

        {/* ขวา: รูปความเสียหาย */}
        <div className="bg-zinc-50 rounded-lg p-4 space-y-3">
          <h2 className="font-semibold mb-3">รูปความเสียหาย</h2>
          {draft.damagePhotos?.length ? (
            <EvidenceGallery media={draft.damagePhotos} />
          ) : (
            <p className="text-sm text-zinc-500">ไม่มีข้อมูลความเสียหาย</p>
          )}
        </div>
      </div>
    </div>
  );
}
