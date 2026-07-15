import { ChevronRight } from "lucide-react-native";
import * as Application from "expo-application";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { HeaderBackButton, ScreenContainer, cx } from "../components/MobileUI";
import { useAuth } from "../contexts/useAuth";
import { isMobileAccountUiEnabled, isSentryVerificationUiEnabled } from "../config/features";

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

function AppVersionFooter() {
  const versionName = Application.nativeApplicationVersion;
  const buildNumber = Application.nativeBuildVersion;

  if (!versionName) {
    return null;
  }

  return (
    <Text
      className="text-center text-xs text-stone-400"
      testID="settings.appVersion"
    >
      Focamai {versionName}
      {buildNumber ? ` (${buildNumber})` : ""}
    </Text>
  );
}

function SettingsIntro() {
  return (
    <View className="gap-2">
      <Text className="text-[28px] font-semibold leading-[35px] text-ink">
        Settings
      </Text>
      <Text className="text-[15px] leading-6 text-stone-600">
        Manage your shopping region and app information.
      </Text>
    </View>
  );
}

function SettingsSectionHeader({ title }) {
  return (
    <Text className="px-1 text-xs font-semibold uppercase tracking-[1px] text-stone-500">
      {title}
    </Text>
  );
}

function SettingsRow({ isLast = false, label, onPress }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className="min-h-[52px] bg-transparent px-1"
      onPress={onPress}
    >
      <View className={cx("min-h-[52px] flex-row items-center justify-between", isLast ? "" : "border-b border-line")}>
        <Text className="text-base font-medium text-ink">{label}</Text>
        <ChevronRight color="#78716c" size={19} strokeWidth={2.2} />
      </View>
    </Pressable>
  );
}

export default function SettingsScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;
  const { user } = useAuth();
  const shouldShowHistoryFallback = !isMobileAccountUiEnabled() || !user;
  const sentryVerificationUiEnabled = isSentryVerificationUiEnabled();
  const menuItems = [
    { label: "Shopping region", routeName: "Region" },
    ...(shouldShowHistoryFallback ? [{ label: "Search history", routeName: "History" }] : []),
    { label: "About Focama", routeName: "About" },
    { label: "Contact", routeName: "Contact" },
    { label: "Privacy", routeName: "Privacy" },
    { label: "Affiliate Disclosure", routeName: "AffiliateDisclosure" },
    ...(sentryVerificationUiEnabled
      ? [{ label: "Sentry verification (temporary)", routeName: "SentryVerification" }]
      : []),
  ];

  return (
    <ScreenContainer
      testID="settings.screen"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={{
        gap: isCompact ? 18 : 22,
        paddingHorizontal: isCompact ? 16 : 24,
        paddingTop: 14,
        paddingBottom: isCompact ? 24 : 32,
      }}
    >
      <View className="w-full max-w-[430px] self-center">
        <SettingsHeader onBack={() => navigation.navigate("Search")} />
      </View>

      <View className={cx("w-full max-w-[430px] self-center", isCompact ? "gap-5" : "gap-6")}>
        <SettingsIntro />

        <View className="gap-2">
          <SettingsSectionHeader title="App" />
          <View className="border-b border-t border-line">
            {menuItems.map((item, index) => (
              <SettingsRow
                key={item.routeName}
                isLast={index === menuItems.length - 1}
                label={item.label}
                onPress={() => navigation.navigate(item.routeName)}
              />
            ))}
          </View>
        </View>

        <AppVersionFooter />
      </View>
    </ScreenContainer>
  );
}
