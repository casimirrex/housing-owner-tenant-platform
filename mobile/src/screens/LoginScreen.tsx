import { useMutation } from "@tanstack/react-query";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { mobileApi } from "../api/client";
import { useGoogleIdToken } from "../auth/useGoogleIdToken";
import { ActionButton } from "../components/ActionButton";
import { SectionCard } from "../components/SectionCard";
import { StatusPill } from "../components/StatusPill";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { mobileStyles } from "../styles/mobile";
import { useAppStore } from "../store/app-store";

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [identifier, setIdentifier] = useState("aarav@example.com");
  const [password, setPassword] = useState("StrongPassword@123");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { authSession, setAuthSession } = useAppStore();

  const loginMutation = useMutation({
    mutationFn: () => mobileApi.login({ identifier, password }),
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : "Login failed.");
    },
    onSuccess: (session) => {
      setErrorMessage(null);
      setAuthSession(session);
    }
  });

  const googleMutation = useMutation({
    mutationFn: (payload: { identityToken: string; redirectUri: string }) =>
      mobileApi.loginWithGoogle(payload),
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : "Google sign-in failed.");
    },
    onSuccess: (session) => {
      setErrorMessage(null);
      setAuthSession(session);
    }
  });

  const googleAuth = useGoogleIdToken({
    onError: (message) => setErrorMessage(message),
    onToken: (payload) => googleMutation.mutate(payload)
  });

  const appleMutation = useMutation({
    mutationFn: () =>
      mobileApi.loginWithApple({
        authorizationCode: "apple_demo_code",
        redirectUri: googleAuth.redirectUri
      }),
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : "Apple sign-in failed.");
    },
    onSuccess: (session) => {
      setErrorMessage(null);
      setAuthSession(session);
    }
  });

  const pending =
    loginMutation.isPending ||
    googleMutation.isPending ||
    appleMutation.isPending;

  const googleButtonLabel = googleMutation.isPending
    ? "Connecting Gmail..."
    : !googleAuth.isConfigured
      ? "Configure Gmail login"
      : !googleAuth.isReady
        ? "Preparing Gmail..."
        : "Continue with Gmail";

  return (
    <ScrollView contentContainerStyle={mobileStyles.container}>
      <Text style={mobileStyles.eyebrow}>Authentication</Text>
      <Text style={mobileStyles.hero}>Login with email, phone, or Gmail.</Text>
      <Text style={mobileStyles.bodyText}>
        This screen uses the live Spring Boot auth APIs for password login, Google identity sign-in,
        and Apple continuation.
      </Text>

      <SectionCard subtitle="Use email or phone with the seeded demo backend." title="Credentials">
        <TextInput
          autoCapitalize="none"
          onChangeText={setIdentifier}
          style={mobileStyles.input}
          value={identifier}
        />
        <TextInput
          autoCapitalize="none"
          onChangeText={setPassword}
          secureTextEntry
          style={mobileStyles.input}
          value={password}
        />
        <ActionButton
          disabled={pending}
          label={loginMutation.isPending ? "Signing in..." : "Login"}
          onPress={() => loginMutation.mutate()}
        />
      </SectionCard>

      <SectionCard
        subtitle="Uses the same `/auth/oauth/google` endpoint as the web app."
        title="Social login"
      >
        <ActionButton
          disabled={pending || (googleAuth.isConfigured && !googleAuth.isReady)}
          label={googleButtonLabel}
          onPress={() => googleAuth.promptGoogle()}
          variant="secondary"
        />
        <ActionButton
          disabled={pending}
          label={appleMutation.isPending ? "Connecting Apple..." : "Continue with Apple"}
          onPress={() => appleMutation.mutate()}
          variant="secondary"
        />
        <Text style={mobileStyles.helperText}>
          {googleAuth.configurationMessage ??
            "If the Gmail account is new, the backend will create the tenant account automatically."}
        </Text>
      </SectionCard>

      <SectionCard title="Session status">
        {authSession ? (
          <>
            <StatusPill label={`${authSession.authMethod} session active`} tone="success" />
            <Text style={mobileStyles.bodyText}>{authSession.message}</Text>
            <Text style={mobileStyles.helperText}>
              Name: {authSession.fullName ?? "Not available"}
            </Text>
            <Text style={mobileStyles.helperText}>
              Email: {authSession.email ?? "Not available"}
            </Text>
            <Text style={mobileStyles.helperText}>
              Email verified: {authSession.emailVerified ? "Yes" : "No"}
            </Text>
            <Text style={mobileStyles.helperText}>User: {authSession.userId}</Text>
            <Text style={mobileStyles.helperText}>
              Access token: {authSession.accessToken.slice(0, 18)}...
            </Text>
          </>
        ) : (
          <Text style={mobileStyles.bodyText}>
            No active session yet. Submit one of the login actions above to start a live session.
          </Text>
        )}
      </SectionCard>

      <SectionCard
        subtitle="Use the signup or OTP flow if you want to test the broader auth journey."
        title="More auth flows"
      >
        <ActionButton
          label="Open sign up"
          onPress={() => navigation.navigate("SignUp")}
          variant="secondary"
        />
        <ActionButton
          label="Open OTP flow"
          onPress={() => navigation.navigate("OtpVerification")}
          variant="secondary"
        />
      </SectionCard>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: "#b36237",
    fontSize: 13,
    fontWeight: "700"
  }
});
