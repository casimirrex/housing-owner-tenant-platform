import { StyleSheet } from "react-native";

export const palette = {
  background: "#f6f0e8",
  surface: "#fffaf4",
  text: "#172326",
  muted: "#5e6c67",
  accent: "#20443b",
  highlight: "#b36237",
  border: "rgba(23, 35, 38, 0.08)"
};

export const mobileStyles = StyleSheet.create({
  container: {
    padding: 18,
    gap: 18,
    backgroundColor: palette.background
  },
  eyebrow: {
    color: palette.highlight,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.4
  },
  hero: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "700",
    color: palette.text
  },
  bodyText: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21
  },
  helperText: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 18
  },
  input: {
    borderRadius: 18,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: palette.border
  },
  textarea: {
    minHeight: 110,
    textAlignVertical: "top"
  },
  row: {
    flexDirection: "row",
    gap: 10
  },
  wrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: palette.border
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.text
  },
  inlineCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    gap: 6
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  metricCard: {
    width: "47%",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 14
  },
  metricValue: {
    fontSize: 26,
    fontWeight: "700",
    color: palette.text
  },
  metricLabel: {
    color: palette.muted,
    fontSize: 13
  }
});
