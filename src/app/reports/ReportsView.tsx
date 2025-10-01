"use client";

import React, { useEffect, useMemo, useState } from "react";
import ReportCard from "./ReportCard";
import type { ClaimItem } from "@/types/claim";
import { Search, ChevronDown } from "lucide-react";
import ReportDetail from "./ReportDetail";
import PrintClaimButton from "../components/PrintClaim";
const cx = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

function thDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ReportsView({
  claims,
  onOpenPdf,
}: {
  claims: ClaimItem[];
  onOpenPdf: (id: string) => void;
}) {
  // default เลือกเคสที่ใหม่สุด
  const defaultSelected =
    [...claims].sort(
      (a, b) => +new Date(b.updated_at) - +new Date(a.updated_at)
    )[0]?.id ?? null;

  const [selectedId, setSelectedId] = useState<string | null>(defaultSelected);
  useEffect(() => setSelectedId(defaultSelected), [defaultSelected]);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<

    "ทั้งหมด" | "กำลังตรวจสอบ" | "สำเร็จ" | "ปฏิเสธ" | "ข้อมูลไม่ครบ"

  >("ทั้งหมด");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return claims.filter((c) => {
      const matchText =
        !q ||
        c.carTitle?.toLowerCase().includes(q) ||
        c.incidentType?.toLowerCase().includes(q) ||
        c.damageAreas?.toString().toLowerCase().includes(q) ||
        c.severitySummary?.toLowerCase().includes(q) ||
        thDateTime(c.incidentDate).includes(q);
      const matchStatus = statusFilter === "ทั้งหมด" || c.status === statusFilter;
      return matchText && matchStatus;
    });
  }, [claims, query, statusFilter]);

  const selected = useMemo(
    () => claims.find((c) => c.id === selectedId) ?? null,
    [claims, selectedId]
  );
  const [open, setOpen] = useState(false);
  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6 py-6 ">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.5fr)_minmax(0,1fr)] ">



        {/* Sidebar */}
        <section className="lg:h-auto mb-120">
          <div className="rounded-[8px] bg-[#E5E5E5] p-4 md:p-5 ring-1 ring-zinc-200/70 shadow-sm flex flex-col">

            {/* Search + Filter */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ค้นหารายการเคลม"
                  className="w-full rounded-lg bg-white px-10 py-2 text-sm text-zinc-800 placeholder-zinc-400
                     ring-1 ring-zinc-200 focus:ring-2 focus:ring-violet-400 shadow-sm outline-none"
                />
              </div>

              {/* Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpen(!open)}
                  className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black shadow hover:bg-black/10"
                >
                  {statusFilter}
                  <ChevronDown size={16} />
                </button>

                {open && (
                  <div className="absolute right-0 mt-2 w-44 rounded-lg bg-white shadow-lg ring-1 ring-black/10 z-10">
                    {(["ทั้งหมด", "กำลังตรวจสอบ", "สำเร็จ", "ปฏิเสธ", "ข้อมูลไม่ครบ"] as const).map((s) => (
                      <div
                        key={s}
                        onClick={() => {
                          setStatusFilter(s);
                          setOpen(false);
                        }}
                        className="cursor-pointer px-4 py-2 text-sm text-zinc-700 hover:bg-violet-100"
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* รายการ (สูงสุด 6) */}
           
            <div className="mt-4 flex flex-col gap-3 max-h-[432px] overflow-y-auto">
              {[...filtered]
                .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
                .map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={cx(
                      "grid grid-cols-[60px_1fr] items-center gap-3 rounded-[8px] px-3 py-3 cursor-pointer transition",
                      item.id === selectedId
                        ? "bg-[#6F47E4] text-white"
                        : "bg-white text-black hover:bg-[#6F47E4]/30"
                    )}
                  >
                    {/* ซ้าย: รูป */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white text-black text-xs font-medium overflow-hidden">
                      {item.car_path ? (
                        <img
                          src={item.car_path}
                          alt={item.carTitle}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        "ภาพ"
                      )}
                    </div>

                    {/* ขวา */}
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold truncate">
                          {item.car_brand} {item.car_model}
                        </p>
                        <span
                          className={cx(
                            "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                            item.status === "กำลังตรวจสอบ" && "bg-yellow-400 text-black",
                            item.status === "สำเร็จ" && "bg-green-500 text-white",
                            item.status === "เอกสารไม่ผ่านการตรวจสอบ" && "bg-red-500 text-white",
                            item.status === "เอกสารต้องแก้ไขเพิ่มเติม" && "bg-orange-200 text-orange-800"
                          )}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs opacity-90">
                        <span className="truncate">อุบัติเหตุ: {item.incidentType ?? ""}</span>
                        <span>เมื่อวันที่:{thDateTime(item.incidentDate)}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

          </div>
        </section>

        <section className="overflow-y-auto max-h-[calc(100vh-6rem)]">
          {selected ? (

            <ReportDetail
              
              claim={selected}
              onOpenPdf={() => {
              window.open(`http://localhost:3001/api/claim-requests/detail?claim_id=${selected.id}`, "_blank");
            }}
            />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-black/70">
              เลือกรายการจากด้านขวาเพื่อแสดงรายละเอียด
            </div>
            
          )}
        </section>
      </div>
    </div>
  );
}
