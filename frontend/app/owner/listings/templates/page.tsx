"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, FileText, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import {
  createListingTemplate,
  deleteListingTemplate,
  listListingTemplates
} from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

/**
 * /owner/listings/templates — CRUD for reusable listing drafts.
 * Templates are stored as free-form JSON so an owner can capture whatever
 * subset of listing fields they want and replay them later.
 */
export default function ListingTemplatesPage() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const queryClient = useQueryClient();
  const [openModal, setOpenModal] = useState(false);
  const [name, setName] = useState("");
  const [payload, setPayload] = useState(EXAMPLE_PAYLOAD);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["listing-templates", accessToken],
    queryFn: () => listListingTemplates(accessToken ?? undefined),
    enabled: Boolean(accessToken)
  });

  const create = useMutation({
    mutationFn: () =>
      createListingTemplate(
        { name: name.trim(), payloadJson: payload.trim() },
        accessToken ?? undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listing-templates"] });
      setOpenModal(false);
      setName("");
      setPayload(EXAMPLE_PAYLOAD);
    }
  });

  const remove = useMutation({
    mutationFn: (templateId: string) =>
      deleteListingTemplate(templateId, accessToken ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listing-templates"] });
    }
  });

  const copy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            Listing tools
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Listing templates</h1>
          <p className="mt-2 text-sm text-ink/65">
            Save repeated fields once, paste them into the Create-listing form to skip retyping.
          </p>
        </div>
        <button className="button-primary" onClick={() => setOpenModal(true)} type="button">
          <Plus className="mr-2 h-4 w-4" /> New template
        </button>
      </header>

      {isLoading ? (
        <p className="mt-8 text-sm text-ink/60">Loading…</p>
      ) : error ? (
        <p className="mt-8 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error instanceof Error ? error.message : "Could not load templates"}
        </p>
      ) : !data || data.items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-black/12 bg-white/60 px-6 py-16 text-center">
          <FileText className="mx-auto h-10 w-10 text-ink/30" />
          <p className="mt-3 text-sm font-semibold text-ink">No templates yet</p>
          <p className="mt-1 text-sm text-ink/55">
            Save a template once, reuse it for every similar listing.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {data.items.map((tpl) => (
            <article
              key={tpl.templateId}
              className="rounded-2xl border border-black/8 bg-white p-5 shadow-soft"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-ink">{tpl.name}</h3>
                  <p className="mt-1 text-xs text-ink/55">Saved {tpl.createdAt}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => copy(tpl.templateId, tpl.payloadJson)}
                    className="button-ghost text-xs"
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    {copiedId === tpl.templateId ? "Copied!" : "Copy JSON"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete template "${tpl.name}"?`)) {
                        remove.mutate(tpl.templateId);
                      }
                    }}
                    disabled={remove.isPending}
                    className="button-ghost text-xs text-rose-700"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
              <pre className="mt-3 max-h-56 overflow-auto rounded-xl bg-canvas/60 p-3 text-[11px] leading-5 text-ink/72">
                {prettyJson(tpl.payloadJson)}
              </pre>
            </article>
          ))}
        </div>
      )}

      {openModal ? (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-[24px] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                  New template
                </p>
                <h3 className="mt-1 text-xl font-semibold text-ink">Save a reusable draft</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="rounded-full p-1 text-ink/40 hover:bg-black/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="field-label mt-5 block">
              Template name
              <input
                className="form-control mt-2"
                placeholder="e.g. 2BHK · Indiranagar · Semi-furnished"
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>

            <label className="field-label mt-4 block">
              Payload (JSON of any fields you want to save)
              <textarea
                className="form-control mt-2 font-mono text-xs"
                rows={12}
                value={payload}
                onChange={(event) => setPayload(event.target.value)}
              />
              <span className="mt-1 block text-xs text-ink/50">
                Tip: copy this JSON into the Create-listing form to prefill fields.
              </span>
            </label>

            {create.error ? (
              <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {create.error instanceof Error ? create.error.message : "Could not save"}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="button-ghost"
                onClick={() => setOpenModal(false)}
                disabled={create.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button-primary"
                onClick={() => create.mutate()}
                disabled={
                  create.isPending ||
                  name.trim().length < 2 ||
                  !looksLikeJson(payload)
                }
              >
                {create.isPending ? "Saving…" : "Save template"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function prettyJson(input: string): string {
  try {
    return JSON.stringify(JSON.parse(input), null, 2);
  } catch {
    return input;
  }
}

function looksLikeJson(input: string): boolean {
  try {
    JSON.parse(input);
    return true;
  } catch {
    return false;
  }
}

const EXAMPLE_PAYLOAD = `{
  "propertyType": "APARTMENT",
  "city": "Bengaluru",
  "locality": "Indiranagar",
  "bhk": "2BHK",
  "rent": 38000,
  "deposit": 76000,
  "furnishing": "Semi-furnished",
  "amenities": ["Parking", "Power Backup", "Lift"],
  "lat": 12.9716,
  "lng": 77.5946
}`;
