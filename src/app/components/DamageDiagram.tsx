import CarDiagram from "@/assets/car-frame.svg";

const DAMAGE_COLOR: Record<string, string> = {
  "รอยขีดข่วน": "#D946EF",
  "รอยบุบ": "#F59E0B",
  "ร้าว": "#3B82F6",
  "กระจกแตก": "#EF4444",
  "ไฟแตก": "#FACC15",
  "ยางแบน": "#7C3AED",
};

const PartIdMap: Record<string, string> = {
  "กระจกบังลมหน้า": "windshield-front",
  "กระจกบังลมหลัง": "windshield-rear",
  "กระจกมองข้าง": "mirror-side",
  "กระจังหน้า": "grille-front",

  "กันชนหน้า": "bumper-front",
  "กันชนหลัง": "bumper-rear",

  "แก้มข้าง": "fender-side",

  "ประตูหน้า": "door-front",
  "ประตูหลัง": "door-rear",

  "ป้ายทะเบียน": "license-plate",

  "แผงมังโคลนหลัง": "mudguard-rear",

  "ฝากระโปรงหน้า": "hood-front",
  "ฝากระโปรงหลัง": "hood-rear",

  "ไฟท้าย": "light-rear",
  "ไฟหน้า": "light-front",

  "ล้อหน้า": "wheel-front",
  "ล้อหลัง": "wheel-rear",

  "สเกิร์ตข้าง": "skirt-side",

  "หน้าต่างหน้า": "window-front",
  "หน้าต่างหลัง": "window-rear",

  "หลังคา": "roof",

  
};

type Row = { part: string; damages: string };

export default function DamageDiagram({ rows }: { rows: Row[] }) {
  return (
    <div className="w-[800px] h-auto relative">
      <CarDiagram className="w-full h-auto" />

      <style jsx global>{`
        ${rows
          .map((r) => {
            const id = PartIdMap[r.part]; // ✅ แปลงชื่อไทย → id
            if (!id) return "";
            const color = DAMAGE_COLOR[r.damages] || "white";
            return `#${id} { fill: ${color} !important; }`;
          })
          .join("\n")}
      `}</style>
    </div>
  );
}
