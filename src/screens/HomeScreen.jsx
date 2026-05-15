import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MarketplacePromptSection } from "../search/MarketplacePromptSection";
import { SearchEntrySection } from "../search/SearchEntrySection";
import { SearchProgressStatus } from "../search/SearchProgressStatus";
import { SearchRefineSection } from "../search/SearchRefineSection";
import { SearchRetrySection } from "../search/SearchRetrySection";
import { SearchResultsSection } from "../search/SearchResultsSection";
import { useMobileSearchController } from "../search/useMobileSearchController";

export default function HomeScreen({ navigation, route }) {
  const {
    canFinalize,
    canRetry,
    confirmSelectedAmazonDomain,
    discoverySummary,
    errorMessage,
    finalResults,
    finalizeFocusedPicks,
    followUpNotes,
    hasStartedSearch,
    isDiscovering,
    isFinalizing,
    isGeneratingPrompt,
    phaseEvents,
    previewItems,
    productQuery,
    refinementPrompt,
    retryCount,
    retryFeedback,
    selectedAmazonDomain,
    showMarketplacePrompt,
    setFollowUpNotes,
    setProductQuery,
    setRetryFeedback,
    setSelectedAmazonDomain,
    startDiscoverySearch,
    submitRetry,
  } = useMobileSearchController();

  useEffect(() => {
    const routeAmazonDomain = route?.params?.selectedAmazonDomain;

    if (routeAmazonDomain) {
      setSelectedAmazonDomain(routeAmazonDomain);
      navigation.setParams({ selectedAmazonDomain: undefined });
    }
  }, [navigation, route?.params?.selectedAmazonDomain, setSelectedAmazonDomain]);

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-mist">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, gap: 18 }}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Text className="text-[12px] font-medium uppercase tracking-[2px] text-accent">
            Focama Mobile
          </Text>
          <Text className="mt-2 text-3xl font-semibold text-ink">Find focused options</Text>
          <Text className="mt-3 text-base leading-6 text-slate-600">
            Search once, add a little context, then ask for a short list. This is still the plain
            verification flow while the mobile data path settles.
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
          selectedAmazonDomain={selectedAmazonDomain}
          setProductQuery={setProductQuery}
          setSelectedAmazonDomain={setSelectedAmazonDomain}
          startDiscoverySearch={startDiscoverySearch}
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

        <SearchResultsSection
          finalResults={finalResults}
          onOpenResult={(item, index) =>
            navigation.navigate("SearchResultDetail", {
              item,
              rank: index + 1,
            })
          }
          previewItems={previewItems}
        />

        <SearchRetrySection
          canRetry={canRetry}
          finalResults={finalResults}
          retryCount={retryCount}
          retryFeedback={retryFeedback}
          setRetryFeedback={setRetryFeedback}
          submitRetry={submitRetry}
        />

        <SearchRefineSection
          canFinalize={canFinalize}
          finalizeFocusedPicks={finalizeFocusedPicks}
          followUpNotes={followUpNotes}
          isFinalizing={isFinalizing}
          refinementPrompt={refinementPrompt}
          setFollowUpNotes={setFollowUpNotes}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
