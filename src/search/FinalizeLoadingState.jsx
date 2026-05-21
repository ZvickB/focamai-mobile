import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Text, View } from "react-native";
import { Surface, cx } from "../components/MobileUI";

const logoImage = require("../../assets/focamai-icon-512.png");

const FINALIZE_STAGES = [
  { delayMs: 0, label: "Reading your search" },
  { delayMs: 1200, label: "Applying your notes" },
  { delayMs: 2600, label: "Narrowing to six picks" },
  { delayMs: 3800, label: "Getting the shortlist ready" },
];

function ShimmerOverlay() {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerValue, {
        duration: 1450,
        easing: Easing.inOut(Easing.quad),
        toValue: 1,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [shimmerValue]);

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-180, 340],
  });

  return (
    <Animated.View
      className="absolute inset-y-0 w-20 bg-white/60"
      pointerEvents="none"
      style={{
        opacity: 0.8,
        transform: [{ translateX }, { skewX: "-18deg" }],
      }}
    />
  );
}

function SkeletonBlock({ className = "" }) {
  return (
    <View className={cx("overflow-hidden rounded-full bg-line/70", className)}>
      <ShimmerOverlay />
    </View>
  );
}

function SkeletonProductCard({ index }) {
  return (
    <Surface
      className="overflow-hidden bg-white px-0 py-0"
      testID={`finalizeLoading.skeleton.${index}`}
    >
      <View className="relative h-32 items-center justify-center overflow-hidden bg-cream">
        <Image
          accessibilityIgnoresInvertColors
          className="h-16 w-16 opacity-20"
          resizeMode="contain"
          source={logoImage}
          testID={`finalizeLoading.logo.${index}`}
        />
        <ShimmerOverlay />
      </View>

      <View className="gap-3 px-5 py-5">
        <SkeletonBlock className="h-4 w-20" />
        <SkeletonBlock className="h-5 w-4/5" />
        <SkeletonBlock className="h-4 w-2/3" />

        <View className="gap-2 pt-1">
          <SkeletonBlock className="h-3.5 w-full" />
          <SkeletonBlock className="h-3.5 w-11/12" />
          <SkeletonBlock className="h-3.5 w-3/5" />
        </View>

        <View className="mt-1 h-10 overflow-hidden rounded-[16px] bg-stone-200/80">
          <ShimmerOverlay />
        </View>
      </View>
    </Surface>
  );
}

export function FinalizeLoadingState() {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    setStageIndex(0);

    const timers = FINALIZE_STAGES.slice(1).map((stage, index) =>
      setTimeout(() => {
        setStageIndex(index + 1);
      }, stage.delayMs),
    );

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const activeStage = FINALIZE_STAGES[stageIndex] || FINALIZE_STAGES[0];

  return (
    <View className="gap-4" testID="finalizeLoading.state">
      <Surface variant="quiet">
        <Text className="text-xs font-semibold uppercase tracking-[1.1px] text-stone-500">
          Shortlist
        </Text>
        <Text className="mt-2 text-[26px] font-semibold leading-[33px] text-ink">
          We're on it. Your results will be here soon.
        </Text>
        <Text className="mt-2 text-[15px] leading-6 text-stone-600">
          Focamai is narrowing the options around your search and notes.
        </Text>

        <View
          accessibilityLabel={`Finalize progress: ${activeStage.label}`}
          accessibilityRole="progressbar"
          accessibilityValue={{
            max: FINALIZE_STAGES.length,
            min: 1,
            now: stageIndex + 1,
            text: activeStage.label,
          }}
          className="mt-5 rounded-[18px] border border-line bg-white px-4 py-4"
          testID="finalizeLoading.stage"
        >
          <View className="flex-row items-center gap-3">
            <View className="h-2.5 w-2.5 rounded-full bg-accent" />
            <Text className="text-sm font-semibold text-ink">{activeStage.label}</Text>
          </View>
          <Text className="mt-2 text-sm leading-5 text-stone-500">
            This usually takes just a few seconds.
          </Text>
        </View>
      </Surface>

      <View className="gap-3" accessibilityLabel="Shortlist preview loading">
        {[0, 1, 2].map((index) => (
          <SkeletonProductCard index={index + 1} key={index} />
        ))}
      </View>
    </View>
  );
}

export default FinalizeLoadingState;
