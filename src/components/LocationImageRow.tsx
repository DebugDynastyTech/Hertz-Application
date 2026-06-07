// src/components/LocationImageRow.tsx
//
// Read-only display row for a captured image + its GPS coordinates.
//
// IMPORTANT: This row intentionally does NOT capture, retake, or re-stamp
// photos. All photo capture goes through the parent's
// `+ Add Image & Location` flow in app/data-entry.tsx, which runs the photo
// through the single StampView → captureRef pipeline (with fadeDuration=0
// and a white background — see that file's StampView for why). Keeping
// capture in exactly one place prevents the "dark photo" bug from
// regressing via a second code path with different defaults.
//
// To replace a photo: delete this row and re-add via the parent.

import React from "react";
import {
  View, Text, StyleSheet, Pressable, TextInput, Image,
  useWindowDimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export interface LocationImageEntry {
  latitude: string;
  longitude: string;
  image: { uri: string; timestamp: string } | null;
}

interface Props {
  entry: LocationImageEntry;
  index: number;
  onDelete: () => void;
}

export default function LocationImageRow({ entry, index, onDelete }: Props) {
  const { width } = useWindowDimensions();
  const imgSize = (width - 80) / 4;
  const safeImageUri = entry.image?.uri ?? null;

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

      {/* Coordinates — read-only display */}
      <View style={styles.coordRow}>
        <View style={styles.coordField}>
          <Text style={styles.label}>Latitude</Text>
          <TextInput
            style={styles.input}
            value={entry.latitude}
            editable={false}
            placeholder="0.000000"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <View style={styles.coordField}>
          <Text style={styles.label}>Longitude</Text>
          <TextInput
            style={styles.input}
            value={entry.longitude}
            editable={false}
            placeholder="0.000000"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Photo */}
      <Text style={styles.label}>Photo</Text>
      {safeImageUri ? (
        <Image
          source={{ uri: safeImageUri }}
          style={[styles.image, { width: imgSize * 2.4, height: imgSize * 2.4 }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.noImage, { width: imgSize * 2.4, height: imgSize * 2.4 }]}>
          <MaterialCommunityIcons name="image-off-outline" size={22} color="#9CA3AF" />
          <Text style={styles.noImageText}>No image</Text>
        </View>
      )}

      <Text style={styles.hint}>
        To replace this photo, remove this row and re-add it via{" "}
        <Text style={styles.hintEmph}>+ Add Image &amp; Location</Text>.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { backgroundColor: "#F9FAFB", borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#E5E7EB" },
  rowHeader:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  indexBadge:   { backgroundColor: "#F0FDF4", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "#BBF7D0" },
  indexText:    { fontSize: 12, fontWeight: "700", color: "#16A34A" },
  deleteBtn:    { width: 28, height: 28, borderRadius: 8, backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB", justifyContent: "center", alignItems: "center" },
  coordRow:     { flexDirection: "row", gap: 8, marginBottom: 12 },
  coordField:   { flex: 1 },
  label:        { fontSize: 11, fontWeight: "600", color: "#6B7280", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.3 },
  input:        { height: 44, borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 10, backgroundColor: "#F3F4F6", fontSize: 13, color: "#111827" },
  image:        { borderRadius: 10, marginTop: 4 },
  noImage:      { borderRadius: 10, marginTop: 4, backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB", justifyContent: "center", alignItems: "center", gap: 4 },
  noImageText:  { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },
  hint:         { marginTop: 10, fontSize: 11, color: "#6B7280", lineHeight: 16 },
  hintEmph:     { color: "#16A34A", fontWeight: "700" },
});
