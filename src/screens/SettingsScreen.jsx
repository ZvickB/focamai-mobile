import { ChevronRight, LogOut, Trash2, UserCircle } from "lucide-react-native";
import * as Application from "expo-application";
import { Alert, Pressable, Text, useWindowDimensions, View } from "react-native";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { HeaderBackButton, ScreenContainer, cx } from "../components/MobileUI";
import { useAuth } from "../contexts/useAuth";
import {
  isMobileAccountUiEnabled,
  isMobilePriceWatchUiEnabled,
  isSentryVerificationUiEnabled,
} from "../config/features";
import { deleteAccount } from "../lib/account/deleteAccount";
import { localHistoryStore } from "../lib/history/localHistoryStore";

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
        Preferences
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

function AccountSection({ navigation }) {
  const { configured, session, user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const priceWatchUiEnabled = isMobilePriceWatchUiEnabled();

  async function handleConfirmedDelete() {
    setIsDeleting(true);
    setDeleteError("");

    try {
      await deleteAccount(session?.access_token);
      await localHistoryStore.clear();
      queryClient.clear();
      await signOut({ scope: "local" });
      navigation.reset({ index: 0, routes: [{ name: "Search" }] });
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "We could not delete your account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      "Delete your Focamai account?",
      "This permanently deletes your account, saved searches, price watches, and Deep Dive usage record. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete account", style: "destructive", onPress: handleConfirmedDelete },
      ],
    );
  }

  if (!configured) return null;

  if (!user) {
    return (
      <View className="gap-2">
        <SettingsSectionHeader title="Account" />
        <View className="border-b border-t border-line">
          <SettingsRow
            isLast={!priceWatchUiEnabled}
            label="Sign in"
            onPress={() => navigation.navigate("Auth")}
          />
          {priceWatchUiEnabled ? (
            <SettingsRow
              isLast
              label="Price watches"
              onPress={() => navigation.navigate("PriceWatches")}
            />
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View className="gap-2">
      <SettingsSectionHeader title="Account" />
      <View className="rounded-[18px] border border-line bg-white px-4 py-4 gap-3">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-cream">
            <UserCircle color="#0F6175" size={22} strokeWidth={1.8} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
              {user.email}
            </Text>
            <Text className="text-xs text-stone-500">Signed in</Text>
          </View>
        </View>
        <Pressable
          accessibilityLabel="Sign out"
          accessibilityRole="button"
          className="min-h-[44px] flex-row items-center justify-center gap-2 rounded-[18px] border border-line bg-white"
          onPress={async () => {
            await signOut();
          }}
        >
          <LogOut color="#78716c" size={16} strokeWidth={2} />
          <Text className="text-sm font-semibold text-stone-600">Sign out</Text>
        </Pressable>
        <View className="border-t border-line pt-3">
          <Text className="text-sm leading-5 text-stone-600">
            Permanently delete your account and account-associated data.
          </Text>
          <Pressable
            accessibilityLabel="Delete account"
            accessibilityRole="button"
            className="mt-3 min-h-[44px] flex-row items-center justify-center gap-2 rounded-[18px] border border-red-200 bg-red-50"
            disabled={isDeleting}
            onPress={confirmDelete}
          >
            <Trash2 color="#b91c1c" size={16} strokeWidth={2} />
            <Text className="text-sm font-semibold text-red-700">
              {isDeleting ? "Deleting account…" : deleteError ? "Try deleting again" : "Delete account"}
            </Text>
          </Pressable>
          {deleteError ? (
            <Text accessibilityRole="alert" className="mt-2 text-sm leading-5 text-red-700">
              {deleteError}
            </Text>
          ) : null}
        </View>
      </View>
      {priceWatchUiEnabled ? (
        <View className="border-b border-t border-line">
          <SettingsRow
            isLast
            label="Price watches"
            onPress={() => navigation.navigate("PriceWatches")}
          />
        </View>
      ) : null}
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;
  const accountUiEnabled = isMobileAccountUiEnabled();
  const sentryVerificationUiEnabled = isSentryVerificationUiEnabled();
  const menuItems = [
    { label: "Shopping region", routeName: "Region" },
    { label: "Search history", routeName: "History" },
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

        {accountUiEnabled ? <AccountSection navigation={navigation} /> : null}

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
