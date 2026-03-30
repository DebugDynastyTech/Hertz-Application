import React, { useState } from "react";
import {
  View, Text, StyleSheet, Pressable, TextInput,
  Image, TouchableOpacity, ActivityIndicator, Alert,
  useWindowDimensions,
} from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export interface LocationImageEntry {
  latitude: string;
  longitude: string;
  image: { uri: string; timestamp: string } | null;
}

interface Props {
  entry: LocationImageEntry;
  index: number;
  onLatChange: (v: string) => void;
  onLngChange: (v: string) => void;
  onImageChange: (img: { uri: string; timestamp: string } | null) => void;
  onDelete: () => void;
}

export default function LocationImageRow({ entry, index, onLatChange, onLngChange, onImageChange, onDelete }: Props) {
  const [fetchingGps, setFetchingGps] = useState(false);
  const [capturing,   setCapturing]   = useState(false);
  const { width } = useWindowDimensions();
  const imgSize = (width - 80) / 4;

  // ── GPS ───────────────────────────────────────────────────────────────────
  const handleGps = async () => {
    if (fetchingGps) return;
    setFetchingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      onLatChange(loc.coords.latitude.toFixed(6));
      onLngChange(loc.coords.longitude.toFixed(6));
    } catch {
      Alert.alert("GPS Error", "Unable to fetch location.");
    } finally {
      setFetchingGps(false);
    }
  };

  // ── Camera capture ────────────────────────────────────────────────────────
  const handleCapture = async () => {
    if (capturing) return;
    setCapturing(true);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required", "Camera access is needed.");
        return;
      }

      // ── saveToPhotos: true saves photo to gallery at capture time ─────────
      // Works in Expo Go without needing expo-media-library permission
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
      });

      if (result.canceled) return;

      if (!result.assets || result.assets.length === 0) {
        Alert.alert("Camera Error", "No image was captured. Please try again.");
        return;
      }

      const asset = result.assets[0];
      if (!asset?.uri) {
        Alert.alert("Camera Error", "Could not read the captured image. Please try again.");
        return;
      }

      onImageChange({ uri: asset.uri, timestamp: new Date().toISOString() });
    } catch {
      Alert.alert("Camera Error", "Something went wrong while capturing. Please try again.");
    } finally {
      setCapturing(false);
    }
  };

  const handleRemoveImage = () => {
    Alert.alert("Remove Photo", "Remove this photo?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => onImageChange(null) },
    ]);
  };

  // ── Safe image uri ────────────────────────────────────────────────────────
  const safeImageUri: string | null = (() => {
    if (!entry.image) return null;
    if (typeof entry.image.uri === "string" && entry.image.uri.length > 0) return entry.image.uri;
    return null;
  })();

  return (
    <View style={styles.container}>
      {/* Row number + delete */}
      <View style={styles.rowHeader}>
        <View style={styles.indexBadge}>
          <Text style={styles.indexText}>#{index + 1}</Text>
        </View>
        <Pressable style={styles.deleteBtn} onPress={onDelete} hitSlop={8}>
          <MaterialCommunityIcons name="close" size={14} color="#6B7280" />
        </Pressable>
      </View>

      {/* Coordinates — read only, GPS fills them */}
      <View style={styles.coordRow}>
        <View style={styles.coordField}>
          <Text style={styles.label}>Latitude</Text>
          <TextInput
            style={styles.input}
            value={fetchingGps ? "" : entry.latitude}
            onChangeText={onLatChange}
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
            value={fetchingGps ? "" : entry.longitude}
            onChangeText={onLngChange}
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
            {fetchingGps
              ? <ActivityIndicator size="small" color="#fff" />
              : <MaterialCommunityIcons name="crosshairs-gps" size={18} color="#fff" />
            }
          </Pressable>
        </View>
      </View>

      {/* Photo */}
      <Text style={styles.label}>Photo</Text>

      {safeImageUri ? (
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: safeImageUri }}
            style={[styles.image, { width: imgSize * 2, height: imgSize * 2 }]}
          />
          <TouchableOpacity style={styles.removeImg} onPress={handleRemoveImage}>
            <MaterialCommunityIcons name="close" size={13} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.retakeBtn, capturing && styles.retakeBtnDisabled]}
            onPress={handleCapture}
            disabled={capturing}
            activeOpacity={0.85}
          >
            {capturing
              ? <ActivityIndicator size="small" color="#16A34A" />
              : <MaterialCommunityIcons name="camera-retake-outline" size={14} color="#16A34A" />
            }
            <Text style={styles.retakeText}>{capturing ? "Opening..." : "Retake"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.captureBtn, capturing && styles.captureBtnDisabled]}
          onPress={handleCapture}
          disabled={capturing}
          activeOpacity={0.85}
        >
          {capturing
            ? <ActivityIndicator size="small" color="#16A34A" />
            : <MaterialCommunityIcons name="camera-outline" size={20} color="#16A34A" />
          }
          <Text style={styles.captureBtnText}>{capturing ? "Opening Camera..." : "Capture Photo"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { backgroundColor: "#F9FAFB", borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#E5E7EB" },
  rowHeader:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  indexBadge:         { backgroundColor: "#F0FDF4", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "#BBF7D0" },
  indexText:          { fontSize: 12, fontWeight: "700", color: "#16A34A" },
  deleteBtn:          { width: 28, height: 28, borderRadius: 8, backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB", justifyContent: "center", alignItems: "center" },
  coordRow:           { flexDirection: "row", gap: 8, marginBottom: 12 },
  coordField:         { flex: 1 },
  gpsCol:             { width: 48 },
  label:              { fontSize: 11, fontWeight: "600", color: "#6B7280", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.3 },
  labelHidden:        { fontSize: 11, color: "transparent", marginBottom: 5 },
  input:              { height: 44, borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 10, backgroundColor: "#F3F4F6", fontSize: 13, color: "#111827" },
  gpsBtn:             { width: 44, height: 44, borderRadius: 10, backgroundColor: "#16A34A", justifyContent: "center", alignItems: "center" },
  gpsBtnActive:       { backgroundColor: "#86EFAC" },
  imageWrap:          { position: "relative", alignSelf: "flex-start", marginTop: 4 },
  image:              { borderRadius: 10 },
  removeImg:          { position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center" },
  retakeBtn:          { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  retakeBtnDisabled:  { opacity: 0.5 },
  retakeText:         { color: "#16A34A", fontSize: 13, fontWeight: "600" },
  captureBtn:         { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: "#BBF7D0", backgroundColor: "#F0FDF4", marginTop: 4 },
  captureBtnDisabled: { opacity: 0.5 },
  captureBtnText:     { color: "#16A34A", fontWeight: "700", fontSize: 14 },
});