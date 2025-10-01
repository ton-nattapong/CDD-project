import React from "react";
import type { ClaimItem, ClaimStatus } from "@/types/claim";
import { FileText } from "lucide-react";

const statusChip: Record<ClaimStatus, string> = {
  กำลังตรวจสอบ: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
  เอกสารต้องแก้ไขเพิ่มเติม: "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-400",
  สำเร็จ: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300",
  เอกสารไม่ผ่านการตรวจสอบ: "bg-rose-100 text-rose-800 ring-1 ring-rose-300",
};

function thDate(iso: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  if (!iso) return { date: "-", time: "" };
  const d = new Date(iso);
  const date = d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const time = d.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { date, time };
}

export default function ReportCard({
  data,
  active,
  layout = "wide",
  onClick,
  onOpenPdf,
  onDetail,
}: {
  data: ClaimItem;
  active?: boolean;
  layout?: "wide";
  onClick?: () => void;
  onOpenPdf?: () => void;
  onDetail?: () => void;
}) {
  const damageText = Array.isArray(data.damageAreas)
    ? data.damageAreas.join(", ")
    : data.damageAreas || "-";

  const created = formatDateTime(data.created_at ?? "");

  return (
    <div
      onClick={onClick}
      className={[
        "group grid cursor-pointer gap-4 rounded-[7px] border p-3 sm:p-4 transition",
        active ? "bg-[#6D5BD0]" : "border-zinc-200 bg-zinc-200 hover:bg-zinc-300/80",
        layout === "wide" ? "grid-cols-[160px_1fr]" : "",
      ].join(" ")}
    >
      {/* รูป */}
      <div className="aspect-[4/3] w-full max-w-[300px] overflow-hidden rounded-[7px] bg-zinc-100">
        {data.photoUrl ? (
          <img
            src={data.photoUrl}
            alt={data.carTitle}
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
            ไม่มีรูป
          </div>
        )}
      </div>

      {/* ข้อมูล ขวา */}
      <div className="flex min-w-0 flex-col justify-between">
        {/* แถวบน: ชื่อรถ + สถานะ */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-white truncate">
            {data.carTitle}
          </h3>
          <span
            className={[
              "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
              statusChip[data.status],
            ].join(" ")}
          >
            {data.status}
          </span>
        </div>

        {/* รายละเอียด */}
        <div className="mt-1 text-sm text-white/90 space-y-1">
          <div>
            <span className="font-medium">วันที่เกิดเหตุ: </span>
            {thDate(data.incidentDate)} {data.incidentTime && `${data.incidentTime} น.`}
          </div>
          {data.incidentType && (
            <div>
              <span className="font-medium">ประเภทเหตุการณ์: </span>
              {data.incidentType}
            </div>
          )}
          {(data.province || data.district || data.nearby) && (
            <div className="truncate">
              {[data.province, data.district, data.nearby].filter(Boolean).join(" | ")}
            </div>
          )}
          {damageText && damageText !== "-" && (
            <div>
              <span className="font-medium">ตำแหน่งความเสียหาย: </span>
              {damageText}
            </div>
          )}
          {data.details && (
            <div>
              <span className="font-medium">รายละเอียด: </span>
              {data.details}
            </div>
          )}
          {data.severitySummary && (
            <div>
              <span className="font-medium">สรุปความเสียหาย: </span>
              {data.severitySummary}
            </div>
          )}
        </div>

        {/* แถวล่าง */}
        <div className="mt-3 flex justify-between items-center text-sm text-white">
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenPdf}
              className="inline-flex items-center gap-1 rounded-md bg-white/90 px-3 py-1.5 text-sm font-medium text-[#4c3aa8] hover:bg-violet-50"
            >
              <FileText className="h-4 w-4" />
              เปิด PDF
            </button>
            {onDetail && (
              <button
                onClick={onDetail}
                className="inline-flex items-center gap-1 rounded-md bg-white/20 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/30"
              >
                รายละเอียด
              </button>
            )}
          </div>
          <span className="text-xs opacity-80">
            วันที่แจ้งเคลม {created.date}
          </span>
        </div>
      </div>
    </div>
  );
}
