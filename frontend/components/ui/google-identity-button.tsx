"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            ux_mode?: "popup" | "redirect";
            context?: "signin" | "signup" | "use";
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme: "outline" | "filled_blue" | "filled_black";
              size: "large" | "medium" | "small";
              shape: "pill" | "rectangular";
              text:
                | "signin_with"
                | "signup_with"
                | "continue_with"
                | "signin";
              logo_alignment: "left" | "center";
              width?: number;
            }
          ) => void;
        };
      };
    };
  }
}

type GoogleButtonText = "signin_with" | "signup_with" | "continue_with" | "signin";

export function GoogleIdentityButton({
  text,
  onCredential,
  onError
}: {
  text: GoogleButtonText;
  onCredential: (credential: string) => void;
  onError?: (message: string) => void;
}) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  const [scriptReady, setScriptReady] = useState(false);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      setScriptReady(true);
    }
  }, []);

  useEffect(() => {
    if (!googleClientId || !scriptReady || !buttonRef.current || !window.google?.accounts?.id) {
      return;
    }

    buttonRef.current.innerHTML = "";
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response) => {
        if (response.credential) {
          onCredentialRef.current(response.credential);
          return;
        }

        onErrorRef.current?.("Google did not return an identity token.");
      },
      ux_mode: "popup",
      context: text === "signup_with" ? "signup" : "signin"
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text,
      logo_alignment: "left",
      width: 320
    });
  }, [googleClientId, scriptReady, text]);

  if (!googleClientId) {
    return (
      <div className="grid gap-3 rounded-2xl border border-copper/20 bg-copper/8 px-4 py-4 text-sm leading-6 text-copper">
        <p>Google sign-in is not available in this environment yet.</p>
        <p className="text-xs leading-5 text-ink/58">
          Add the Google OAuth web client configuration on the frontend and backend to enable SSO.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <Script
        onError={() => onErrorRef.current?.("Google Identity Services could not be loaded.")}
        onLoad={() => setScriptReady(true)}
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
      />
      <div className="min-h-12" ref={buttonRef} />
      <p className="text-xs leading-5 text-ink/58">
        Uses Google Identity Services so people can continue with a verified Gmail account in one step.
      </p>
    </div>
  );
}
