import { useMutation, useQuery } from "@tanstack/react-query";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { mobileApi } from "../api/client";
import { ActionButton } from "../components/ActionButton";
import { ListingTile } from "../components/ListingTile";
import { SectionCard } from "../components/SectionCard";
import { StatusPill } from "../components/StatusPill";
import type { ListingSummary } from "../api/types";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { mobileStyles } from "../styles/mobile";
import { useAppStore } from "../store/app-store";

export function SavedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    savedPropertyIds,
    savePropertyId,
    removePropertyId
  } = useAppStore();
  const homeQuery = useQuery({
    queryKey: ["saved-home"],
    queryFn: () => mobileApi.getHome()
  });
  const dashboardQuery = useQuery({
    queryKey: ["saved-dashboard"],
    queryFn: () => mobileApi.getDashboard()
  });

  const saveMutation = useMutation({
    mutationFn: (propertyId: string) => mobileApi.saveProperty(propertyId),
    onSuccess: (_, propertyId) => savePropertyId(propertyId)
  });

  const removeMutation = useMutation({
    mutationFn: (propertyId: string) => mobileApi.removeSavedProperty(propertyId),
    onSuccess: (_, propertyId) => removePropertyId(propertyId)
  });

  const allListings = [
    ...(homeQuery.data?.recommendations ?? []),
    ...(homeQuery.data?.trending ?? []),
    ...(homeQuery.data?.newListings ?? [])
  ];

  const uniqueListings = allListings.filter(
    (listing, index, current) =>
      current.findIndex((item) => item.listingId === listing.listingId) === index
  );

  const shortlistItems = uniqueListings.filter((listing) => savedPropertyIds.includes(listing.listingId));
  const discoverItems = uniqueListings.filter((listing) => !savedPropertyIds.includes(listing.listingId)).slice(0, 3);

  const toggleSave = (listing: ListingSummary) => {
    if (savedPropertyIds.includes(listing.listingId)) {
      removeMutation.mutate(listing.listingId);
      return;
    }
    saveMutation.mutate(listing.listingId);
  };

  return (
    <ScrollView contentContainerStyle={mobileStyles.container}>
      <Text style={mobileStyles.eyebrow}>Shortlist</Text>
      <Text style={mobileStyles.hero}>See the saved page as a real mobile destination.</Text>
      <Text style={mobileStyles.bodyText}>
        The shortlist view uses the live property save/remove APIs and seeded discovery cards.
      </Text>

      <SectionCard
        subtitle={dashboardQuery.data?.alertsSummary.latestSummary}
        title={`Saved homes (${savedPropertyIds.length})`}
      >
        <View style={mobileStyles.metricRow}>
          <View style={mobileStyles.metricCard}>
            <Text style={mobileStyles.metricValue}>{dashboardQuery.data?.savedCount ?? savedPropertyIds.length}</Text>
            <Text style={mobileStyles.metricLabel}>Backend saved count</Text>
          </View>
          <View style={mobileStyles.metricCard}>
            <Text style={mobileStyles.metricValue}>{shortlistItems.length}</Text>
            <Text style={mobileStyles.metricLabel}>Visible shortlist cards</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard title="Your shortlist">
        {shortlistItems.length ? (
          shortlistItems.map((listing) => (
            <View key={listing.listingId} style={styles.listingBlock}>
              <ListingTile
                listing={listing}
                onPress={() => navigation.navigate("PropertyDetail", { propertyId: listing.listingId })}
              />
              <ActionButton label="Remove from shortlist" onPress={() => toggleSave(listing)} variant="secondary" />
            </View>
          ))
        ) : (
          <Text style={mobileStyles.bodyText}>No saved cards are visible yet. Use the discovery screens to save one.</Text>
        )}
      </SectionCard>

      <SectionCard subtitle="These suggestions can be saved directly into the shortlist flow." title="Discover more">
        {discoverItems.map((listing) => (
          <View key={listing.listingId} style={styles.listingBlock}>
            <ListingTile
              listing={listing}
              onPress={() => navigation.navigate("PropertyDetail", { propertyId: listing.listingId })}
            />
            <ActionButton label="Save to shortlist" onPress={() => toggleSave(listing)} />
          </View>
        ))}
      </SectionCard>

      {saveMutation.isSuccess || removeMutation.isSuccess ? (
        <StatusPill label="Shortlist synced with backend" tone="success" />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  listingBlock: {
    gap: 8
  }
});
