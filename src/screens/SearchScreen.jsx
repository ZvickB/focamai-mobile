import { useEffect } from "react";
import { BrandWordmark, ScreenContainer, ScreenIntro } from "../components/MobileUI";
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
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <BrandWordmark />
      <ScreenIntro
        eyebrow="Calm buying guidance"
        title="What are you looking for today?"
        description="Describe the product in your own words. We'll narrow it to six focused picks."
        testID="search.title"
      />

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
    </ScreenContainer>
  );
}
