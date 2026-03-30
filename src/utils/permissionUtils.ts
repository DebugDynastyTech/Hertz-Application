import { Alert, Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";

// ── Open app settings so user can grant permission manually ──────────────────
function openSettings(permissionName: string) {
  Alert.alert(
    `${permissionName} Permission Required`,
    `You have denied ${permissionName} permission. Please go to Settings and enable it to use this feature.`,
    [
      { text: "Cancel", style: "cancel" },
      { text: "Open Settings", onPress: () => Linking.openSettings() },
    ]
  );
}

// ── Camera permission ─────────────────────────────────────────────────────────
export async function requestCameraPermission(): Promise<boolean> {
  const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
  if (status === "granted") return true;
  if (!canAskAgain) {
    openSettings("Camera");
  } else {
    Alert.alert("Camera Permission Required", "Please allow camera access to capture photos.");
  }
  return false;
}

// ── Location permission ───────────────────────────────────────────────────────
export async function requestLocationPermission(): Promise<boolean> {
  const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
  if (status === "granted") return true;
  if (!canAskAgain) {
    openSettings("Location");
  } else {
    Alert.alert("Location Permission Required", "Please allow location access to capture GPS coordinates.");
  }
  return false;
}

// ── Media library permission ──────────────────────────────────────────────────
export async function requestMediaLibraryPermission(): Promise<boolean> {
  const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
  if (status === "granted") return true;
  if (!canAskAgain) {
    openSettings("Storage");
  } else {
    Alert.alert("Storage Permission Required", "Please allow storage access to save photos to your gallery.");
  }
  return false;
}