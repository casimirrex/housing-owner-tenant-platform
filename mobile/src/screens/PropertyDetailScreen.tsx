import { useMutation, useQuery } from "@tanstack/react-query";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { mobileApi } from "../api/client";
import { ActionButton } from "../components/ActionButton";
import { SectionCard } from "../components/SectionCard";
import { StatusPill } from "../components/StatusPill";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAppStore } from "../store/app-store";

export function PropertyDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "PropertyDetail">>();
  const propertyId = route.params.propertyId;
  const {
    savedPropertyIds,
    savePropertyId,
    removePropertyId
  } = useAppStore();

  const detailQuery = useQuery({
    queryKey: ["mobile-property", propertyId],
    queryFn: () => mobileApi.getPropertyDetail(propertyId)
  });

  const reviewsQuery = useQuery({
    queryKey: ["mobile-property-reviews", propertyId],
    queryFn: () => mobileApi.getPropertyReviews(propertyId)
  });

  const faqQuery = useQuery({
    queryKey: ["mobile-property-faq", propertyId],
    queryFn: () => mobileApi.getPropertyFaq(propertyId)
  });

  const detail = detailQuery.data;
  const isSaved = savedPropertyIds.includes(propertyId);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await mobileApi.removeSavedProperty(propertyId);
        return;
      }
      await mobileApi.saveProperty(propertyId);
    },
    onSuccess: () => {
      if (isSaved) {
        removePropertyId(propertyId);
        return;
      }
      savePropertyId(propertyId);
    }
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionCard
        subtitle={detail?.property.subtitle}
        title={detail?.property.title ?? "Loading property"}
      >
        <Text style={styles.bodyText}>{detail?.property.description}</Text>
        <Text style={styles.price}>
          Rs. {detail?.pricing.monthlyRent?.toLocaleString("en-IN") ?? "--"}
        </Text>
        <Text style={styles.bodyText}>
          {detail?.specs.bhk} • {detail?.specs.furnishing} • {detail?.property.locality}
        </Text>
        <View style={styles.buttonRow}>
          <View style={styles.buttonCell}>
            <ActionButton
              label={saveMutation.isPending ? "Updating..." : isSaved ? "Remove shortlist" : "Save shortlist"}
              onPress={() => saveMutation.mutate()}
              variant="secondary"
            />
          </View>
          <View style={styles.buttonCell}>
            <ActionButton
              label="Schedule visit"
              onPress={() => navigation.navigate("Visits", { propertyId })}
            />
          </View>
        </View>
      </SectionCard>

      <SectionCard title="Trust signals">
        {detail?.trustSignals.verified ? <StatusPill label={detail.trustSignals.verificationLabel} tone="success" /> : null}
        {detail?.trustSignals.badges.map((badge) => (
          <Text key={badge} style={styles.bullet}>• {badge}</Text>
        ))}
      </SectionCard>

      <SectionCard title="Amenities and owner">
        <Text style={styles.bodyText}>{detail?.amenities.join(" • ")}</Text>
        <Text style={styles.metaText}>
          Owner: {detail?.ownerInfo.name} • {detail?.ownerInfo.badge}
        </Text>
        <Text style={styles.metaText}>
          Language: {detail?.ownerInfo.preferredLanguage} • {detail?.ownerInfo.phoneMasked}
        </Text>
      </SectionCard>

      <SectionCard title="Recent reviews">
        {reviewsQuery.data?.reviews.map((review) => (
          <View key={review.reviewId} style={styles.block}>
            <Text style={styles.blockTitle}>{review.headline}</Text>
            <Text style={styles.bodyText}>{review.comment}</Text>
            <Text style={styles.metaText}>
              {review.reviewerName} • {review.reviewerType} • {review.rating}/5
            </Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="FAQ">
        {faqQuery.data?.faqItems.map((item) => (
          <View key={item.question} style={styles.block}>
            <Text style={styles.blockTitle}>{item.question}</Text>
            <Text style={styles.bodyText}>{item.answer}</Text>
          </View>
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
  bodyText: {
    color: "#5e6c67",
    fontSize: 14,
    lineHeight: 21
  },
  price: {
    fontSize: 28,
    fontWeight: "700",
    color: "#172326"
  },
  bullet: {
    color: "#20443b",
    fontWeight: "600"
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10
  },
  buttonCell: {
    flex: 1
  },
  block: {
    gap: 6,
    paddingBottom: 10
  },
  blockTitle: {
    color: "#172326",
    fontWeight: "700"
  },
  metaText: {
    color: "#b36237",
    fontSize: 12
  }
});
