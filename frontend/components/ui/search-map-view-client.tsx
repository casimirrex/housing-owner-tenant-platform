"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import Link from "next/link";
import type { SearchMapPin } from "@/lib/api/types";

/**
 * Map view of search results — used by SearchMapView via next/dynamic to
 * avoid SSR (Leaflet touches `window` at import time).
 *
 * Custom HTML/CSS pins ("₹32k") are used instead of default Leaflet icons,
 * so we don't need to deal with Leaflet's broken default-marker URL paths
 * under Webpack.
 */
export default function SearchMapViewClient({
  pins,
  city
}: {
  pins: SearchMapPin[];
  city: string;
}) {
  // Centre the map on the city; if pins exist, prefer the first pin's coords.
  const center = useMemo<[number, number]>(() => {
    if (pins.length > 0) return [pins[0].lat, pins[0].lng];
    return CITY_CENTERS[city] ?? CITY_CENTERS.Bengaluru;
  }, [pins, city]);

  return (
    <div className="overflow-hidden rounded-[24px] border border-black/8 shadow-soft">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom
        style={{ height: "640px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pins.map((pin) => (
          <Marker
            key={pin.listingId}
            position={[pin.lat, pin.lng]}
            icon={buildPriceIcon(pin)}
          >
            <Popup>
              <div className="min-w-[200px]">
                <p className="text-sm font-semibold text-ink line-clamp-2">{pin.title}</p>
                <p className="mt-1 text-xs text-ink/60">{pin.locality}</p>
                <p className="mt-2 text-base font-semibold text-pine">
                  ₹{pin.rent.toLocaleString("en-IN")}/mo
                </p>
                {pin.verified ? (
                  <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    ✓ Verified
                  </p>
                ) : null}
                <Link
                  href={`/properties/${pin.listingId}`}
                  className="mt-3 inline-block rounded-full bg-pine px-3 py-1.5 text-xs font-semibold text-white hover:bg-pine/90"
                >
                  View property
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
        <FitBoundsToPins pins={pins} fallbackCenter={center} />
      </MapContainer>
    </div>
  );
}

/* ── Helper: re-fit bounds when pins change ──────────────────────────── */
function FitBoundsToPins({
  pins,
  fallbackCenter
}: {
  pins: SearchMapPin[];
  fallbackCenter: [number, number];
}) {
  const map = useMap();
  useEffect(() => {
    if (pins.length === 0) {
      map.setView(fallbackCenter, 12);
      return;
    }
    if (pins.length === 1) {
      map.setView([pins[0].lat, pins[0].lng], 14);
      return;
    }
    const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [pins, fallbackCenter, map]);
  return null;
}

/* ── Pin icon: rounded pill with rent like "₹32k" ────────────────────── */
function buildPriceIcon(pin: SearchMapPin): L.DivIcon {
  const label = formatRentShort(pin.rent);
  const verifiedClass = pin.verified ? "border-emerald-500" : "border-pine";
  const html = `
    <div class="map-price-pin">
      <div class="rounded-full bg-pine px-2.5 py-1 text-xs font-bold text-white shadow-soft border-2 ${verifiedClass}">
        ${label}
      </div>
    </div>
  `;
  return L.divIcon({
    className: "map-price-pin-wrapper",
    html,
    iconSize: [60, 30],
    iconAnchor: [30, 30]
  });
}

function formatRentShort(rent: number): string {
  if (rent >= 100_000) return `₹${(rent / 100_000).toFixed(1)}L`;
  if (rent >= 1_000) return `₹${Math.round(rent / 1_000)}k`;
  return `₹${rent}`;
}

const CITY_CENTERS: Record<string, [number, number]> = {
  Bengaluru: [12.9716, 77.5946],
  Pune: [18.5204, 73.8567],
  Hyderabad: [17.385, 78.4867],
  "NCR-Delhi": [28.6139, 77.209],
  Chennai: [13.0827, 80.2707]
};
