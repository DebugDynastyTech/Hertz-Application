import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

type Variant = "primary" | "secondary" | "danger" | "outline";

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: Variant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: string;
  disabled?: boolean;
}

export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  variant = "primary",
  style,
  textStyle,
  icon,
  disabled = false, // ── FIXED: now destructured and used
}: Props) {
  const isDanger    = variant === "danger";
  const isOutline   = variant === "outline";
  const isSecondary = variant === "secondary";

  // ── FIXED: button is disabled if explicitly disabled OR loading ──────────
  const isDisabled = disabled || loading;

  if (isDanger) {
    return (
      <TouchableOpacity
        style={[styles.base, styles.dangerBtn, isDisabled && styles.disabledBtn, style]}
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#DC2626" size="small" />
        ) : (
          <Text style={[styles.dangerText, isDisabled && styles.disabledText, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  if (isOutline) {
    return (
      <TouchableOpacity
        style={[styles.base, styles.outlineBtn, isDisabled && styles.disabledBtn, style]}
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#16A34A" size="small" />
        ) : (
          <Text style={[styles.outlineText, isDisabled && styles.disabledText, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  if (isSecondary) {
    return (
      <TouchableOpacity
        style={[styles.base, styles.secondaryBtn, isDisabled && styles.disabledBtn, style]}
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#D97706" size="small" />
        ) : (
          <Text style={[styles.secondaryText, isDisabled && styles.disabledText, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.base, { overflow: "hidden" }, isDisabled && styles.disabledBtn, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={loading ? ["#166534", "#166534"] : isDisabled ? ["#9CA3AF", "#9CA3AF"] : ["#16A34A", "#15803D"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={[styles.primaryText, isDisabled && styles.disabledText, textStyle]}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base:          { borderRadius: 12, marginBottom: 10 },
  gradient:      { paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  primaryText:   { color: "#fff", fontWeight: "700", fontSize: 15 },
  dangerBtn:     { borderWidth: 1.5, borderColor: "#FCA5A5", backgroundColor: "#FEF2F2", paddingVertical: 14, alignItems: "center" },
  dangerText:    { color: "#DC2626", fontWeight: "700", fontSize: 15 },
  outlineBtn:    { borderWidth: 1.5, borderColor: "#16A34A", backgroundColor: "#F0FDF4", paddingVertical: 14, alignItems: "center" },
  outlineText:   { color: "#16A34A", fontWeight: "700", fontSize: 15 },
  secondaryBtn:  { borderWidth: 1.5, borderColor: "#FDE68A", backgroundColor: "#FFFBEB", paddingVertical: 14, alignItems: "center" },
  secondaryText: { color: "#D97706", fontWeight: "700", fontSize: 15 },
  // ── Disabled visual feedback ─────────────────────────────────────────────
  disabledBtn:   { opacity: 0.45 },
  disabledText:  { opacity: 0.7 },
});
