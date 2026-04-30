import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ListingSummary } from "../api/types";

export function ListingTile({
  listing,
  onPress,
  secondaryLabel
}: {
  listing: ListingSummary;
  onPress: () => void;
  secondaryLabel?: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.meta}>
            {listing.locality}, {listing.city}
          </Text>
        </View>
        <Text style={styles.rent}>Rs. {listing.rent.toLocaleString("en-IN")}</Text>
      </View>
      <Text style={styles.meta}>
        {listing.bhk} • {listing.postedLabel}
      </Text>
      {secondaryLabel ? <Text style={styles.badge}>{secondaryLabel}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(23, 35, 38, 0.08)",
    gap: 10
  },
  header: {
    flexDirection: "row",
    gap: 12
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#172326"
  },
  meta: {
    color: "#5f6d69",
    fontSize: 13
  },
  rent: {
    color: "#20443b",
    fontWeight: "700"
  },
  badge: {
    color: "#b36237",
    fontSize: 12,
    fontWeight: "700"
  }
});
