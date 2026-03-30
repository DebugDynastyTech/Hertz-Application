import React from "react";
import { View, Text, StyleSheet } from "react-native";
import InputField from "./InputField";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props { value: string; onChangeText: (v: string) => void; }

export default function WaterFacilitySection({ value, onChangeText }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="water-outline" size={18} color="#16A34A" />
        </View>
        <Text style={styles.headerText}>Water Facility</Text>
      </View>
      <View style={styles.body}>
        <InputField value={value} onChangeText={onChangeText} placeholder="Describe the water facility available..." multiline style={{ height: 60, textAlignVertical: "top", paddingTop: 12 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#F9FAFB", paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  iconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#F0FDF4", justifyContent: "center", alignItems: "center" },
  headerText: { color: "#111827", fontWeight: "700", fontSize: 15 },
  body: { padding: 14 },
});