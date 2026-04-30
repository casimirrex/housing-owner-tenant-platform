import { ResponseType, makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

const redirectUriOptions = {
  path: "oauth/google",
  scheme: "rentandbeyond"
} as const;

const googleScopes = ["openid", "profile", "email"];

function getRequiredClientEnvVar() {
  switch (Platform.OS) {
    case "android":
      return "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID";
    case "ios":
      return "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID";
    default:
      return "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID";
  }
}

function getPlatformClientId() {
  switch (Platform.OS) {
    case "android":
      return process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
    case "ios":
      return process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    default:
      return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  }
}

export function useGoogleIdToken({
  onError,
  onToken
}: {
  onError?: (message: string) => void;
  onToken: (payload: { identityToken: string; redirectUri: string }) => void;
}) {
  const fallbackRedirectUri = makeRedirectUri(redirectUriOptions);
  const requiredClientEnvVar = getRequiredClientEnvVar();
  const platformClientId = getPlatformClientId();
  const configured = Boolean(platformClientId);

  const [request, response, promptAsync] = Google.useAuthRequest(
    {
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      responseType: ResponseType.IdToken,
      scopes: googleScopes,
      selectAccount: true,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
    },
    redirectUriOptions
  );

  useEffect(() => {
    if (!response) {
      return;
    }

    if (response.type === "success") {
      const identityToken =
        response.params?.id_token ??
        response.authentication?.idToken;

      if (!identityToken) {
        onError?.("Google completed without an ID token. Check the Google client setup for this app.");
        return;
      }

      onToken({
        identityToken,
        redirectUri: request?.redirectUri ?? fallbackRedirectUri
      });
      return;
    }

    if (response.type === "error") {
      onError?.(response.error?.message ?? "Google sign-in failed.");
    }
  }, [fallbackRedirectUri, onError, onToken, request?.redirectUri, response]);

  return {
    configurationMessage: configured
      ? null
      : `Google sign-in needs ${requiredClientEnvVar} in the mobile app environment for ${Platform.OS}.`,
    isConfigured: configured,
    isReady: configured && Boolean(request),
    promptGoogle: async () => {
      if (!configured) {
        onError?.(
          `Google sign-in needs ${requiredClientEnvVar} in the mobile app environment for ${Platform.OS}.`
        );
        return;
      }

      if (!request) {
        onError?.("Google sign-in is still loading. Please try again in a moment.");
        return;
      }

      await promptAsync();
    },
    redirectUri: request?.redirectUri ?? fallbackRedirectUri
  };
}
