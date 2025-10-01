"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ✅ กำหนด icon เอง (เอาไฟล์ไปไว้ที่ public/leaflet/)
const markerIcon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function MapInner({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={16}
      scrollWheelZoom={true}
      className="h-[300px] w-full rounded-lg"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <Marker position={[lat, lng]} icon={markerIcon}>
        <Popup>ตำแหน่งที่เลือก</Popup>
      </Marker>
    </MapContainer>
  );
}
