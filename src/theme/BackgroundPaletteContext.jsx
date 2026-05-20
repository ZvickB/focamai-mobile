import { createContext, useContext, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

export const BACKGROUND_PALETTE_OPTIONS = [
  {
    id: "current-warm-cream",
    name: "Current Warm Cream",
    tokens: {
      appBackground: "#f7f2ea",
      cardBackground: "#fcf9f3",
      borderSubtle: "#e4d7c6",
    },
  },
  {
    id: "cleaner-ivory",
    name: "Cleaner Ivory",
    tokens: {
      appBackground: "#fbf7ef",
      cardBackground: "#fcf9f3",
      borderSubtle: "#e4d7c6",
    },
  },
  {
    id: "soft-porcelain",
    name: "Soft Porcelain",
    tokens: {
      appBackground: "#faf6f1",
      cardBackground: "#fcf9f3",
      borderSubtle: "#e4d7c6",
    },
  },
  {
    id: "creamy-white",
    name: "Creamy White",
    tokens: {
      appBackground: "#fffaf2",
      cardBackground: "#fcf9f3",
      borderSubtle: "#e4d7c6",
    },
  },
  {
    id: "slightly-cooler-linen",
    name: "Slightly Cooler Linen",
    tokens: {
      appBackground: "#f7f4ee",
      cardBackground: "#fcf9f3",
      borderSubtle: "#e4d7c6",
    },
  },
];

const DEFAULT_BACKGROUND_OPTION_ID = "soft-porcelain";
const DEFAULT_BACKGROUND_OPTION_INDEX = Math.max(
  BACKGROUND_PALETTE_OPTIONS.findIndex((option) => option.id === DEFAULT_BACKGROUND_OPTION_ID),
  0,
);

const BackgroundPaletteContext = createContext({
  activeBackgroundOption: BACKGROUND_PALETTE_OPTIONS[DEFAULT_BACKGROUND_OPTION_INDEX],
  cycleBackgroundOption: () => {},
  themeTokens: BACKGROUND_PALETTE_OPTIONS[DEFAULT_BACKGROUND_OPTION_INDEX].tokens,
});

const isDevMode = typeof __DEV__ !== "undefined" && __DEV__;

export function BackgroundPaletteProvider({ children }) {
  const [activeIndex, setActiveIndex] = useState(DEFAULT_BACKGROUND_OPTION_INDEX);
  const activeBackgroundOption = BACKGROUND_PALETTE_OPTIONS[activeIndex];

  const value = useMemo(
    () => ({
      activeBackgroundOption,
      cycleBackgroundOption: () =>
        setActiveIndex((currentIndex) => (currentIndex + 1) % BACKGROUND_PALETTE_OPTIONS.length),
      themeTokens: activeBackgroundOption.tokens,
    }),
    [activeBackgroundOption],
  );

  return (
    <BackgroundPaletteContext.Provider value={value}>
      {children}
    </BackgroundPaletteContext.Provider>
  );
}

export function useBackgroundPalette() {
  return useContext(BackgroundPaletteContext);
}

export function DevBackgroundPaletteControl() {
  const { activeBackgroundOption, cycleBackgroundOption } = useBackgroundPalette();

  if (!isDevMode) {
    return null;
  }

  return (
    <View
      className="absolute bottom-5 left-4 z-50"
      pointerEvents="box-none"
    >
      <Pressable
        accessibilityLabel={`Switch app background. Current option: ${activeBackgroundOption.name}`}
        accessibilityRole="button"
        className="rounded-full border border-line bg-white px-3 py-2 shadow-sm"
        onPress={cycleBackgroundOption}
        testID="dev.backgroundPaletteToggle"
      >
        <Text className="text-[11px] font-semibold text-ink">
          BG: {activeBackgroundOption.name}
        </Text>
      </Pressable>
    </View>
  );
}
