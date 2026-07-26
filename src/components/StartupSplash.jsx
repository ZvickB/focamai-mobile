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
const MAX_SPLASH_LOGO_SIZE = 224;
const shimmerColors = [
  "rgba(251,247,239,0)",
  "rgba(232,247,239,0.18)",
  "rgba(255,244,220,0.38)",
  "rgba(232,247,239,0.18)",
  "rgba(251,247,239,0)",
];

const splashLogo = require("../../assets/adaptive-icon-foreground.png");

export default function StartupSplash({ appReady, nativeSplashHidden, onDismissed, onReady }) {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const frameStyle = { height: windowHeight, width: windowWidth };
  const splashLogoSize = Math.min(windowWidth * 0.62, MAX_SPLASH_LOGO_SIZE);
  const splashLogoStyle = {
    height: splashLogoSize,
    left: (windowWidth - splashLogoSize) / 2,
    top: (windowHeight - splashLogoSize) / 2,
    width: splashLogoSize,
  };
  const [layoutReady, setLayoutReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const dismissStartedRef = useRef(false);
  const hasReportedReadyRef = useRef(false);
  const shimmerStartedAtRef = useRef(null);
  const shimmerStartedRef = useRef(false);
  const shimmerDelayRef = useRef(null);
  const finishTimerRef = useRef(null);
  const splashOpacity = useSharedValue(1);
  const shimmerProgress = useSharedValue(0);

  const animatedSplashStyle = useAnimatedStyle(() => ({ opacity: splashOpacity.value }));
  const animatedShimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -splashLogoSize * 1.1 + shimmerProgress.value * splashLogoSize * 2.2 },
      { translateY: -splashLogoSize * 0.15 + shimmerProgress.value * splashLogoSize * 0.3 },
      { rotate: "20deg" },
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

    // The navigator is already mounted underneath this matching layer. Fading
    // the logo over it leaves a brief doubled-logo frame on fast launches,
    // so remove the overlay as one atomic handoff instead.
    splashOpacity.value = 0;
    onDismissed();
  }, [onDismissed, shimmerProgress, splashOpacity]);

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
      <Animated.View pointerEvents="none" style={[styles.frame, styles.background, frameStyle, animatedSplashStyle]} />
      <Animated.View pointerEvents="none" style={[styles.frame, frameStyle, animatedSplashStyle]}>
        <Image
          resizeMode="contain"
          source={splashLogo}
          style={[styles.frame, splashLogoStyle]}
        />
        {!reducedMotion ? (
          <MaskedView
            maskElement={
              <Image resizeMode="contain" source={splashLogo} style={styles.maskImage} />
            }
            pointerEvents="none"
            style={[styles.frame, splashLogoStyle]}
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
      </Animated.View>
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
  maskImage: {
    height: "100%",
    width: "100%",
  },
  shimmerBand: {
    height: "145%",
    left: "-70%",
    position: "absolute",
    top: "-22.5%",
    width: "65%",
  },
});
