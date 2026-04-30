import { StyleSheet, Text, View } from "react-native";

export function StatusPill({
  label,
  tone = "neutral"
}: {
  label: string;
  tone?: "neutral" | "success" | "warning";
}) {
  return (
    <View style={[styles.pill, tone === "success" ? styles.success : null, tone === "warning" ? styles.warning : null]}>
      <Text style={[styles.label, tone === "success" ? styles.successLabel : null, tone === "warning" ? styles.warningLabel : null]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(23, 35, 38, 0.08)"
  },
  success: {
    backgroundColor: "rgba(32, 68, 59, 0.12)"
  },
  warning: {
    backgroundColor: "rgba(179, 98, 55, 0.14)"
  },
  label: {
    color: "#5e6c67",
    fontSize: 12,
    fontWeight: "700"
  },
  successLabel: {
    color: "#20443b"
  },
  warningLabel: {
    color: "#b36237"
  }
});
