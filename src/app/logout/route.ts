// app/logout/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.redirect(new URL("/page", process.env.NEXT_PUBLIC_URL_PREFIX || "http://localhost:3000"));

  // เคลียร์ cookie token
  res.cookies.set("token", "", { expires: new Date(0), path: "/" });

  return res;
}
