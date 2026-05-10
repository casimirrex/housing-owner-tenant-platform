"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Clock, Mail, Phone, Sparkles } from "lucide-react";
import { getOwnerVisits } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";
import { WhatsAppMessageButton } from "@/components/ui/whatsapp-button";
import { visitConfirmMessage } from "@/lib/whatsapp";

/**
 * Tier 2 #5 — Owner-side panel showing visits booked on their listings.
 * Sits on the owner dashboard (above the leads panel).
 *
 * Each visit shows tenant contact + listing + slot + notes so the owner
 * can prepare or follow up.
 */
export function OwnerVisitsPanel() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);

  const visitsQuery = useQuery({
    queryKey: ["owner-visits", accessToken ?? "guest"],
    queryFn: () => getOwnerVisits(accessToken),
    enabled: Boolean(accessToken),
    staleTime: 30_000
  });

  if (visitsQuery.isLoading || !visitsQuery.data) return null;
  const { visits, upcomingCount } = visitsQuery.data;

  return (
    <section className="section-panel mt-8">
      <div className="flex items-center gap-3">
        <CalendarClock className="h-5 w-5 text-copper" />
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
          Property visits
        </p>
        {upcomingCount > 0 ? (
          <span className="rounded-full bg-pine/10 px-2 py-0.5 text-xs font-semibold text-pine">
            {upcomingCount} upcoming
          </span>
        ) : null}
      </div>
      <h2 className="mt-2 text-2xl font-semibold text-ink">
        Visits booked on your listings
      </h2>
      <p className="mt-2 text-sm leading-6 text-ink/68">
        Tenants who&apos;ve scheduled time to see your properties. Confirm or reschedule by
        contacting them directly.
      </p>

      {visits.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-black/12 bg-white/70 px-4 py-6 text-center text-sm text-ink/56">
          No visits booked yet. Tenants on a property page can click &quot;Schedule a
          visit&quot; to book a slot — those bookings appear here.
        </p>
      ) : (
        <div className="mt-5 grid gap-3">
          {visits.map((v) => (
            <div
              key={v.visitId}
              className="rounded-2xl border border-black/8 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{v.tenantName}</p>
                    {v.status === "SCHEDULED" ? (
                      <span className="rounded-full bg-pine/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pine">
                        Scheduled
                      </span>
                    ) : v.status === "COMPLETED" ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        Completed
                      </span>
                    ) : (
                      <span className="rounded-full bg-ink/8 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink/52">
                        {v.status}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-ink/56">
                    For <strong className="text-ink/72">{v.listingTitle}</strong>
                  </p>
                </div>
                <div className="flex flex-col items-end text-xs">
                  <p className="font-semibold text-ink">
                    {new Date(v.preferredDate).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", weekday: "short"
                    })}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-ink/56">
                    <Clock className="h-3 w-3" />
                    {v.slotLabel}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <a
                  href={`mailto:${v.tenantEmail}`}
                  className="inline-flex items-center gap-1 rounded-full bg-pine/8 px-3 py-1 text-pine hover:bg-pine/16"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {v.tenantEmail}
                </a>
                {v.tenantPhone ? (
                  <a
                    href={`tel:${v.tenantPhone}`}
                    className="inline-flex items-center gap-1 rounded-full bg-pine/8 px-3 py-1 text-pine hover:bg-pine/16"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {v.tenantPhone}
                  </a>
                ) : null}
                {v.tenantPhone && v.status === "SCHEDULED" ? (
                  <WhatsAppMessageButton
                    size="sm"
                    label="Confirm on WhatsApp"
                    phone={v.tenantPhone}
                    message={visitConfirmMessage({
                      tenantName: v.tenantName,
                      listingTitle: v.listingTitle,
                      scheduledLabel: `${new Date(v.preferredDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "short" })} ${v.slotLabel}`
                    })}
                  />
                ) : null}
              </div>

              {v.notes ? (
                <div className="mt-3 rounded-xl bg-sand/55 p-3">
                  <p className="flex items-start gap-2 text-sm leading-6 text-ink/72">
                    <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-copper" />
                    <span className="italic">&ldquo;{v.notes}&rdquo;</span>
                  </p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
