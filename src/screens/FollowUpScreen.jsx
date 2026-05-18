import { ScreenContainer, ScreenIntro } from "../components/MobileUI";
import { QuerySuggestionPrompt } from "../search/QuerySuggestionPrompt";
import { SearchProgressStatus } from "../search/SearchProgressStatus";
import { SearchRefineSection } from "../search/SearchRefineSection";
import { useSearchFlow } from "../search/SearchFlowContext";

export default function FollowUpScreen({ navigation }) {
  const {
    applyQuerySuggestion,
    canFinalize,
    dismissQuerySuggestion,
    discoverySummary,
    errorMessage,
    finalizeFocusedPicks,
    followUpNotes,
    hasStartedSearch,
    isApplyingQuerySuggestion,
    isFinalizing,
    isGeneratingPrompt,
    phaseEvents,
    productQuery,
    querySuggestion,
    refinementPrompt,
    setFollowUpNotes,
  } = useSearchFlow();

  async function finalizeAndOpenResults() {
    await finalizeFocusedPicks();
    navigation.navigate("Results");
  }

  async function skipAndOpenResults() {
    await finalizeFocusedPicks({ followUpNotesOverride: "" });
    navigation.navigate("Results");
  }

  return (
    <ScreenContainer testID="followup.screen" keyboardShouldPersistTaps="handled">
      <ScreenIntro
        eyebrow="One quick question"
        title="Answer if it helps"
        description="One optional note can sharpen the shortlist. Skipping still keeps the search moving."
      />

      <SearchRefineSection
        canFinalize={canFinalize}
        finalizeFocusedPicks={finalizeAndOpenResults}
        followUpNotes={followUpNotes}
        isFinalizing={isFinalizing}
        isGeneratingPrompt={isGeneratingPrompt}
        refinementPrompt={refinementPrompt}
        setFollowUpNotes={setFollowUpNotes}
        skipFocusedPicks={skipAndOpenResults}
      />

      <QuerySuggestionPrompt
        isApplying={isApplyingQuerySuggestion}
        onKeepResults={dismissQuerySuggestion}
        onTrySuggestedSearch={applyQuerySuggestion}
        suggestion={querySuggestion}
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
