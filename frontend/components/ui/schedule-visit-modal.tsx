"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarClock, Clock, MapPin, Sparkles, X } from "lucide-react";
import { getVisitSlots, scheduleVisit } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

/**
 * Tier 2 #5 — Property Visit Booking.
 * Tenant picks a date (next 14 days) → sees available slots → confirms.
 *
 * Free for now (no wallet deduction). Phase 2 of this feature can charge
 * owners Rs 49 per confirmed visit; the booking flow doesn't change.
 */
export function ScheduleVisitModal({
  listingId,
  listingTitle,
  listingLocality,
  listingCity,
  onClose,
  onScheduled
}: {
  listingId: string;
  listingTitle: string;
  listingLocality: string;
  listingCity: string;
  onClose: () => void;
  onScheduled: (visit: { visitId: string; slotLabel: string; preferredDate: string }) => void;
}) {
  const accessToken = useAuthStore((state) => state.session?.accessToken);

  // Generate next 14 days starting from today (skips dates in the past).
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const [selectedDate, setSelectedDate] = useState(dates[1]); // start with tomorrow
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const dateIso = selectedDate.toISOString().slice(0, 10);

  const slotsQuery = useQuery({
    queryKey: ["visit-slots", listingId, dateIso, accessToken ?? "guest"],
    queryFn: () => getVisitSlots(listingId, dateIso, accessToken),
    enabled: Boolean(accessToken),
    staleTime: 30_000
  });

  const scheduleMutation = useMutation({
    mutationFn: () => scheduleVisit(
      { propertyId: listingId, slotId: selectedSlotId!, preferredDate: dateIso, notes: notes || undefined },
      accessToken
    ),
    onSuccess: (result) => {
      const slot = slotsQuery.data?.slots.find((s) => s.slotId === selectedSlotId);
      onScheduled({
        visitId: result.visitId,
        slotLabel: slot?.label ?? "",
        preferredDate: dateIso
      });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Could not schedule the visit. Please try again.");
    }
  });

  const slots = slotsQuery.data?.slots ?? [];
  const visitRules = slotsQuery.data?.visitRules ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 backdrop-blur-sm px-4 py-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-soft my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pine/10">
              <CalendarClock className="h-5 w-5 text-pine" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                Schedule a visit
              </p>
              <h2 className="mt-1 font-serif text-2xl text-ink">{listingTitle}</h2>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink/56">
                <MapPin className="h-3.5 w-3.5" />
                {listingLocality}, {listingCity}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-ink/40 hover:bg-sand hover:text-ink"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Date picker — horizontal scroll of the next 14 days */}
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-ink/52">
          Pick a date
        </p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {dates.map((d) => {
            const iso = d.toISOString().slice(0, 10);
            const isSelected = iso === dateIso;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => {
                  setSelectedDate(d);
                  setSelectedSlotId(null);
                }}
                disabled={scheduleMutation.isPending}
                className={`flex-shrink-0 rounded-2xl border-2 px-4 py-3 text-center transition ${
                  isSelected
                    ? "border-pine bg-pine/8"
                    : "border-black/10 bg-white hover:border-black/20"
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/52">
                  {d.toLocaleDateString("en-IN", { weekday: "short" })}
                </p>
                <p className="mt-1 text-2xl font-semibold text-ink">{d.getDate()}</p>
                <p className="text-[10px] text-ink/52">
                  {d.toLocaleDateString("en-IN", { month: "short" })}
                </p>
              </button>
            );
          })}
        </div>

        {/* Slots */}
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-ink/52">
          Available time slots
        </p>
        {slotsQuery.isLoading ? (
          <p className="mt-3 text-sm text-ink/56">Loading available slots…</p>
        ) : slots.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-black/12 bg-white/70 px-4 py-4 text-center text-sm text-ink/56">
            No slots available on this day. Please pick another date.
          </p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {slots.map((slot) => {
              const isSelected = slot.slotId === selectedSlotId;
              return (
                <button
                  key={slot.slotId}
                  type="button"
                  disabled={!slot.available || scheduleMutation.isPending}
                  onClick={() => setSelectedSlotId(slot.slotId)}
                  className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left transition ${
                    !slot.available
                      ? "border-black/8 bg-sand/40 text-ink/30"
                      : isSelected
                        ? "border-pine bg-pine/8 text-pine"
                        : "border-black/10 bg-white text-ink hover:border-black/20"
                  }`}
                >
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-semibold">{slot.label}</span>
                  {!slot.available ? (
                    <span className="ml-auto text-xs text-ink/40">Booked</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

        {/* Notes */}
        <label className="mt-5 block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/52">
            Notes for the owner (optional)
          </span>
          <textarea
            className="form-control mt-2 min-h-[64px]"
            placeholder="Please call 15 minutes before arrival, parking guidance, etc."
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={scheduleMutation.isPending}
          />
        </label>

        {/* Visit rules */}
        {visitRules.length > 0 ? (
          <div className="mt-5 rounded-xl bg-sand/55 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-copper">
              Visit guidelines
            </p>
            <ul className="mt-2 space-y-1">
              {visitRules.map((rule, idx) => (
                <li className="flex gap-2 text-xs text-ink/72" key={idx}>
                  <Sparkles className="mt-0.5 h-3 w-3 flex-shrink-0 text-copper" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="button-primary flex-1"
            disabled={!selectedSlotId || scheduleMutation.isPending}
            onClick={() => scheduleMutation.mutate()}
          >
            {scheduleMutation.isPending ? "Scheduling…" : "Confirm visit"}
          </button>
          <button
            type="button"
            className="button-secondary"
            disabled={scheduleMutation.isPending}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>

        {!selectedSlotId && slots.length > 0 ? (
          <p className="mt-2 text-center text-xs text-ink/52">
            Pick a time slot to enable Confirm.
          </p>
        ) : null}
      </div>
    </div>
  );
}
