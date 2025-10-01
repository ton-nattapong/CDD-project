// src/mappers/accidentDraft.ts
import type { AccidentDraft } from "@/types/claim";

export function mapAccidentDraft(raw: any): AccidentDraft {
  return {
    accidentType: raw.accident_type ?? raw.accidentType ?? "",
    accident_date: raw.accident_date ?? "",
    accident_time: raw.accident_time ?? "",
    province: raw.province ?? null,
    district: raw.district ?? null,
    road: raw.road ?? null,
    areaType: raw.area_type ?? raw.areaType ?? "",   // ✅ map snake → camel
    nearby: raw.nearby ?? null,
    details: raw.details ?? null,
    location: {
      lat: parseFloat(raw.location?.lat ?? "0"),
      lng: parseFloat(raw.location?.lng ?? "0"),
      accuracy: raw.location?.accuracy
        ? parseFloat(raw.location.accuracy)
        : null,
    },
    evidenceMedia: raw.evidenceMedia ?? [],
    damagePhotos: raw.damagePhotos?.map((d: any) => ({
      url: d.url,
      type: d.type,
      note: d.damage_note ?? d.note ?? "", // ✅ map damage_note → note
      side: d.side,
    })) ?? [],
  };
}
