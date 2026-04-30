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

export function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dashboardQuery = useQuery({
    queryKey: ["notifications-dashboard"],
    queryFn: () => mobileApi.getDashboard()
  });
  const matchesQuery = useQuery({
    queryKey: ["notifications-matches"],
    queryFn: () => mobileApi.getMatches()
  });
  const visitsQuery = useQuery({
    queryKey: ["notifications-visits"],
    queryFn: () => mobileApi.getVisits()
  });

  const notificationItems = [
    ...(visitsQuery.data?.items.map((visit) => ({
      id: visit.visitId,
      title: `${visit.propertySummary.title} visit confirmed`,
      body: `${visit.preferredDate} • ${visit.slotLabel} • ${visit.status}`,
      tone: "success" as const
    })) ?? []),
    ...(matchesQuery.data?.items.slice(0, 3).map((match) => ({
      id: match.listingId,
      title: `${Math.round(match.matchScore * 100)}% match found`,
      body: `${match.title} • ${match.matchReason}`,
      tone: "warning" as const
    })) ?? [])
  ];

  return (
    <ScrollView contentContainerStyle={mobileStyles.container}>
      <Text style={mobileStyles.eyebrow}>Alerts</Text>
      <Text style={mobileStyles.hero}>Notifications can now be previewed as a real page.</Text>
      <Text style={mobileStyles.bodyText}>
        This screen synthesizes alerts from dashboard, matches, and visits until a dedicated
        notifications API exists.
      </Text>

      <SectionCard subtitle={dashboardQuery.data?.alertsSummary.latestSummary} title="Alerts summary">
        <View style={mobileStyles.metricRow}>
          <View style={mobileStyles.metricCard}>
            <Text style={mobileStyles.metricValue}>{dashboardQuery.data?.alertsSummary.unreadCount ?? "--"}</Text>
            <Text style={mobileStyles.metricLabel}>Unread alerts</Text>
          </View>
          <View style={mobileStyles.metricCard}>
            <Text style={mobileStyles.metricValue}>{dashboardQuery.data?.alertsSummary.urgentCount ?? "--"}</Text>
            <Text style={mobileStyles.metricLabel}>Urgent items</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard title="Latest notifications">
        {notificationItems.map((item) => (
          <View key={item.id} style={mobileStyles.inlineCard}>
            <StatusPill label={item.tone === "success" ? "Visit" : "Match"} tone={item.tone} />
            <Text style={{ fontWeight: "700", color: "#172326" }}>{item.title}</Text>
            <Text style={mobileStyles.bodyText}>{item.body}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Jump to source">
        <ActionButton label="Open visits" onPress={() => navigation.navigate("Visits")} />
        <ActionButton label="Open matches" onPress={() => navigation.navigate("Tabs", { screen: "Matches" })} variant="secondary" />
      </SectionCard>
    </ScrollView>
  );
}
