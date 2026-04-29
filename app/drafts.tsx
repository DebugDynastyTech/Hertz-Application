import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { uploadEntryWithImages } from "../src/services/uploadService";
import { deleteDraft, getDrafts } from "../src/storage/draftStrorage";
import {
  getUploadedReports,
  saveUploadedReport,
} from "../src/storage/reportStorage";
import { checkInternet } from "../src/utils/network";

type ReportTab = "uploaded" | "pending";

export default function Drafts() {
  const router = useRouter();

  const [drafts, setDrafts] = useState<any[]>([]);
  const [uploadedReports, setUploadedReports] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<ReportTab>("pending");
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const [uploadedIndexes, setUploadedIndexes] = useState<number[]>([]);

  const loadData = async () => {
    const [draftData, uploadedData] = await Promise.all([
      getDrafts(),
      getUploadedReports(),
    ]);
    setDrafts(Array.isArray(draftData) ? draftData : []);
    setUploadedReports(Array.isArray(uploadedData) ? uploadedData : []);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = async (item: any, index: number) => {
    const isOnline = await checkInternet();

    if (!isOnline) {
      Alert.alert(
        "No Internet",
        "You're offline. Please connect to upload this report.",
      );
      return;
    }

    try {
      setUploadingIndex(index);

      const result = await uploadEntryWithImages(item, item.images ?? []);

      await saveUploadedReport({
        ...item,
        images: item.images ?? [],
        uploadedAt: new Date().toISOString(),
        serverId: result?.id,
      });

      setUploadedIndexes((prev) => [...prev, index]);

      await deleteDraft(index);
      await loadData();

      Alert.alert("✅ Success", "Report uploaded successfully!");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong. Please try again.";

      Alert.alert("Upload Failed", message);
    } finally {
      setUploadingIndex(null);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = (index: number) => {
    Alert.alert(
      "Delete Draft",
      "Are you sure you want to delete this draft? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteDraft(index);
            await loadData();
          },
        },
      ],
    );
  };

  // ── Edit — pass ONLY the index, data-entry reads draft from AsyncStorage ──
  // This avoids passing large JSON through route params which can crash the app
  const handleEdit = (index: number) => {
    router.push({
      pathname: "/data-entry",
      params: {
        editMode: "true",
        draftIndex: String(index),
        // NO draftData param — data-entry loads it safely from AsyncStorage
      },
    });
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isPending = activeTab === "pending";
  const visibleReports = isPending ? drafts : uploadedReports;

  const formatDate = (d: string) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={["#0A1628", "#0F3D2E"]}
        style={s.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={s.headerOrb} />
        <Text style={s.headerTitle}>Reports</Text>
        <Text style={s.headerSub}>Manage your survey records</Text>

        <View style={s.tabContainer}>
          {(["pending", "uploaded"] as ReportTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[s.tab, activeTab === tab && s.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={
                  tab === "pending" ? "clock-outline" : "cloud-check-outline"
                }
                size={15}
                color={activeTab === tab ? "#fff" : "rgba(255,255,255,0.5)"}
              />
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {tab === "pending"
                  ? `Pending (${drafts.length})`
                  : `Uploaded (${uploadedReports.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Cards */}
      <ScrollView
        style={s.content}
        contentContainerStyle={s.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {visibleReports.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyIcon}>
              <MaterialCommunityIcons
                name={isPending ? "file-clock-outline" : "cloud-check-outline"}
                size={48}
                color="#9CA3AF"
              />
            </View>
            <Text style={s.emptyTitle}>
              {isPending ? "No Pending Drafts" : "No Uploaded Reports"}
            </Text>
            <Text style={s.emptyDesc}>
              {isPending
                ? "New entries saved offline will appear here"
                : "Your uploaded reports will be stored here for reference"}
            </Text>
          </View>
        ) : (
          visibleReports.map((item, index) => (
            <View key={`${item.referenceId || "r"}-${index}`} style={s.card}>
              {/* Card Header */}
              <View style={s.cardHeader}>
                <View
                  style={[
                    s.statusBadge,
                    isPending ? s.statusPending : s.statusUploaded,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={isPending ? "clock-outline" : "cloud-check"}
                    size={11}
                    color={isPending ? "#D97706" : "#16A34A"}
                  />
                  <Text
                    style={[
                      s.statusText,
                      { color: isPending ? "#D97706" : "#16A34A" },
                    ]}
                  >
                    {isPending ? "Pending" : "Uploaded"}
                  </Text>
                </View>
                <Text style={s.cardRef}>#{item.referenceId || "—"}</Text>
              </View>

              {/* Card Details */}
              <View style={s.cardDetails}>
                <DetailRow
                  icon="map-marker-outline"
                  label="Village"
                  value={item.village || "—"}
                />
                <DetailRow
                  icon="calendar-outline"
                  label="Date"
                  value={item.date || "—"}
                />
                <DetailRow
                  icon="layers-outline"
                  label="Rows"
                  value={item.numberOfRows?.toString() || "—"}
                />
                <DetailRow
                  icon="sprout-outline"
                  label="Plants/Row"
                  value={item.plantsPerRow?.toString() || "—"}
                />
                <DetailRow
                  icon="water-outline"
                  label="Water"
                  value={item.waterFacility || "—"}
                />
                <DetailRow
                  icon="image-multiple-outline"
                  label="Images"
                  value={`${item.images?.length ?? 0} photo${item.images?.length !== 1 ? "s" : ""}`}
                />
                {!isPending && item.uploadedAt && (
                  <DetailRow
                    icon="cloud-upload-outline"
                    label="Uploaded"
                    value={formatDate(item.uploadedAt)}
                  />
                )}
              </View>

              {/* Actions — pending only */}
              {isPending && (
                <View style={s.cardActions}>
                  {/* Upload */}
                  <TouchableOpacity
                    style={s.uploadBtn}
                    onPress={() => handleUpload(item, index)}
                    disabled={
                      uploadingIndex === index ||
                      uploadedIndexes.includes(index)
                    }
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={["#16A34A", "#15803D"]}
                      style={s.btnInner}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {uploadingIndex === index ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <MaterialCommunityIcons
                          name="cloud-upload-outline"
                          size={15}
                          color="#fff"
                        />
                      )}
                      <Text style={s.uploadBtnText}>
                        {
                          
                          uploadedIndexes.includes(index)
                            ? "Uploaded"
                            : 
                              uploadingIndex === index
                              ? "Uploading…"
                              : 
                                "Upload"
                        }
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Edit — only passes index, NOT the full draft JSON */}
                  <TouchableOpacity
                    style={s.editBtn}
                    onPress={() => handleEdit(index)}
                    disabled={uploadingIndex === index}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons
                      name="pencil-outline"
                      size={15}
                      color="#2563EB"
                    />
                    <Text style={s.editBtnText}>Edit</Text>
                  </TouchableOpacity>

                  {/* Delete */}
                  <TouchableOpacity
                    style={s.deleteBtn}
                    onPress={() => handleDelete(index)}
                    disabled={uploadingIndex === index}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons
                      name="delete-outline"
                      size={15}
                      color="#DC2626"
                    />
                    <Text style={s.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <View style={s.detailRow}>
      <MaterialCommunityIcons
        name={icon}
        size={14}
        color="#9CA3AF"
        style={{ marginRight: 6 }}
      />
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={s.detailValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAF9" },
  header: {
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  headerOrb: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(34,197,94,0.08)",
    top: -60,
    right: -40,
  },
  headerTitle: { color: "#fff", fontSize: 26, fontWeight: "800" },
  headerSub: {
    color: "rgba(167,243,208,0.6)",
    fontSize: 13,
    marginBottom: 20,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: "rgba(34,197,94,0.3)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.4)",
  },
  tabText: { color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  content: { flex: 1 },
  contentInner: { padding: 16 },
  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPending: { backgroundColor: "#FFFBEB" },
  statusUploaded: { backgroundColor: "#F0FDF4" },
  statusText: { fontSize: 11, fontWeight: "700" },
  cardRef: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  cardDetails: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  detailRow: { flexDirection: "row", alignItems: "center" },
  detailLabel: { fontSize: 13, color: "#9CA3AF", width: 70 },
  detailValue: { fontSize: 13, color: "#111827", fontWeight: "500", flex: 1 },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  uploadBtn: { flex: 1.3, borderRadius: 12, overflow: "hidden" },
  btnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
  },
  uploadBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  editBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
  },
  editBtnText: { color: "#2563EB", fontSize: 13, fontWeight: "700" },
  deleteBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
  },
  deleteBtnText: { color: "#DC2626", fontSize: 13, fontWeight: "700" },
});
