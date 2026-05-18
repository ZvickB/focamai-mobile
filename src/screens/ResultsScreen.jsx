import { ScreenContainer, ScreenIntro } from "../components/MobileUI";
import { SearchProgressStatus } from "../search/SearchProgressStatus";
import { SearchRetrySection } from "../search/SearchRetrySection";
import { SearchResultsSection } from "../search/SearchResultsSection";
import { useSearchFlow } from "../search/SearchFlowContext";

export default function ResultsScreen({ navigation }) {
  const {
    applyRetrySuggestion,
    canRetry,
    canRequestRetryAdvice,
    discoverySummary,
    errorMessage,
    finalResults,
    followUpNotes,
    hasStartedSearch,
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

  return (
    <ScreenContainer testID="results.screen" keyboardShouldPersistTaps="handled">
      <ScreenIntro
        eyebrow="Results"
        title="Your focused picks"
        description="Review the shortlist, then open a pick for the details behind it."
      />

        <SearchProgressStatus
          discoverySummary={discoverySummary}
          errorMessage={errorMessage}
          finalResults={finalResults}
          hasStartedSearch={hasStartedSearch}
          isFinalizing={isFinalizing}
          isGeneratingPrompt={isGeneratingPrompt}
          phaseEvents={phaseEvents}
          previewItems={previewItems}
          productQuery={productQuery}
          refinementPrompt={refinementPrompt}
        />

        <SearchResultsSection
          finalResults={finalResults}
          isFinalizing={isFinalizing}
          onOpenResult={(item, index) =>
            navigation.navigate("SearchResultDetail", {
              candidateId: item.id,
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
    </ScreenContainer>
  );
}
