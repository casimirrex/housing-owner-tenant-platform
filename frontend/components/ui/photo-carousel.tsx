"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Tier 2 — Photo carousel with thumbnail strip + click-to-zoom lightbox.
 *
 * Hero image is large and clickable. Thumbnails below act as a strip; clicking
 * a thumb sets the hero. Clicking the hero opens a fullscreen lightbox with
 * prev/next navigation. Keyboard arrows + Esc work in the lightbox.
 */
export function PhotoCarousel({
  imageUrls,
  alt = "Property photo"
}: {
  imageUrls: string[];
  alt?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  // Reset to first image whenever the source list changes
  useEffect(() => setActiveIndex(0), [imageUrls]);

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (!lightbox) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(false);
      if (event.key === "ArrowLeft") prev();
      if (event.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, activeIndex, imageUrls.length]);

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 text-sm text-oat/55">
        No photos available
      </div>
    );
  }

  const total = imageUrls.length;
  const next = () => setActiveIndex((i) => (i + 1) % total);
  const prev = () => setActiveIndex((i) => (i - 1 + total) % total);

  return (
    <>
      <div className="grid gap-3">
        {/* Hero */}
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="group relative block aspect-[16/10] w-full overflow-hidden rounded-2xl bg-black/10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrls[activeIndex]}
            alt={`${alt} ${activeIndex + 1} of ${total}`}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            loading="lazy"
          />
          {total > 1 ? (
            <>
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-1.5 text-white opacity-0 transition group-hover:opacity-100"
                onClick={(event) => {
                  event.stopPropagation();
                  prev();
                }}
              >
                <ChevronLeft className="h-5 w-5" />
              </span>
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-1.5 text-white opacity-0 transition group-hover:opacity-100"
                onClick={(event) => {
                  event.stopPropagation();
                  next();
                }}
              >
                <ChevronRight className="h-5 w-5" />
              </span>
            </>
          ) : null}
          <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-white">
            {activeIndex + 1} / {total}
          </span>
        </button>

        {/* Thumbnail strip */}
        {total > 1 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {imageUrls.map((src, idx) => (
              <button
                key={`${src}-${idx}`}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  idx === activeIndex
                    ? "border-pine ring-2 ring-pine/40"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
                aria-label={`Show photo ${idx + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Lightbox */}
      {lightbox ? (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 px-4 py-6"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setLightbox(false);
            }}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          {total > 1 ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                prev();
              }}
              className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              aria-label="Previous"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
          ) : null}
          <div
            className="max-h-full max-w-full"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrls[activeIndex]}
              alt={`${alt} ${activeIndex + 1} of ${total}`}
              className="max-h-[90vh] max-w-[92vw] object-contain"
            />
          </div>
          {total > 1 ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                next();
              }}
              className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              aria-label="Next"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          ) : null}
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white">
            {activeIndex + 1} / {total}
          </span>
        </div>
      ) : null}
    </>
  );
}
