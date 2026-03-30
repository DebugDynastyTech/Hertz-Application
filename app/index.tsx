// import {
//   View,
//   Text,
//   StyleSheet,
//   Dimensions,
// } from "react-native";
// import { useEffect } from "react";
// import { useRouter } from "expo-router";
// import { LinearGradient } from "expo-linear-gradient";
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withTiming,
//   withRepeat,
//   withSequence,
//   withDelay,
//   Easing,
// } from "react-native-reanimated";
// import Svg, { Path } from "react-native-svg";
// import { getToken } from "../src/utils/auth";
// import * as Haptics from "expo-haptics";

// const { width, height } = Dimensions.get("window");

// export default function Welcome() {
//   const router = useRouter();

//   const logoScale = useSharedValue(0.7);
//   const logoOpacity = useSharedValue(0);
//   const ringScale = useSharedValue(0.6);
//   const ringOpacity = useSharedValue(0);
//   const textTranslateY = useSharedValue(30);
//   const textOpacity = useSharedValue(0);
//   const dot1Opacity = useSharedValue(0);
//   const dot2Opacity = useSharedValue(0);
//   const dot3Opacity = useSharedValue(0);
//   const bgCircle1 = useSharedValue(0);
//   const bgCircle2 = useSharedValue(0);

//   useEffect(() => {
//     bgCircle1.value = withRepeat(
//       withSequence(
//         withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
//         withTiming(0.6, { duration: 3000 })
//       ),
//       -1
//     );
//     bgCircle2.value = withDelay(
//       1500,
//       withRepeat(
//         withSequence(
//           withTiming(1, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
//           withTiming(0.5, { duration: 3500 })
//         ),
//         -1
//       )
//     );
//     logoScale.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.back(1.5)) });
//     logoOpacity.value = withTiming(1, { duration: 700 });
//     ringScale.value = withDelay(300, withRepeat(
//       withSequence(
//         withTiming(1.15, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
//         withTiming(1, { duration: 1800 })
//       ),
//       -1
//     ));
//     ringOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
//     textTranslateY.value = withDelay(400, withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) }));
//     textOpacity.value = withDelay(400, withTiming(1, { duration: 700 }));
//     dot1Opacity.value = withDelay(900, withRepeat(
//       withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })),
//       -1
//     ));
//     dot2Opacity.value = withDelay(1100, withRepeat(
//       withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })),
//       -1
//     ));
//     dot3Opacity.value = withDelay(1300, withRepeat(
//       withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })),
//       -1
//     ));

//     const timer = setTimeout(async () => {
//       const token = await getToken();
//       await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//       if (token) {
//         router.replace("/dashboard");
//       } else {
//         router.replace("/login");
//       }
//     }, 2800);

//     return () => clearTimeout(timer);
//   }, []);

//   const logoStyle = useAnimatedStyle(() => ({
//     transform: [{ scale: logoScale.value }],
//     opacity: logoOpacity.value,
//   }));
//   const ringStyle = useAnimatedStyle(() => ({
//     transform: [{ scale: ringScale.value }],
//     opacity: ringOpacity.value,
//   }));
//   const textStyle = useAnimatedStyle(() => ({
//     opacity: textOpacity.value,
//     transform: [{ translateY: textTranslateY.value }],
//   }));
//   const dot1Style = useAnimatedStyle(() => ({ opacity: dot1Opacity.value }));
//   const dot2Style = useAnimatedStyle(() => ({ opacity: dot2Opacity.value }));
//   const dot3Style = useAnimatedStyle(() => ({ opacity: dot3Opacity.value }));
//   const bg1Style = useAnimatedStyle(() => ({
//     opacity: bgCircle1.value * 0.18,
//     transform: [{ scale: 0.9 + bgCircle1.value * 0.2 }],
//   }));
//   const bg2Style = useAnimatedStyle(() => ({
//     opacity: bgCircle2.value * 0.12,
//     transform: [{ scale: 0.8 + bgCircle2.value * 0.3 }],
//   }));

//   return (
//     <LinearGradient
//       colors={["#0A1628", "#0D2137", "#0F3D2E"]}
//       style={styles.container}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 1 }}
//     >
//       <Animated.View style={[styles.bgCircle1, bg1Style]} />
//       <Animated.View style={[styles.bgCircle2, bg2Style]} />

//       <View style={styles.dotsGrid}>
//         {Array.from({ length: 20 }).map((_, i) => (
//           <View key={i} style={styles.gridDot} />
//         ))}
//       </View>

//       <Animated.View style={[styles.ringOuter, ringStyle]} />
//       <Animated.View style={[styles.ringInner, ringStyle]} />

//       <Animated.View style={[styles.logoWrapper, logoStyle]}>
//         <View style={styles.logoCore}>
//           <Svg width="52" height="52" viewBox="0 0 200 200">
//             <Path
//               d="M100 18 C138 28 168 72 153 117 C138 162 103 186 100 190 C97 186 62 162 47 117 C32 72 62 28 100 18 Z"
//               fill="#22C55E"
//             />
//             <Path d="M100 38 L100 172" stroke="rgba(255,255,255,0.5)" strokeWidth="4" strokeLinecap="round" />
//             <Path d="M100 72 C85 82 74 97 63 113" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />
//             <Path d="M100 98 C85 108 74 123 63 139" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />
//             <Path d="M100 72 C115 82 126 97 137 113" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />
//             <Path d="M100 98 C115 108 126 123 137 139" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />
//           </Svg>
//         </View>
//       </Animated.View>

//       <Animated.View style={[styles.textBlock, textStyle]}>
//         <Text style={styles.title}>Forest Survey</Text>
//         <Text style={styles.subtitle}>Intelligent Field Monitoring</Text>
//       </Animated.View>

//       <Animated.View style={[styles.loadingRow, textStyle]}>
//         <Animated.View style={[styles.dot, dot1Style]} />
//         <Animated.View style={[styles.dot, dot2Style]} />
//         <Animated.View style={[styles.dot, dot3Style]} />
//       </Animated.View>

//       <Animated.View style={[styles.badge, textStyle]}>
//         <Text style={styles.badgeText}>HERTZ • FIELD OPS</Text>
//       </Animated.View>
//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: "center", alignItems: "center" },
//   bgCircle1: {
//     position: "absolute",
//     width: width * 1.2, height: width * 1.2,
//     borderRadius: width * 0.6,
//     backgroundColor: "#22C55E",
//     top: -width * 0.3, right: -width * 0.3,
//   },
//   bgCircle2: {
//     position: "absolute",
//     width: width * 1.0, height: width * 1.0,
//     borderRadius: width * 0.5,
//     backgroundColor: "#0EA5E9",
//     bottom: -width * 0.4, left: -width * 0.3,
//   },
//   dotsGrid: {
//     position: "absolute", top: height * 0.1, right: 20,
//     flexDirection: "row", flexWrap: "wrap", width: 120, gap: 10, opacity: 0.15,
//   },
//   gridDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#fff" },
//   ringOuter: {
//     position: "absolute",
//     width: width * 0.55, height: width * 0.55,
//     borderRadius: width * 0.275,
//     borderWidth: 1, borderColor: "rgba(34,197,94,0.3)",
//   },
//   ringInner: {
//     position: "absolute",
//     width: width * 0.42, height: width * 0.42,
//     borderRadius: width * 0.21,
//     borderWidth: 1.5, borderColor: "rgba(34,197,94,0.5)",
//   },
//   logoWrapper: {
//     width: width * 0.28, height: width * 0.28,
//     justifyContent: "center", alignItems: "center", marginBottom: 32,
//   },
//   logoCore: {
//     width: "100%", height: "100%", borderRadius: 999,
//     backgroundColor: "rgba(15,61,46,0.9)",
//     borderWidth: 2, borderColor: "rgba(34,197,94,0.6)",
//     justifyContent: "center", alignItems: "center",
//   },
//   textBlock: { alignItems: "center", marginBottom: 24 },
//   title: { fontSize: width * 0.085, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.5 },
//   subtitle: { fontSize: width * 0.038, color: "rgba(167,243,208,0.8)", marginTop: 6, letterSpacing: 0.5 },
//   loadingRow: { flexDirection: "row", gap: 8, marginBottom: 40 },
//   dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: "#22C55E" },
//   badge: {
//     position: "absolute", bottom: 48,
//     paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
//     borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
//     backgroundColor: "rgba(255,255,255,0.05)",
//   },
//   badgeText: { color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: 3, fontWeight: "600" },
// });
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { getToken } from "../src/utils/auth";

const { width, height } = Dimensions.get("window");

export default function Welcome() {
  const router = useRouter();

  const logoScale = useSharedValue(0.7);
  const logoOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.6);
  const ringOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  const textOpacity = useSharedValue(0);
  const dot1Opacity = useSharedValue(0);
  const dot2Opacity = useSharedValue(0);
  const dot3Opacity = useSharedValue(0);
  const bgCircle1 = useSharedValue(0);
  const bgCircle2 = useSharedValue(0);

  useEffect(() => {
    // Start auth check immediately in parallel — don't wait for animations
    let destination = "/login";
    const authPromise = getToken().then((token) => {
      destination = token ? "/dashboard" : "/login";
    });

    // Faster, snappier animations
    bgCircle1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 1800 })
      ),
      -1
    );
    bgCircle2.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, { duration: 2000 })
        ),
        -1
      )
    );
    logoScale.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.3)) });
    logoOpacity.value = withTiming(1, { duration: 400 });
    ringScale.value = withDelay(150, withRepeat(
      withSequence(
        withTiming(1.12, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200 })
      ),
      -1
    ));
    ringOpacity.value = withDelay(150, withTiming(1, { duration: 350 }));
    textTranslateY.value = withDelay(200, withTiming(0, { duration: 450, easing: Easing.out(Easing.cubic) }));
    textOpacity.value = withDelay(200, withTiming(1, { duration: 450 }));
    dot1Opacity.value = withDelay(500, withRepeat(
      withSequence(withTiming(1, { duration: 300 }), withTiming(0.3, { duration: 300 })),
      -1
    ));
    dot2Opacity.value = withDelay(650, withRepeat(
      withSequence(withTiming(1, { duration: 300 }), withTiming(0.3, { duration: 300 })),
      -1
    ));
    dot3Opacity.value = withDelay(800, withRepeat(
      withSequence(withTiming(1, { duration: 300 }), withTiming(0.3, { duration: 300 })),
      -1
    ));

    // Navigate as soon as animations have shown AND auth is resolved
    const timer = setTimeout(async () => {
      await authPromise; // already done by now in 99% of cases
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
      router.replace(destination as any);
    }, 1600);

    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));
  const dot1Style = useAnimatedStyle(() => ({ opacity: dot1Opacity.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dot2Opacity.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dot3Opacity.value }));
  const bg1Style = useAnimatedStyle(() => ({
    opacity: bgCircle1.value * 0.18,
    transform: [{ scale: 0.9 + bgCircle1.value * 0.2 }],
  }));
  const bg2Style = useAnimatedStyle(() => ({
    opacity: bgCircle2.value * 0.12,
    transform: [{ scale: 0.8 + bgCircle2.value * 0.3 }],
  }));

  return (
    <LinearGradient
      colors={["#0A1628", "#0D2137", "#0F3D2E"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animated.View style={[styles.bgCircle1, bg1Style]} />
      <Animated.View style={[styles.bgCircle2, bg2Style]} />

      <View style={styles.dotsGrid}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={i} style={styles.gridDot} />
        ))}
      </View>

      <Animated.View style={[styles.ringOuter, ringStyle]} />
      <Animated.View style={[styles.ringInner, ringStyle]} />

      <Animated.View style={[styles.logoWrapper, logoStyle]}>
        <View style={styles.logoCore}>
          <Svg width="52" height="52" viewBox="0 0 200 200">
            <Path
              d="M100 18 C138 28 168 72 153 117 C138 162 103 186 100 190 C97 186 62 162 47 117 C32 72 62 28 100 18 Z"
              fill="#22C55E"
            />
            <Path d="M100 38 L100 172" stroke="rgba(255,255,255,0.5)" strokeWidth="4" strokeLinecap="round" />
            <Path d="M100 72 C85 82 74 97 63 113" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />
            <Path d="M100 98 C85 108 74 123 63 139" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />
            <Path d="M100 72 C115 82 126 97 137 113" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />
            <Path d="M100 98 C115 108 126 123 137 139" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />
          </Svg>
        </View>
      </Animated.View>

      <Animated.View style={[styles.textBlock, textStyle]}>
        <Text style={styles.title}>Forest Survey</Text>
        <Text style={styles.subtitle}>Intelligent Field Monitoring</Text>
      </Animated.View>

      <Animated.View style={[styles.loadingRow, textStyle]}>
        <Animated.View style={[styles.dot, dot1Style]} />
        <Animated.View style={[styles.dot, dot2Style]} />
        <Animated.View style={[styles.dot, dot3Style]} />
      </Animated.View>

      <Animated.View style={[styles.badge, textStyle]}>
        <Text style={styles.badgeText}>HERTZ • FIELD OPS</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  bgCircle1: {
    position: "absolute",
    width: width * 1.2, height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: "#22C55E",
    top: -width * 0.3, right: -width * 0.3,
  },
  bgCircle2: {
    position: "absolute",
    width: width * 1.0, height: width * 1.0,
    borderRadius: width * 0.5,
    backgroundColor: "#0EA5E9",
    bottom: -width * 0.4, left: -width * 0.3,
  },
  dotsGrid: {
    position: "absolute", top: height * 0.1, right: 20,
    flexDirection: "row", flexWrap: "wrap", width: 120, gap: 10, opacity: 0.15,
  },
  gridDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#fff" },
  ringOuter: {
    position: "absolute",
    width: width * 0.55, height: width * 0.55,
    borderRadius: width * 0.275,
    borderWidth: 1, borderColor: "rgba(34,197,94,0.3)",
  },
  ringInner: {
    position: "absolute",
    width: width * 0.42, height: width * 0.42,
    borderRadius: width * 0.21,
    borderWidth: 1.5, borderColor: "rgba(34,197,94,0.5)",
  },
  logoWrapper: {
    width: width * 0.28, height: width * 0.28,
    justifyContent: "center", alignItems: "center", marginBottom: 32,
  },
  logoCore: {
    width: "100%", height: "100%", borderRadius: 999,
    backgroundColor: "rgba(15,61,46,0.9)",
    borderWidth: 2, borderColor: "rgba(34,197,94,0.6)",
    justifyContent: "center", alignItems: "center",
  },
  textBlock: { alignItems: "center", marginBottom: 24 },
  title: { fontSize: width * 0.085, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.5 },
  subtitle: { fontSize: width * 0.038, color: "rgba(167,243,208,0.8)", marginTop: 6, letterSpacing: 0.5 },
  loadingRow: { flexDirection: "row", gap: 8, marginBottom: 40 },
  dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: "#22C55E" },
  badge: {
    position: "absolute", bottom: 48,
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  badgeText: { color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: 3, fontWeight: "600" },
});