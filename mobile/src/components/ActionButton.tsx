import { Pressable, StyleSheet, Text } from "react-native";

export function ActionButton({
  label,
  onPress,
  variant = "primary",
  disabled = false
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" ? styles.secondaryButton : styles.primaryButton,
        disabled ? styles.disabledButton : null,
        pressed && !disabled ? styles.pressed : null
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === "secondary" ? styles.secondaryLabel : styles.primaryLabel,
          disabled ? styles.disabledLabel : null
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  primaryButton: {
    backgroundColor: "#20443b"
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(23, 35, 38, 0.1)"
  },
  label: {
    fontSize: 14,
    fontWeight: "700"
  },
  disabledButton: {
    opacity: 0.6
  },
  disabledLabel: {
    color: "#5e6c67"
  },
  primaryLabel: {
    color: "#fffaf4"
  },
  secondaryLabel: {
    color: "#172326"
  },
  pressed: {
    opacity: 0.86
  }
});
