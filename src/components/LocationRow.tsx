import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface Props {
  latitude: string;
  longitude: string;
  index: number;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
  onDelete: () => void;
}

export default function LocationRow({
  latitude,
  longitude,
  index,
  onLatitudeChange,
  onLongitudeChange,
  onDelete,
}: Props) {
  const [fetchingGps, setFetchingGps] = useState(false);

  const handleGps = async () => {
    if (fetchingGps) return;

    setFetchingGps(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      onLatitudeChange(loc.coords.latitude.toFixed(6));
      onLongitudeChange(loc.coords.longitude.toFixed(6));
    } catch {
      Alert.alert("GPS Error", "Unable to fetch location.");
    } finally {
      setFetchingGps(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.rowHeader}>
        <View style={styles.indexBadge}>
          <Text style={styles.indexText}>#{index + 1}</Text>
        </View>

        <Pressable style={styles.deleteBtn} onPress={onDelete} hitSlop={8}>
          <MaterialCommunityIcons name="close" size={14} color="#6B7280" />
        </Pressable>
      </View>

      {/* Coordinates */}
      <View style={styles.coordRow}>
        <View style={styles.coordField}>
          <Text style={styles.label}>Latitude</Text>

          <TextInput
            style={styles.input}
            value={fetchingGps ? "" : latitude}
            onChangeText={onLatitudeChange}
            placeholder={fetchingGps ? "Fetching..." : "0.000000"}
            placeholderTextColor={fetchingGps ? "#16A34A" : "#9CA3AF"}
            editable={false}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.coordField}>
          <Text style={styles.label}>Longitude</Text>

          <TextInput
            style={styles.input}
            value={fetchingGps ? "" : longitude}
            onChangeText={onLongitudeChange}
            placeholder={fetchingGps ? "Fetching..." : "0.000000"}
            placeholderTextColor={fetchingGps ? "#16A34A" : "#9CA3AF"}
            editable={false}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.gpsCol}>
          <Text style={styles.labelHidden}>GPS</Text>

          <Pressable
            style={[styles.gpsBtn, fetchingGps && styles.gpsBtnActive]}
            onPress={handleGps}
            disabled={fetchingGps}
          >
            {fetchingGps ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={18}
                color="#fff"
              />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  indexBadge: {
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },

  indexText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16A34A",
  },

  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },

  coordRow: {
    flexDirection: "row",
    gap: 8,
  },

  coordField: {
    flex: 1,
  },

  gpsCol: {
    width: 48,
  },

  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  labelHidden: {
    fontSize: 11,
    color: "transparent",
    marginBottom: 5,
  },

  input: {
    height: 44,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    fontSize: 13,
    color: "#111827",
  },

  gpsBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#16A34A",
    justifyContent: "center",
    alignItems: "center",
  },

  gpsBtnActive: {
    backgroundColor: "#86EFAC",
  },
});
