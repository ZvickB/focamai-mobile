import { useEffect } from "react";
import { Settings } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { BrandWordmark, RecoveryPanel, ScreenContainer } from "../components/MobileUI";
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
            <Stop offset="1" stopColor="#faf6f1" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect fill="url(#searchTopWash)" height="100%" width="100%" x="0" y="0" />
      </Svg>
    </View>
  );
}

function SearchFocusHero() {
  return (
    <View className="gap-4">
      <BrandWordmark className="items-center" imageClassName="h-14 w-64" />
      <View className="items-center px-3">
        <Text
          className="text-center text-[31px] font-semibold leading-[38px] text-ink"
          testID="search.title"
        >
          Find the right{"\u00A0"}pick.
        </Text>
        <Text className="mt-2 max-w-[285px] text-center text-[15px] leading-6 text-stone-600">
          Tell Focamai what you need. It narrows the noise to six focused options.
        </Text>
      </View>
    </View>
  );
}

function SettingsIconButton({ onPress }) {
  return (
    <Pressable
      accessibilityLabel="Open settings"
      accessibilityRole="button"
      className="h-11 w-11 items-center justify-center rounded-full"
      onPress={onPress}
      testID="search.settingsButton"
    >
      <Settings color="#0F6175" size={21} strokeWidth={2.1} />
    </Pressable>
  );
}

export default function SearchScreen({ navigation, route }) {
  const {
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

  function submitSearch(queryOverride) {
    const nextQuery = String(queryOverride ?? productQuery).trim();
    const hasQuery = nextQuery.length > 0;

    startDiscoverySearch(queryOverride === undefined ? undefined : { queryOverride: nextQuery });

    if (hasQuery) {
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
        gap: 20,
        justifyContent: "center",
        minHeight: "100%",
        paddingHorizontal: 24,
        paddingTop: 4,
        paddingBottom: 46,
      }}
    >
      <View className="w-full max-w-[430px] self-center gap-7">
        <View className="items-end">
          <SettingsIconButton onPress={() => navigation.navigate("Settings")} />
        </View>

        <View className="-mt-5 mb-3">
          <SearchFlowProgressCue activeStep="search" testID="search.flowProgressCue" />
        </View>

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
      </View>

      {showMarketplacePrompt ? (
        <MarketplacePromptSection
          confirmSelectedAmazonDomain={confirmSelectedAmazonDomain}
          selectedAmazonDomain={selectedAmazonDomain}
        />
      ) : null}
    </ScreenContainer>
  );
}
