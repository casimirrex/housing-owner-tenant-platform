"use client";

type GoogleOAuthButtonText = "signin_with" | "signup_with" | "continue_with" | "signin";

const GOOGLE_OAUTH_SCOPE = "openid email profile";
const GOOGLE_OAUTH_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";

function toBase64Url(value: ArrayBuffer) {
  const bytes = new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createOauthState() {
  const randomBytes = new Uint8Array(16);
  window.crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function createCodeVerifier() {
  const randomBytes = new Uint8Array(64);
  window.crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

async function createCodeChallenge(codeVerifier: string) {
  const verifierBytes = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest("SHA-256", verifierBytes);
  return toBase64Url(digest);
}

function getButtonLabel(text: GoogleOAuthButtonText) {
  switch (text) {
    case "signup_with":
      return "Continue with Gmail";
    case "signin":
    case "signin_with":
    case "continue_with":
    default:
      return "Sign in with Gmail";
  }
}

export function GoogleOAuthButton({
  text,
  redirectUri,
  returnPath,
  stateStorageKey,
  codeVerifierStorageKey,
  loginHint,
  label,
  onError,
  onStart
}: {
  text: GoogleOAuthButtonText;
  redirectUri: string;
  returnPath: string;
  stateStorageKey: string;
  codeVerifierStorageKey: string;
  loginHint?: string;
  label?: string;
  onError?: (message: string) => void;
  onStart?: () => void;
}) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const startOAuthFlow = async () => {
    if (!googleClientId) {
      onError?.("Google sign-in is not available in this environment yet.");
      return;
    }

    try {
      const state = createOauthState();
      const codeVerifier = createCodeVerifier();
      const codeChallenge = await createCodeChallenge(codeVerifier);
      window.sessionStorage.setItem(stateStorageKey, state);
      window.sessionStorage.setItem(codeVerifierStorageKey, codeVerifier);
      window.sessionStorage.setItem(
        `housing-owner-tenant-google-oauth:return:${state}`,
        returnPath
      );

      const authorizationUrl = new URL(GOOGLE_OAUTH_AUTHORIZE_URL);
      authorizationUrl.searchParams.set("client_id", googleClientId);
      authorizationUrl.searchParams.set("redirect_uri", redirectUri);
      authorizationUrl.searchParams.set("response_type", "code");
      authorizationUrl.searchParams.set("scope", GOOGLE_OAUTH_SCOPE);
      authorizationUrl.searchParams.set("state", state);
      authorizationUrl.searchParams.set("code_challenge", codeChallenge);
      authorizationUrl.searchParams.set("code_challenge_method", "S256");
      authorizationUrl.searchParams.set("prompt", "select_account");
      authorizationUrl.searchParams.set("include_granted_scopes", "true");
      if (loginHint?.trim()) {
        authorizationUrl.searchParams.set("login_hint", loginHint.trim());
      }

      onStart?.();
      window.location.assign(authorizationUrl.toString());
    } catch {
      onError?.("Google sign-in could not be started. Please try again.");
    }
  };

  return (
    <div className="grid gap-3">
      {!googleClientId ? (
        <div className="rounded-[26px] border border-copper/20 bg-copper/8 px-5 py-4 text-sm leading-6 text-copper">
          Google sign-in is not available in this environment yet. Add the Google OAuth web client
          configuration on the frontend and backend to enable Gmail registration.
        </div>
      ) : null}
      <button
        className="flex w-full items-center justify-between rounded-[26px] border border-black/8 bg-white px-5 py-3 text-left shadow-soft transition hover:border-pine/30 hover:bg-white/90"
        onClick={startOAuthFlow}
        type="button"
        disabled={!googleClientId}
      >
        <span className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#4285F4] text-base font-semibold text-white">
            G
          </span>
          <span className="grid gap-1">
            <span className="text-sm font-semibold text-ink">{label ?? getButtonLabel(text)}</span>
            <span className="text-xs leading-5 text-ink/60">
              Google will open a secure consent screen and bring you back here.
            </span>
          </span>
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">
          OAuth 2.0
        </span>
      </button>
    </div>
  );
}
