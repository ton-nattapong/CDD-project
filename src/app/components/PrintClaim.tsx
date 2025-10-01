"use client";

import { useRouter } from "next/navigation";
import type { ClaimStatus } from "@/types/claim";
import { FileText } from "lucide-react";

export default function PrintClaimButton({
  claimId,
  status,
  docPath = "/reports/claim-doc",
  autoPrint = true,
  openInNewTab = true,
  className = "",
}: {
  claimId: string | number;
  status: ClaimStatus;
  docPath?: string;
  autoPrint?: boolean;
  openInNewTab?: boolean;
  className?: string;
}) {
  const router = useRouter();

  // โชว์เฉพาะเมื่อสถานะสำเร็จ
  if (status !== "สำเร็จ") return null;

  const url =
    `${docPath}?claim_id=${encodeURIComponent(String(claimId))}` +
    (autoPrint ? "&autoprint=1" : "");

  const base =
    "inline-flex items-center gap-2 rounded-[7px] px-3.5 py-2 text-sm font-semibold " +
    "transform-gpu transition-[transform,background-color,box-shadow] duration-[1100ms] " +
    "ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-0.5 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";
  const success = "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm";

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    if (openInNewTab) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      router.push(url);
    }
  };

  return (
    <button onClick={handleClick} className={`${base} ${success} ${className}`} title="ดู/พิมพ์เอกสารการเคลม">
      <FileText className="h-4 w-4" />
    เอกสารการเคลม
    </button>
  );
}
