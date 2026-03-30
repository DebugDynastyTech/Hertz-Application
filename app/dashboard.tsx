import {
  View, Text, StyleSheet, Dimensions, ScrollView,
  TouchableOpacity, StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing,
} from "react-native-reanimated";
import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import Svg, { Path } from "react-native-svg";
import { getDrafts } from "../src/storage/draftStrorage";
import { getUploadedReports } from "../src/storage/reportStorage";

const { width } = Dimensions.get("window");
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning 🌿";
  if (h < 17) return "Good Afternoon ☀️";
  return "Good Evening 🌙";
}

export default function Dashboard() {
  const router = useRouter();
  const [now, setNow] = useState(new Date());
  const [pendingCount, setPendingCount] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [employeeName, setEmployeeName] = useState("Field Officer");

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Reload counts every time screen is focused
  useFocusEffect(useCallback(() => {
    const load = async () => {
      const [drafts, uploaded, name] = await Promise.all([
        getDrafts(),
        getUploadedReports(),
        AsyncStorage.getItem("employee_name"),
      ]);
      const draftsArr   = Array.isArray(drafts)   ? drafts   : [];
      const uploadedArr = Array.isArray(uploaded) ? uploaded : [];
      setPendingCount(draftsArr.length);
      setUploadedCount(uploadedArr.length);
      if (name) setEmployeeName(name);
      const today = new Date().toISOString().split("T")[0];
      const todayList = uploadedArr.filter(
        (r: any) => (r.uploadedAt || r.createdAt || "").startsWith(today)
      );
      setTodayCount(todayList.length);
    };
    load();
  }, []));

  const headerOpacity  = useSharedValue(0);
  const headerY        = useSharedValue(-20);
  const actionsOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value  = withTiming(1, { duration: 600 });
    headerY.value        = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });
    actionsOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
  }, []);

  const headerStyle  = useAnimatedStyle(() => ({ opacity: headerOpacity.value, transform: [{ translateY: headerY.value }] }));
  const actionsStyle = useAnimatedStyle(() => ({ opacity: actionsOpacity.value }));

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(["token", "employee_name"]);
    router.replace("/login");
  };

  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <LinearGradient colors={["#0A1628", "#0F3D2E"]} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.orb1} /><View style={styles.orb2} />

          <Animated.View style={headerStyle}>
            {/* Top row */}
            <View style={styles.headerTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.name}>{employeeName}</Text>
              </View>
              <View style={styles.logoCircle}>
                <Svg width="24" height="24" viewBox="0 0 200 200">
                  <Path d="M100 18 C138 28 168 72 153 117 C138 162 103 186 100 190 C97 186 62 162 47 117 C32 72 62 28 100 18 Z" fill="#22C55E" />
                  <Path d="M100 38 L100 172" stroke="rgba(255,255,255,0.5)" strokeWidth="5" strokeLinecap="round" />
                </Svg>
              </View>
            </View>

            {/* Date & Time card */}
            <View style={styles.dateTimeCard}>
              <View style={styles.dateRow}>
                <MaterialCommunityIcons name="calendar-today" size={15} color="rgba(167,243,208,0.7)" />
                <Text style={styles.dateText}>{dateStr}</Text>
              </View>
              <View style={styles.dividerH} />
              <View style={styles.timeRow}>
                <MaterialCommunityIcons name="clock-outline" size={15} color="rgba(167,243,208,0.7)" />
                <Text style={styles.timeText}>{timeStr}</Text>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{pendingCount}</Text>
                <Text style={styles.statLabel}>Pending Uploads</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{todayCount}</Text>
                <Text style={styles.statLabel}>Today's Reports</Text>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* ── Quick Actions ── */}
        <Animated.View style={[styles.actionsSection, actionsStyle]}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          {/* New Entry button */}
          <TouchableOpacity style={styles.primaryAction} onPress={() => router.push("/data-entry")} activeOpacity={0.9}>
            <LinearGradient colors={["#16A34A", "#15803D"]} style={styles.primaryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <View style={styles.actionIconWrap}>
                <MaterialCommunityIcons name="plus" size={24} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.primaryTitle}>New Monitoring Entry</Text>
                <Text style={styles.primarySub}>Start a new field survey</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(255,255,255,0.6)" />
            </LinearGradient>
          </TouchableOpacity>

          {/* ── View Reports — improved card ── */}
          <Text style={styles.sectionTitle}>Reports</Text>
          <TouchableOpacity
            style={styles.reportsCard}
            onPress={() => router.push("/drafts")}
            activeOpacity={0.88}
          >
            {/* Card header */}
            <View style={styles.reportsHeader}>
              <View style={styles.reportsIconWrap}>
                <MaterialCommunityIcons name="file-chart-outline" size={22} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reportsTitle}>View Reports</Text>
                <Text style={styles.reportsSub}>Manage drafts & uploaded entries</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
            </View>

            {/* Divider */}
            <View style={styles.reportsDivider} />

            {/* Stats row */}
            <View style={styles.reportsStatsRow}>
              {/* Pending */}
              <View style={styles.reportsStatBox}>
                <View style={[styles.reportsStatIconWrap, { backgroundColor: "#FFFBEB" }]}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color="#D97706" />
                </View>
                <Text style={styles.reportsStatValue}>{pendingCount}</Text>
                <Text style={styles.reportsStatLabel}>Pending</Text>
              </View>

              <View style={styles.reportsStatDivider} />

              {/* Uploaded */}
              <View style={styles.reportsStatBox}>
                <View style={[styles.reportsStatIconWrap, { backgroundColor: "#F0FDF4" }]}>
                  <MaterialCommunityIcons name="cloud-check-outline" size={16} color="#16A34A" />
                </View>
                <Text style={styles.reportsStatValue}>{uploadedCount}</Text>
                <Text style={styles.reportsStatLabel}>Uploaded</Text>
              </View>

              <View style={styles.reportsStatDivider} />

              {/* Total */}
              <View style={styles.reportsStatBox}>
                <View style={[styles.reportsStatIconWrap, { backgroundColor: "#EFF6FF" }]}>
                  <MaterialCommunityIcons name="file-multiple-outline" size={16} color="#2563EB" />
                </View>
                <Text style={styles.reportsStatValue}>{pendingCount + uploadedCount}</Text>
                <Text style={styles.reportsStatLabel}>Total</Text>
              </View>
            </View>

            {/* Bottom hint */}
            {pendingCount > 0 && (
              <View style={styles.reportsHint}>
                <MaterialCommunityIcons name="alert-circle-outline" size={13} color="#D97706" />
                <Text style={styles.reportsHintText}>
                  {pendingCount} draft{pendingCount > 1 ? "s" : ""} waiting to be uploaded
                </Text>
              </View>
            )}
          </TouchableOpacity>

        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: "#F8FAF9" },
  header:       { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20, overflow: "hidden", borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  orb1:         { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(34,197,94,0.1)", top: -60, right: -40 },
  orb2:         { position: "absolute", width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(14,165,233,0.08)", bottom: -50, left: -30 },
  headerTop:    { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  greeting:     { color: "rgba(167,243,208,0.7)", fontSize: 13, fontWeight: "500" },
  name:         { color: "#fff", fontSize: 26, fontWeight: "800", marginTop: 2 },
  logoCircle:   { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(34,197,94,0.15)", borderWidth: 1, borderColor: "rgba(34,197,94,0.4)", justifyContent: "center", alignItems: "center" },
  dateTimeCard: { backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", gap: 8 },
  dateRow:      { flexDirection: "row", alignItems: "center", gap: 8 },
  dateText:     { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "500", flex: 1 },
  dividerH:     { height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  timeRow:      { flexDirection: "row", alignItems: "center", gap: 8 },
  timeText:     { color: "#22C55E", fontSize: 20, fontWeight: "800", letterSpacing: 1 },
  statsRow:     { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  statItem:     { flex: 1, alignItems: "center" },
  statValue:    { color: "#fff", fontSize: 26, fontWeight: "800" },
  statLabel:    { color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 2, textAlign: "center" },
  statDivider:  { width: 1, backgroundColor: "rgba(255,255,255,0.15)", marginHorizontal: 8 },

  actionsSection: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle:   { fontSize: 17, fontWeight: "700", color: "#111827", marginBottom: 14 },

  primaryAction:  { borderRadius: 18, overflow: "hidden", marginBottom: 24, elevation: 4 },
  primaryGrad:    { flexDirection: "row", alignItems: "center", padding: 18, gap: 14 },
  actionIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  primaryTitle:   { color: "#fff", fontSize: 16, fontWeight: "700" },
  primarySub:     { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 },

  // ── Reports card ──────────────────────────────────────────────────────────
  reportsCard:          { backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, marginBottom: 14 },
  reportsHeader:        { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  reportsIconWrap:      { width: 44, height: 44, borderRadius: 12, backgroundColor: "#EFF6FF", justifyContent: "center", alignItems: "center" },
  reportsTitle:         { fontSize: 15, fontWeight: "700", color: "#111827" },
  reportsSub:           { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  reportsDivider:       { height: 1, backgroundColor: "#F3F4F6", marginHorizontal: 16 },
  reportsStatsRow:      { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 14 },
  reportsStatBox:       { flex: 1, alignItems: "center", gap: 6 },
  reportsStatIconWrap:  { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  reportsStatValue:     { fontSize: 20, fontWeight: "800", color: "#111827" },
  reportsStatLabel:     { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },
  reportsStatDivider:   { width: 1, backgroundColor: "#F3F4F6" },
  reportsHint:          { flexDirection: "row", alignItems: "center", gap: 6, marginHorizontal: 16, marginBottom: 14, backgroundColor: "#FFFBEB", padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#FDE68A" },
  reportsHintText:      { fontSize: 12, color: "#D97706", fontWeight: "600", flex: 1 },
});
