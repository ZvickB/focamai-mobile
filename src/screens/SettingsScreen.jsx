import { ChevronRight } from "lucide-react-native";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { HeaderBackButton, ScreenContainer, ScreenIntro, cx } from "../components/MobileUI";

function SettingsHeader({ onBack }) {
  const { width } = useWindowDimensions();
  const sideSlotClassName = width <= 415 ? "min-w-[72px]" : "min-w-[96px]";

  return (
    <View className="relative min-h-[44px] w-full flex-row items-center justify-between">
      <View className={cx("z-10 flex-row items-center justify-start", sideSlotClassName)}>
        <HeaderBackButton label="Search" onPress={onBack} testID="settings.backButton" />
      </View>
      <Text className="absolute inset-x-0 text-center text-base font-semibold text-ink">
        Settings
      </Text>
      <View className={sideSlotClassName} />
    </View>
  );
}

function SettingsRow({ label, onPress }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className="min-h-[60px] flex-row items-center justify-between rounded-[18px] border border-line bg-cream px-4 py-3"
      onPress={onPress}
    >
      <Text className="text-base font-semibold text-ink">{label}</Text>
      <ChevronRight color="#14222b" size={20} strokeWidth={2.2} />
    </Pressable>
  );
}

export default function SettingsScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;
  const menuItems = [
    { label: "Shopping region", routeName: "Region" },
    { label: "About Focama", routeName: "About" },
    { label: "Contact", routeName: "Contact" },
    { label: "Privacy", routeName: "Privacy" },
    { label: "Affiliate Disclosure", routeName: "AffiliateDisclosure" },
  ];

  return (
    <ScreenContainer
      testID="settings.screen"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={{
        gap: isCompact ? 20 : 24,
        paddingHorizontal: isCompact ? 16 : 24,
        paddingTop: 14,
        paddingBottom: isCompact ? 24 : 32,
      }}
    >
      <View className="w-full max-w-[430px] self-center">
        <SettingsHeader onBack={() => navigation.navigate("Search")} />
      </View>

      <View className={cx("w-full max-w-[430px] self-center", isCompact ? "gap-5" : "gap-6")}>
        <ScreenIntro
          eyebrow="Settings"
          title="Preferences and app details."
          description="Manage your shopping region and core app information."
        />

        <View className={isCompact ? "gap-3" : "gap-4"}>
          {menuItems.map((item) => (
            <SettingsRow
              key={item.routeName}
              label={item.label}
              onPress={() => navigation.navigate(item.routeName)}
            />
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}
