"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  IndianRupee,
  MapPin,
  MessageSquareMore,
  Sparkles,
  UserPlus,
  Users
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  findRoommateMatches,
  getMyRoommateProfile,
  upsertRoommateProfile
} from "@/lib/api/client";
import type { RoommateProfile, RoommateProfileRequestBody } from "@/lib/api/types";
import { useAuthStore } from "@/store/auth-store";

const GENDERS: { value: NonNullable<RoommateProfileRequestBody["genderPreference"]>; label: string }[] = [
  { value: "ANY", label: "Any" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "NON_BINARY", label: "Non-binary" }
];

export default function RoommatesPage() {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const queryClient = useQueryClient();
  const [form, setForm] = useState<RoommateProfileRequestBody>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["roommate-profile-me", accessToken],
    queryFn: async () => {
      try {
        return await getMyRoommateProfile(accessToken ?? undefined);
      } catch (err) {
        // 404 means no profile yet — treat as soft empty.
        const message = err instanceof Error ? err.message : "";
        if (message.includes("404") || /not\s+found/i.test(message) || /no roommate/i.test(message)) {
          return null;
        }
        throw err;
      }
    },
    enabled: Boolean(accessToken)
  });

  const matchesQuery = useQuery({
    queryKey: ["roommate-matches", accessToken],
    queryFn: () => findRoommateMatches(20, accessToken ?? undefined),
    enabled: Boolean(accessToken && profileQuery.data)
  });

  // Whenever a profile loads, copy its values into the form.
  useEffect(() => {
    const me = profileQuery.data;
    if (me) {
      setForm({
        city: me.city,
        preferredAreas: me.preferredAreas ?? "",
        budgetMin: me.budgetMin ?? undefined,
        budgetMax: me.budgetMax ?? undefined,
        moveInDate: me.moveInDate ?? "",
        genderPreference:
          (me.genderPreference as RoommateProfileRequestBody["genderPreference"]) ?? "ANY",
        occupation: me.occupation ?? "",
        smoker: me.smoker,
        drinks: me.drinks,
        petFriendly: me.petFriendly,
        vegetarian: me.vegetarian,
        earlyRiser: me.earlyRiser,
        bio: me.bio ?? ""
      });
    }
  }, [profileQuery.data]);

  const upsert = useMutation({
    mutationFn: () => upsertRoommateProfile(form, accessToken ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roommate-profile-me"] });
      queryClient.invalidateQueries({ queryKey: ["roommate-matches"] });
      setShowForm(false);
    }
  });

  if (!accessToken) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-sm text-ink/60">Sign in to find a roommate.</p>
      </main>
    );
  }

  const me = profileQuery.data ?? null;
  const formOpen = showForm || !me;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
          Roommates
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Find a roommate</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/65">
          Tell us about your lifestyle. We&apos;ll show people in your city whose habits, budget, and
          move-in window line up with yours.
        </p>
      </header>

      {profileQuery.isLoading ? (
        <p className="mt-8 text-sm text-ink/60">Loading your profile…</p>
      ) : (
        <>
          {/* Profile section */}
          <section className="mt-8 rounded-2xl border border-black/8 bg-white p-6 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pine">
                  My profile
                </p>
                {me ? (
                  <h2 className="mt-1 text-xl font-semibold text-ink">
                    {me.fullName} — {me.city}
                  </h2>
                ) : (
                  <h2 className="mt-1 text-xl font-semibold text-ink">
                    No profile yet — let&apos;s create one
                  </h2>
                )}
              </div>
              {me && !formOpen ? (
                <button
                  type="button"
                  className="button-ghost"
                  onClick={() => setShowForm(true)}
                >
                  Edit profile
                </button>
              ) : null}
            </div>

            {formOpen ? (
              <ProfileForm
                form={form}
                setForm={setForm}
                isSubmitting={upsert.isPending}
                onSubmit={() => upsert.mutate()}
                onCancel={me ? () => setShowForm(false) : undefined}
                error={upsert.error instanceof Error ? upsert.error.message : null}
              />
            ) : me ? (
              <ProfileSummary me={me} />
            ) : null}
          </section>

          {/* Matches section */}
          {me ? (
            <section className="mt-10">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                    Matches
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-ink">
                    Compatible roommates in {me.city}
                  </h2>
                </div>
                {matchesQuery.data ? (
                  <span className="text-xs text-ink/55">
                    {matchesQuery.data.totalCount} match
                    {matchesQuery.data.totalCount === 1 ? "" : "es"}
                  </span>
                ) : null}
              </div>

              {matchesQuery.isLoading ? (
                <p className="mt-6 text-sm text-ink/60">Finding matches…</p>
              ) : !matchesQuery.data || matchesQuery.data.items.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-black/12 bg-white/60 px-6 py-12 text-center">
                  <Users className="mx-auto h-10 w-10 text-ink/30" />
                  <p className="mt-3 text-sm font-semibold text-ink">No matches yet</p>
                  <p className="mt-1 text-sm text-ink/55">
                    Either no one in {me.city} has filled in a profile, or none meet your filters
                    yet. Check back soon — new profiles arrive every day.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {matchesQuery.data.items.map((m) => (
                    <MatchCard key={m.profileId} match={m} />
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}

function ProfileSummary({ me }: { me: RoommateProfile }) {
  return (
    <div className="mt-5 grid gap-4 md:grid-cols-3">
      <Pill icon={MapPin} label="City">{me.city}</Pill>
      <Pill icon={IndianRupee} label="Budget">
        {me.budgetMin && me.budgetMax
          ? `₹${me.budgetMin.toLocaleString("en-IN")} – ₹${me.budgetMax.toLocaleString("en-IN")}`
          : "—"}
      </Pill>
      <Pill icon={CalendarClock} label="Move-in">
        {me.moveInDate || "Flexible"}
      </Pill>
      <Pill icon={Sparkles} label="Lifestyle">
        {[
          me.smoker ? "Smoker" : "Non-smoker",
          me.drinks ? "Drinks" : "No alcohol",
          me.vegetarian ? "Vegetarian" : "Non-veg",
          me.petFriendly ? "Pet-friendly" : null,
          me.earlyRiser ? "Early riser" : null
        ]
          .filter(Boolean)
          .join(" · ")}
      </Pill>
      {me.preferredAreas ? (
        <div className="md:col-span-3 rounded-2xl bg-canvas/40 p-4 text-sm text-ink/72">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">
            Preferred areas
          </p>
          <p className="mt-1">{me.preferredAreas}</p>
        </div>
      ) : null}
      {me.bio ? (
        <div className="md:col-span-3 rounded-2xl bg-canvas/40 p-4 text-sm leading-6 text-ink/72">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">Bio</p>
          <p className="mt-1">{me.bio}</p>
        </div>
      ) : null}
    </div>
  );
}

function Pill({
  icon: Icon,
  label,
  children
}: {
  icon: any;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/8 bg-canvas/40 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-copper">
        <Icon className="mr-1.5 inline h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-ink">{children}</p>
    </div>
  );
}

function ProfileForm({
  form,
  setForm,
  isSubmitting,
  onSubmit,
  onCancel,
  error
}: {
  form: RoommateProfileRequestBody;
  setForm: (next: RoommateProfileRequestBody) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel?: () => void;
  error: string | null;
}) {
  const update = (patch: Partial<RoommateProfileRequestBody>) =>
    setForm({ ...form, ...patch });

  return (
    <div className="mt-5 grid gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="field-label">
          City *
          <input
            className="form-control mt-2"
            placeholder="Bengaluru"
            value={form.city}
            onChange={(event) => update({ city: event.target.value })}
          />
        </label>
        <label className="field-label">
          Occupation
          <input
            className="form-control mt-2"
            placeholder="Software engineer"
            value={form.occupation ?? ""}
            onChange={(event) => update({ occupation: event.target.value })}
          />
        </label>
      </div>

      <label className="field-label">
        Preferred areas
        <input
          className="form-control mt-2"
          placeholder="Indiranagar, Koramangala, HSR Layout"
          value={form.preferredAreas ?? ""}
          onChange={(event) => update({ preferredAreas: event.target.value })}
        />
      </label>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="field-label">
          Budget min (₹)
          <input
            type="number"
            className="form-control mt-2"
            placeholder="15000"
            value={form.budgetMin ?? ""}
            onChange={(event) =>
              update({ budgetMin: event.target.value ? Number(event.target.value) : undefined })
            }
          />
        </label>
        <label className="field-label">
          Budget max (₹)
          <input
            type="number"
            className="form-control mt-2"
            placeholder="35000"
            value={form.budgetMax ?? ""}
            onChange={(event) =>
              update({ budgetMax: event.target.value ? Number(event.target.value) : undefined })
            }
          />
        </label>
        <label className="field-label">
          Move-in date
          <input
            type="date"
            className="form-control mt-2"
            value={form.moveInDate ?? ""}
            onChange={(event) => update({ moveInDate: event.target.value })}
          />
        </label>
      </div>

      <label className="field-label">
        Looking for
        <select
          className="form-control mt-2"
          value={form.genderPreference ?? "ANY"}
          onChange={(event) =>
            update({
              genderPreference: event.target.value as RoommateProfileRequestBody["genderPreference"]
            })
          }
        >
          {GENDERS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="rounded-2xl border border-black/8 bg-canvas/30 p-4">
        <legend className="px-2 text-xs font-bold uppercase tracking-[0.18em] text-copper">
          Lifestyle
        </legend>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <Toggle
            label="🚬 I smoke"
            value={form.smoker}
            onChange={(v) => update({ smoker: v })}
          />
          <Toggle
            label="🍺 I drink"
            value={form.drinks}
            onChange={(v) => update({ drinks: v })}
          />
          <Toggle
            label="🥗 Vegetarian"
            value={form.vegetarian}
            onChange={(v) => update({ vegetarian: v })}
          />
          <Toggle
            label="🐶 Pet-friendly"
            value={form.petFriendly}
            onChange={(v) => update({ petFriendly: v })}
          />
          <Toggle
            label="🌅 Early riser"
            value={form.earlyRiser}
            onChange={(v) => update({ earlyRiser: v })}
          />
        </div>
      </fieldset>

      <label className="field-label">
        Short bio
        <textarea
          className="form-control mt-2"
          rows={3}
          placeholder="A bit about you, what kind of roommate you're looking for…"
          maxLength={1500}
          value={form.bio ?? ""}
          onChange={(event) => update({ bio: event.target.value })}
        />
      </label>

      {error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        {onCancel ? (
          <button
            type="button"
            className="button-ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        ) : null}
        <button
          type="button"
          className="button-primary"
          onClick={onSubmit}
          disabled={isSubmitting || !form.city.trim()}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          {isSubmitting ? "Saving…" : "Save profile"}
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm">
      <input
        type="checkbox"
        checked={value}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

function MatchCard({ match }: { match: RoommateProfile }) {
  const score = match.matchScore ?? 0;
  return (
    <article className="rounded-2xl border border-black/8 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-ink">{match.fullName}</h3>
          <p className="text-xs text-ink/55">
            {match.city}
            {match.occupation ? ` · ${match.occupation}` : ""}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
            score >= 50
              ? "bg-emerald-100 text-emerald-700"
              : score >= 30
                ? "bg-amber-100 text-amber-800"
                : "bg-ink/10 text-ink/65"
          }`}
        >
          {score}% match
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {[
          match.smoker ? "🚬 Smoker" : "🚭 Non-smoker",
          match.drinks ? "🍺 Drinks" : "🚫 No alcohol",
          match.vegetarian ? "🥗 Veg" : "🍗 Non-veg",
          match.petFriendly ? "🐶 Pet OK" : null,
          match.earlyRiser ? "🌅 Early" : null
        ]
          .filter(Boolean)
          .map((tag) => (
            <span
              key={tag as string}
              className="rounded-full bg-canvas/60 px-2 py-0.5 text-[10px] font-bold text-ink/60"
            >
              {tag as string}
            </span>
          ))}
      </div>

      {match.budgetMin && match.budgetMax ? (
        <p className="mt-3 text-xs text-ink/55">
          <IndianRupee className="mr-1 inline h-3 w-3" />
          ₹{match.budgetMin.toLocaleString("en-IN")} – ₹
          {match.budgetMax.toLocaleString("en-IN")}/mo
        </p>
      ) : null}

      {match.bio ? (
        <p className="mt-2 line-clamp-3 text-xs leading-5 text-ink/72">{match.bio}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/messages?startWith=${encodeURIComponent(match.userId)}`}
          className="button-secondary text-xs"
        >
          <MessageSquareMore className="mr-1.5 h-3.5 w-3.5" />
          Message
        </Link>
      </div>
    </article>
  );
}

const EMPTY_FORM: RoommateProfileRequestBody = {
  city: "Bengaluru",
  preferredAreas: "",
  budgetMin: undefined,
  budgetMax: undefined,
  moveInDate: "",
  genderPreference: "ANY",
  occupation: "",
  smoker: false,
  drinks: false,
  petFriendly: false,
  vegetarian: false,
  earlyRiser: false,
  bio: ""
};
