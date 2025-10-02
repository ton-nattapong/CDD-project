"use client";

import React, { useEffect, useState } from "react";
import PdfRequest, { PdfDetail } from "../../PdfRequest";

export default function PdfPage({ params }: { params: { id: string } }) {
  const [detail, setDetail] = useState<PdfDetail | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await fetch(
          `http://localhost:3001/api/claim-requests/detail?claim_id=${params.id}`,
          { credentials: "include" }
        );
        const json = await res.json();

        if (json.ok) {
          const d = json.data;

          const mapped: PdfDetail = {
            claim_id: d.claim_id,
            status: d.status,
            created_at: d.created_at,
            car: {
              id: d.selected_car_id ?? 0, 
              car_brand: d.car_brand,
              car_model: d.car_model,
              car_year: d.car_year,
              car_license_plate: d.license_plate,
              insurance_type: d.insurance_type,
              policy_number: d.policy_number,
              coverage_end_date: d.coverage_end_date,
              insured_name: d.insured_name,
              car_path: d.car_path,
            },
            accident: {
              accidentType: d.accident_type,
              accident_date: d.accident_date,
              accident_time: d.accident_time,
              province: d.province,
              district: d.district,
              road: d.road,
              areaType: d.area_type,
              nearby: d.nearby,
              details: d.details,
              location: {
                lat: parseFloat(d.latitude),
                lng: parseFloat(d.longitude),
              },
              evidenceMedia: d.evidence_file_url
                ? [
                    {
                      id: 0,
                      url: d.evidence_file_url,
                      type: d.media_type,
                    },
                  ]
                : [],
              damagePhotos: (d.damage_images || []).map((img: any) => ({
                id: img.id,
                url: img.original_url,
                note: img.damage_note,
                side: img.side,
              })),
            },
          };

          setDetail(mapped);
        }
      } catch (err) {
        console.error("fetch error:", err);
      }
    }

    fetchDetail();
  }, [params.id]);

  if (!detail) {
    return (
      <div className="p-10 text-center text-zinc-500">กำลังโหลด...</div>
    );
  }

  return <PdfRequest detail={detail} />;
}
