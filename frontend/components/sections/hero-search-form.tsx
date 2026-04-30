"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MapPinned, Search, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

const heroSearchSchema = z.object({
  city: z.string().min(2),
  query: z.string().optional()
});

type HeroSearchValues = z.infer<typeof heroSearchSchema>;

export function HeroSearchForm({
  defaultCity,
  placeholder
}: {
  defaultCity: string;
  placeholder: string;
}) {
  const router = useRouter();
  const form = useForm<HeroSearchValues>({
    resolver: zodResolver(heroSearchSchema),
    defaultValues: {
      city: defaultCity,
      query: ""
    }
  });

  const onSubmit = form.handleSubmit((values) => {
    const query = new URLSearchParams({
      city: values.city,
      query: values.query ?? "",
      verified: "true"
    });

    router.push(`/search?${query.toString()}`);
  });

  return (
    <form
      className="section-panel"
      onSubmit={onSubmit}
    >
      <div className="grid gap-4 md:grid-cols-[1.05fr_1.7fr_auto]">
        <label className="soft-panel rounded-[1.5rem]">
          <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-ink/55">
            <MapPinned size={14} />
            City
          </span>
          <input
            className="mt-3 w-full bg-transparent text-lg font-semibold text-ink outline-none"
            placeholder="Bengaluru"
            {...form.register("city")}
          />
        </label>
        <label className="soft-panel rounded-[1.5rem]">
          <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-ink/55">
            <Search size={14} />
            Search
          </span>
          <input
            className="mt-3 w-full bg-transparent text-lg font-semibold text-ink outline-none"
            placeholder={placeholder}
            {...form.register("query")}
          />
        </label>
        <button
          className="button-primary rounded-[1.5rem] px-6 py-4"
          type="submit"
        >
          <Search size={18} />
          Discover
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 px-1">
        <span className="meta-pill">
          <ShieldCheck className="mr-2 h-4 w-4 text-pine" />
          Verified discovery
        </span>
        <span className="meta-pill">City-first search</span>
        <span className="meta-pill">Clear registration flow</span>
      </div>
    </form>
  );
}
