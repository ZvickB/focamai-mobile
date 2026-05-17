import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MarketplacePromptSection } from "../search/MarketplacePromptSection";
import { SearchEntrySection } from "../search/SearchEntrySection";
import { SearchProgressStatus } from "../search/SearchProgressStatus";
import { useSearchFlow } from "../search/SearchFlowContext";

export default function SearchScreen({ navigation, route }) {
  const {
    confirmSelectedAmazonDomain,
    discoverySummary,
    errorMessage,
    hasStartedSearch,
    isDiscovering,
    isFinalizing,
    isGeneratingPrompt,
    phaseEvents,
    productQuery,
    refinementPrompt,
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

  function submitSearch() {
    const hasQuery = productQuery.trim().length > 0;

    startDiscoverySearch();

    if (hasQuery) {
      navigation.navigate("FollowUp");
    }
  }

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-mist" testID="search.screen">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, gap: 18 }}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Text className="text-[12px] font-medium uppercase tracking-[2px] text-accent">
            Focama Mobile
          </Text>
          <Text className="mt-2 text-3xl font-semibold text-ink" testID="search.title">
            What are you looking for?
          </Text>
          <Text className="mt-3 text-base leading-6 text-slate-600">
            Search once, add a little context, then ask for a short list.
          </Text>
        </View>

        {showMarketplacePrompt ? (
          <MarketplacePromptSection
            confirmSelectedAmazonDomain={confirmSelectedAmazonDomain}
            selectedAmazonDomain={selectedAmazonDomain}
            setSelectedAmazonDomain={setSelectedAmazonDomain}
          />
        ) : null}

        <SearchEntrySection
          isDiscovering={isDiscovering}
          onSettingsPress={() => navigation.navigate("Settings")}
          productQuery={productQuery}
          setProductQuery={setProductQuery}
          startDiscoverySearch={submitSearch}
        />

        <SearchProgressStatus
          discoverySummary={discoverySummary}
          errorMessage={errorMessage}
          hasStartedSearch={hasStartedSearch}
          isFinalizing={isFinalizing}
          isGeneratingPrompt={isGeneratingPrompt}
          phaseEvents={phaseEvents}
          productQuery={productQuery}
          refinementPrompt={refinementPrompt}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
