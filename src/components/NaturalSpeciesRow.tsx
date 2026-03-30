import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import InputField from "./InputField";

interface Props {
  naturalspeciesList: any[]; naturalspecies: string; planted: string; survival: string; height: string;
  onSpeciesChange: (v: string) => void; onPlantedChange: (v: string) => void;
  onSurvivalChange: (v: string) => void; onHeightChange: (v: string) => void;
  onDelete: () => void;
}

export default function NaturalSpeciesRow({
  naturalspeciesList, naturalspecies, planted, survival, height,
  onSpeciesChange, onPlantedChange, onSurvivalChange, onHeightChange, onDelete,
}: Props) {
  return (
    <View style={styles.container}>
      <Pressable style={styles.deleteBtn} onPress={onDelete} hitSlop={8}>
        <MaterialCommunityIcons name="close" size={14} color="#6B7280" />
      </Pressable>

      {/* Species picker — full width */}
      <Text style={styles.label}>Species</Text>
      <View style={styles.pickerBox}>
        <Picker selectedValue={naturalspecies} onValueChange={onSpeciesChange} style={styles.pickerInner}>
          <Picker.Item label="Select species..." value="" color="#9CA3AF" />
          {naturalspeciesList.map((item, i) => (
            <Picker.Item key={i} label={item.name || item} value={item.name || item} />
          ))}
        </Picker>
      </View>

      {/* Planted + Survival */}
      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Planted</Text>
          <InputField value={planted} onChangeText={onPlantedChange} keyboardType="numeric" placeholder="0" />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Survival</Text>
          <InputField value={survival} onChangeText={onSurvivalChange} keyboardType="numeric" placeholder="0" />
        </View>
      </View>

      {/* Height */}
      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Height (cm)</Text>
          <InputField value={height} onChangeText={onHeightChange} keyboardType="numeric" placeholder="0" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F9FAFB", borderRadius: 12, padding: 12,
    marginBottom: 10, borderWidth: 1, borderColor: "#E5E7EB", position: "relative",
  },
  deleteBtn: {
    position: "absolute", top: 10, right: 10,
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB",
    justifyContent: "center", alignItems: "center", zIndex: 10,
  },
  label: {
    fontSize: 11, fontWeight: "600", color: "#6B7280",
    marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.3,
  },
  pickerBox: {
    width: "100%", minHeight: 48,
    borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 12,
    justifyContent: "center", backgroundColor: "#fff",
    marginBottom: 10,
  },
  pickerInner: { width: "100%", height: 50, color: "#111827" },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
});