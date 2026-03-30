import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TextInput, TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat, withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { loginUser } from "../src/services/authService";

const { width } = Dimensions.get("window");

// ── Error types ────────────────────────────────────────────────────────────
type ErrorType = "invalid_credentials" | "no_internet" | "server_error" | "timeout" | "unknown";

interface ErrorConfig {
  icon: string;
  color: string;
  bg: string;
  border: string;
  title: string;
  message: string;
  hint: string;
}

const ERROR_MAP: Record<ErrorType, ErrorConfig> = {
  invalid_credentials: {
    icon: "shield-lock-outline",
    color: "#EF4444",
    bg: "#FEF2F2",
    border: "#FCA5A5",
    title: "Invalid Credentials",
    message: "The mobile number or password you entered is incorrect.",
    hint: "Double-check your details and try again.",
  },
  no_internet: {
    icon: "wifi-off",
    color: "#F59E0B",
    bg: "#FFFBEB",
    border: "#FCD34D",
    title: "No Internet",
    message: "Unable to connect to the server.",
    hint: "Check your Wi-Fi or mobile data and retry.",
  },
  server_error: {
    icon: "server-network-off",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    border: "#C4B5FD",
    title: "Server Error",
    message: "The server encountered an unexpected problem.",
    hint: "Please try again in a few moments.",
  },
  timeout: {
    icon: "clock-alert-outline",
    color: "#F59E0B",
    bg: "#FFFBEB",
    border: "#FCD34D",
    title: "Request Timed Out",
    message: "The server took too long to respond.",
    hint: "Check your connection speed and try again.",
  },
  unknown: {
    icon: "alert-circle-outline",
    color: "#6B7280",
    bg: "#F9FAFB",
    border: "#D1D5DB",
    title: "Something Went Wrong",
    message: "An unexpected error occurred.",
    hint: "Please try again or contact support.",
  },
};

function detectErrorType(error: any, serverMessage?: string): ErrorType {
  if (error?.message?.includes("Network request failed")) return "no_internet";
  if (error?.message?.includes("fetch")) return "no_internet";
  if (error?.message?.includes("timeout") || error?.message?.includes("Timeout")) return "timeout";

  if (serverMessage) {
    const msg = serverMessage.toLowerCase();
    if (msg.includes("invalid") || msg.includes("incorrect") ||
        msg.includes("wrong") || msg.includes("not found") ||
        msg.includes("unauthorized") || msg.includes("credentials"))
      return "invalid_credentials";
    if (msg.includes("server") || msg.includes("500") || msg.includes("internal"))
      return "server_error";
  }

  return "invalid_credentials";
}

// ── Error Modal ────────────────────────────────────────────────────────────
function ErrorModal({
  visible, errorType, onClose, onRetry,
}: {
  visible: boolean;
  errorType: ErrorType;
  onClose: () => void;
  onRetry: () => void;
}) {
  const cfg = ERROR_MAP[errorType];
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (visible) {
    scale.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.back(1.4)) });
    opacity.value = withTiming(1, { duration: 220 });
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={em.overlay}>
        <Animated.View style={[em.card, { borderColor: cfg.border }, cardStyle]}>

          <View style={[em.iconCircle, { backgroundColor: `${cfg.color}18` }]}>
            <View style={[em.iconInner, { backgroundColor: `${cfg.color}25` }]}>
              <MaterialCommunityIcons name={cfg.icon as any} size={32} color={cfg.color} />
            </View>
          </View>

          <View style={[em.badge, { backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}40` }]}>
            <View style={[em.badgeDot, { backgroundColor: cfg.color }]} />
            <Text style={[em.badgeText, { color: cfg.color }]}>Login Failed</Text>
          </View>

          <Text style={em.title}>{cfg.title}</Text>
          <Text style={em.message}>{cfg.message}</Text>

          <View style={[em.hintBox, { backgroundColor: `${cfg.color}0D`, borderColor: `${cfg.color}30` }]}>
            <Ionicons name="information-circle-outline" size={15} color={cfg.color} />
            <Text style={[em.hintText, { color: cfg.color }]}>{cfg.hint}</Text>
          </View>

          <View style={em.actions}>
            <TouchableOpacity style={em.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={em.closeBtnText}>Dismiss</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[em.retryBtn, { backgroundColor: cfg.color }]}
              onPress={onRetry}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
              <Text style={em.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const em = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center", alignItems: "center", padding: 28,
  },
  card: {
    width: "100%", backgroundColor: "#fff", borderRadius: 28,
    padding: 28, borderWidth: 1.5, alignItems: "center",
    elevation: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25, shadowRadius: 20,
  },
  iconCircle: {
    width: 90, height: 90, borderRadius: 45,
    justifyContent: "center", alignItems: "center", marginBottom: 16,
  },
  iconInner: {
    width: 68, height: 68, borderRadius: 34,
    justifyContent: "center", alignItems: "center",
  },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, marginBottom: 14,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  title: {
    fontSize: 20, fontWeight: "800", color: "#111827",
    textAlign: "center", marginBottom: 8, letterSpacing: -0.3,
  },
  message: {
    fontSize: 14, color: "#6B7280", textAlign: "center",
    lineHeight: 21, marginBottom: 16,
  },
  hintBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    padding: 12, borderRadius: 12, borderWidth: 1,
    width: "100%", marginBottom: 24,
  },
  hintText: { fontSize: 13, fontWeight: "500", flex: 1, lineHeight: 18 },
  actions: { flexDirection: "row", gap: 10, width: "100%" },
  closeBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB",
    alignItems: "center",
  },
  closeBtnText: { color: "#374151", fontWeight: "700", fontSize: 14 },
  retryBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
  },
  retryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});

// ── Main Login Screen ──────────────────────────────────────────────────────
export default function Login() {
  const router = useRouter();
  const [mobile,          setMobile]          = useState("");
  const [password,        setPassword]        = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [mobileError,     setMobileError]     = useState("");
  const [passwordError,   setPasswordError]   = useState("");
  const [mobileFocused,   setMobileFocused]   = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [errorVisible,    setErrorVisible]    = useState(false);
  const [errorType,       setErrorType]       = useState<ErrorType>("unknown");

  const shakeX         = useSharedValue(0);
  const logoFloat      = useSharedValue(0);
  const formOpacity    = useSharedValue(0);
  const formTranslateY = useSharedValue(40);

  // ── FIXED: animations belong in useEffect, not useState ─────────────────
  // useState(() => {...}) was treating the callback as an initial value
  // computation — it ran once but is the wrong API for side effects.
  // useEffect with [] runs once after mount, which is the correct pattern.
  useEffect(() => {
    logoFloat.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0,  { duration: 2000 })
      ), -1
    );
    formOpacity.value    = withDelay(200, withTiming(1, { duration: 700 }));
    formTranslateY.value = withDelay(200, withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, []);

  const shakeStyle    = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));
  const logoFloatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: logoFloat.value }] }));
  const formStyle     = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const triggerShake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 60 }), withTiming(10, { duration: 60 }),
      withTiming(-8,  { duration: 60 }), withTiming(8,  { duration: 60 }),
      withTiming(0,   { duration: 60 })
    );
  };

  const showError = (type: ErrorType) => {
    setErrorType(type);
    setErrorVisible(true);
    triggerShake();
  };

  const validate = () => {
    let valid = true;
    setMobileError(""); setPasswordError("");
    if (!mobile.trim()) {
      setMobileError("Mobile number is required"); valid = false;
    } else if (mobile.trim().length < 10) {
      setMobileError("Enter a valid 10-digit mobile number"); valid = false;
    }
    if (!password.trim()) {
      setPasswordError("Password is required"); valid = false;
    } else if (password.trim().length < 4) {
      setPasswordError("Password must be at least 4 characters"); valid = false;
    }
    if (!valid) triggerShake();
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      const result = await loginUser(mobile, password);
      if (result.ok) {
        await AsyncStorage.setItem("token", result.access_token);
        await AsyncStorage.setItem("employee_name", result.employee?.name || "Field Officer");
        router.replace("/dashboard");
      } else {
        const type = detectErrorType(null, result.message);
        showError(type);
      }
    } catch (error: any) {
      const type = detectErrorType(error);
      showError(type);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#0A1628", "#0D2137", "#0F3D2E"]}
      style={styles.container}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.orb1} /><View style={styles.orb2} />

      <ErrorModal
        visible={errorVisible}
        errorType={errorType}
        onClose={() => setErrorVisible(false)}
        onRetry={() => { setErrorVisible(false); handleLogin(); }}
      />

      <KeyboardAwareScrollView
        contentContainerStyle={styles.inner}
        enableOnAndroid extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.logoWrapper, logoFloatStyle]}>
          <View style={styles.logoBg} />
          <View style={styles.logoCore}>
            <Svg width="48" height="48" viewBox="0 0 200 200">
              <Path d="M100 18 C138 28 168 72 153 117 C138 162 103 186 100 190 C97 186 62 162 47 117 C32 72 62 28 100 18 Z" fill="#22C55E" />
              <Path d="M100 38 L100 172" stroke="rgba(255,255,255,0.6)" strokeWidth="4" strokeLinecap="round" />
              <Path d="M100 72 C85 82 74 97 63 113" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />
              <Path d="M100 98 C85 108 74 123 63 139" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />
              <Path d="M100 72 C115 82 126 97 137 113" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />
              <Path d="M100 98 C115 108 126 123 137 139" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />
            </Svg>
          </View>
        </Animated.View>

        <Text style={styles.appName}>Forest Survey</Text>
        <Text style={styles.tagline}>Employee Login</Text>

        <Animated.View style={[styles.formWrap, shakeStyle, formStyle]}>
          <BlurView intensity={20} tint="dark" style={styles.card}>
            <View style={styles.cardInner}>
              <Text style={styles.cardTitle}>Welcome Back</Text>
              <Text style={styles.cardSubtitle}>Sign in to continue monitoring</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Mobile Number</Text>
                <View style={[
                  styles.inputWrapper,
                  mobileFocused && styles.inputFocused,
                  mobileError ? styles.inputError : null,
                ]}>
                  <Ionicons
                    name="phone-portrait-outline" size={18}
                    color={mobileError ? "#F87171" : mobileFocused ? "#22C55E" : "rgba(255,255,255,0.4)"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Enter your mobile"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    value={mobile}
                    onChangeText={(t) => { setMobile(t); setMobileError(""); }}
                    onFocus={() => setMobileFocused(true)}
                    onBlur={() => setMobileFocused(false)}
                    style={styles.textInput}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    maxLength={10}
                  />
                  {mobile.length > 0 && (
                    <TouchableOpacity onPress={() => { setMobile(""); setMobileError(""); }} style={styles.clearBtn}>
                      <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.3)" />
                    </TouchableOpacity>
                  )}
                </View>
                {mobileError ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle-outline" size={13} color="#F87171" />
                    <Text style={styles.errorText}>{mobileError}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={[
                  styles.inputWrapper,
                  passwordFocused && styles.inputFocused,
                  passwordError ? styles.inputError : null,
                ]}>
                  <Ionicons
                    name="lock-closed-outline" size={18}
                    color={passwordError ? "#F87171" : passwordFocused ? "#22C55E" : "rgba(255,255,255,0.4)"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Enter your password"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(t) => { setPassword(t); setPasswordError(""); }}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    style={[styles.textInput, { flex: 1 }]}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18} color="rgba(255,255,255,0.4)"
                    />
                  </TouchableOpacity>
                </View>
                {passwordError ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle-outline" size={13} color="#F87171" />
                    <Text style={styles.errorText}>{passwordError}</Text>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity
                style={[styles.loginBtn, loading && styles.loginBtnLoading]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={loading ? ["#166534", "#166534"] : ["#16A34A", "#15803D"]}
                  style={styles.loginBtnGradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.loginBtnText}>Signing in...</Text>
                    </View>
                  ) : (
                    <View style={styles.loadingRow}>
                      <Text style={styles.loginBtnText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>

        <Text style={styles.footerText}>Hertz Field Operations Platform</Text>
      </KeyboardAwareScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1 },
  orb1:             { position: "absolute", width: width * 1.1, height: width * 1.1, borderRadius: width * 0.55, backgroundColor: "rgba(34,197,94,0.08)", top: -width * 0.4, right: -width * 0.3 },
  orb2:             { position: "absolute", width: width * 0.9, height: width * 0.9, borderRadius: width * 0.45, backgroundColor: "rgba(14,165,233,0.06)", bottom: -width * 0.3, left: -width * 0.25 },
  inner:            { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  logoWrapper:      { width: width * 0.25, height: width * 0.25, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  logoBg:           { position: "absolute", width: "140%", height: "140%", borderRadius: 999, backgroundColor: "rgba(34,197,94,0.12)" },
  logoCore:         { width: "100%", height: "100%", borderRadius: 999, backgroundColor: "rgba(15,61,46,0.9)", borderWidth: 1.5, borderColor: "rgba(34,197,94,0.5)", justifyContent: "center", alignItems: "center" },
  appName:          { fontSize: width * 0.08, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  tagline:          { fontSize: 14, color: "rgba(167,243,208,0.7)", marginTop: 4, marginBottom: 28, letterSpacing: 0.5 },
  formWrap:         { width: "100%", borderRadius: 24, overflow: "hidden", marginBottom: 24 },
  card:             { borderRadius: 24, overflow: "hidden" },
  cardInner:        { padding: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 24, backgroundColor: "rgba(255,255,255,0.04)" },
  cardTitle:        { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 4 },
  cardSubtitle:     { fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 },
  fieldGroup:       { marginBottom: 16 },
  fieldLabel:       { fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8, letterSpacing: 0.5, fontWeight: "600", textTransform: "uppercase" },
  inputWrapper:     { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingHorizontal: 14 },
  inputFocused:     { borderColor: "#22C55E", backgroundColor: "rgba(34,197,94,0.08)" },
  inputError:       { borderColor: "#F87171", backgroundColor: "rgba(248,113,113,0.08)" },
  inputIcon:        { marginRight: 10 },
  textInput:        { flex: 1, height: 50, color: "#fff", fontSize: 15 },
  clearBtn:         { padding: 4 },
  eyeBtn:           { padding: 8 },
  errorRow:         { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 4 },
  errorText:        { color: "#F87171", fontSize: 12 },
  loginBtn:         { marginTop: 8, borderRadius: 14, overflow: "hidden" },
  loginBtnLoading:  { opacity: 0.8 },
  loginBtnGradient: { paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  loadingRow:       { flexDirection: "row", alignItems: "center", gap: 8 },
  loginBtnText:     { color: "#fff", fontSize: 16, fontWeight: "700" },
  footerText:       { fontSize: 12, color: "rgba(255,255,255,0.2)", letterSpacing: 0.5 },
});