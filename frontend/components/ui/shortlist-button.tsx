"use client";

import { useMutation } from "@tanstack/react-query";
import { saveProperty, removeSavedProperty } from "@/lib/api/client";

export function ShortlistButton({ propertyId }: { propertyId: string }) {
  const mutation = useMutation({
    mutationFn: async (saved: boolean) => {
      return saved ? removeSavedProperty(propertyId) : saveProperty(propertyId);
    }
  });

  const saved = mutation.data && "saved" in mutation.data ? mutation.data.saved : false;

  return (
    <button
      className={saved ? "button-accent w-full" : "button-secondary w-full"}
      disabled={mutation.isPending}
      onClick={() => mutation.mutate(saved)}
      type="button"
    >
      {mutation.isPending ? "Saving..." : saved ? "Saved to shortlist" : "Save listing"}
    </button>
  );
}
