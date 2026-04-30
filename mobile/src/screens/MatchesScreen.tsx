import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet } from "react-native";
import { mobileApi } from "../api/client";
import { ListingTile } from "../components/ListingTile";
import { SectionCard } from "../components/SectionCard";
import type { RootStackParamList } from "../navigation/RootNavigator";

export function MatchesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const matchesQuery = useQuery({
    queryKey: ["mobile-matches"],
    queryFn: () => mobileApi.getMatches()
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionCard
        subtitle="Rules-based and preference-driven suggestions from the backend."
        title="Personalized matches"
      >
        {matchesQuery.data?.items.map((listing) => (
          <ListingTile
            key={listing.listingId}
            listing={listing}
            onPress={() => navigation.navigate("PropertyDetail", { propertyId: listing.listingId })}
            secondaryLabel={listing.matchReason}
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
  }
});
