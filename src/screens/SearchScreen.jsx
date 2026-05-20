import { useEffect } from "react";
import { Settings } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { BrandWordmark, ScreenContainer } from "../components/MobileUI";
import { MarketplacePromptSection } from "../search/MarketplacePromptSection";
import { SearchEntrySection } from "../search/SearchEntrySection";
import { useSearchFlow } from "../search/SearchFlowContext";

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
      testID="search.screen"
      keyboardShouldPersistTaps="handled"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={{
        gap: 20,
        justifyContent: "center",
        minHeight: "100%",
        paddingHorizontal: 24,
        paddingTop: 18,
        paddingBottom: 32,
      }}
    >
      <View className="w-full max-w-[430px] self-center gap-8">
        <View className="items-end">
          <SettingsIconButton onPress={() => navigation.navigate("Settings")} />
        </View>

        <SearchFocusHero />

        <SearchEntrySection
          isDiscovering={isDiscovering}
          productQuery={productQuery}
          setProductQuery={setProductQuery}
          startDiscoverySearch={submitSearch}
        />
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
