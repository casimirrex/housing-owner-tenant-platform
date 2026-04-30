import { useMutation } from "@tanstack/react-query";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput } from "react-native";
import { mobileApi } from "../api/client";
import { ActionButton } from "../components/ActionButton";
import { SectionCard } from "../components/SectionCard";
import { StatusPill } from "../components/StatusPill";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { mobileStyles } from "../styles/mobile";
import { useAppStore } from "../store/app-store";

export function OtpVerificationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "OtpVerification">>();
  const {
    latestAuthFlow,
    authSession,
    setAuthSession,
    setLatestAuthFlow
  } = useAppStore();
  const [destination, setDestination] = useState(route.params?.destination ?? "+919876543210");
  const [flowId, setFlowId] = useState(route.params?.flowId ?? latestAuthFlow?.flowId ?? "");
  const [otpCode, setOtpCode] = useState("123456");

  useEffect(() => {
    if (latestAuthFlow?.flowId && !flowId) {
      setFlowId(latestAuthFlow.flowId);
    }
  }, [flowId, latestAuthFlow?.flowId]);

  const sendOtpMutation = useMutation({
    mutationFn: () =>
      mobileApi.sendOtp({
        channel: destination.includes("@") ? "EMAIL" : "PHONE",
        destination,
        purpose: "LOGIN"
      }),
    onSuccess: (flow) => {
      setLatestAuthFlow(flow);
      setFlowId(flow.flowId);
    }
  });

  const verifyOtpMutation = useMutation({
    mutationFn: () => mobileApi.verifyOtp({ flowId, destination, otpCode }),
    onSuccess: (session) => setAuthSession(session)
  });

  return (
    <ScrollView contentContainerStyle={mobileStyles.container}>
      <Text style={mobileStyles.eyebrow}>OTP flow</Text>
      <Text style={mobileStyles.hero}>Send OTP, then verify it from the same mobile preview.</Text>
      <Text style={mobileStyles.bodyText}>
        This screen calls both `/auth/otp/send` and `/auth/otp/verify`.
      </Text>

      <SectionCard subtitle="You can swap between phone and email destinations." title="OTP destination">
        <TextInput onChangeText={setDestination} style={mobileStyles.input} value={destination} />
        <ActionButton
          label={sendOtpMutation.isPending ? "Sending..." : "Send OTP"}
          onPress={() => sendOtpMutation.mutate()}
        />
      </SectionCard>

      <SectionCard subtitle="The demo backend accepts the seeded OTP-style flow and returns a session." title="Verify code">
        <TextInput onChangeText={setFlowId} placeholder="flow id" style={mobileStyles.input} value={flowId} />
        <TextInput onChangeText={setOtpCode} placeholder="123456" style={mobileStyles.input} value={otpCode} />
        <ActionButton
          label={verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}
          onPress={() => verifyOtpMutation.mutate()}
        />
      </SectionCard>

      {latestAuthFlow ? (
        <SectionCard title="Flow status">
          <StatusPill label={latestAuthFlow.status} tone="warning" />
          <Text style={mobileStyles.bodyText}>{latestAuthFlow.message}</Text>
          <Text style={mobileStyles.helperText}>Masked destination: {latestAuthFlow.maskedDestination}</Text>
          <Text style={mobileStyles.helperText}>Next step: {latestAuthFlow.nextStep}</Text>
        </SectionCard>
      ) : null}

      {authSession ? (
        <SectionCard title="Verified session">
          <StatusPill label={`${authSession.authMethod} verified`} tone="success" />
          <Text style={mobileStyles.bodyText}>{authSession.message}</Text>
          <ActionButton label="Go to home" onPress={() => navigation.navigate("Tabs", { screen: "Home" })} />
        </SectionCard>
      ) : null}
    </ScrollView>
  );
}
