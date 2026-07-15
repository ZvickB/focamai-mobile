import { useEffect, useRef, useState } from "react";
import { ChevronRight, LogOut, Settings, Trash2 } from "lucide-react-native";
import { Alert, Modal, Pressable, Text, useWindowDimensions, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import {
  AppHeader,
  IconButton,
  QuietStatusPanel,
  RecoveryPanel,
  ScreenContainer,
  cx,
} from "../components/MobileUI";
import { useAuth } from "../contexts/useAuth";
import { isMobileAccountUiEnabled, isMobilePriceWatchUiEnabled } from "../config/features";
import { deleteAccount } from "../lib/account/deleteAccount";
import { localHistoryStore } from "../lib/history/localHistoryStore";
import { MarketplacePromptSection } from "../search/MarketplacePromptSection";
import { SearchEntrySection } from "../search/SearchEntrySection";
import { SearchFlowProgressCue } from "../search/SearchFlowProgressCue";
import { useSearchFlow } from "../search/SearchFlowContext";

function SearchBackgroundWash() {
  return (
    <View
      className="absolute inset-x-0 top-0 h-[280px]"
      pointerEvents="none"
    >
      <Svg height="100%" preserveAspectRatio="none" width="100%">
        <Defs>
          <LinearGradient id="searchTopWash" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor="#f2ddbf" stopOpacity="0.3" />
            <Stop offset="0.58" stopColor="#f7ead8" stopOpacity="0.12" />
            <Stop offset="1" stopColor="#fbf7ef" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect fill="url(#searchTopWash)" height="100%" width="100%" x="0" y="0" />
      </Svg>
    </View>
  );
}

function SearchFocusHero() {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;

  return (
    <View className={isCompact ? "gap-1.5" : "gap-2"}>
      <View className="items-center px-3">
        <Text
          className={cx(
            "text-center font-semibold text-ink",
            isCompact ? "text-[30px] leading-[37px]" : "text-[32px] leading-[39px]",
          )}
          testID="search.title"
        >
          Find the right{"\u00A0"}pick.
        </Text>
        <Text className="mt-1.5 max-w-[300px] text-center text-[15px] leading-6 text-stone-600">
          Tell Focamai what you need. It narrows the noise to six useful picks.
        </Text>
      </View>
    </View>
  );
}

function SettingsIconButton({ onPress }) {
  return (
    <IconButton
      accessibilityLabel="Open settings"
      onPress={onPress}
      testID="search.settingsButton"
    >
      <Settings color="#0F6175" size={21} strokeWidth={2.1} />
    </IconButton>
  );
}

function AccountAvatarButton({ email, onPress }) {
  const initial = String(email || "F").trim().charAt(0).toUpperCase() || "F";

  return (
    <IconButton accessibilityLabel="Open account menu" className="bg-accent" onPress={onPress} testID="search.accountButton">
      <Text className="text-sm font-semibold text-white">{initial}</Text>
    </IconButton>
  );
}

function SearchHeader({ onOpenAccountMenu, onOpenSettings, onSignIn, showAccount, showSignIn, userEmail }) {
  return (
    <AppHeader
      left={showAccount ? (
        <AccountAvatarButton email={userEmail} onPress={onOpenAccountMenu} />
      ) : showSignIn ? (
        <Pressable
          accessibilityRole="button"
          className="min-h-[44px] justify-center pr-2"
          onPress={onSignIn}
          testID="search.signInButton"
        >
          <Text className="text-sm font-semibold text-accent">Sign in</Text>
        </Pressable>
      ) : <View className="h-11 w-11" />}
      right={<SettingsIconButton onPress={onOpenSettings} />}
    />
  );
}

function AccountSheetAction({ destructive = false, label, onPress }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className="min-h-[52px] flex-row items-center justify-between border-b border-line px-1"
      onPress={onPress}
    >
      <Text className={cx("text-base font-medium", destructive ? "text-red-700" : "text-ink")}>{label}</Text>
      {destructive ? <Trash2 color="#b91c1c" size={19} strokeWidth={2.1} /> : <ChevronRight color="#78716c" size={19} strokeWidth={2.2} />}
    </Pressable>
  );
}

function AccountSheet({ deleteError, email, onClose, onDeleteAccount, onOpenHistory, onOpenPreferences, onOpenPriceWatches, onSignOut, priceWatchUiEnabled, visible }) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityLabel="Close account menu"
          accessibilityRole="button"
          className="absolute inset-0 bg-black/20"
          onPress={onClose}
        />
        <View className="rounded-t-[20px] border border-line bg-white px-5 pb-8 pt-5">
          <View className="mb-4 gap-1">
            <Text className="text-base font-semibold text-ink" numberOfLines={1}>{email}</Text>
            <Text className="text-sm text-stone-500">Account</Text>
          </View>
          <View className="border-t border-line">
            <AccountSheetAction label="Preferences" onPress={onOpenPreferences} />
            <AccountSheetAction label="Search history" onPress={onOpenHistory} />
            {priceWatchUiEnabled ? <AccountSheetAction label="Price watches" onPress={onOpenPriceWatches} /> : null}
            <Pressable
              accessibilityLabel="Sign out"
              accessibilityRole="button"
              className="min-h-[52px] flex-row items-center gap-2 border-b border-line px-1"
              onPress={onSignOut}
            >
              <LogOut color="#78716c" size={18} strokeWidth={2.1} />
              <Text className="text-base font-medium text-ink">Sign out</Text>
            </Pressable>
            <AccountSheetAction destructive label="Delete account" onPress={onDeleteAccount} />
          </View>
          {deleteError ? <Text accessibilityRole="alert" className="mt-3 text-sm leading-5 text-red-700">{deleteError}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

function SearchFlexibleSpacer({ testID }) {
  return <View style={{ flexGrow: 1, flexShrink: 1 }} testID={testID} />;
}

function HistoryPrefillPanel({ followUp, onClear }) {
  return (
    <QuietStatusPanel className="gap-2" testID="search.historyPrefillPanel">
      <Text className="text-sm font-semibold text-ink">Saved search ready</Text>
      {followUp ? (
        <Text className="text-sm leading-5 text-stone-600" numberOfLines={3}>
          Notes for Refine: {followUp}
        </Text>
      ) : (
        <Text className="text-sm leading-5 text-stone-600">
          Start when you are ready, or adjust the search phrase first.
        </Text>
      )}
      {followUp ? (
        <Pressable accessibilityRole="button" onPress={onClear} testID="search.clearHistoryNotesButton">
          <Text className="text-sm font-semibold text-accent">Clear saved notes</Text>
        </Pressable>
      ) : null}
    </QuietStatusPanel>
  );
}

export default function SearchScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;
  const pendingNavigationToFollowUpRef = useRef(null);
  const [historyPrefill, setHistoryPrefill] = useState(null);
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const { configured: authConfigured, session, signOut, user } = useAuth();
  const queryClient = useQueryClient();
  const accountUiEnabled = isMobileAccountUiEnabled();
  const priceWatchUiEnabled = isMobilePriceWatchUiEnabled();
  const {
    activeSearchSession,
    clearRestoredFlowPhase,
    confirmSelectedAmazonDomain,
    errorMessage,
    followUpNotes,
    isDiscovering,
    productQuery,
    restoredFlowPhase,
    selectedAmazonDomain,
    showMarketplacePrompt,
    setFollowUpNotes,
    setProductQuery,
    setSelectedAmazonDomain,
    startDiscoverySearch,
  } = useSearchFlow();

  useEffect(() => {
    if (!restoredFlowPhase) {
      return;
    }

    clearRestoredFlowPhase();
    navigation.navigate(restoredFlowPhase === "results" ? "Results" : "FollowUp");
  }, [clearRestoredFlowPhase, navigation, restoredFlowPhase]);

  useEffect(() => {
    const routeAmazonDomain = route?.params?.selectedAmazonDomain;

    if (routeAmazonDomain) {
      setSelectedAmazonDomain(routeAmazonDomain);
      navigation.setParams({ selectedAmazonDomain: undefined });
    }
  }, [navigation, route?.params?.selectedAmazonDomain, setSelectedAmazonDomain]);

  useEffect(() => {
    const historySearch = route?.params?.historySearch;

    if (!historySearch) {
      return;
    }

    const nextQuery = String(historySearch.query || "").trim();
    const nextFollowUp = String(historySearch.followUp || "").trim();

    setProductQuery(nextQuery);
    setFollowUpNotes(nextFollowUp);
    setHistoryPrefill({ followUp: nextFollowUp, query: nextQuery });
    navigation.setParams({ historySearch: undefined });
  }, [navigation, route?.params?.historySearch, setFollowUpNotes, setProductQuery]);

  useEffect(() => {
    const pendingSearch = pendingNavigationToFollowUpRef.current;
    const startedMatchingSearch =
      pendingSearch &&
      activeSearchSession?.submittedQuery === pendingSearch.query &&
      activeSearchSession?.requestId !== pendingSearch.previousRequestId;

    if (startedMatchingSearch && !showMarketplacePrompt) {
      pendingNavigationToFollowUpRef.current = null;
      setHistoryPrefill(null);
      navigation.navigate("FollowUp");
    }
  }, [activeSearchSession, navigation, showMarketplacePrompt]);

  function submitSearch(queryOverride) {
    const nextQuery = String(queryOverride ?? productQuery).trim();
    const hasQuery = nextQuery.length > 0;
    pendingNavigationToFollowUpRef.current = hasQuery
      ? {
          previousRequestId: activeSearchSession?.requestId,
          query: nextQuery,
        }
      : null;
    const initialFollowUpNotes = historyPrefill?.followUp || "";
    const didStartSearch = startDiscoverySearch({
      initialFollowUpNotes,
      ...(queryOverride === undefined ? {} : { queryOverride: nextQuery }),
    });

    if (hasQuery && didStartSearch) {
      pendingNavigationToFollowUpRef.current = null;
      setHistoryPrefill(null);
      navigation.navigate("FollowUp");
    } else if (!hasQuery) {
      pendingNavigationToFollowUpRef.current = null;
    }
  }

  function confirmMarketplaceAndContinue(nextAmazonDomain) {
    const nextQuery = String(productQuery).trim();
    pendingNavigationToFollowUpRef.current = nextQuery
      ? {
          previousRequestId: activeSearchSession?.requestId,
          query: nextQuery,
        }
      : pendingNavigationToFollowUpRef.current;
    const didStartSearch = confirmSelectedAmazonDomain(nextAmazonDomain);

    if (didStartSearch) {
      pendingNavigationToFollowUpRef.current = null;
      setHistoryPrefill(null);
      navigation.navigate("FollowUp");
    }
  }

  function clearHistoryNotes() {
    setFollowUpNotes("");
    setHistoryPrefill((currentValue) =>
      currentValue ? { ...currentValue, followUp: "" } : currentValue,
    );
  }

  function closeAccountMenu() {
    setAccountMenuVisible(false);
  }

  function openAccountDestination(routeName) {
    closeAccountMenu();
    navigation.navigate(routeName);
  }

  async function handleSignOut() {
    closeAccountMenu();
    await signOut();
  }

  async function handleConfirmedAccountDeletion() {
    setIsDeletingAccount(true);
    setDeleteError("");

    try {
      await deleteAccount(session?.access_token);
      await localHistoryStore.clear();
      queryClient.clear();
      await signOut({ scope: "local" });
      closeAccountMenu();
      navigation.reset({ index: 0, routes: [{ name: "Search" }] });
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "We could not delete your account. Please try again.");
    } finally {
      setIsDeletingAccount(false);
    }
  }

  function confirmAccountDeletion() {
    if (isDeletingAccount) return;

    Alert.alert(
      "Delete your Focamai account?",
      "This permanently deletes your account, saved searches, price watches, and Deep Dive usage record. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete account", style: "destructive", onPress: handleConfirmedAccountDeletion },
      ],
    );
  }

  return (
    <ScreenContainer
      backgroundElement={<SearchBackgroundWash />}
      testID="search.screen"
      keyboardShouldPersistTaps="handled"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={{
        flexGrow: 1,
        gap: 0,
        paddingHorizontal: isCompact ? 16 : 24,
        paddingTop: 14,
        paddingBottom: 28,
      }}
    >
      <View className="w-full max-w-[430px] flex-grow self-center">
        <View className={isCompact ? "gap-3" : "gap-4"}>
          <SearchHeader
            onOpenAccountMenu={() => setAccountMenuVisible(true)}
            onOpenSettings={() => navigation.navigate("Settings")}
            onSignIn={() => navigation.navigate("Auth", { backLabel: "Search" })}
            showAccount={accountUiEnabled && authConfigured && Boolean(user)}
            showSignIn={accountUiEnabled && authConfigured && !user}
            userEmail={user?.email}
          />

          <View className="w-full self-center">
            <SearchFlowProgressCue activeStep="search" testID="search.flowProgressCue" />
          </View>
        </View>

        <SearchFlexibleSpacer testID="search.flexibleSpacerTop" />

        <View className={cx("w-full", isCompact ? "gap-3.5" : "gap-[18px]")}>
          <SearchFocusHero />
          <SearchEntrySection
            isDiscovering={isDiscovering}
            productQuery={productQuery}
            setProductQuery={setProductQuery}
            startDiscoverySearch={submitSearch}
          />

          {errorMessage === "Enter a product query first." ? (
            <RecoveryPanel
              detail={errorMessage}
              message="Add the product you want help with, then start the search again."
              testID="search.recoveryPanel"
              title="Add a product first"
            />
          ) : null}

          {historyPrefill ? (
            <HistoryPrefillPanel
              followUp={followUpNotes}
              onClear={clearHistoryNotes}
            />
          ) : null}
        </View>

        <SearchFlexibleSpacer testID="search.flexibleSpacerBottom" />
      </View>

      {showMarketplacePrompt ? (
        <MarketplacePromptSection
          confirmSelectedAmazonDomain={confirmMarketplaceAndContinue}
          selectedAmazonDomain={selectedAmazonDomain}
        />
      ) : null}
      <AccountSheet
        deleteError={deleteError}
        email={user?.email || ""}
        onClose={closeAccountMenu}
        onDeleteAccount={confirmAccountDeletion}
        onOpenHistory={() => openAccountDestination("History")}
        onOpenPreferences={() => openAccountDestination("Preferences")}
        onOpenPriceWatches={() => openAccountDestination("PriceWatches")}
        onSignOut={handleSignOut}
        priceWatchUiEnabled={priceWatchUiEnabled}
        visible={accountMenuVisible}
      />
    </ScreenContainer>
  );
}
