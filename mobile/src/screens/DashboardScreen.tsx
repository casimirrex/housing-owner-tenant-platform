import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ActionButton } from "../components/ActionButton";
import { mobileApi } from "../api/client";
import { SectionCard } from "../components/SectionCard";
import type { RootStackParamList } from "../navigation/RootNavigator";

export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dashboardQuery = useQuery({
    queryKey: ["mobile-dashboard"],
    queryFn: () => mobileApi.getDashboard()
  });

  const dashboard = dashboardQuery.data;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionCard subtitle={dashboard?.alertsSummary.latestSummary} title="Tenant dashboard">
        <View style={styles.grid}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{dashboard?.savedCount ?? "--"}</Text>
            <Text style={styles.metricLabel}>Saved</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{dashboard?.scheduledVisits ?? "--"}</Text>
            <Text style={styles.metricLabel}>Visits</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{dashboard?.recommendedCount ?? "--"}</Text>
            <Text style={styles.metricLabel}>Matches</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{dashboard?.profileCompletion ?? "--"}%</Text>
            <Text style={styles.metricLabel}>Profile</Text>
          </View>
        </View>
        <Pressable onPress={() => navigation.navigate("Visits")} style={styles.button}>
          <Text style={styles.buttonText}>Open visit planner</Text>
        </Pressable>
      </SectionCard>

      <SectionCard subtitle="Open the newer destination pages directly from the main dashboard." title="More tenant pages">
        <ActionButton label="Open shortlist" onPress={() => navigation.navigate("Saved")} />
        <ActionButton label="Open notifications" onPress={() => navigation.navigate("Notifications")} variant="secondary" />
        <ActionButton label="Open rent dashboard" onPress={() => navigation.navigate("RentDashboard")} variant="secondary" />
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    gap: 18,
    backgroundColor: "#f6f0e8"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  metric: {
    width: "47%",
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 18
  },
  metricValue: {
    fontSize: 26,
    fontWeight: "700",
    color: "#172326"
  },
  metricLabel: {
    color: "#5e6c67",
    fontSize: 13
  },
  button: {
    marginTop: 8,
    borderRadius: 18,
    backgroundColor: "#20443b",
    paddingVertical: 14,
    alignItems: "center"
  },
  buttonText: {
    color: "#fffaf4",
    fontWeight: "700"
  }
});
