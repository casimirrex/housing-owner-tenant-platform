import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text } from "react-native";
import { mobileApi } from "../api/client";
import { ActionButton } from "../components/ActionButton";
import { SectionCard } from "../components/SectionCard";
import type { RootStackParamList } from "../navigation/RootNavigator";

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const profileQuery = useQuery({
    queryKey: ["mobile-profile"],
    queryFn: () => mobileApi.getUserProfile()
  });

  const preferencesQuery = useQuery({
    queryKey: ["mobile-preferences"],
    queryFn: () => mobileApi.getPreferences()
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionCard
        subtitle={`${profileQuery.data?.city ?? ""} • ${profileQuery.data?.profileStatus ?? ""}`}
        title={profileQuery.data?.fullName ?? "Loading profile"}
      >
        <Text style={styles.bodyText}>{profileQuery.data?.email}</Text>
        <Text style={styles.bodyText}>{profileQuery.data?.phoneNumber}</Text>
        <Text style={styles.bodyText}>
          {profileQuery.data?.occupation} • {profileQuery.data?.role}
        </Text>
      </SectionCard>

      <SectionCard title="Preference profile">
        <Text style={styles.bodyText}>
          Budget: Rs. {preferencesQuery.data?.budgetMin?.toLocaleString("en-IN")} - Rs.{" "}
          {preferencesQuery.data?.budgetMax?.toLocaleString("en-IN")}
        </Text>
        <Text style={styles.bodyText}>BHK: {preferencesQuery.data?.bhkPreference}</Text>
        <Text style={styles.bodyText}>Commute: {preferencesQuery.data?.commuteLocation}</Text>
        <Text style={styles.bodyText}>
          Localities: {preferencesQuery.data?.preferredLocalities.join(", ")}
        </Text>
        <Text style={styles.bodyText}>
          Tags: {preferencesQuery.data?.lifestyleTags.join(", ")}
        </Text>
      </SectionCard>

      <SectionCard title="Verification and payments">
        <ActionButton label="Open e-KYC" onPress={() => navigation.navigate("EKyc")} />
        <ActionButton label="Open payments" onPress={() => navigation.navigate("Payments")} variant="secondary" />
        <ActionButton label="Open agreement" onPress={() => navigation.navigate("Agreement")} variant="secondary" />
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
  bodyText: {
    fontSize: 14,
    color: "#5e6c67",
    lineHeight: 21
  }
});
