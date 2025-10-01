import type { ClaimDetail } from "@/types/claim";
import DamageDiagram from "../components/DamageDiagram";
/* ---------- utils ---------- */
const thDate = (iso?: string) =>
  !iso
    ? "-"
    : new Date(iso).toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

type Row = {
  no: number;
  part: string;
  damages: string;
  severity: "A" | "B" | "C" | "D" | string;
  side?: string;
};

export default function ClaimDocument({ detail }: { detail: ClaimDetail }) {
  const car = (detail.car ?? {}) as any;
  const acc = (detail.accident ?? {}) as any;

  // รวมรายการจาก annotations ของทุกภาพ
  const rows: Row[] = [];
  let i = 1;
  for (const p of acc.damagePhotos ?? []) {
    for (const a of (p as any).annotations ?? []) {
      const dmg = Array.isArray(a.damage) ? a.damage.join(", ") : a.damage || "-";
      rows.push({
        no: i++,
        part: a.part || "-",
        damages: dmg,
        severity: (a.severity as any) ?? "-",
        side: (p as any).side,
      });
    }
  }

  const uniqueParts = Array.from(new Set(rows.map((r) => r.part))).filter(Boolean);

  return (
    <div id="print-root" className="mx-auto w-full max-w-[794px] bg-white p-0 print:max-w-none">
      {/* PRINT hardening */}
      <style jsx global>{`
        @page { size: A4; margin: 10mm 10mm 12mm 10mm; }
        @media print {
          html, body { background: #fff !important; }
          /* ซ่อนทุกอย่างยกเว้นเอกสาร */
          body * { visibility: hidden !important; }
          #print-root, #print-root * { visibility: visible !important; }
          #print-root { position: absolute; inset: 0; margin: 0; }
          /* เก็บเฉพาะเนื้อหา ห้าม floating สิ่งอื่น */
          .no-print, .print-hide, [class*="fixed"], [class*="sticky"], [data-floating] { display: none !important; }
          /* ตัดเงา/โฟกัส */
          *:focus { outline: none !important; box-shadow: none !important; }
          /* กันหักกลางกล่องสำคัญ */
          .avoid-break { break-inside: avoid; page-break-inside: avoid; }
          .break-before { break-before: page; page-break-before: always; }
        }
        /* ตารางเส้นคม */
        .doc-table { border-collapse: collapse; width: 100%; }
        .doc-table th, .doc-table td { border: 1px solid #C9CDD4; padding: 8px 10px; vertical-align: top; }
        .doc-th { background: #F6F8FB; font-weight: 600; }
        .doc-box { border: 1px solid #C9CDD4; border-radius: 6px; }
        .legend-dot { width: 12px; height: 12px; border-radius: 9999px; display:inline-block; border:1px solid #111827; }
        /* กล่องติ๊ก A-D เป็นกรอบสี่เหลี่ยม ไม่ใช่ <input> */
        .check-cell { width: 14px; height: 14px; border: 1.6px solid #111827; display: inline-block; border-radius:2px; }
        .check-fill { width: 9px; height: 9px; background:#111827; display:block; margin:2px; }
      `}</style>

      {/* ---------- Header ---------- */}
      <div className="rounded-xl p-4 sm:p-5 shadow-none-print avoid-break text-black">
        <div className="mb-2 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full border border-zinc-300">🚗</div>
          <div>
            <div className="text-[22px] font-extrabold leading-tight">
              บริษัท ประกันภัย จำกัด (มหาชน)
            </div>
            <div className="text-[15px] font-semibold text-zinc-800">
              Insurance Public Company Limited
            </div>
          </div>
        </div>
        <div className="my-2 h-px w-full bg-zinc-300" />

        <div className="mb-2 text-center text-[15px] font-semibold tracking-wide text-zinc-900">
          ข้อมูลการเคลม
        </div>

        {/* ---------- กล่องข้อมูลเคลม ---------- */}
        <div className="doc-box p-3 sm:p-4 text-[13px] avoid-break">
          <div className="grid grid-cols-12 gap-x-4 gap-y-2">
            <Info label="ยี่ห้อรถ" value={car.car_brand} />
            <Info label="ปี" value={String(car.car_year ?? "-")} />
            <Info label="เลขที่เคลม" value={String(detail.claim_id)} />

            <Info label="รุ่น" value={car.car_model} />
            <Info label="ทะเบียน" value={car.car_license_plate} />
            <Info label="สถานะ" value={detail.status ?? "-"} />

            <Info label="เลขที่กรมธรรม์" value={car.policy_number} />
            <Info label="ประเภทประกัน" value={car.insurance_type} />
            <Info label="คุ้มครองถึง" value={car.coverage_end_date ? thDate(car.coverage_end_date) : "-"} />

            <div className="col-span-12 my-1 h-px w-full bg-zinc-200" />

            <Info label="วันที่ยื่นคำขอ" value={thDate(detail.created_at)} />
            <Info label="วันที่เกิดเหตุ" value={thDate(acc.date)} />
            <Info label="เวลาที่เกิดเหตุ" value={acc.time ?? "-"} />

            <Info label="ประเภทอุบัติเหตุ" value={acc.accidentType} />
            <Info label="จังหวัด" value={acc.province} />
            <Info label="อำเภอ" value={acc.district} />

            <Info label="ถนน/บริเวณใกล้เคียง" value={`${acc.road ?? "-"} / ${acc.nearby ?? "-"}`} className="col-span-12" />
            <Info label="ประเภทพื้นที่" value={acc.areaType} />
          </div>
        </div>

        {/* ---------- รายการความเสียหาย (3 คอลัมน์) ---------- */}
        <div className="mt-4 doc-box avoid-break">
          <div className="border-b border-zinc-300 bg-[#F6F8FB] px-3 py-2 text-[13px] font-semibold">
            รายการความเสียหาย
          </div>

          <div className="grid grid-cols-12">
            {/* ซ้าย: ชิ้นส่วนที่เสียหาย */}
            <div className="col-span-12 border-b border-zinc-300 p-3 sm:col-span-4 sm:border-b-0 sm:border-r">
              <div className="mb-2 text-[13px] font-semibold">ชิ้นส่วนที่เสียหาย</div>
              <div className="grid grid-cols-1 gap-1 text-[13px]">
                {uniqueParts.length ? (
                  uniqueParts.map((p) => (
                    <div key={p} className="flex items-center gap-2">
                      <span className="legend-dot" style={{ background: "#fff" }} />
                      <span>{p}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-zinc-500">—</div>
                )}
              </div>
            </div>

            {/* กลาง: แผนภาพ */}
            <div className="col-span-12 border-b border-zinc-300 p-3 sm:col-span-4 sm:border-b-0 sm:border-r">
              <div className="mb-2 text-[13px] font-semibold">แผนภาพชิ้นส่วนที่เสียหาย</div>
              <DamageDiagram rows={rows} />
              
            </div>

            {/* ขวา: Legend */}
            <div className="col-span-12 p-3 sm:col-span-4">
              <div className="mb-2 text-[13px] font-semibold">ลักษณะความเสียหาย</div>
              <ul className="grid grid-cols-1 gap-1 text-[13px]">
                {[
                  ["#D946EF", "รอยขีดข่วน"],
                  ["#F59E0B", "รอยบุบ"],
                  ["#3B82F6", "ร้าว"],
                  ["#EF4444", "กระจกแตก"],
                  ["#FACC15", "ไฟแตก"],
                  ["#7C3AED", "ยางแบน"],
                ].map(([color, label]) => (
                  <li key={label} className="flex items-center gap-2">
                    <span className="legend-dot" style={{ background: color as string }} />
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ---------- ตาราง “รายการชิ้นส่วนที่เสียหาย” ---------- */}
        <div className="mt-4 doc-box avoid-break">
          <div className="border-b border-zinc-300 bg-[#F6F8FB] px-3 py-2 text-[13px] font-semibold">
            รายการชิ้นส่วนที่เสียหาย
          </div>
          <div className="overflow-x-auto">
            <table className="doc-table text-[13px]">
              <thead>
                <tr>
                  <th className="doc-th w-16 text-center">ลำดับ</th>
                  <th className="doc-th">รายการ</th>
                  <th className="doc-th w-[38%]">สภาพ</th>
                  <th className="doc-th w-72 text-center" colSpan={4}>ระดับความเสียหาย</th>
                </tr>
                <tr>
                  <th />
                  <th />
                  <th />
                  {["A", "B", "C", "D"].map((lv) => (
                    <th key={lv} className="doc-th w-16 text-center">{lv}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((r) => (
                    <tr key={r.no}>
                      <td className="text-center">{r.no}</td>
                      <td>{r.part}</td>
                      {/* สภาพ = ข้อความธรรมดา ไม่มี input/overlay */}
                      <td className="whitespace-pre-wrap break-words">{r.damages}</td>
                      {["A", "B", "C", "D"].map((lv) => (
                        <td key={lv} className="text-center">
                          <span className="check-cell">
                            {String(r.severity).toUpperCase() === lv ? <span className="check-fill" /> : null}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-zinc-500">ไม่มีข้อมูลความเสียหาย</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---------- ลายเซ็น ---------- */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 avoid-break">
          <SignBox title="บริษัทประกัน" />
          <SignBox title="ผู้เอาประกันภัย / ลูกค้า" />
        </div>
      </div>
    </div>
  );
}

/* ---------- subs ---------- */
function Info({ label, value, className = "" }: { label: string; value?: string; className?: string }) {
  return (
    <div className={`col-span-12 sm:col-span-6 lg:col-span-4 ${className}`}>
      <div className="text-[12px] text-zinc-500">{label}</div>
      <div className="text-[13px] font-medium">{value || "-"}</div>
    </div>
  );
}
function SignBox({ title }: { title: string }) {
  return (
    <div className="rounded-md border border-zinc-300 p-4">
      <div className="mb-10 text-[13px] text-zinc-700">{title}</div>
      <div className="text-[13px] text-zinc-600">ลงชื่อ ___________________________</div>
      <div className="mt-2 text-[13px] text-zinc-600">วันที่ ___________/___________/___________</div>
    </div>
  );
}
