import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { mobileApi } from "../api/client";
import { ListingTile } from "../components/ListingTile";
import { SectionCard } from "../components/SectionCard";
import type { RootStackParamList } from "../navigation/RootNavigator";

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const homeQuery = useQuery({
    queryKey: ["mobile-home"],
    queryFn: () => mobileApi.getHome()
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>Mobile discovery</Text>
      <Text style={styles.hero}>A tenant-first app shell backed by the live Spring Boot APIs.</Text>

      <SectionCard
        subtitle={homeQuery.data?.heroSearchConfig.searchPlaceholder}
        title={homeQuery.data?.heroSearchConfig.city ?? "Loading city"}
      >
        <Text style={styles.bodyText}>
          Smart search, recommendations, trending inventory, and urgent homes are all coming from
          the shared backend.
        </Text>
      </SectionCard>

      <SectionCard title="Recommended for you">
        {homeQuery.data?.recommendations.map((listing) => (
          <ListingTile
            key={listing.listingId}
            listing={listing}
            onPress={() => navigation.navigate("PropertyDetail", { propertyId: listing.listingId })}
            secondaryLabel={listing.recommendationReason}
          />
        ))}
      </SectionCard>

      <SectionCard title="Trending now">
        {homeQuery.data?.trending.map((listing) => (
          <ListingTile
            key={listing.listingId}
            listing={listing}
            onPress={() => navigation.navigate("PropertyDetail", { propertyId: listing.listingId })}
          />
        ))}
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
  eyebrow: {
    color: "#b36237",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.4
  },
  hero: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "700",
    color: "#172326"
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#5e6c67"
  }
});
