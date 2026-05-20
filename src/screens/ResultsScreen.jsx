import { Search, Settings } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { AppHeader, HeaderBackButton, IconButton, ScreenContainer } from "../components/MobileUI";
import { SearchProgressStatus } from "../search/SearchProgressStatus";
import { SearchRetrySection } from "../search/SearchRetrySection";
import { SearchResultsSection } from "../search/SearchResultsSection";
import { useSearchFlow } from "../search/SearchFlowContext";

function ResultsTopBar({ onBack, onNewSearch, onSettings }) {
  return (
    <View className="w-full max-w-[430px] self-center">
      <AppHeader
        left={<HeaderBackButton label="Refine" onPress={onBack} testID="results.backButton" />}
        wordmarkClassName="h-9 w-32"
      right={
        <>
          <Pressable
            accessibilityLabel="Start a new search"
            accessibilityRole="button"
            className="min-h-[38px] flex-row items-center gap-1 rounded-full bg-white px-3 shadow-sm"
            onPress={onNewSearch}
            testID="results.newSearchButton"
          >
            <Search color="#14222b" size={16} strokeWidth={2.2} />
            <Text className="text-xs font-semibold text-ink">New</Text>
          </Pressable>

          <IconButton
            accessibilityLabel="Open settings"
            className="h-[38px] w-[38px] bg-white shadow-sm"
            onPress={onSettings}
            testID="results.settingsButton"
          >
            <Settings color="#14222b" size={18} strokeWidth={2.1} />
          </IconButton>
        </>
      }
      />
    </View>
  );
}

function ResultsHero() {
  return (
    <View className="gap-3">
      <Text className="text-[32px] font-semibold leading-[39px] text-ink">
        Here are your <Text className="text-ember">6</Text> best picks
      </Text>
      <Text className="text-[15px] leading-6 text-stone-600">
        Carefully selected based on your needs and preferences.
      </Text>
    </View>
  );
}

export default function ResultsScreen({ navigation }) {
  const {
    applyRetrySuggestion,
    canRetry,
    canRequestRetryAdvice,
    discoverySummary,
    errorMessage,
    finalResults,
    followUpNotes,
    isFinalizing,
    isGeneratingRetryAdvice,
    isGeneratingPrompt,
    phaseEvents,
    previewItems,
    productQuery,
    refinementPrompt,
    requestRetryAdvice,
    retryAdvice,
    retryAdviceError,
    retryCount,
    retryFeedback,
    setRetryFeedback,
    submitRetry,
  } = useSearchFlow();
  const focusedPickCount = Array.isArray(finalResults) ? finalResults.length : 0;
  const shouldShowStatus = Boolean(errorMessage || isFinalizing || focusedPickCount === 0);

  return (
    <ScreenContainer
      testID="results.screen"
      keyboardShouldPersistTaps="handled"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={{
        gap: 20,
        paddingHorizontal: 24,
        paddingTop: 14,
        paddingBottom: 32,
      }}
    >
      <View className="w-full gap-8">
        <ResultsTopBar
          onBack={() => navigation.navigate("FollowUp")}
          onNewSearch={() => navigation.navigate("Search")}
          onSettings={() => navigation.navigate("Settings")}
        />

        <ResultsHero />

        {shouldShowStatus ? (
          <SearchProgressStatus
            discoverySummary={discoverySummary}
            errorMessage={errorMessage}
            finalResults={finalResults}
            hasStartedSearch={focusedPickCount > 0 || isFinalizing}
            isFinalizing={isFinalizing}
            isGeneratingPrompt={isGeneratingPrompt}
            phaseEvents={phaseEvents}
            previewItems={previewItems}
            productQuery={productQuery}
            refinementPrompt={refinementPrompt}
          />
        ) : null}

        <SearchResultsSection
          finalResults={finalResults}
          isFinalizing={isFinalizing}
          onOpenResult={(item, index) =>
            navigation.navigate("SearchResultDetail", {
              candidateId: item.id,
              item,
              rank: index + 1,
            })
          }
          previewItems={previewItems}
          showEmptyState
        />

        <SearchRetrySection
          applyRetrySuggestion={applyRetrySuggestion}
          canRetry={canRetry}
          canRequestRetryAdvice={canRequestRetryAdvice}
          finalResults={finalResults}
          followUpNotes={followUpNotes}
          isGeneratingRetryAdvice={isGeneratingRetryAdvice}
          productQuery={productQuery}
          requestRetryAdvice={requestRetryAdvice}
          retryAdvice={retryAdvice}
          retryAdviceError={retryAdviceError}
          retryCount={retryCount}
          retryFeedback={retryFeedback}
          setRetryFeedback={setRetryFeedback}
          submitRetry={submitRetry}
        />
      </View>
    </ScreenContainer>
  );
}
