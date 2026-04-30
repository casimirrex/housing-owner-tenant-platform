import { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

export function SectionCard({
  title,
  subtitle,
  children
}: PropsWithChildren<{ title: string; subtitle?: string }>) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fffaf4",
    borderRadius: 24,
    padding: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(23, 35, 38, 0.08)"
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#172326"
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: "#5e6c67"
  },
  body: {
    marginTop: 6,
    gap: 8
  }
});
