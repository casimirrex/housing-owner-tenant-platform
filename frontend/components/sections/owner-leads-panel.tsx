"use client";

import { useQuery } from "@tanstack/react-query";
import { Inbox, Mail, Phone, Sparkles } from "lucide-react";
import { getOwnerLeads } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";
import { WhatsAppMessageButton } from "@/components/ui/whatsapp-button";
import { ownerReplyMessage } from "@/lib/whatsapp";

/**
 * Tier 1 #3 — Owner-side inbox of paid leads from tenants.
 * Each row = one tenant who paid Rs 49 to express interest in a listing.
 * Includes tenant contact details so the owner can follow up.
 */
export function OwnerLeadsPanel() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);

  const leadsQuery = useQuery({
    queryKey: ["owner-leads", accessToken ?? "guest"],
    queryFn: () => getOwnerLeads(accessToken),
    enabled: Boolean(accessToken),
    staleTime: 30_000
  });

  if (leadsQuery.isLoading || !leadsQuery.data) return null;
  const { leads, newCount } = leadsQuery.data;

  return (
    <section className="section-panel mt-8">
      <div className="flex items-center gap-3">
        <Inbox className="h-5 w-5 text-copper" />
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
          Tenant leads
        </p>
        {newCount > 0 ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            {newCount} new
          </span>
        ) : null}
      </div>
      <h2 className="mt-2 text-2xl font-semibold text-ink">
        Tenants who expressed paid interest
      </h2>
      <p className="mt-2 text-sm leading-6 text-ink/68">
        Each tenant paid Rs 49 to send a lead — high-intent, ready to talk.
      </p>

      {leads.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-black/12 bg-white/70 px-4 py-6 text-center text-sm text-ink/56">
          No leads yet. Once tenants click &quot;Express Interest&quot; on your listings, they
          appear here with their contact details.
        </p>
      ) : (
        <div className="mt-5 grid gap-3">
          {leads.map((lead) => (
            <div
              key={lead.leadId}
              className="rounded-2xl border border-black/8 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{lead.tenantName}</p>
                    {lead.status === "NEW" ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        New
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-ink/56">
                    Interested in <strong className="text-ink/72">{lead.listingTitle}</strong>
                  </p>
                </div>
                <span className="text-xs text-ink/52">
                  {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                  })}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                <a
                  href={`mailto:${lead.tenantEmail}`}
                  className="inline-flex items-center gap-1 rounded-full bg-pine/8 px-3 py-1 text-pine hover:bg-pine/16"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {lead.tenantEmail}
                </a>
                {lead.tenantPhone ? (
                  <a
                    href={`tel:${lead.tenantPhone}`}
                    className="inline-flex items-center gap-1 rounded-full bg-pine/8 px-3 py-1 text-pine hover:bg-pine/16"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {lead.tenantPhone}
                  </a>
                ) : null}
                {lead.tenantPhone ? (
                  <WhatsAppMessageButton
                    size="sm"
                    label="Reply on WhatsApp"
                    phone={lead.tenantPhone}
                    message={ownerReplyMessage({
                      tenantName: lead.tenantName,
                      listingTitle: lead.listingTitle
                    })}
                  />
                ) : null}
              </div>

              {lead.message ? (
                <div className="mt-3 rounded-xl bg-sand/55 p-3">
                  <p className="flex items-start gap-2 text-sm leading-6 text-ink/72">
                    <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-copper" />
                    <span className="italic">&ldquo;{lead.message}&rdquo;</span>
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
