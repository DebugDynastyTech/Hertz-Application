import React, { useState } from "react";
import { View, TextInput, StyleSheet, TextInputProps, Text } from "react-native";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export default function InputField({ label, error, ...props }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        {...props}
        placeholderTextColor="#9CA3AF"
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={[
          styles.input,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
          props.style,
        ]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", marginBottom: 14 },
  label: { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 6, letterSpacing: 0.3 },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FAFAFA",
    fontSize: 14,
    color: "#111827",
  },
  inputFocused: { borderColor: "#16A34A", backgroundColor: "#F0FDF4" },
  inputError: { borderColor: "#F87171", backgroundColor: "#FEF2F2" },
  errorText: { color: "#EF4444", fontSize: 11, marginTop: 4 },
});
