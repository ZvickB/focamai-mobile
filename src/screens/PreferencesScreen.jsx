import { useState } from "react";
import { Check, SlidersHorizontal } from "lucide-react-native";
import { Pressable, Text, useWindowDimensions, View } from "react-native";

import { AppHeader, HeaderBackButton, QuietStatusPanel, ScreenContainer, cx } from "../components/MobileUI";
import { useAuth } from "../contexts/useAuth";
import {
  normalizeRankingPreference,
  RANKING_PREFERENCES,
  RANKING_PREFERENCE_LABELS,
} from "../lib/preferences/rankingPreference";

const PREFERENCE_OPTIONS = [
  {
    description: "Keep a practical mix of fit, quality, value, and variety.",
    value: RANKING_PREFERENCES.BALANCED,
  },
  {
    description: "Still weighs fit and quality, while favoring less expensive choices.",
    value: RANKING_PREFERENCES.PRICE,
  },
  {
    description: "Starts with the lowest-priced options that fit your search.",
    value: RANKING_PREFERENCES.LOWEST_PRICE,
  },
  {
    description: "Leans toward familiar category brands when the fit is close.",
    value: RANKING_PREFERENCES.BRAND,
  },
  {
    description: "Shows a broader spread of useful options after the best match.",
    value: RANKING_PREFERENCES.RANGE,
  },
];

function PreferencesHeader({ onBack }) {
  return (
    <AppHeader
      left={<HeaderBackButton label="Settings" onPress={onBack} testID="preferences.backButton" />}
      right={<View className="h-11 w-11" />}
    />
  );
}

function PreferenceRow({ disabled, isSelected, onPress, option }) {
  return (
    <Pressable
      accessibilityLabel={RANKING_PREFERENCE_LABELS[option.value]}
      accessibilityRole="radio"
      accessibilityState={{ disabled, selected: isSelected }}
      className={cx(
        "min-h-[76px] flex-row items-start gap-3 border-b border-line px-1 py-3",
        isSelected ? "bg-cream" : "bg-transparent",
      )}
      disabled={disabled}
      onPress={onPress}
      testID={`preferences.option.${option.value}`}
    >
      <View
        className={cx(
          "mt-0.5 h-6 w-6 items-center justify-center rounded-full border",
          isSelected ? "border-accent bg-accent" : "border-line bg-white",
        )}
      >
        {isSelected ? <Check color="#fff" size={14} strokeWidth={2.8} /> : null}
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text className={cx("text-sm", isSelected ? "font-semibold text-accent" : "font-semibold text-ink")}>
          {RANKING_PREFERENCE_LABELS[option.value]}
        </Text>
        <Text className="text-sm leading-5 text-stone-600">{option.description}</Text>
      </View>
    </Pressable>
  );
}

export default function PreferencesScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;
  const {
    rankingPreference,
    rankingPreferenceError,
    rankingPreferenceLoading,
    setRankingPreference,
  } = useAuth();
  const [saveStatus, setSaveStatus] = useState("");
  const selectedPreference = normalizeRankingPreference(rankingPreference);

  async function choosePreference(nextPreference) {
    if (nextPreference === selectedPreference || rankingPreferenceLoading) return;

    setSaveStatus("");
    const { error } = await setRankingPreference(nextPreference);
    if (!error) {
      setSaveStatus("Saved to your account.");
    }
  }

  return (
    <ScreenContainer
      testID="preferences.screen"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={{
        gap: isCompact ? 18 : 22,
        paddingHorizontal: isCompact ? 16 : 24,
        paddingTop: 14,
        paddingBottom: isCompact ? 24 : 32,
      }}
    >
      <View className="w-full max-w-[430px] self-center">
        <PreferencesHeader onBack={() => navigation.navigate("Settings")} />
      </View>

      <View className="w-full max-w-[430px] self-center gap-5">
        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <SlidersHorizontal color="#0F6175" size={19} strokeWidth={2.2} />
            <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-accent">
              Preferences
            </Text>
          </View>
          <Text className="text-[28px] font-semibold leading-[35px] text-ink">
            What should lead your picks?
          </Text>
          <Text className="text-[15px] leading-6 text-stone-600">
            This shapes how Focamai ranks each new set of six picks.
          </Text>
        </View>

        <View accessibilityRole="radiogroup" className="border-t border-line">
          {PREFERENCE_OPTIONS.map((option) => (
            <PreferenceRow
              key={option.value}
              disabled={rankingPreferenceLoading}
              isSelected={selectedPreference === option.value}
              onPress={() => choosePreference(option.value)}
              option={option}
            />
          ))}
        </View>

        <QuietStatusPanel>
          <Text accessibilityRole="status" className="text-sm leading-5 text-stone-600">
            {rankingPreferenceLoading
              ? "Saving preference…"
              : rankingPreferenceError || saveStatus || "Changes save automatically for future searches."}
          </Text>
        </QuietStatusPanel>
      </View>
    </ScreenContainer>
  );
}
