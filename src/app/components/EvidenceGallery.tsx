"use client";

import React, { useEffect, useMemo, useState } from "react";

export type MediaItem = { url: string; type?: "image" | "video"; publicId?: string };

type Props = {
  media: (string | MediaItem)[];
  title?: string;
  thumbWidth?: number;
  className?: string;
};

const asMediaItem = (m: string | MediaItem): MediaItem =>
  typeof m === "string" ? { url: m } : m;

const isVideo = (m: MediaItem) =>
  m.type === "video" || /\.(mp4|mov|webm|ogg)$/i.test(m.url);

const makeThumb = (url: string, w = 800) =>
  url.includes("/upload/")
    ? url.replace("/upload/", `/upload/f_auto,q_auto,w_${w}/`)
    : url;

export default function EvidenceGallery({
  media,
  title = "ภาพความเสียหาย",
  thumbWidth = 800,
  className = "",
}: Props) {
  const items = useMemo(() => (media || []).map(asMediaItem), [media]);

  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (!items.length) return;
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % items.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, items.length]);

  if (!items.length) {
    return <div className="text-sm text-zinc-500">ไม่มีไฟล์แนบ</div>;
  }

  // ภาพแรกใหญ่
  const [first, ...rest] = items;

  return (
    <section className={className}>
      <div className="grid grid-cols-2 gap-2">
        {/* ซ้าย: ภาพใหญ่ */}
        <button
          type="button"
          onClick={() => {
            setIndex(0);
            setOpen(true);
          }}
          className="relative col-span-1 row-span-2 overflow-hidden rounded-lg"
        >
          {isVideo(first) ? (
            <video
              src={first.url}
              className="h-full w-full object-cover border-1 "
              controls
            />
          ) : (
            <img
              src={makeThumb(first.url, thumbWidth)}
              alt="main"
              className="h-full w-full object-cover border-1"
            />
          )}
        </button>

        {/* ขวา: 4 ภาพเล็ก */}
        <div className="grid grid-cols-2 gap-2 ">
          {rest.slice(0, 4).map((m, i) => (
            <button
              type="button"
              key={i}
              onClick={() => {
                setIndex(i + 1);
                setOpen(true);
              }}
              className="relative overflow-hidden rounded-lg"
            >
              {isVideo(m) ? (
                <video
                  src={m.url}
                  className="h-full w-full object-cover border-1"
                  controls
                />
              ) : (
                <img
                  src={makeThumb(m.url, thumbWidth)}
                  alt={`thumb-${i}`}
                  className="h-full w-full object-cover border-1"
                />
              )}

              {/* overlay ถ้ามีเกิน 5 รูป */}
              {i === 3 && rest.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-lg font-semibold">
                  +{rest.length - 4}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* modal viewer ของคุณ (เดิม) */}
      {open && items[index] && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 sm:p-8"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative mx-auto max-w-6xl w-full max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white text-xl"
            >
              ✕
            </button>

            {/* arrows */}
            {items.length > 1 && (
              <>
                <button
                  onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 px-3 py-2 text-white/90 hover:text-white"
                >
                  ‹
                </button>
                <button
                  onClick={() => setIndex((i) => (i + 1) % items.length)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 px-3 py-2 text-white/90 hover:text-white"
                >
                  ›
                </button>
              </>
            )}

            <div className="grid place-items-center">
              {isVideo(items[index]) ? (
                <video
                  src={items[index].url}
                  controls
                  className="mx-auto max-h-[80vh] max-w-[90vw] object-contain rounded-lg"
                />
              ) : (
                <img
                  src={items[index].url}
                  alt="evidence"
                  className="mx-auto max-h-[80vh] max-w-[90vw] object-contain rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
