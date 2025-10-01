// src/components/Navbar.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {

  Home, Car, FileText, Mail, UserCheck,
  LayoutDashboard, ClipboardCheck, LogOut, User

} from "lucide-react";
import { Prompt, Noto_Sans_Thai } from 'next/font/google';
const headingFont = Prompt({ subsets: ['thai', 'latin'], weight: ['600', '700'], display: 'swap' });
const bodyFont = Noto_Sans_Thai({ subsets: ['thai', 'latin'], weight: ['400', '500'], display: 'swap' });

type Role = "admin" | "customer" | null;

type MeResponse = {
  isAuthenticated: boolean;
  user?: { id: string; role: Role; full_name?: string; email?: string };
};

// ====== เพื่อน: รายการเมนู (คง naming/เส้นทางเดิม) ======
const navItemsCustomer = [
  { icon: <Home size={20} />, href: "/", label: "หน้าหลัก" },
  { icon: <Car size={20} />, href: "/detect", label: "การตรวจจับ" },
  { icon: <FileText size={20} />, href: "/reports", label: "การเคลมของฉัน" },
  { icon: <Mail size={20} />, href: "/contact", label: "กล่องข้อความ" },
  { icon: <UserCheck size={20} />, href: "/claim", label: "สร้างการเคลมใหม่" }, // mobile only
  { icon: <LogOut size={20} />, href: "/login", label: "ออกจากระบบ" },          
];

const navItemsAdmin = [
  { icon: <LayoutDashboard size={20} />, href: "/adminpage", label: "Dashboard" },
 { icon: <ClipboardCheck size={20} />, href: "/adminpage/reportsall", label: "Reports" },
  { icon: <ClipboardCheck size={20} />, href: "/adminpage/reportsrequest", label: "Requests" },
  { icon: <UserCheck size={20} />, href: "/adminpage/customers", label: "Users" },
  { icon: <LogOut size={20} />, href: "/login", label: "Logout" },

];

  

// ====== เพื่อน: เช็ค active รองรับเส้นทางย่อย ======
function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/adminpage") return pathname === "/adminpage";
  return pathname === href || pathname.startsWith(href + "/");
}

// ====== สี/สไตล์ของคุณ (แก้ค่าสีที่นี่ที่เดียว) ======
const BRAND = {
  base: "#17153B",
  primary: "#6D5BD0",
  primaryDark: "#5F4CC8",
  railBg: "rgba(217,222,226,0.5)",
};

// ====== Component ======
export default function Navbar({ role: roleProp }: { role?: Role }) {
  const pathname = usePathname();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // ถ้าไม่ได้ส่ง role มา ให้ลองเช็คจาก API (คง behavior ของคุณ)
  useEffect(() => {
    if (roleProp) { setLoading(false); return; }
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/me`, {
          credentials: "include",
          signal: ac.signal,
          cache: "no-store",
        });
        const data: MeResponse = await res.json();
        setMe(data);
      } catch {
        setMe({ isAuthenticated: false });
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [roleProp]);

  const resolvedRole: Role =
    roleProp ?? (me?.user?.role ?? (me?.isAuthenticated ? "customer" : "customer"));

  const isAdmin = resolvedRole === "admin";
  const items = isAdmin ? navItemsAdmin : navItemsCustomer;

  const fullName = me?.user?.full_name ?? "ผู้ใช้";
  const email = me?.user?.email ?? "";

  // ====== Desktop Sidebar (ของคุณ): แถบขยายเมื่อ hover + แถบยื่นออกตอน active ======
  return (
    <>
      {/* Desktop / Tablet Sidebar */}
      <div className="group fixed top-0 left-0 hidden h-screen z-50 md:block">
        <aside
          className="
            h-full text-white overflow-hidden
            transition-all duration-300
            w-20 group-hover:w-64
            flex flex-col
          "
          style={{ background: BRAND.railBg, backdropFilter: "blur(6px)" as any }}
        >
          {/* LOGO */}
          <div className="flex items-center gap-3 m-2 p-4">
            <Image src="/logocar.png" alt="Logo" width={32} height={32} />
            <span
              className="font-bold text-sm text-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              Ai Car Damage Detection
            </span>
          </div>

          {/* MENU */}
          <nav className="flex flex-col gap-2 px-2 py-2 m-2">
            {items
              .filter(it => !(it.href === "/claim")) // ปุ่มนี้เดี๋ยวใช้ใน mobile
              .map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link key={item.href} href={item.href} className="relative block">
                    <div
                      className={[
                        "relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
                        "transition-all duration-300",
                        "hover:bg-white/30",
                        active ? "" : "text-black",
                        // สร้าง "แถบยื่นออก" ทางขวาเมื่อ active
                        active
                          ? "bg-[#6D5BD0] text-white shadow-md"
                          : "",
                        // เพื่อให้ before สามารถยื่นออกนอกรางได้
                        "overflow-visible",
                      ].join(" ")}
                    >
                      {/* แถบยื่นออก (เฉพาะ active) */}
                      {active && (
                        <span
                          className="pointer-events-none absolute right-[-10px] top-1/2 -translate-y-1/2 w-1 h-8 rounded-full"
                          style={{ backgroundColor: BRAND.primary }}
                        />
                      )}
                      <div className="flex items-center justify-center w-6 h-6 text-[#17153B]">
                        {item.icon}
                      </div>
                      <span
                        className={`${bodyFont.className}
                       
                          whitespace-nowrap transition-all duration-300
                          group-hover:opacity-100 opacity-0
                          group-hover:ml-0 ml-[-100px]
                        `}
                        style={{ color: active ? " #17153B " : "#17153B" }}
                      >
                        {item.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
          </nav>

          {/* FOOTER */}
          <div className="mt-auto p-3">
            <div
              className="group/user flex items-center gap-3 p-2 rounded-xl transition-colors duration-300"
              style={{ backgroundColor: "transparent" }}
            >
              <div
                className="p-2 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: BRAND.primary }}
              >
                <User size={18} />
              </div>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
               
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile: Floating Bottom Bar (คงฟังก์ชันเพื่อน แต่โทนสีคุณ) */}
      <nav
        className="
          fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-sm md:hidden
          rounded-full px-4 py-2 flex justify-around items-center z-50 shadow-xl
        "
        style={{ backgroundColor: BRAND.base, color: "#fff" }}
      >
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link key={item.href} href={item.href} className="flex items-center justify-center">
              <div
                title={item.label}
                aria-current={active ? "page" : undefined}
                className={[
                  "p-2 rounded-full transition-all duration-200",
                  active
                    ? "shadow-[0_0_0_3px_rgba(255,255,255,0.15)]"
                    : "",
                  "hover:scale-110",
                ].join(" ")}
                style={{
                  backgroundColor: active ? BRAND.primary : "transparent",
                  outline: active ? `2px solid rgba(255,255,255,0.7)` : "none",
                }}
              >
                {item.icon}
                
              </div>
            </Link>
            
          );
          
        })}
        
      </nav>
    </>
  );
}
