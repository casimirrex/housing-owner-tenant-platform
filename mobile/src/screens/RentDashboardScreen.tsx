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

export function RentDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dashboardQuery = useQuery({
    queryKey: ["rent-dashboard-dashboard"],
    queryFn: () => mobileApi.getDashboard()
  });
  const propertyQuery = useQuery({
    queryKey: ["rent-dashboard-property"],
    queryFn: () => mobileApi.getPropertyDetail("listing_001")
  });
  const visitsQuery = useQuery({
    queryKey: ["rent-dashboard-visits"],
    queryFn: () => mobileApi.getVisits()
  });
  const pagesQuery = useQuery({
    queryKey: ["rent-dashboard-pages"],
    queryFn: () => mobileApi.getProductPages()
  });

  const rentPage = pagesQuery.data?.pages.find((page) => page.page.toLowerCase().includes("monthly rent"));

  return (
    <ScrollView contentContainerStyle={mobileStyles.container}>
      <Text style={mobileStyles.eyebrow}>Rent dashboard</Text>
      <Text style={mobileStyles.hero}>See the monthly rent dashboard as its own mobile page.</Text>
      <Text style={mobileStyles.bodyText}>
        This preview combines tenant summary data with a sample property rent figure until payment
        history APIs are added.
      </Text>

      <SectionCard subtitle={rentPage?.source ?? "Phase 2"} title="Monthly overview">
        <View style={mobileStyles.metricRow}>
          <View style={mobileStyles.metricCard}>
            <Text style={mobileStyles.metricValue}>
              Rs. {propertyQuery.data?.pricing.monthlyRent?.toLocaleString("en-IN") ?? "--"}
            </Text>
            <Text style={mobileStyles.metricLabel}>Indicative rent due</Text>
          </View>
          <View style={mobileStyles.metricCard}>
            <Text style={mobileStyles.metricValue}>
              Rs. {propertyQuery.data?.pricing.securityDeposit?.toLocaleString("en-IN") ?? "--"}
            </Text>
            <Text style={mobileStyles.metricLabel}>Deposit tracked</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard title="Account activity">
        <StatusPill label={dashboardQuery.data?.alertsSummary.latestSummary ?? "Payment feed pending"} tone="warning" />
        <Text style={mobileStyles.bodyText}>Scheduled visits: {visitsQuery.data?.items.length ?? 0}</Text>
        <Text style={mobileStyles.bodyText}>
          Profile completion: {dashboardQuery.data?.profileCompletion ?? 0}%
        </Text>
      </SectionCard>

      <SectionCard title="Next actions">
        <ActionButton label="Open payments" onPress={() => navigation.navigate("Payments")} />
        <ActionButton label="Open profile" onPress={() => navigation.navigate("Tabs", { screen: "Profile" })} variant="secondary" />
      </SectionCard>
    </ScrollView>
  );
}
