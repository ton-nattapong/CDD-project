"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ClaimDocument from "@/app/components/ClaimDocument";
import type { ClaimDetail } from "@/types/claim";

const URL_PREFIX =
  process.env.NEXT_PUBLIC_URL_PREFIX || (typeof window !== "undefined" ? "" : "");

export default function ClaimDocPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const claimId = sp.get("claim_id");
  const autoPrint = sp.get("autoprint") === "1";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [detail, setDetail] = useState<ClaimDetail | null>(null);

  useEffect(() => {
    if (!claimId) { setErr("ไม่พบ claim_id"); setLoading(false); return; }
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${URL_PREFIX}/api/claim-requests/detail?claim_id=${encodeURIComponent(claimId)}`,
          { credentials: "include", cache: "no-store" }
        );
        const json = await res.json();
        if (!alive) return;
        if (!res.ok || !json?.ok) throw new Error(json?.message || "โหลดรายละเอียดไม่สำเร็จ");
        setDetail(json.data as ClaimDetail);
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "เกิดข้อผิดพลาด");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [claimId]);

  // autoprint
  useEffect(() => {
    if (!loading && !err && detail && autoPrint) {
      setTimeout(() => window.print(), 300);
    }
  }, [loading, err, detail, autoPrint]);

  if (loading) return <div className="p-6 text-zinc-600">กำลังโหลดเอกสาร…</div>;
  if (err || !detail) return <div className="p-6 text-rose-600">ผิดพลาด: {err || "ไม่พบข้อมูล"}</div>;

  return (
    <div className="min-h-screen bg-white">
      {/* แถบปุ่มบนเฉพาะตอนไม่พิมพ์ */}
      <div className="no-print mx-auto max-w-[794px] px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm hover:bg-zinc-200">
          ← กลับ
        </button>
        <button onClick={() => window.print()} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700">
          พิมพ์เอกสาร
        </button>
      </div>

      <ClaimDocument detail={detail} />
    </div>
  );
}
