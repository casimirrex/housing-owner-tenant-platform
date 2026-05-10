"use client";

import { MessageCircle, Share2 } from "lucide-react";
import { isMaskedPhone, whatsappLink } from "@/lib/whatsapp";

/**
 * Inline WhatsApp button — opens https://wa.me/... with a pre-filled message.
 *
 * Two flavours:
 *   - <WhatsAppMessageButton phone={...} message={...} />
 *       Opens directly to that contact. Hides itself if `phone` is masked
 *       or missing, since wa.me/<masked> doesn't work.
 *   - <WhatsAppShareButton message={...} />
 *       Opens WhatsApp's "share to anyone" picker — useful for sending a
 *       property URL to a friend.
 *
 * Both render as a green pill that matches WhatsApp's brand colour.
 */
type CommonProps = {
  message: string;
  label?: string;
  size?: "sm" | "md";
  variant?: "filled" | "ghost";
  className?: string;
};

const baseClass =
  "inline-flex items-center gap-1.5 rounded-full font-semibold transition";
const sizeClass = {
  sm: "px-3 py-1 text-xs",
  md: "px-4 py-2 text-sm"
};
const variantClass = {
  filled: "bg-[#25D366] text-white hover:bg-[#1ea855]",
  ghost: "border border-[#25D366]/40 bg-white text-[#1ea855] hover:bg-[#25D366]/8"
};

export function WhatsAppMessageButton({
  phone,
  message,
  label = "Message on WhatsApp",
  size = "md",
  variant = "filled",
  className = ""
}: CommonProps & { phone: string | null | undefined }) {
  // Phone masked or missing → hide. Owners only see this once contact is unlocked.
  if (!phone || isMaskedPhone(phone)) return null;

  const href = whatsappLink(message, phone);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseClass} ${sizeClass[size]} ${variantClass[variant]} ${className}`}
      aria-label={label}
    >
      <MessageCircle className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      <span>{label}</span>
    </a>
  );
}

export function WhatsAppShareButton({
  message,
  label = "Share on WhatsApp",
  size = "md",
  variant = "ghost",
  className = ""
}: CommonProps) {
  const href = whatsappLink(message);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseClass} ${sizeClass[size]} ${variantClass[variant]} ${className}`}
      aria-label={label}
    >
      <Share2 className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      <span>{label}</span>
    </a>
  );
}
