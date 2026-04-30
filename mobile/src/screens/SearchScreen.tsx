import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { mobileApi } from "../api/client";
import { ListingTile } from "../components/ListingTile";
import { SectionCard } from "../components/SectionCard";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAppStore } from "../store/app-store";

export function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { selectedCity, searchQuery, setSearchQuery } = useAppStore();
  const [submittedQuery, setSubmittedQuery] = useState(searchQuery);

  const resultsQuery = useQuery({
    queryKey: ["mobile-search", selectedCity, submittedQuery],
    queryFn: () =>
      mobileApi.search({
        city: selectedCity,
        query: submittedQuery,
        page: 0,
        pageSize: 8,
        verified: true
      })
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionCard subtitle="Live API-backed search results with typed query contracts." title="Search and shortlist">
        <View style={styles.searchRow}>
          <TextInput
            onChangeText={setSearchQuery}
            placeholder="Metro, tech park, locality..."
            style={styles.input}
            value={searchQuery}
          />
          <Pressable
            onPress={() => setSubmittedQuery(searchQuery)}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Search</Text>
          </Pressable>
        </View>
        <Text style={styles.summaryText}>{resultsQuery.data?.summary.summary ?? "Searching..."}</Text>
      </SectionCard>

      <SectionCard title="Results">
        {resultsQuery.data?.items.map((listing) => (
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
  searchRow: {
    flexDirection: "row",
    gap: 10
  },
  input: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(23, 35, 38, 0.08)"
  },
  button: {
    borderRadius: 18,
    backgroundColor: "#20443b",
    paddingHorizontal: 18,
    justifyContent: "center"
  },
  buttonText: {
    color: "#fffaf4",
    fontWeight: "700"
  },
  summaryText: {
    color: "#5e6c67",
    fontSize: 13
  }
});
