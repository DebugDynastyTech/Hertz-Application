import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

interface Props {
  wallList: any[]; wallType: string; rmt: string;
  onWallChange: (v: string) => void; onRmtChange: (v: string) => void; onDelete: () => void;
}

export default function ProtectionWallRow({ wallList, wallType, rmt, onWallChange, onRmtChange, onDelete }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>Wall Type</Text>
          <View style={styles.pickerBox}>
            <Picker selectedValue={wallType} onValueChange={onWallChange} style={styles.pickerInner}>
              <Picker.Item label="Select..." value="" color="#9CA3AF" />
              {wallList.map((item, i) => <Picker.Item key={i} label={item.name || item} value={item.name || item} />)}
            </Picker>
          </View>
        </View>

        <View style={styles.col}>
          <Text style={styles.label}>RMT</Text>
          <TextInput
            style={styles.input}
            value={rmt}
            onChangeText={onRmtChange}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.deleteCol}>
          <Text style={styles.labelHidden}>Del</Text>
          <Pressable style={styles.deleteBtn} onPress={onDelete} hitSlop={8}>
            <MaterialCommunityIcons name="close" size={14} color="#6B7280" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#F9FAFB", borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#E5E7EB" },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  col: { flex: 1 },
  deleteCol: { width: 40 },
  label: { fontSize: 11, fontWeight: "600", color: "#6B7280", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.3 },
  labelHidden: { fontSize: 11, color: "transparent", marginBottom: 5 },
  pickerBox: { minHeight: 48, borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 12, justifyContent: "center", backgroundColor: "#fff" },
  pickerInner: { width: "100%", height: 50, color: "#111827" },
  input: { height: 48, borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 12, backgroundColor: "#fff", fontSize: 14, color: "#111827" },
  deleteBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB", justifyContent: "center", alignItems: "center" },
});