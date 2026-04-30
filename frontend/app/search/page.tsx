import { SearchExperience } from "@/components/sections/search-experience";

export const dynamic = "force-dynamic";

export default function SearchPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const asString = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] ?? "" : value ?? "";

  const city = asString(searchParams.city) || "Bengaluru";
  const query = asString(searchParams.query);
  const budgetMaxValue = asString(searchParams.budgetMax);
  const bhk = asString(searchParams.bhk) || undefined;
  const verifiedValue = asString(searchParams.verified);

  return (
    <SearchExperience
      initialBhk={bhk}
      initialBudgetMax={budgetMaxValue ? Number(budgetMaxValue) : undefined}
      initialCity={city}
      initialQuery={query}
      initialVerified={verifiedValue ? verifiedValue === "true" : undefined}
    />
  );
}
