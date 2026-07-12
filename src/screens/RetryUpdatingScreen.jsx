import { Check, Search } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import {
  AppHeader,
  HeaderBackButton,
  QuietStatusPanel,
  ScreenContainer,
  Surface,
  cx,
} from "../components/MobileUI";
import { SearchFlowProgressCue } from "../search/SearchFlowProgressCue";
import { useSearchFlow } from "../search/SearchFlowContext";

function replaceOrNavigate(navigation, routeName) {
  if (typeof navigation.replace === "function") {
    navigation.replace(routeName);
    return;
  }

  navigation.navigate(routeName);
}

function SearchPulseIcon() {
  const pulseValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(pulseValue, {
        duration: 1800,
        easing: Easing.out(Easing.quad),
        toValue: 1,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulseValue]);

  const ringScale = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.78, 1.24],
  });
  const ringOpacity = pulseValue.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [0.26, 0.12, 0],
  });

  return (
    <View className="h-28 items-center justify-center" testID="retryUpdating.searchPulse">
      <Animated.View
        className="absolute h-24 w-24 rounded-full border border-accent bg-accent/10"
        style={{
          opacity: ringOpacity,
          transform: [{ scale: ringScale }],
        }}
      />
      <View className="h-20 w-20 items-center justify-center rounded-full bg-cream">
        <Search color="#0F6175" size={34} strokeWidth={2.2} />
      </View>
    </View>
  );
}

function ProgressShimmer() {
  const progressValue = useRef(new Animated.Value(0)).current;
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.timing(progressValue, {
          duration: 2500,
          easing: Easing.inOut(Easing.cubic),
          toValue: 1,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerValue, {
          duration: 2500,
          easing: Easing.inOut(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
    );

    progressValue.setValue(0);
    shimmerValue.setValue(0);
    animation.start();

    return () => {
      animation.stop();
    };
  }, [progressValue, shimmerValue]);

  const fillWidth = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });
  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 260],
  });

  return (
    <View
      accessibilityLabel="Finding better matches"
      accessibilityRole="progressbar"
      className="h-2.5 overflow-hidden rounded-full bg-line"
      testID="retryUpdating.progress"
    >
      <Animated.View
        className="h-full overflow-hidden rounded-full bg-accent"
        style={{ width: fillWidth }}
      >
        <Animated.View
          className="absolute inset-y-0 w-10 bg-white/35"
          pointerEvents="none"
          style={{
            opacity: 0.72,
            transform: [{ translateX }, { skewX: "-16deg" }],
          }}
        />
      </Animated.View>
    </View>
  );
}

export default function RetryUpdatingScreen({ navigation }) {
  const {
    canFinalize,
    errorMessage,
    finalizeFocusedPicks,
    isFinalizing,
    retrySearchQuery,
  } = useSearchFlow();
  const [hasRequestedFinalize, setHasRequestedFinalize] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    async function finalizeRetrySearch() {
      setHasRequestedFinalize(true);
      const didFinalize = await finalizeFocusedPicks({ followUpNotesOverride: "" });

      if (isMountedRef.current && didFinalize) {
        replaceOrNavigate(navigation, "Results");
      }
    }

    if (!hasRequestedFinalize && canFinalize && !isFinalizing) {
      void finalizeRetrySearch();
    }

  }, [canFinalize, finalizeFocusedPicks, hasRequestedFinalize, isFinalizing, navigation]);

  const statusCopy = isFinalizing || hasRequestedFinalize
    ? "Narrowing to 6 updated picks..."
    : "Finding better matches...";

  return (
    <ScreenContainer
      safeAreaEdges={["top", "bottom"]}
      testID="retryUpdating.screen"
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
      }}
    >
      <View className="w-full max-w-[430px] self-center gap-5">
        <AppHeader
          left={<HeaderBackButton label="Search" onPress={() => navigation.navigate("Search")} />}
          right={<View className="h-11 w-11" />}
        />

        <SearchFlowProgressCue activeStep="refine" />

        <Surface className="items-center">
          <SearchPulseIcon />

          <Text className="mt-1 text-center text-[26px] font-semibold leading-[33px] text-ink">
            We're updating your picks based on your feedback.
          </Text>
          <Text className="mt-3 text-center text-[15px] leading-6 text-stone-600">
            Focamai is using a sharper search to find 6 picks that fit better.
          </Text>

          <QuietStatusPanel className="mt-6 w-full" testID="retryUpdating.queryPanel">
            <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-stone-500">
              Improved search we're using
            </Text>
            <Text className="mt-2 text-base font-semibold leading-6 text-accent">
              {retrySearchQuery || "Preparing a sharper search..."}
            </Text>
            <Text className="mt-3 text-sm leading-5 text-stone-600">
              Based on your Improve picks feedback.
            </Text>
          </QuietStatusPanel>

          <View className="mt-6 w-full gap-3">
            <View className="flex-row items-center justify-center gap-3">
              <View className="h-px flex-1 bg-line" />
              <Text className="text-sm font-medium text-stone-600">{statusCopy}</Text>
              <View className="h-px flex-1 bg-line" />
            </View>
            <ProgressShimmer />
            <Text className="text-center text-sm leading-5 text-stone-500">
              This usually takes just a few seconds.
            </Text>
          </View>

          <QuietStatusPanel className={cx("mt-6 w-full flex-row items-center gap-3")}>
            <View className="h-10 w-10 items-center justify-center rounded-full border border-accent bg-cream">
              <Check color="#0F6175" size={20} strokeWidth={2.3} />
            </View>
            <Text className="flex-1 text-sm leading-5 text-stone-700">
              You'll see 6 updated picks on the next screen.
            </Text>
          </QuietStatusPanel>

          {errorMessage ? (
            <Text className="mt-4 text-center text-sm leading-5 text-stone-600">
              {errorMessage}
            </Text>
          ) : null}
        </Surface>
      </View>
    </ScreenContainer>
  );
}
