import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  latitude: string;
  longitude: string;
  index: number;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
  onDelete: () => void;
  /** Parent starts the Live GPS session for this row. */
  onStartGps?: () => void;
  /** True while a Live GPS session is open targeting THIS row. */
  gpsActive?: boolean;
  /** True after the GPS button was tapped but before the first fix arrives. */
  gpsStarting?: boolean;
  /** True when another GPS flow (image or another row) is already running. */
  gpsDisabled?: boolean;
  /** Live-updating values while gpsActive — provided by parent. */
  liveLatitude?: string;
  liveLongitude?: string;
  liveAccuracy?: number | null;
  /** Confirm fills this row with the live values. */
  onConfirmGps?: () => void;
  /** Cancel stops the GPS watcher without writing. */
  onCancelGps?: () => void;
}

// ── Accuracy helpers (duplicated here so the row is self-contained) ─────────
function getAccuracyColor(accuracy: number | null | undefined): string {
  if (accuracy === null || accuracy === undefined) return "#9CA3AF";
  if (accuracy <= 15) return "#16A34A";
  if (accuracy <= 30) return "#D97706";
  return "#DC2626";
}
function getAccuracyLabel(accuracy: number | null | undefined): string {
  if (accuracy === null || accuracy === undefined) return "Fetching...";
  if (accuracy <= 15) return "Good";
  if (accuracy <= 30) return "Fair";
  return "Poor";
}

export default function LocationRow({
  latitude,
  longitude,
  index,
  onDelete,
  onStartGps,
  gpsActive = false,
  gpsStarting = false,
  gpsDisabled = false,
  liveLatitude = "",
  liveLongitude = "",
  liveAccuracy = null,
  onConfirmGps,
  onCancelGps,
}: Props) {
  const buttonDisabled = gpsDisabled || gpsActive || gpsStarting;

  // ── Active-GPS layout ────────────────────────────────────────────────────
  // While Live GPS is running for THIS row, swap the static fields for the
  // live accuracy panel + Use This Location / Cancel buttons.
  if (gpsActive) {
    const color = getAccuracyColor(liveAccuracy);
    const label = getAccuracyLabel(liveAccuracy);
    const hasFix = liveLatitude !== "";

    return (
      <View style={[styles.container, styles.containerActive]}>
        <View style={styles.rowHeader}>
          <View style={[styles.indexBadge, styles.indexBadgeActive]}>
            <Text style={styles.indexText}>#{index + 1}</Text>
          </View>
          <View style={styles.liveDotWrap}>
            <View style={[styles.liveDot, { backgroundColor: color }]} />
            <Text style={styles.liveDotText}>Live GPS</Text>
          </View>
        </View>

        {/* Accuracy */}
        <View style={[styles.accuracyRow, { borderColor: color }]}>
          <View style={[styles.accuracyDot, { backgroundColor: color }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.accuracyLabel}>Accuracy</Text>
            <Text style={[styles.accuracyValue, { color }]}>
              {liveAccuracy !== null && liveAccuracy !== undefined
                ? `±${liveAccuracy.toFixed(1)} m — ${label}`
                : "Fetching GPS..."}
            </Text>
          </View>
          <MaterialCommunityIcons
            name={
              liveAccuracy !== null &&
              liveAccuracy !== undefined &&
              liveAccuracy <= 15
                ? "check-circle"
                : "loading"
            }
            size={20}
            color={color}
          />
        </View>

        {/* Live coords */}
        <View style={styles.liveCoords}>
          <View style={styles.liveCoordBox}>
            <Text style={styles.label}>Latitude</Text>
            <Text style={styles.liveCoordValue}>{liveLatitude || "—"}</Text>
          </View>
          <View style={styles.liveCoordDivider} />
          <View style={styles.liveCoordBox}>
            <Text style={styles.label}>Longitude</Text>
            <Text style={styles.liveCoordValue}>{liveLongitude || "—"}</Text>
          </View>
        </View>

        <Text style={styles.hint}>
          {liveAccuracy !== null &&
          liveAccuracy !== undefined &&
          liveAccuracy <= 15
            ? "✅ Good accuracy — you can save now."
            : "⏳ Waiting for better accuracy... or save now if acceptable."}
        </Text>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onCancelGps}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="close" size={15} color="#374151" />
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              { backgroundColor: color },
              !hasFix && styles.confirmBtnDisabled,
            ]}
            onPress={onConfirmGps}
            disabled={!hasFix}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="map-marker-check"
              size={16}
              color="#fff"
            />
            <Text style={styles.confirmBtnText}>Use This Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Static layout (default) ──────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.rowHeader}>
        <View style={styles.indexBadge}>
          <Text style={styles.indexText}>#{index + 1}</Text>
        </View>

        <Pressable style={styles.deleteBtn} onPress={onDelete} hitSlop={8}>
          <MaterialCommunityIcons name="close" size={14} color="#6B7280" />
        </Pressable>
      </View>

      <View style={styles.coordRow}>
        <View style={styles.coordField}>
          <Text style={styles.label}>Latitude</Text>
          <TextInput
            style={styles.input}
            value={gpsStarting ? "" : latitude}
            placeholder={gpsStarting ? "Fetching..." : "0.000000"}
            placeholderTextColor={gpsStarting ? "#16A34A" : "#9CA3AF"}
            editable={false}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.coordField}>
          <Text style={styles.label}>Longitude</Text>
          <TextInput
            style={styles.input}
            value={gpsStarting ? "" : longitude}
            placeholder={gpsStarting ? "Fetching..." : "0.000000"}
            placeholderTextColor={gpsStarting ? "#16A34A" : "#9CA3AF"}
            editable={false}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.gpsCol}>
          <Text style={styles.labelHidden}>GPS</Text>
          <Pressable
            style={[
              styles.gpsBtn,
              gpsStarting && styles.gpsBtnStarting,
              buttonDisabled && !gpsStarting && styles.gpsBtnDisabled,
            ]}
            onPress={() => onStartGps?.()}
            disabled={buttonDisabled}
          >
            {gpsStarting ? (
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

  containerActive: {
    backgroundColor: "#fff",
    borderColor: "#BBF7D0",
    borderWidth: 1.5,
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
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

  indexBadgeActive: {
    backgroundColor: "#DCFCE7",
  },

  indexText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16A34A",
  },

  liveDotWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveDotText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
    letterSpacing: 0.3,
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

  coordRow: { flexDirection: "row", gap: 8 },
  coordField: { flex: 1 },
  gpsCol: { width: 48 },

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

  gpsBtnDisabled: { opacity: 0.45 },

  gpsBtnStarting: { backgroundColor: "#22C55E" },

  // ── Active GPS panel ─────────────────────────────────────────────────────
  accuracyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: "#F9FAFB",
    marginBottom: 10,
  },
  accuracyDot: { width: 9, height: 9, borderRadius: 5 },
  accuracyLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  accuracyValue: { fontSize: 14, fontWeight: "700", marginTop: 1 },

  liveCoords: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    marginBottom: 10,
  },
  liveCoordBox: { flex: 1, padding: 10, alignItems: "center" },
  liveCoordDivider: { width: 1, backgroundColor: "#E5E7EB" },
  liveCoordValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "700",
    marginTop: 3,
  },

  hint: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 12,
  },

  actionRow: { flexDirection: "row", gap: 8 },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelBtnText: { color: "#374151", fontWeight: "700", fontSize: 13 },
  confirmBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
