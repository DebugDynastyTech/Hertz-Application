import React from "react";
import {
  View, FlatList, Image, TouchableOpacity, Text,
  StyleSheet, useWindowDimensions, Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface ImageItem {
  uri: string;
  timestamp: string;
}
interface Props {
  images: ImageItem[];
  setImages: React.Dispatch<React.SetStateAction<ImageItem[]>>;
}

export default function ImagePickerGrid({ images, setImages }: Props) {
  const { width } = useWindowDimensions();
  const imageSize = (width - 60) / 3;

  const captureImage = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required", "Camera access is needed to capture survey photos.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });

      // ── FIXED: guard against canceled or empty assets ─────────────────────
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

      setImages((prev) => [
        ...prev,
        { uri: asset.uri, timestamp: new Date().toISOString() },
      ]);
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
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="camera-outline" size={18} color="#7C3AED" />
        </View>
        <Text style={styles.headerText}>Survey Photos</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{images.length}</Text>
        </View>
      </View>

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
              />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                <MaterialCommunityIcons name="close" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

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
  headerText: { flex: 1, color: "#5B21B6", fontWeight: "700", fontSize: 15 },
  countBadge: {
    backgroundColor: "#7C3AED", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
  },
  countText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  grid: { padding: 8 },
  image: { borderRadius: 10 },
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
