import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  reason: string;
  reasonList: string[];
  onReasonChange: (value: string) => void;
}

export default function ReasonSection({
  reason,
  reasonList,
  onReasonChange,
}: Props) {
  return (
    <View style={styles.card}>
      
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="warning-outline" size={18} color="#FFFFFF" />
        <Text style={styles.headerText}>Reason</Text>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={reason}
            onValueChange={onReasonChange}
            style={styles.picker}
          >
            <Picker.Item label="Select" value="" />
            {reasonList.map((item, index) => (
              <Picker.Item key={index} label={item} value={item} />
            ))}
          </Picker>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    marginVertical: 12,
    elevation: 2, // Android shadow
  },

  header: {
    backgroundColor: "#2F5D8A", // blue like image
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  headerText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },

  body: {
    padding: 16,
  },

  pickerContainer: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    overflow: "hidden",
  },

  picker: {
    height: 44,
    width: "100%",
  },
});