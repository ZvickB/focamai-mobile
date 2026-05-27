import { useEffect, useRef } from "react";
import { Settings } from "lucide-react-native";
import { Text, useWindowDimensions, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { BrandWordmark, IconButton, RecoveryPanel, ScreenContainer, cx } from "../components/MobileUI";
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
  const wordmarkWidth = Math.min(256, Math.max(isCompact ? 188 : 216, width - 72));

  return (
    <View className={isCompact ? "gap-2" : "gap-2.5"}>
      <BrandWordmark
        className="items-center"
        imageClassName={isCompact ? "h-12" : "h-14"}
        imageStyle={{ width: wordmarkWidth }}
      />
      <View className="items-center px-3">
        <Text
          className="text-center text-[31px] font-semibold leading-[38px] text-ink"
          testID="search.title"
        >
          Find the right{"\u00A0"}pick.
        </Text>
        <Text className="mt-1.5 max-w-[285px] text-center text-[15px] leading-6 text-stone-600">
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

function SearchTopBar({ isCompact, onOpenSettings }) {
  return (
    <View className="min-h-[44px] flex-row items-center">
      <View className="h-11 w-11" />
      <View className={cx("flex-1 items-center px-2", isCompact ? "max-w-[230px]" : "max-w-[280px]")}>
        <SearchFlowProgressCue activeStep="search" testID="search.flowProgressCue" />
      </View>
      <View className="h-11 w-11 items-end justify-center">
        <SettingsIconButton onPress={onOpenSettings} />
      </View>
    </View>
  );
}

export default function SearchScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;
  const pendingNavigationToFollowUpRef = useRef(null);
  const {
    activeSearchSession,
    confirmSelectedAmazonDomain,
    errorMessage,
    isDiscovering,
    productQuery,
    selectedAmazonDomain,
    showMarketplacePrompt,
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
    const pendingSearch = pendingNavigationToFollowUpRef.current;
    const startedMatchingSearch =
      pendingSearch &&
      activeSearchSession?.submittedQuery === pendingSearch.query &&
      activeSearchSession?.requestId !== pendingSearch.previousRequestId;

    if (startedMatchingSearch && !showMarketplacePrompt) {
      pendingNavigationToFollowUpRef.current = null;
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
    const didStartSearch = startDiscoverySearch(
      queryOverride === undefined ? undefined : { queryOverride: nextQuery },
    );

    if (hasQuery && didStartSearch) {
      pendingNavigationToFollowUpRef.current = null;
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
      navigation.navigate("FollowUp");
    }
  }

  return (
    <ScreenContainer
      backgroundElement={<SearchBackgroundWash />}
      testID="search.screen"
      keyboardShouldPersistTaps="handled"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={{
        gap: isCompact ? 16 : 20,
        justifyContent: "center",
        minHeight: "100%",
        paddingHorizontal: isCompact ? 16 : 24,
        paddingTop: isCompact ? 16 : 24,
        paddingBottom: 32,
      }}
    >
      <View className={cx("w-full max-w-[430px] self-center", isCompact ? "gap-5" : "gap-6")}>
        <SearchTopBar
          isCompact={isCompact}
          onOpenSettings={() => navigation.navigate("Settings")}
        />

        <SearchFocusHero />

        <View className={isCompact ? "mt-1" : "mt-3"}>
          <SearchEntrySection
            isDiscovering={isDiscovering}
            productQuery={productQuery}
            setProductQuery={setProductQuery}
            startDiscoverySearch={submitSearch}
          />
        </View>

        {errorMessage === "Enter a product query first." ? (
          <RecoveryPanel
            detail={errorMessage}
            message="Add the product you want help with, then start the search again."
            testID="search.recoveryPanel"
            title="Add a product first"
          />
        ) : null}
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
