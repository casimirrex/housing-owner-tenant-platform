import { useQuery } from "@tanstack/react-query";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { ScrollView, Text, View } from "react-native";
import { mobileApi } from "../api/client";
import { ActionButton } from "../components/ActionButton";
import { SectionCard } from "../components/SectionCard";
import { StatusPill } from "../components/StatusPill";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { mobileStyles } from "../styles/mobile";

export function PaymentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const profileQuery = useQuery({
    queryKey: ["payments-profile"],
    queryFn: () => mobileApi.getUserProfile()
  });
  const dashboardQuery = useQuery({
    queryKey: ["payments-dashboard"],
    queryFn: () => mobileApi.getDashboard()
  });
  const pagesQuery = useQuery({
    queryKey: ["payments-pages"],
    queryFn: () => mobileApi.getProductPages()
  });

  const paymentPage = pagesQuery.data?.pages.find((page) => page.page.toLowerCase().includes("payment"));

  return (
    <ScrollView contentContainerStyle={mobileStyles.container}>
      <Text style={mobileStyles.eyebrow}>Phase 2 payments</Text>
      <Text style={mobileStyles.hero}>Preview the UPI payment journey page.</Text>
      <Text style={mobileStyles.bodyText}>
        This is a designed mobile destination backed by current user and dashboard context while
        the dedicated payment API is still pending.
      </Text>

      <SectionCard subtitle={paymentPage?.source ?? "Phase 2"} title="Payment readiness">
        <StatusPill label="API contract pending" tone="warning" />
        <Text style={mobileStyles.bodyText}>
          Tenant: {profileQuery.data?.fullName} • City: {profileQuery.data?.city}
        </Text>
        <Text style={mobileStyles.bodyText}>
          Scheduled visits: {dashboardQuery.data?.scheduledVisits ?? 0} • Recommended homes:{" "}
          {dashboardQuery.data?.recommendedCount ?? 0}
        </Text>
      </SectionCard>

      <SectionCard title="Planned payment steps">
        {[
          "Select move-in payment or booking charge",
          "Choose UPI or bank instrument",
          "Track payment status before agreement signing"
        ].map((step) => (
          <View key={step} style={mobileStyles.inlineCard}>
            <Text style={mobileStyles.bodyText}>{step}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Continue into related pages">
        <ActionButton label="Open monthly rent dashboard" onPress={() => navigation.navigate("RentDashboard")} />
        <ActionButton label="Open e-Agreement" onPress={() => navigation.navigate("Agreement")} variant="secondary" />
      </SectionCard>
    </ScrollView>
  );
}
