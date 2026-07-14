import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Image, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const SPLASH_BACKGROUND = "#fbf7ef";
const STATIC_LOGO_DELAY_MS = 200;
const SHIMMER_DURATION_MS = 900;
const FINISHING_WINDOW_MS = 170;
const SPLASH_FADE_DURATION_MS = 220;
const shimmerColors = [
  "rgba(251,247,239,0)",
  "rgba(232,247,239,0.2)",
  "rgba(255,244,220,0.16)",
  "rgba(251,247,239,0)",
];

const splashWordmark = require("../../assets/splash-wordmark.png");
const splashWordmarkMask = require("../../assets/splash-wordmark-mask.png");

export default function StartupSplash({ appReady, nativeSplashHidden, onDismissed, onReady }) {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const frameStyle = { height: windowHeight, width: windowWidth };
  const [layoutReady, setLayoutReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const dismissStartedRef = useRef(false);
  const hasReportedReadyRef = useRef(false);
  const shimmerStartedAtRef = useRef(null);
  const shimmerStartedRef = useRef(false);
  const shimmerDelayRef = useRef(null);
  const finishTimerRef = useRef(null);
  const dismissTimerRef = useRef(null);
  const backgroundOpacity = useSharedValue(1);
  const shimmerProgress = useSharedValue(0);

  const animatedBackgroundStyle = useAnimatedStyle(() => ({ opacity: backgroundOpacity.value }));
  const animatedShimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -310 + shimmerProgress.value * 620 },
      { translateY: -125 + shimmerProgress.value * 250 },
      { rotate: "24deg" },
    ],
  }));

  const dismiss = useCallback(() => {
    if (dismissStartedRef.current) {
      return;
    }

    dismissStartedRef.current = true;
    if (shimmerDelayRef.current) clearTimeout(shimmerDelayRef.current);
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    cancelAnimation(shimmerProgress);

    backgroundOpacity.value = withTiming(0, {
      duration: SPLASH_FADE_DURATION_MS,
      easing: Easing.out(Easing.quad),
    });

    // Reanimated's completion callback is not a safe startup gate on every
    // dev-client/runtime combination. The visual fade is best-effort; this JS
    // timer guarantees that it can never leave the user behind the overlay.
    dismissTimerRef.current = setTimeout(onDismissed, SPLASH_FADE_DURATION_MS);
  }, [backgroundOpacity, onDismissed, shimmerProgress]);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReducedMotion(enabled);
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener?.("reduceMotionChanged", setReducedMotion);
    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  useEffect(() => {
    if (!layoutReady || hasReportedReadyRef.current) {
      return undefined;
    }

    hasReportedReadyRef.current = true;
    // The splash image is bundled with the app, so its JS load callback is not a
    // safe readiness signal on iOS while the native splash covers this view.
    // Two compositor frames ensure the matching React Native layer is painted
    // before we remove the native layer.
    let secondFrame;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(onReady);
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      if (secondFrame) cancelAnimationFrame(secondFrame);
    };
  }, [layoutReady, onReady]);

  useEffect(() => {
    if (!nativeSplashHidden || dismissStartedRef.current) {
      return undefined;
    }

    if (reducedMotion) {
      if (appReady) dismiss();
      return undefined;
    }

    if (appReady) {
      dismiss();
      return undefined;
    }

    shimmerDelayRef.current = setTimeout(() => {
      if (dismissStartedRef.current || appReady || reducedMotion) {
        return;
      }

      shimmerStartedRef.current = true;
      shimmerStartedAtRef.current = Date.now();
      shimmerProgress.value = withTiming(1, {
        duration: SHIMMER_DURATION_MS,
        easing: Easing.inOut(Easing.cubic),
      });
    }, STATIC_LOGO_DELAY_MS);

    return () => {
      if (shimmerDelayRef.current) clearTimeout(shimmerDelayRef.current);
    };
  }, [appReady, dismiss, nativeSplashHidden, reducedMotion, shimmerProgress]);

  useEffect(() => {
    if (!nativeSplashHidden || !appReady || dismissStartedRef.current) {
      return;
    }

    const shimmerElapsed = shimmerStartedAtRef.current ? Date.now() - shimmerStartedAtRef.current : 0;
    const shimmerIsNearlyComplete =
      shimmerStartedRef.current && shimmerElapsed >= SHIMMER_DURATION_MS - FINISHING_WINDOW_MS;

    if (!shimmerIsNearlyComplete) {
      dismiss();
      return;
    }

    finishTimerRef.current = setTimeout(dismiss, Math.max(0, SHIMMER_DURATION_MS - shimmerElapsed));
  }, [appReady, dismiss, nativeSplashHidden]);

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      onLayout={() => setLayoutReady(true)}
      pointerEvents="none"
      style={[styles.container, styles.frame, frameStyle]}
    >
      <Animated.View pointerEvents="none" style={[styles.frame, styles.background, frameStyle, animatedBackgroundStyle]} />
      <View pointerEvents="none" style={[styles.frame, frameStyle]}>
        <Image
          resizeMode="contain"
          source={splashWordmark}
          style={[styles.frame, frameStyle]}
        />
        {!reducedMotion ? (
          <MaskedView
            maskElement={<Image resizeMode="contain" source={splashWordmarkMask} style={[styles.frame, frameStyle]} />}
            pointerEvents="none"
            style={[styles.frame, frameStyle]}
          >
            <Animated.View pointerEvents="none" style={[styles.shimmerBand, animatedShimmerStyle]}>
              <LinearGradient
                colors={shimmerColors}
                end={{ x: 1, y: 0.5 }}
                start={{ x: 0, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </MaskedView>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
  },
  frame: {
    left: 0,
    position: "absolute",
    top: 0,
  },
  background: {
    backgroundColor: SPLASH_BACKGROUND,
  },
  shimmerBand: {
    height: "38%",
    left: "-45%",
    position: "absolute",
    top: "31%",
    width: "190%",
  },
});
