"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { blockUser } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

/**
 * Inline "Block user" button — used inside the chat thread header. Confirms
 * via window.confirm to keep the surface small. After a successful block we
 * invalidate the chat thread list so the now-blocked thread disappears from
 * the UI immediately.
 */
export function BlockUserButton({
  blockedUserId,
  blockedUserName
}: {
  blockedUserId: string;
  blockedUserName?: string;
}) {
  const accessToken = useAuthStore((state) => state.session?.accessToken);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => blockUser({ userId: blockedUserId }, accessToken ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-threads"] });
      queryClient.invalidateQueries({ queryKey: ["user-blocks"] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Could not block user.");
    }
  });

  if (!accessToken) return null;

  const handleClick = () => {
    const confirmed = window.confirm(
      `Block ${blockedUserName ?? "this user"}? They won't be able to see your conversations or new messages.`
    );
    if (confirmed) {
      setError(null);
      mutation.mutate();
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={mutation.isPending}
        className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
        title="Block user"
      >
        {mutation.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ShieldAlert className="h-3.5 w-3.5" />
        )}
        Block
      </button>
      {error ? (
        <span className="text-[10px] text-rose-700">{error}</span>
      ) : null}
    </div>
  );
}
