"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Inbox,
  MessageSquareMore,
  Send,
  User
} from "lucide-react";
import {
  fetchChatMessages,
  listChatThreads,
  markThreadRead,
  sendChatMessage
} from "@/lib/api/client";
import { BlockUserButton } from "@/components/ui/block-user-button";
import { useAuthStore } from "@/store/auth-store";

const POLL_INTERVAL_MS = 5_000;

/**
 * Tier 2 #6 — In-app chat experience (polling-based).
 *
 * Two-pane layout:
 *   • Left: list of threads for the signed-in user (works for tenant or owner)
 *   • Right: messages of the selected thread + composer
 *
 * Polls /api/v1/chat/threads/{threadId}/messages every 5 seconds while a
 * thread is open. Marks messages as read on open. No WebSocket used —
 * simplicity over real-time.
 */
export function MessagesExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();

  const activeThreadId = searchParams.get("thread");

  /* ── Threads list ───────────────────────────────────────────────────── */
  const threadsQuery = useQuery({
    queryKey: ["chat-threads", accessToken ?? "guest"],
    queryFn: () => listChatThreads(accessToken),
    enabled: Boolean(accessToken),
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: POLL_INTERVAL_MS / 2
  });

  /* ── Messages for active thread (polled) ────────────────────────────── */
  const messagesQuery = useQuery({
    queryKey: ["chat-messages", activeThreadId, accessToken ?? "guest"],
    queryFn: () => fetchChatMessages(activeThreadId!, accessToken),
    enabled: Boolean(accessToken && activeThreadId),
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: POLL_INTERVAL_MS / 2
  });

  /* ── Mark thread as read when it opens ──────────────────────────────── */
  useEffect(() => {
    if (!accessToken || !activeThreadId) return;
    markThreadRead(activeThreadId, accessToken)
      .then(() => {
        // Refresh the threads list so the unread badge clears.
        queryClient.invalidateQueries({ queryKey: ["chat-threads", accessToken] });
      })
      .catch(() => {
        // Silent — read-marking is best-effort.
      });
  }, [activeThreadId, accessToken, queryClient]);

  /* ── Compose + send ─────────────────────────────────────────────────── */
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const sendMutation = useMutation({
    mutationFn: () => sendChatMessage(activeThreadId!, draft.trim(), accessToken),
    onSuccess: () => {
      setDraft("");
      setSendError(null);
      // Refetch messages + threads (to update last preview)
      queryClient.invalidateQueries({ queryKey: ["chat-messages", activeThreadId, accessToken] });
      queryClient.invalidateQueries({ queryKey: ["chat-threads", accessToken] });
      composerRef.current?.focus();
    },
    onError: (err) => {
      setSendError(err instanceof Error ? err.message : "Could not send message.");
    }
  });

  const handleSend = () => {
    if (!draft.trim() || !activeThreadId || sendMutation.isPending) return;
    sendMutation.mutate();
  };

  /* ── Auto-scroll to bottom when new messages arrive ─────────────────── */
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
  const messageCount = messagesQuery.data?.messages.length ?? 0;
  useEffect(() => {
    const el = messagesScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messageCount, activeThreadId]);

  /* ── Active thread metadata (for header) ────────────────────────────── */
  const activeThread = useMemo(() => {
    return threadsQuery.data?.find((t) => t.threadId === activeThreadId) ?? null;
  }, [threadsQuery.data, activeThreadId]);

  /* ── Unauthenticated ────────────────────────────────────────────────── */
  if (!session) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <section className="hero-panel px-8 py-10 text-center">
          <span className="eyebrow-pill">Messages</span>
          <h1 className="mt-5 font-serif text-4xl text-oat md:text-5xl">
            Sign in to see your messages
          </h1>
          <p className="mt-4 text-base leading-7 text-oat/76">
            Tenants chat with property owners directly. Sign in to start a
            conversation or check replies on your existing threads.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link className="button-accent" href="/account/login">Sign in</Link>
            <Link className="button-secondary" href="/account/register">Create account</Link>
          </div>
        </section>
      </main>
    );
  }

  const threads = threadsQuery.data ?? [];

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Back to search
          </Link>
          <h1 className="mt-3 font-serif text-3xl text-ink md:text-4xl">Messages</h1>
          <p className="mt-2 text-sm text-ink/68">
            Conversations between you and {session.role === "OWNER" ? "tenants" : "owners"}.
            Chat updates every few seconds while this tab is open.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[340px_1fr]">
        {/* ── Thread list ──────────────────────────────────────────── */}
        <aside className="section-panel max-h-[640px] overflow-y-auto">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-copper" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
              Inbox ({threads.length})
            </p>
          </div>

          {threads.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-black/12 bg-white/70 px-4 py-6 text-center text-sm text-ink/56">
              {session.role === "OWNER"
                ? "No tenants have messaged you yet. When they do, threads appear here."
                : "No conversations yet. Open a property and click 'Message owner' to start one."}
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {threads.map((t) => {
                const isActive = t.threadId === activeThreadId;
                return (
                  <li key={t.threadId}>
                    <button
                      type="button"
                      onClick={() => router.push(`/messages?thread=${encodeURIComponent(t.threadId)}`)}
                      className={`w-full rounded-2xl border p-3 text-left transition ${
                        isActive
                          ? "border-pine bg-pine/8"
                          : "border-black/8 bg-white hover:border-black/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-ink truncate">
                          {t.counterpartyName}
                        </p>
                        {t.unreadCount > 0 ? (
                          <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            {t.unreadCount}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[11px] text-ink/52">
                        About: <span className="text-ink/72">{t.listingTitle}</span>
                      </p>
                      <p className="mt-2 line-clamp-1 text-xs text-ink/68">
                        {t.lastMessagePreview ?? <span className="italic text-ink/40">No messages yet</span>}
                      </p>
                      {t.lastMessageAt ? (
                        <p className="mt-1 text-[10px] text-ink/44">
                          {new Date(t.lastMessageAt).toLocaleString("en-IN", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                          })}
                        </p>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* ── Chat panel ───────────────────────────────────────────── */}
        <section className="section-panel flex max-h-[640px] flex-col">
          {!activeThreadId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
              <MessageSquareMore className="h-10 w-10 text-ink/24" />
              <p className="text-sm text-ink/56">
                Pick a conversation from the inbox to start reading.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <header className="flex items-start justify-between gap-3 border-b border-black/8 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
                    Conversation
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-ink">
                    {activeThread?.counterpartyName ?? "Loading…"}
                  </h2>
                  <p className="mt-0.5 text-xs text-ink/56">
                    About:{" "}
                    {activeThread ? (
                      <Link
                        href={`/properties/${activeThread.listingId}`}
                        className="font-semibold text-pine hover:underline"
                      >
                        {activeThread.listingTitle}
                      </Link>
                    ) : "—"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="rounded-full bg-pine/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-pine">
                    {activeThread?.myRole === "OWNER" ? "Owner view" : "Tenant view"}
                  </span>
                  {activeThread ? (
                    <BlockUserButton
                      blockedUserId={activeThread.counterpartyId}
                      blockedUserName={activeThread.counterpartyName}
                    />
                  ) : null}
                </div>
              </header>

              {/* Messages */}
              <div
                ref={messagesScrollRef}
                className="flex-1 space-y-3 overflow-y-auto py-4"
              >
                {messagesQuery.isLoading ? (
                  <p className="text-center text-sm text-ink/52">Loading messages…</p>
                ) : messageCount === 0 ? (
                  <p className="rounded-xl border border-dashed border-black/12 bg-white/70 px-4 py-8 text-center text-sm text-ink/56">
                    No messages yet. Send the first one to get the conversation going.
                  </p>
                ) : (
                  messagesQuery.data!.messages.map((m) => (
                    <div
                      key={m.messageId}
                      className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${
                          m.fromMe
                            ? "bg-pine text-white"
                            : "bg-sand/70 text-ink"
                        }`}
                      >
                        {!m.fromMe ? (
                          <p className="mb-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider opacity-72">
                            <User className="h-3 w-3" />
                            {m.senderName}
                          </p>
                        ) : null}
                        <p className="whitespace-pre-wrap break-words leading-relaxed">
                          {m.content}
                        </p>
                        <p
                          className={`mt-1 text-[10px] ${
                            m.fromMe ? "text-white/72" : "text-ink/44"
                          }`}
                        >
                          {new Date(m.sentAt).toLocaleString("en-IN", {
                            hour: "2-digit", minute: "2-digit",
                            day: "numeric", month: "short"
                          })}
                          {m.fromMe ? (
                            <span className="ml-1.5">{m.read ? "· Read" : "· Sent"}</span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Composer */}
              <div className="border-t border-black/8 pt-4">
                <textarea
                  ref={composerRef}
                  className="form-control min-h-[64px] resize-none"
                  placeholder="Write a message… (Enter to send, Shift+Enter for newline)"
                  maxLength={1000}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={sendMutation.isPending}
                />
                {sendError ? (
                  <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {sendError}
                  </p>
                ) : null}
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-ink/44">
                    {draft.length}/1000 characters
                  </p>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!draft.trim() || sendMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white hover:bg-pine/90 disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    {sendMutation.isPending ? "Sending…" : "Send"}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
