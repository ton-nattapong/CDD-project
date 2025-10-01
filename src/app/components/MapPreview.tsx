"use client";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// ✅ ปิด SSR และโหลดเฉพาะ client
const MapNoSSR = dynamic(() => import("./MapInner"), { ssr: false });

export default function MapPreview({ lat, lng }: { lat: number; lng: number }) {
  return <MapNoSSR lat={lat} lng={lng} />;
}
