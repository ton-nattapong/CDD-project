"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// ✅ ฟังก์ชันแก้บั๊ก container ขนาดผิด
function FixMapSize() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }, [map]);
  return null;
}

export default function MapInner({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={true}
      style={{ height: "300px", width: "100%", zIndex: 0 }}
      className="rounded-lg"
    >
      <FixMapSize />

      {/* ✅ ใช้ OSM มาตรฐาน */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        subdomains={["a", "b", "c"]}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      <Marker position={[lat, lng]} icon={markerIcon}>
        <Popup>ตำแหน่งที่เลือก</Popup>
      </Marker>
    </MapContainer>
  );
}
