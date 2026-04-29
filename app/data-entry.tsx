import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  AppStateStatus,
  BackHandler,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { captureRef } from "react-native-view-shot";

import InputField from "../src/components/InputField";
import LocationImageRow, {
  LocationImageEntry,
} from "../src/components/LocationImageRow";
import LocationRow from "../src/components/LocationRow";
import NaturalSpeciesRow from "../src/components/NaturalSpeciesRow";
import PrimaryButton from "../src/components/PrimaryButton";
import ProtectionWallRow from "../src/components/ProtectionWallRow";
import SpeciesRow from "../src/components/SpeciesRow";
import WaterFacilitySection from "../src/components/WaterFacilitySection";

import { fetchEntries } from "../src/services/entryService";
import {
  getDraftByIndex,
  getDrafts,
  saveDraft,
  updateDraft,
} from "../src/storage/draftStrorage";
import { checkInternet } from "../src/utils/network";
import { WatermarkData, buildStampLines } from "../src/utils/watermarkUtils";

const T = { primary: "#16A34A", border: "#E5E7EB" };
const SCREEN_WIDTH = Dimensions.get("window").width;

// ── Permission helpers ────────────────────────────────────────────────────────
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

async function requestCameraPermission(): Promise<boolean> {
  const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
  if (status === "granted") return true;
  if (!canAskAgain) openSettings("Camera");
  else Alert.alert("Camera Permission Required", "Please allow camera access to capture photos.");
  return false;
}

async function requestLocationPermission(): Promise<boolean> {
  const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
  if (status === "granted") return true;
  if (!canAskAgain) openSettings("Location");
  else Alert.alert("Location Permission Required", "Please allow location access to capture GPS coordinates.");
  return false;
}

async function requestMediaPermission(): Promise<boolean> {
  const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
  if (status === "granted") return true;
  if (!canAskAgain) openSettings("Storage");
  return false;
}

type ModalType = "success" | "error" | "warning" | "info";
interface ModalState {
  visible: boolean;
  type: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const MODAL_CFG = {
  success: { icon: "check-circle",  color: "#16A34A", bg: "#F0FDF4", border: "#86EFAC" },
  error:   { icon: "alert-circle",  color: "#DC2626", bg: "#FEF2F2", border: "#FCA5A5" },
  warning: { icon: "alert",         color: "#D97706", bg: "#FFFBEB", border: "#FCD34D" },
  info:    { icon: "information",   color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
};

function AppModal({ m, onClose }: { m: ModalState; onClose: () => void }) {
  const cfg = MODAL_CFG[m.type];
  return (
    <Modal visible={m.visible} transparent animationType="fade">
      <View style={ms.overlay}>
        <View style={[ms.card, { borderColor: cfg.border, backgroundColor: cfg.bg }]}>
          <View style={[ms.icon, { backgroundColor: `${cfg.color}15` }]}>
            <MaterialCommunityIcons name={cfg.icon as any} size={36} color={cfg.color} />
          </View>
          <Text style={[ms.title, { color: cfg.color }]}>{m.title}</Text>
          {m.message ? <Text style={ms.msg}>{m.message}</Text> : null}
          <View style={ms.actions}>
            {m.onCancel && (
              <TouchableOpacity style={[ms.btn, ms.cancelBtn]} onPress={() => { m.onCancel?.(); onClose(); }}>
                <Text style={ms.cancelTxt}>{m.cancelText || "Cancel"}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[ms.btn, { backgroundColor: cfg.color, flex: m.onCancel ? 1 : undefined, minWidth: 120 }]}
              onPress={() => { m.onConfirm?.(); onClose(); }}
            >
              <Text style={ms.confirmTxt}>{m.confirmText || "OK"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const ms = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 32 },
  card:       { width: "100%", borderRadius: 24, padding: 24, borderWidth: 1.5, alignItems: "center", elevation: 10 },
  icon:       { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  title:      { fontSize: 18, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  msg:        { fontSize: 14, color: "#4B5563", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  actions:    { flexDirection: "row", gap: 10, width: "100%" },
  btn:        { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cancelBtn:  { backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB" },
  cancelTxt:  { color: "#374151", fontWeight: "700", fontSize: 14 },
  confirmTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
});

function SectionHeader({ icon, title }: { icon: any; title: string }) {
  return (
    <View style={sh.wrap}>
      <View style={sh.iconWrap}>
        <MaterialCommunityIcons name={icon} size={17} color={T.primary} />
      </View>
      <Text style={sh.title}>{title}</Text>
    </View>
  );
}
const sh = StyleSheet.create({
  wrap:     { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: "#F9FAFB", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  iconWrap: { width: 30, height: 30, borderRadius: 9, backgroundColor: "#F0FDF4", justifyContent: "center", alignItems: "center" },
  title:    { fontSize: 15, fontWeight: "700", color: "#111827" },
});

// ── Accuracy helpers ──────────────────────────────────────────────────────────
function getAccuracyColor(accuracy: number | null): string {
  if (accuracy === null) return "#9CA3AF";
  if (accuracy <= 15) return "#16A34A";
  if (accuracy <= 30) return "#D97706";
  return "#DC2626";
}
function getAccuracyLabel(accuracy: number | null): string {
  if (accuracy === null) return "Fetching...";
  if (accuracy <= 15) return "Good";
  if (accuracy <= 30) return "Fair";
  return "Poor";
}

// ── Live GPS Card ─────────────────────────────────────────────────────────────
interface LiveGpsCardProps {
  photoUri: string;
  latitude: string;
  longitude: string;
  accuracy: number | null;
  onConfirm: () => void;
  confirming: boolean;
}

function LiveGpsCard({ photoUri, latitude, longitude, accuracy, onConfirm, confirming }: LiveGpsCardProps) {
  const color = getAccuracyColor(accuracy);
  const label = getAccuracyLabel(accuracy);
  return (
    <View style={gps.card}>
      <SectionHeader icon="crosshairs-gps" title="Live GPS — Select Location" />
      <View style={gps.body}>
        <Image source={{ uri: photoUri }} style={gps.preview} resizeMode="cover" />
        <View style={[gps.accuracyRow, { borderColor: color }]}>
          <View style={[gps.accuracyDot, { backgroundColor: color }]} />
          <View style={{ flex: 1 }}>
            <Text style={gps.accuracyLabel}>Accuracy</Text>
            <Text style={[gps.accuracyValue, { color }]}>
              {accuracy !== null ? `±${accuracy.toFixed(1)} m — ${label}` : "Fetching GPS..."}
            </Text>
          </View>
          <MaterialCommunityIcons name={accuracy !== null && accuracy <= 15 ? "check-circle" : "loading"} size={22} color={color} />
        </View>
        <View style={gps.coordsRow}>
          <View style={gps.coordBox}>
            <Text style={gps.coordLabel}>Latitude</Text>
            <Text style={gps.coordValue}>{latitude || "—"}</Text>
          </View>
          <View style={gps.coordDivider} />
          <View style={gps.coordBox}>
            <Text style={gps.coordLabel}>Longitude</Text>
            <Text style={gps.coordValue}>{longitude || "—"}</Text>
          </View>
        </View>
        <Text style={gps.hint}>
          {accuracy !== null && accuracy <= 15
            ? "✅ Good accuracy — you can save now."
            : "⏳ Waiting for better accuracy... or save now if acceptable."}
        </Text>
        <TouchableOpacity
          style={[gps.confirmBtn, { backgroundColor: color }, confirming && { opacity: 0.7 }]}
          onPress={onConfirm}
          disabled={confirming || latitude === ""}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="map-marker-check" size={18} color="#fff" />
          <Text style={gps.confirmBtnText}>{confirming ? "Saving..." : "Use This Location"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const gps = StyleSheet.create({
  card:           { backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
  body:           { padding: 16, gap: 12 },
  preview:        { width: "100%", height: 180, borderRadius: 12 },
  accuracyRow:    { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1.5, backgroundColor: "#F9FAFB" },
  accuracyDot:    { width: 10, height: 10, borderRadius: 5 },
  accuracyLabel:  { fontSize: 11, color: "#6B7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
  accuracyValue:  { fontSize: 15, fontWeight: "700", marginTop: 2 },
  coordsRow:      { flexDirection: "row", backgroundColor: "#F9FAFB", borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", overflow: "hidden" },
  coordBox:       { flex: 1, padding: 12, alignItems: "center" },
  coordDivider:   { width: 1, backgroundColor: "#E5E7EB" },
  coordLabel:     { fontSize: 11, color: "#6B7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 },
  coordValue:     { fontSize: 13, color: "#111827", fontWeight: "700" },
  hint:           { fontSize: 12, color: "#6B7280", textAlign: "center", lineHeight: 18 },
  confirmBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  confirmBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

// ── Safe helpers ──────────────────────────────────────────────────────────────
function safeArray(val: any): any[] {
  return Array.isArray(val) ? val : [];
}
function safeDateString(val: any): string {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch { return ""; }
}
function restoreImageLocations(draftData: any): LocationImageEntry[] {
  if (Array.isArray(draftData?.imageLocations) && draftData.imageLocations.length > 0) {
    return draftData.imageLocations.map((e: any) => ({
      latitude:  e.latitude  ?? "",
      longitude: e.longitude ?? "",
      image:     e.image     ?? null,
    }));
  }
  if (Array.isArray(draftData?.images) && draftData.images.length > 0) {
    return draftData.images.map((img: any) => ({ latitude: "", longitude: "", image: img }));
  }
  return [];
}
function populateFromDraft(draft: any) {
  return {
    referenceId:        draft.referenceId              ?? "",
    date:               safeDateString(draft.date),
    numberOfRows:       draft.numberOfRows?.toString() ?? "",
    plantsPerRow:       draft.plantsPerRow?.toString() ?? "",
    village:            draft.village                  ?? "",
    reason:             draft.reason                   ?? "",
    waterFacility:      draft.waterFacility            ?? "",
    speciesRows:        safeArray(draft.speciesRows).length ? safeArray(draft.speciesRows) : [{ species: "", planted: "", survival: "", height: "" }],
    naturalspeciesRows: safeArray(draft.naturalspeciesRows).length ? safeArray(draft.naturalspeciesRows) : [{ species: "", planted: "", survival: "", height: "" }],
    protectionRows:     safeArray(draft.protectionRows).length ? safeArray(draft.protectionRows) : [{ wallType: "", rmt: "" }],
    locations:          safeArray(draft.locationRows).length
                          ? safeArray(draft.locationRows).map((r: any) => ({ latitude: r.latitude ?? r.lat?.toString() ?? "", longitude: r.longitude ?? r.long?.toString() ?? "" }))
                          : [{ latitude: "", longitude: "" }],
    imageLocations: restoreImageLocations(draft),
  };
}

// ── Save to gallery ───────────────────────────────────────────────────────────
async function saveToGallery(uri: string): Promise<void> {
  try {
    const granted = await requestMediaPermission();
    if (!granted) return;
    await MediaLibrary.saveToLibraryAsync(uri);
  } catch { }
}

// ── StampView ─────────────────────────────────────────────────────────────────
interface StampViewProps {
  uri: string;
  stampRef: React.RefObject<View | null>;
  watermark: WatermarkData;
  photoWidth: number;
  photoHeight: number;
}
function StampView({ uri, stampRef, watermark, photoWidth, photoHeight }: StampViewProps) {
  // Use real photo dimensions to preserve landscape/portrait orientation
  const aspectRatio = photoHeight > 0 ? photoHeight / photoWidth : 1.33;
  const W = SCREEN_WIDTH;
  const H = Math.round(W * aspectRatio);
  const lines    = buildStampLines(watermark);
  const fontSize = Math.max(13, Math.round(W * 0.032));
  const pad      = Math.max(10, Math.round(W * 0.025));
  return (
    <View ref={stampRef} style={{ position: "absolute", left: -99999, top: 0, width: W, height: H, backgroundColor: "#000" }} collapsable={false}>
      <Image source={{ uri }} style={{ width: W, height: H, resizeMode: "cover" }} />
      <View style={{ position: "absolute", bottom: pad, left: 0, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: pad, paddingVertical: Math.round(pad * 0.6), borderTopRightRadius: 6 }}>
        {lines.map((line, i) => (
          <Text key={i} style={{ color: "#fff", fontSize, fontWeight: "600", letterSpacing: 0.3, lineHeight: fontSize * 1.6 }}>{line}</Text>
        ))}
      </View>
    </View>
  );
}

const AUTO_SAVE_MARKER = "__autosave__";

export default function DataEntry() {
  const router = useRouter();

  const params     = useLocalSearchParams<{ editMode: string; draftIndex: string; }>();
  const isEditMode = params.editMode === "true";
  const draftIndex = isEditMode ? Number(params.draftIndex) : -1;

  const [draftData,   setDraftData]   = useState<any | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(!isEditMode);

  const [referenceId,        setReferenceId]       = useState("");
  const [date,               setDate]              = useState("");
  const [numberOfRows,       setNumberOfRows]       = useState("");
  const [plantsPerRow,       setPlantsPerRow]       = useState("");
  const [village,            setVillage]            = useState("");
  const [reason,             setReason]             = useState("");
  const [waterFacility,      setWaterFacility]      = useState("");
  const [speciesRows,        setSpeciesRows]        = useState([{ species: "", planted: "", survival: "", height: "" }]);
  const [naturalspeciesRows, setNaturalspeciesRows] = useState([{ species: "", planted: "", survival: "", height: "" }]);
  const [protectionRows,     setProtectionRows]     = useState([{ wallType: "", rmt: "" }]);
  const [locations,          setLocations]          = useState([{ latitude: "", longitude: "" }]);
  const [imageLocations,     setImageLocations]     = useState<LocationImageEntry[]>([]);

  const [speciesList,        setSpeciesList]        = useState<any[]>([]);
  const [naturalspeciesList, setNaturalspeciesList] = useState<any[]>([]);
  const [villages,           setVillages]           = useState<any[]>([]);
  const [reasonList,         setReasonList]         = useState<any[]>([]);
  const [protectionWallList, setProtectionWallList] = useState<any[]>([]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshing,     setRefreshing]     = useState(false);
  const [refError,       setRefError]       = useState("");
  const [dateError,      setDateError]      = useState("");
  const [villageError,   setVillageError]   = useState("");
  const [addingImage,    setAddingImage]    = useState(false);

  const [liveGps, setLiveGps] = useState<{ photoUri: string; latitude: string; longitude: string; accuracy: number | null; photoWidth: number; photoHeight: number; } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const gpsWatchRef = useRef<Location.LocationSubscription | null>(null);

  const [pendingWatermark, setPendingWatermark] = useState<{ uri: string; watermark: WatermarkData; lat: string; lng: string; photoWidth: number; photoHeight: number; } | null>(null);
  const stampRef = useRef<View>(null);

  const [modal, setModal] = useState<ModalState>({ visible: false, type: "info", title: "", message: "" });
  const showModal  = (cfg: Omit<ModalState, "visible">) => setModal({ ...cfg, visible: true });
  const closeModal = () => setModal((m) => ({ ...m, visible: false, onConfirm: undefined, onCancel: undefined }));

  const autoSaveIndexRef  = useRef<number | null>(null);
  const savedManuallyRef  = useRef(false);
  const createdAtRef      = useRef(new Date().toISOString());

  const refRef            = useRef(referenceId);
  const dateRef           = useRef(date);
  const numberOfRowsRef   = useRef(numberOfRows);
  const plantsPerRowRef   = useRef(plantsPerRow);
  const villageRef        = useRef(village);
  const reasonRef         = useRef(reason);
  const waterFacilityRef  = useRef(waterFacility);
  const speciesRowsRef    = useRef(speciesRows);
  const naturalRowsRef    = useRef(naturalspeciesRows);
  const protectionRowsRef = useRef(protectionRows);
  const locationsRef      = useRef(locations);
  const imageLocRef       = useRef(imageLocations);

  useEffect(() => { refRef.current            = referenceId; },        [referenceId]);
  useEffect(() => { dateRef.current           = date; },               [date]);
  useEffect(() => { numberOfRowsRef.current   = numberOfRows; },       [numberOfRows]);
  useEffect(() => { plantsPerRowRef.current   = plantsPerRow; },       [plantsPerRow]);
  useEffect(() => { villageRef.current        = village; },            [village]);
  useEffect(() => { reasonRef.current         = reason; },             [reason]);
  useEffect(() => { waterFacilityRef.current  = waterFacility; },      [waterFacility]);
  useEffect(() => { speciesRowsRef.current    = speciesRows; },        [speciesRows]);
  useEffect(() => { naturalRowsRef.current    = naturalspeciesRows; }, [naturalspeciesRows]);
  useEffect(() => { protectionRowsRef.current = protectionRows; },     [protectionRows]);
  useEffect(() => { locationsRef.current      = locations; },          [locations]);
  useEffect(() => { imageLocRef.current       = imageLocations; },     [imageLocations]);

  const buildEntryFromRefs = (createdAt: string) => ({
    referenceId:        refRef.current,
    date:               dateRef.current,
    village:            villageRef.current,
    numberOfRows:       numberOfRowsRef.current,
    plantsPerRow:       plantsPerRowRef.current,
    waterFacility:      waterFacilityRef.current,
    reason:             reasonRef.current,
    speciesRows:        speciesRowsRef.current,
    naturalspeciesRows: naturalRowsRef.current,
    protectionRows:     protectionRowsRef.current,
    locationRows:       locationsRef.current.map((e) => ({ latitude: e.latitude, longitude: e.longitude })),
    imageLocations:     imageLocRef.current.map((e) => ({ latitude: e.latitude ?? "", longitude: e.longitude ?? "", image: e.image ?? null })),
    images:             imageLocRef.current.filter((e) => e.image).map((e) => e.image),
    createdAt,
    [AUTO_SAVE_MARKER]: true,
  });

  const performAutoSave = async () => {
    if (savedManuallyRef.current) return;
    if (!refRef.current.trim()) return;
    if (isEditMode) return;
    try {
      const entry = buildEntryFromRefs(createdAtRef.current);
      if (autoSaveIndexRef.current !== null) {
        await updateDraft(autoSaveIndexRef.current, entry);
      } else {
        const existing = await getDrafts();
        autoSaveIndexRef.current = existing.length;
        await saveDraft(entry);
      }
    } catch { }
  };

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "background" || nextState === "inactive") performAutoSave();
    });
    return () => sub.remove();
  }, [isEditMode]);

  useEffect(() => {
    const onBackPress = () => {
      performAutoSave().then(() => router.back());
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [isEditMode]);

  useEffect(() => {
    return () => {
      performAutoSave();
      gpsWatchRef.current?.remove();
    };
  }, [isEditMode]);

  useEffect(() => {
    if (!pendingWatermark) return;
    const timer = setTimeout(async () => {
      try {
        if (!stampRef.current) return;
        const watermarkedUri = await captureRef(stampRef, { format: "jpg", quality: 0.9 });
        await saveToGallery(watermarkedUri);
        setImageLocations((prev) => [...prev, {
          latitude:  pendingWatermark.lat,
          longitude: pendingWatermark.lng,
          image:     { uri: watermarkedUri, timestamp: pendingWatermark.watermark.timestamp },
        }]);
      } catch {
        setImageLocations((prev) => [...prev, {
          latitude:  pendingWatermark.lat,
          longitude: pendingWatermark.lng,
          image:     { uri: pendingWatermark.uri, timestamp: pendingWatermark.watermark.timestamp },
        }]);
      } finally {
        setPendingWatermark(null);
        setConfirming(false);
        setAddingImage(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [pendingWatermark]);

  useEffect(() => {
    if (!isEditMode) return;
    const loadDraft = async () => {
      try {
        const draft = await getDraftByIndex(draftIndex);
        if (!draft) {
          showModal({ type: "error", title: "Draft Not Found", message: "This draft could not be loaded.", confirmText: "Go Back", onConfirm: () => router.back() });
          return;
        }
        setDraftData(draft);
        createdAtRef.current = draft.createdAt ?? new Date().toISOString();
        const filled = populateFromDraft(draft);
        setReferenceId(filled.referenceId);
        setDate(filled.date);
        setNumberOfRows(filled.numberOfRows);
        setPlantsPerRow(filled.plantsPerRow);
        setVillage(filled.village);
        setReason(filled.reason);
        setWaterFacility(filled.waterFacility);
        setSpeciesRows(filled.speciesRows);
        setNaturalspeciesRows(filled.naturalspeciesRows);
        setProtectionRows(filled.protectionRows);
        setLocations(filled.locations);
        setImageLocations(filled.imageLocations);
      } catch {
        showModal({ type: "error", title: "Load Error", message: "Failed to load draft data.", confirmText: "Go Back", onConfirm: () => router.back() });
      } finally {
        setDraftLoaded(true);
      }
    };
    loadDraft();
  }, [isEditMode, draftIndex]);

  const loadMasters = async (refresh = false, silent = true) => {
    try {
      if (refresh) setRefreshing(true);
      const data = await fetchEntries(refresh);
      if (!data) return;
      setVillages(safeArray(data.villages));
      setSpeciesList(safeArray(data.species));
      setNaturalspeciesList(safeArray(data.natural_species));
      setProtectionWallList(safeArray(data.protection_walls));
      setReasonList(safeArray(data.reasons));
      if (refresh && !silent)
        showModal({ type: "success", title: "Data Refreshed", message: "Master data updated successfully." });
    } catch {
      if (refresh && !silent)
        showModal({ type: "error", title: "Refresh Failed", message: "Could not fetch latest data." });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadMasters(false, true);
      const online = await checkInternet();
      if (online) await loadMasters(true, true);
    };
    init();
  }, []);

  const updateLocation      = (index: number, patch: any) => setLocations((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  const updateImageLocation = (index: number, patch: any) => setImageLocations((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) { setDate(selectedDate.toISOString().split("T")[0]); setDateError(""); }
  };

  const pickerDate = (() => {
    try {
      if (!date) return new Date();
      const d = new Date(date);
      return isNaN(d.getTime()) ? new Date() : d;
    } catch { return new Date(); }
  })();

  const buildLocalEntry = (createdAt: string) => ({
    referenceId, date, village, numberOfRows, plantsPerRow,
    speciesRows, naturalspeciesRows, protectionRows,
    locationRows:   locations.map((e) => ({ latitude: e.latitude, longitude: e.longitude })),
    imageLocations: imageLocations.map((e) => ({ latitude: e.latitude ?? "", longitude: e.longitude ?? "", image: e.image ?? null })),
    images:         imageLocations.filter((e) => e.image).map((e) => e.image),
    waterFacility, reason, createdAt,
  });

  const handleAddImageLocation = async () => {
    if (addingImage) return;
    setAddingImage(true);
    try {
      const camGranted = await requestCameraPermission();
      if (!camGranted) { setAddingImage(false); return; }
      const locGranted = await requestLocationPermission();
      if (!locGranted) { setAddingImage(false); return; }

      const photo = await ImagePicker.launchCameraAsync({ quality: 0.9 });
      if (photo.canceled) { setAddingImage(false); return; }
      if (!photo.assets || photo.assets.length === 0) { setAddingImage(false); return; }
      const asset = photo.assets[0];
      if (!asset?.uri) { setAddingImage(false); return; }

      const firstLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
      setLiveGps({
        photoUri:    asset.uri,
        latitude:    firstLoc.coords.latitude.toFixed(6),
        longitude:   firstLoc.coords.longitude.toFixed(6),
        accuracy:    firstLoc.coords.accuracy,
        photoWidth:  asset.width  ?? SCREEN_WIDTH,
        photoHeight: asset.height ?? Math.round(SCREEN_WIDTH * 1.33),
      });

      gpsWatchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 0 },
        (loc) => {
          setLiveGps((prev) => prev ? {
            ...prev,
            latitude:  loc.coords.latitude.toFixed(6),
            longitude: loc.coords.longitude.toFixed(6),
            accuracy:  loc.coords.accuracy,
          } : prev);
        }
      );
    } catch {
      setAddingImage(false);
    }
  };

  const handleConfirmLocation = () => {
    if (!liveGps || confirming) return;
    setConfirming(true);
    gpsWatchRef.current?.remove();
    gpsWatchRef.current = null;
    const timestamp = new Date().toISOString();
    setPendingWatermark({
      uri: liveGps.photoUri,
      watermark: { latitude: liveGps.latitude, longitude: liveGps.longitude, timestamp, referenceId: referenceId || undefined },
      lat: liveGps.latitude,
      lng: liveGps.longitude,
      photoWidth:  liveGps.photoWidth,
      photoHeight: liveGps.photoHeight,
    });
    setLiveGps(null);
  };

  const handleSaveDraft = async () => {
    if (!referenceId.trim()) {
      setRefError("Reference ID is required");
      showModal({ type: "warning", title: "Reference ID Required", message: "Please enter a Reference ID before saving." });
      return;
    }
    const entry = buildLocalEntry(draftData?.createdAt ?? createdAtRef.current);
    if (isEditMode) {
      await updateDraft(draftIndex, entry);
      savedManuallyRef.current = true;
      showModal({ type: "success", title: "Draft Updated", message: "Your changes have been saved to drafts.", confirmText: "Go to Reports", onConfirm: () => router.replace("/drafts") });
    } else {
      if (autoSaveIndexRef.current !== null) {
        await updateDraft(autoSaveIndexRef.current, entry);
      } else {
        await saveDraft(entry);
      }
      savedManuallyRef.current = true;
      showModal({ type: "success", title: "Draft Saved", message: "Entry saved locally. Upload anytime from Reports.", confirmText: "Go to Dashboard", onConfirm: () => router.replace("/dashboard") });
    }
  };

  if (!draftLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F1F5F9" }}>
        <AppModal m={modal} onClose={closeModal} />
        <MaterialCommunityIcons name="loading" size={40} color={T.primary} />
        <Text style={{ marginTop: 12, color: "#6B7280", fontSize: 14 }}>Loading draft...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <AppModal m={modal} onClose={closeModal} />

      {pendingWatermark && (
        <StampView
          uri={pendingWatermark.uri}
          stampRef={stampRef}
          watermark={pendingWatermark.watermark}
          photoWidth={pendingWatermark.photoWidth}
          photoHeight={pendingWatermark.photoHeight}
        />
      )}

      <LinearGradient
        colors={["#0A1628", "#0F3D2E"]}
        style={styles.pageHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerOrb} />
        {isEditMode && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              performAutoSave().then(() => router.back());
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        <Text style={styles.pageTitle}>
          {isEditMode ? "Edit Draft" : "New Entry"}
        </Text>
        <Text style={styles.pageSubtitle}>
          {isEditMode
            ? `Editing #${draftData?.referenceId || "—"}`
            : "Forest Monitoring Survey"}
        </Text>
        <Pressable
          style={styles.refreshBtn}
          onPress={() => loadMasters(true, false)}
          disabled={refreshing}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={15}
            color={refreshing ? "rgba(255,255,255,0.35)" : "#22C55E"}
          />
          <Text
            style={[
              styles.refreshText,
              refreshing && { color: "rgba(255,255,255,0.35)" },
            ]}
          >
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </Text>
        </Pressable>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Info */}
          <View style={styles.card}>
            <SectionHeader
              icon="information-outline"
              title="Basic Information"
            />
            <View style={styles.cardBody}>
              <Text style={styles.label}>
                Reference ID <Text style={styles.req}>*</Text>
              </Text>
              <InputField
                value={referenceId}
                onChangeText={(t) => {
                  setReferenceId(t.replace(/\s+/g, "_"));
                  setRefError("");
                }}
                placeholder="Enter Reference ID"
                error={refError}
              />
              <Text style={styles.label}>
                Date of Monitoring <Text style={styles.req}>*</Text>
              </Text>
              <Pressable onPress={() => setShowDatePicker(true)}>
                <View
                  style={[styles.dateField, dateError ? styles.fieldErr : null]}
                >
                  <MaterialCommunityIcons
                    name="calendar-outline"
                    size={18}
                    color={date ? T.primary : "#9CA3AF"}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      color: date ? "#111827" : "#9CA3AF",
                      marginLeft: 8,
                    }}
                  >
                    {date || "Select date..."}
                  </Text>
                </View>
              </Pressable>
              {dateError ? (
                <Text style={styles.errTxt}>{dateError}</Text>
              ) : null}
              {showDatePicker && (
                <DateTimePicker
                  value={pickerDate}
                  mode="date"
                  display="default"
                  onChange={onChangeDate}
                  maximumDate={new Date()}
                />
              )}
              <Text style={[styles.label, { marginTop: 6 }]}>
                Village <Text style={styles.req}>*</Text>
              </Text>
              <View
                style={[
                  styles.pickerWrap,
                  villageError ? styles.fieldErr : null,
                ]}
              >
                <Picker
                  selectedValue={village}
                  onValueChange={(v) => {
                    setVillage(v);
                    setVillageError("");
                  }}
                  style={styles.picker}
                >
                  <Picker.Item
                    label="Select village..."
                    value=""
                    color="#9CA3AF"
                  />
                  {villages
                    .filter((item) => item != null)
                    .map((item, i) => {
                      const v = (item.name ?? item ?? "").toString();
                      if (!v) return null;
                      return <Picker.Item key={i} label={v} value={v} />;
                    })}
                </Picker>
              </View>
              {villageError ? (
                <Text style={styles.errTxt}>{villageError}</Text>
              ) : null}
              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>No. of Rows</Text>
                  <InputField
                    value={numberOfRows}
                    onChangeText={setNumberOfRows}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Plants per Row</Text>
                  <InputField
                    value={plantsPerRow}
                    onChangeText={setPlantsPerRow}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Species */}
          <View style={styles.card}>
            <SectionHeader icon="leaf" title="Species" />
            <View style={styles.cardBody}>
              {speciesRows.map((row, i) => (
                <SpeciesRow
                  key={i}
                  speciesList={speciesList}
                  species={row.species}
                  planted={row.planted}
                  survival={row.survival}
                  height={row.height}
                  onSpeciesChange={(v) => {
                    setSpeciesRows((p) =>
                      p.map((r, idx) => (idx === i ? { ...r, species: v } : r)),
                    );
                  }}
                  onPlantedChange={(v) => {
                    setSpeciesRows((p) =>
                      p.map((r, idx) => (idx === i ? { ...r, planted: v } : r)),
                    );
                  }}
                  onSurvivalChange={(v) => {
                    setSpeciesRows((p) =>
                      p.map((r, idx) =>
                        idx === i ? { ...r, survival: v } : r,
                      ),
                    );
                  }}
                  onHeightChange={(v) => {
                    setSpeciesRows((p) =>
                      p.map((r, idx) => (idx === i ? { ...r, height: v } : r)),
                    );
                  }}
                  onDelete={() =>
                    speciesRows.length > 1 &&
                    setSpeciesRows(speciesRows.filter((_, idx) => idx !== i))
                  }
                />
              ))}
              <PrimaryButton
                title="+ Add Species Row"
                variant="outline"
                onPress={() =>
                  setSpeciesRows([
                    ...speciesRows,
                    { species: "", planted: "", survival: "", height: "" },
                  ])
                }
              />
            </View>
          </View>

          {/* Protection Wall */}
          <View style={styles.card}>
            <SectionHeader icon="shield-outline" title="Protection Wall" />
            <View style={styles.cardBody}>
              {protectionRows.map((row, i) => (
                <ProtectionWallRow
                  key={i}
                  wallList={protectionWallList}
                  wallType={row.wallType}
                  rmt={row.rmt}
                  onWallChange={(v) => {
                    setProtectionRows((p) =>
                      p.map((r, idx) =>
                        idx === i ? { ...r, wallType: v } : r,
                      ),
                    );
                  }}
                  onRmtChange={(v) => {
                    setProtectionRows((p) =>
                      p.map((r, idx) => (idx === i ? { ...r, rmt: v } : r)),
                    );
                  }}
                  onDelete={() =>
                    protectionRows.length > 1 &&
                    setProtectionRows(
                      protectionRows.filter((_, idx) => idx !== i),
                    )
                  }
                />
              ))}
              <PrimaryButton
                title="+ Add Wall Row"
                variant="outline"
                onPress={() =>
                  setProtectionRows([
                    ...protectionRows,
                    { wallType: "", rmt: "" },
                  ])
                }
              />
            </View>
          </View>

          {/* Water Facility */}
          <View style={styles.card}>
            <WaterFacilitySection
              value={waterFacility}
              onChangeText={setWaterFacility}
            />
          </View>

          {/* Natural Species */}
          <View style={styles.card}>
            <SectionHeader icon="grain" title="Natural Species" />
            <View style={styles.cardBody}>
              {naturalspeciesRows.map((row, i) => (
                <NaturalSpeciesRow
                  key={i}
                  naturalspeciesList={naturalspeciesList}
                  naturalspecies={row.species}
                  planted={row.planted}
                  survival={row.survival}
                  height={row.height}
                  onSpeciesChange={(v) => {
                    setNaturalspeciesRows((p) =>
                      p.map((r, idx) => (idx === i ? { ...r, species: v } : r)),
                    );
                  }}
                  onPlantedChange={(v) => {
                    setNaturalspeciesRows((p) =>
                      p.map((r, idx) => (idx === i ? { ...r, planted: v } : r)),
                    );
                  }}
                  onSurvivalChange={(v) => {
                    setNaturalspeciesRows((p) =>
                      p.map((r, idx) =>
                        idx === i ? { ...r, survival: v } : r,
                      ),
                    );
                  }}
                  onHeightChange={(v) => {
                    setNaturalspeciesRows((p) =>
                      p.map((r, idx) => (idx === i ? { ...r, height: v } : r)),
                    );
                  }}
                  onDelete={() =>
                    naturalspeciesRows.length > 1 &&
                    setNaturalspeciesRows(
                      naturalspeciesRows.filter((_, idx) => idx !== i),
                    )
                  }
                />
              ))}
              <PrimaryButton
                title="+ Add Natural Species"
                variant="outline"
                onPress={() =>
                  setNaturalspeciesRows([
                    ...naturalspeciesRows,
                    { species: "", planted: "", survival: "", height: "" },
                  ])
                }
              />
            </View>
          </View>

          {/* Reason */}
          <View style={styles.card}>
            <SectionHeader icon="alert-circle-outline" title="Reason" />
            <View style={styles.cardBody}>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={reason}
                  onValueChange={setReason}
                  style={styles.picker}
                >
                  <Picker.Item
                    label="Select reason..."
                    value=""
                    color="#9CA3AF"
                  />
                  {reasonList
                    .filter((item) => item != null)
                    .map((item, i) => {
                      const v = (item.name ?? item ?? "").toString();
                      if (!v) return null;
                      return <Picker.Item key={i} label={v} value={v} />;
                    })}
                </Picker>
              </View>
            </View>
          </View>

          {/* Locations */}
          <View style={styles.card}>
            <SectionHeader icon="map-marker" title="Locations" />
            <View style={styles.cardBody}>
              {locations.map((loc, i) => (
                <LocationRow
                  key={i}
                  index={i}
                  latitude={loc.latitude}
                  longitude={loc.longitude}
                  onLatitudeChange={(v) => updateLocation(i, { latitude: v })}
                  onLongitudeChange={(v) => updateLocation(i, { longitude: v })}
                  onDelete={() =>
                    setLocations((prev) => prev.filter((_, idx) => idx !== i))
                  }
                />
              ))}
              <PrimaryButton
                title="+ Add Location"
                variant="outline"
                onPress={() =>
                  setLocations([...locations, { latitude: "", longitude: "" }])
                }
              />
            </View>
          </View>

          {/* Images with Location */}
          <View style={styles.card}>
            <SectionHeader icon="image-outline" title="Images with Location" />
            <View style={styles.cardBody}>
              {imageLocations.length === 0 && !liveGps && (
                <Text style={{ color: "#9CA3AF", marginBottom: 12 }}>
                  No images added yet.
                </Text>
              )}
              {imageLocations.map((entry, i) => (
                <LocationImageRow
                  key={i}
                  entry={entry}
                  index={i}
                  onLatChange={(v) => updateImageLocation(i, { latitude: v })}
                  onLngChange={(v) => updateImageLocation(i, { longitude: v })}
                  onImageChange={(img) =>
                    updateImageLocation(i, { image: img })
                  }
                  onDelete={() =>
                    setImageLocations((prev) =>
                      prev.filter((_, idx) => idx !== i),
                    )
                  }
                />
              ))}
              {!liveGps && (
                <PrimaryButton
                  title={
                    addingImage ? "Processing..." : "+ Add Image & Location"
                  }
                  variant="outline"
                  onPress={handleAddImageLocation}
                  disabled={addingImage}
                />
              )}
            </View>
          </View>

          {/* Live GPS Card */}
          {liveGps && (
            <LiveGpsCard
              photoUri={liveGps.photoUri}
              latitude={liveGps.latitude}
              longitude={liveGps.longitude}
              accuracy={liveGps.accuracy}
              onConfirm={handleConfirmLocation}
              confirming={confirming}
            />
          )}

          {/* Save as Draft */}
          <View style={styles.submitCard}>
            <PrimaryButton
              title={isEditMode ? "Update Draft" : "Save as Draft"}
              onPress={handleSaveDraft}
            />
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: "#F1F5F9" },
  pageHeader:   { paddingTop: 52, paddingBottom: 22, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: "hidden" },
  headerOrb:    { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(34,197,94,0.08)", top: -60, right: -40 },
  backBtn:      { flexDirection: "row", alignItems: "center", marginBottom: 8, alignSelf: "flex-start" },
  pageTitle:    { color: "#fff", fontSize: 26, fontWeight: "800" },
  pageSubtitle: { color: "rgba(167,243,208,0.6)", fontSize: 13, marginTop: 2, marginBottom: 16 },
  refreshBtn:   { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "rgba(34,197,94,0.12)", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: "rgba(34,197,94,0.25)" },
  refreshText:  { color: "#22C55E", fontSize: 13, fontWeight: "600" },
  scroll:       { padding: 16, gap: 14 },
  card:         { backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
  cardBody:     { padding: 16 },
  label:        { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 6 },
  req:          { color: "#EF4444" },
  dateField:    { flexDirection: "row", alignItems: "center", height: 48, borderWidth: 1.5, borderColor: T.border, borderRadius: 12, paddingHorizontal: 14, backgroundColor: "#FAFAFA", marginBottom: 6 },
  fieldErr:     { borderColor: "#F87171", backgroundColor: "#FEF2F2" },
  errTxt:       { color: "#EF4444", fontSize: 11, marginBottom: 8 },
  pickerWrap:   { width: "100%", borderWidth: 1.5, borderColor: T.border, borderRadius: 12, minHeight: 50, backgroundColor: "#FAFAFA", marginBottom: 6 },
  picker:       { width: "100%", height: 50, color: "#111827" },
  twoCol:       { flexDirection: "row", gap: 12 },
  submitCard:   { backgroundColor: "#fff", borderRadius: 18, padding: 16, elevation: 2 },
});