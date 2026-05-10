/**
 * Phase A WhatsApp helpers — click-to-WhatsApp ("wa.me") integration.
 *
 * No vendor cost, no API key. We generate a plain `https://wa.me/<phone>?text=<msg>`
 * deep link; the user's WhatsApp opens with the message pre-filled.
 *
 * Two flavours of buttons exist:
 *   - WhatsAppMessageButton  — needs a phone number (e.g. tenant ↔ owner)
 *   - WhatsAppShareButton    — no phone, just shares a URL via wa.me
 *
 * This file is the source of truth for both — every component uses these
 * helpers so message tone stays consistent across the app.
 */

const SITE_URL =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "https://testition.tech";

/**
 * Optional platform-wide support number. Set NEXT_PUBLIC_SUPPORT_WHATSAPP
 * to e.g. `+919876543210` (with country code) and the footer button uses
 * it. If unset, the button hides itself.
 */
export const SUPPORT_WHATSAPP =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP : undefined;

/**
 * Normalise an India phone number into the wa.me format (digits only,
 * country code prefixed). Accepts `+91 98xxxxxxxx`, `91-98xxxxxxxx`,
 * `98xxxxxxxx`, `(+91) 98xxxxxxxx`, etc.
 *
 * Returns null if we can't safely route — caller should hide the button.
 */
export function normalizePhoneForWa(phone: string | null | undefined): string | null {
  if (!phone) return null;
  // Strip everything except digits.
  const digits = phone.replace(/\D+/g, "");
  if (!digits) return null;
  // wa.me wants no leading + and country code included.
  if (digits.length === 10) return "91" + digits;
  if (digits.startsWith("91") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 11) return "91" + digits.slice(1);
  // Unknown format — bail.
  return null;
}

/**
 * True if the phone string is masked (e.g. "98XXXXX210") and therefore
 * can't be routed to WhatsApp. Used by callers to decide whether to
 * render the button at all.
 */
export function isMaskedPhone(phone: string | null | undefined): boolean {
  if (!phone) return true;
  return /[xX*]/.test(phone);
}

/**
 * Build a click-to-WhatsApp deep link.
 *
 * - When `phone` is provided, opens directly to that contact.
 * - When omitted, opens WhatsApp's "share to anyone" picker — useful for
 *   sharing a property link with a friend.
 *
 * The `text` is URL-encoded internally; pass the raw human string.
 */
export function whatsappLink(text: string, phone?: string | null): string {
  const encoded = encodeURIComponent(text);
  if (!phone) return `https://wa.me/?text=${encoded}`;
  const cleaned = normalizePhoneForWa(phone);
  if (!cleaned) return `https://wa.me/?text=${encoded}`;
  return `https://wa.me/${cleaned}?text=${encoded}`;
}

/* ── Message templates per surface ───────────────────────────────────── */

export function inquiryMessage(opts: {
  title: string;
  locality: string;
  city: string;
  rent: number;
  listingId: string;
}): string {
  const url = `${SITE_URL}/properties/${opts.listingId}`;
  return (
    `Hi! I'm interested in "${opts.title}" at ${opts.locality}, ${opts.city} (₹${opts.rent.toLocaleString("en-IN")}/mo).` +
    `\n\nIs it still available? Could we schedule a visit?\n\n${url}\n— via testition.tech`
  );
}

export function shareListingMessage(opts: {
  title: string;
  locality: string;
  city: string;
  rent: number;
  listingId: string;
}): string {
  const url = `${SITE_URL}/properties/${opts.listingId}`;
  return (
    `Found this rental — what do you think?\n\n` +
    `🏠 ${opts.title}\n📍 ${opts.locality}, ${opts.city}\n💰 ₹${opts.rent.toLocaleString("en-IN")}/mo\n\n${url}`
  );
}

export function shareSearchMessage(city: string, count?: number): string {
  const url = `${SITE_URL}/search?city=${encodeURIComponent(city)}`;
  const intro = count != null ? `Found ${count} rentals in ${city}` : `Browse rentals in ${city}`;
  return `${intro} on testition.tech:\n\n${url}`;
}

export function shareShortlistMessage(items: { title: string; rent: number }[]): string {
  const lines = items
    .slice(0, 5)
    .map((it) => `• ${it.title} — ₹${it.rent.toLocaleString("en-IN")}/mo`)
    .join("\n");
  const more = items.length > 5 ? `\n…and ${items.length - 5} more` : "";
  return `Here are the homes I'm shortlisting:\n\n${lines}${more}\n\nvia testition.tech`;
}

export function shareCompareMessage(titles: string[]): string {
  const list = titles.map((t) => `• ${t}`).join("\n");
  return `Comparing these homes — what do you think?\n\n${list}\n\nvia testition.tech`;
}

export function ownerReplyMessage(opts: { tenantName: string; listingTitle: string }): string {
  return (
    `Hi ${opts.tenantName}, thanks for your interest in "${opts.listingTitle}". ` +
    `I'm the owner — would you like to schedule a visit? Reply with a date that works for you.`
  );
}

export function visitConfirmMessage(opts: {
  tenantName: string;
  listingTitle: string;
  scheduledLabel: string;
}): string {
  return (
    `Hi ${opts.tenantName}, confirming your visit to "${opts.listingTitle}" on ${opts.scheduledLabel}. ` +
    `See you then. Reply here if you need to reschedule.`
  );
}

export function tenantContactOwnerMessage(opts: {
  ownerName: string;
  listingTitle: string;
  visitLabel?: string;
}): string {
  if (opts.visitLabel) {
    return (
      `Hi ${opts.ownerName || "there"}, this is regarding our scheduled visit to "${opts.listingTitle}" ` +
      `on ${opts.visitLabel}. Could you confirm directions / parking?`
    );
  }
  return (
    `Hi ${opts.ownerName || "there"}, I had reached out about "${opts.listingTitle}". ` +
    `Wanted to follow up — when can I see the place?`
  );
}

export function continueOnWhatsAppMessage(opts: {
  counterpartyName: string;
  listingTitle: string;
}): string {
  return (
    `Hi ${opts.counterpartyName}, continuing our chat about "${opts.listingTitle}" here on WhatsApp ` +
    `(via testition.tech).`
  );
}

export function shareReceiptMessage(opts: {
  monthLabel: string;
  amount: number;
  receiptUrl: string;
}): string {
  return (
    `Sharing my rent receipt for ${opts.monthLabel} (₹${opts.amount.toLocaleString("en-IN")}).\n\n` +
    `${opts.receiptUrl}\n\nFrom testition.tech`
  );
}

export function shareLeaseMessage(opts: {
  listingTitle: string;
  rent: number;
  startDate: string;
  endDate: string;
}): string {
  return (
    `Sharing my lease summary:\n\n` +
    `🏠 ${opts.listingTitle}\n` +
    `💰 ₹${opts.rent.toLocaleString("en-IN")}/mo\n` +
    `📅 ${opts.startDate} → ${opts.endDate}\n\n` +
    `Tracked on testition.tech`
  );
}

export function roommateInquiryMessage(opts: { name: string; city: string }): string {
  return (
    `Hi ${opts.name}, I saw your roommate profile on testition.tech (${opts.city}) — looks like our ` +
    `budget and lifestyle align. Want to chat?`
  );
}

export function maintenanceForwardMessage(opts: {
  category: string;
  title: string;
  description: string;
  address: string;
}): string {
  return (
    `Hi, my tenant raised a ${opts.category} issue at:\n\n` +
    `📍 ${opts.address}\n\n` +
    `Issue: ${opts.title}\n${opts.description}\n\n` +
    `Can you take a look? Forwarded from testition.tech.`
  );
}

export function platformSupportMessage(): string {
  return `Hi Testition support team, I need help with…`;
}
