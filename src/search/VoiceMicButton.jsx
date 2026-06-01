import { useEffect } from "react";
import { Pressable } from "react-native";
import { Mic } from "lucide-react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { cx } from "../components/MobileUI";

export function VoiceMicButton({
  voiceStatus,
  onPress,
  idleLabel = "Search by voice",
  className,
  iconSize = 23,
  testID,
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (voiceStatus === "recording") {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.18, { duration: 500 }),
          withTiming(1, { duration: 500 }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(scale);
      scale.value = withTiming(1, { duration: 150 });
    }
  }, [voiceStatus, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isRecording = voiceStatus === "recording";
  const isError = voiceStatus === "error";

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityLabel={
          isRecording
            ? "Stop recording"
            : voiceStatus === "processing"
              ? "Transcribing…"
              : idleLabel
        }
        accessibilityRole="button"
        className={cx(
          "items-center justify-center rounded-full",
          isRecording ? "bg-red-100" : "bg-cream",
          className,
        )}
        disabled={voiceStatus === "processing"}
        onPress={onPress}
        testID={testID}
      >
        <Mic
          color={isRecording || isError ? "#C0392B" : "#0F6175"}
          size={iconSize}
          strokeWidth={2.2}
        />
      </Pressable>
    </Animated.View>
  );
}
