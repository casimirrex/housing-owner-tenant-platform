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

export function SignUpScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [fullName, setFullName] = useState("Aarav Kumar");
  const [email, setEmail] = useState("aarav@example.com");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("9876543210");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { authSession, latestAuthFlow, setAuthSession, setLatestAuthFlow } = useAppStore();

  const emailMutation = useMutation({
    mutationFn: () => mobileApi.registerWithEmail({ fullName, email }),
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : "Email sign-up failed.");
    },
    onSuccess: (flow) => {
      setErrorMessage(null);
      setLatestAuthFlow(flow);
    }
  });

  const phoneMutation = useMutation({
    mutationFn: () => mobileApi.registerWithPhone({ fullName, countryCode, phoneNumber }),
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : "Phone sign-up failed.");
    },
    onSuccess: (flow) => {
      setErrorMessage(null);
      setLatestAuthFlow(flow);
      navigation.navigate("OtpVerification", {
        destination: `${countryCode}${phoneNumber}`,
        flowId: flow.flowId
      });
    }
  });

  const googleMutation = useMutation({
    mutationFn: (payload: { identityToken: string; redirectUri: string }) =>
      mobileApi.loginWithGoogle(payload),
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : "Gmail sign-up failed.");
    },
    onSuccess: (session) => {
      setErrorMessage(null);
      setAuthSession(session);
      setLatestAuthFlow(null);
    }
  });

  const googleAuth = useGoogleIdToken({
    onError: (message) => setErrorMessage(message),
    onToken: (payload) => googleMutation.mutate(payload)
  });

  const pending =
    emailMutation.isPending ||
    phoneMutation.isPending ||
    googleMutation.isPending;

  const googleButtonLabel = googleMutation.isPending
    ? "Connecting Gmail..."
    : !googleAuth.isConfigured
      ? "Configure Gmail sign up"
      : !googleAuth.isReady
        ? "Preparing Gmail..."
        : "Sign up with Gmail";

  return (
    <ScrollView contentContainerStyle={mobileStyles.container}>
      <Text style={mobileStyles.eyebrow}>Registration</Text>
      <Text style={mobileStyles.hero}>Create an account with email, phone, or Gmail.</Text>
      <Text style={mobileStyles.bodyText}>
        Gmail registration uses the same backend Google endpoint as the web application, so new
        users can be created from their verified Google account directly.
      </Text>

      <SectionCard subtitle="Shared user details used for the email and phone flows." title="Basic details">
        <TextInput onChangeText={setFullName} style={mobileStyles.input} value={fullName} />
      </SectionCard>

      <SectionCard title="Register with Gmail">
        <ActionButton
          disabled={pending || (googleAuth.isConfigured && !googleAuth.isReady)}
          label={googleButtonLabel}
          onPress={() => googleAuth.promptGoogle()}
          variant="secondary"
        />
        <Text style={mobileStyles.helperText}>
          {googleAuth.configurationMessage ??
            "Use a verified Gmail account to create the user and start a live authenticated session immediately."}
        </Text>
      </SectionCard>

      <SectionCard title="Register with email">
        <TextInput
          autoCapitalize="none"
          onChangeText={setEmail}
          style={mobileStyles.input}
          value={email}
        />
        <ActionButton
          disabled={pending}
          label={emailMutation.isPending ? "Starting..." : "Start email sign up"}
          onPress={() => emailMutation.mutate()}
        />
      </SectionCard>

      <SectionCard title="Register with phone">
        <View style={mobileStyles.row}>
          <View style={{ width: 90 }}>
            <TextInput onChangeText={setCountryCode} style={mobileStyles.input} value={countryCode} />
          </View>
          <View style={{ flex: 1 }}>
            <TextInput onChangeText={setPhoneNumber} style={mobileStyles.input} value={phoneNumber} />
          </View>
        </View>
        <ActionButton
          disabled={pending}
          label={phoneMutation.isPending ? "Starting..." : "Start phone sign up"}
          onPress={() => phoneMutation.mutate()}
        />
      </SectionCard>

      {authSession ? (
        <SectionCard title="Live Gmail session">
          <StatusPill label={`${authSession.authMethod} session active`} tone="success" />
          <Text style={mobileStyles.bodyText}>{authSession.message}</Text>
          <Text style={mobileStyles.helperText}>
            Name: {authSession.fullName ?? "Not available"}
          </Text>
          <Text style={mobileStyles.helperText}>
            Email: {authSession.email ?? "Not available"}
          </Text>
          <Text style={mobileStyles.helperText}>User: {authSession.userId}</Text>
        </SectionCard>
      ) : null}

      {latestAuthFlow ? (
        <SectionCard title="Latest registration flow">
          <StatusPill label={latestAuthFlow.status} tone="success" />
          <Text style={mobileStyles.bodyText}>{latestAuthFlow.message}</Text>
          <Text style={mobileStyles.helperText}>Next step: {latestAuthFlow.nextStep}</Text>
          <Text style={mobileStyles.helperText}>
            Destination: {latestAuthFlow.maskedDestination}
          </Text>
        </SectionCard>
      ) : null}

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
