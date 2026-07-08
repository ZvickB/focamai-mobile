import { useEffect, useRef, useState } from "react";
import { Settings } from "lucide-react-native";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
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

function SearchHeader({ onOpenSettings, onSignIn, showSignIn }) {
  return (
    <AppHeader
      left={showSignIn ? (
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
  const { configured: authConfigured, user } = useAuth();
  const {
    activeSearchSession,
    confirmSelectedAmazonDomain,
    errorMessage,
    followUpNotes,
    isDiscovering,
    productQuery,
    selectedAmazonDomain,
    showMarketplacePrompt,
    setFollowUpNotes,
    setProductQuery,
    setSelectedAmazonDomain,
    startDiscoverySearch,
  } = useSearchFlow();

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
            onOpenSettings={() => navigation.navigate("Settings")}
            onSignIn={() => navigation.navigate("Auth", { backLabel: "Search" })}
            showSignIn={authConfigured && !user}
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
    </ScreenContainer>
  );
}
