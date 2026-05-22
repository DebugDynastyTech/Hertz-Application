// src/components/ImagePickerGrid.tsx
import React from "react";
import {
  View, FlatList, Image, TouchableOpacity, Text,
  StyleSheet, useWindowDimensions, Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { requestCameraPermission, requestMediaLibraryPermission } from "../utils/permissionUtils";

export interface ImageItem {
  uri: string;
  timestamp: string;
}

interface Props {
  images: ImageItem[];
  setImages: React.Dispatch<React.SetStateAction<ImageItem[]>>;
  /** Optional: set to true if you want to also watermark these photos */
  applyStamp?: boolean;
  referenceId?: string;
}

export default function ImagePickerGrid({ images, setImages, applyStamp, referenceId }: Props) {
  const { width } = useWindowDimensions();
  const imageSize = (width - 60) / 3;

  const captureImage = async () => {
    // 1. Camera permission
    const camGranted = await requestCameraPermission();
    if (!camGranted) return;

    try {
      const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });

      if (result.canceled) return;
      if (!result.assets?.length || !result.assets[0]?.uri) {
        Alert.alert("Camera Error", "No image was captured. Please try again.");
        return;
      }

      const asset      = result.assets[0];
      const capturedAt = new Date().toISOString();
      let   finalUri   = asset.uri;

      // 2. Optionally apply watermark stamp
      if (applyStamp) {
        try {
          const { applyWatermark } = await import("../utils/watermarkUtils");
          finalUri = await applyWatermark(finalUri, {
            latitude:    "N/A",   // Grid photos don't have GPS — adjust if needed
            longitude:   "N/A",
            timestamp:   capturedAt,
            referenceId: referenceId,
          });
        } catch (stampErr) {
          console.warn("[ImagePickerGrid] stamp failed, using raw image:", stampErr);
        }
      }

      // 3. Save to gallery
      const mediaGranted = await requestMediaLibraryPermission();
      if (mediaGranted) {
        try {
          await MediaLibrary.saveToLibraryAsync(finalUri);
        } catch (saveErr) {
          console.warn("[ImagePickerGrid] gallery save failed:", saveErr);
          // Non-fatal
        }
      }

      // 4. Add to grid state
      setImages((prev) => [...prev, { uri: finalUri, timestamp: capturedAt }]);
    } catch {
      Alert.alert("Camera Error", "Something went wrong. Please try again.");
    }
  };

  const removeImage = (index: number) => {
    Alert.alert("Remove Photo", "Remove this photo from the survey?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: () => setImages((prev) => prev.filter((_, i) => i !== index)),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="camera-outline" size={18} color="#7C3AED" />
        </View>
        <Text style={styles.headerText}>Survey Photos</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{images.length}</Text>
        </View>
      </View>

      {/* Grid */}
      {images.length > 0 && (
        <FlatList
          data={images}
          keyExtractor={(_, i) => i.toString()}
          numColumns={3}
          scrollEnabled={false}
          contentContainerStyle={styles.grid}
          renderItem={({ item, index }) => (
            <View style={{ position: "relative", margin: 4 }}>
              <Image
                source={{ uri: item.uri }}
                style={[styles.image, { width: imageSize - 8, height: imageSize - 8 }]}
                resizeMode="cover"
              />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                <MaterialCommunityIcons name="close" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Add button */}
      <TouchableOpacity style={styles.addBtn} onPress={captureImage} activeOpacity={0.85}>
        <MaterialCommunityIcons name="camera-plus-outline" size={20} color="#7C3AED" />
        <Text style={styles.addBtnText}>Add Photo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F5F3FF", borderRadius: 16,
    borderWidth: 1, borderColor: "#DDD6FE", marginVertical: 16, overflow: "hidden",
  },
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#EDE9FE", paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: "#DDD6FE",
  },
  iconWrap: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: "#DDD6FE",
    justifyContent: "center", alignItems: "center",
  },
  headerText:  { flex: 1, color: "#5B21B6", fontWeight: "700", fontSize: 15 },
  countBadge:  { backgroundColor: "#7C3AED", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countText:   { color: "#fff", fontSize: 12, fontWeight: "700" },
  grid:        { padding: 8 },
  image:       { borderRadius: 10 },
  removeBtn: {
    position: "absolute", top: 2, right: 2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center",
  },
  addBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14,
  },
  addBtnText: { color: "#7C3AED", fontWeight: "700", fontSize: 14 },
});