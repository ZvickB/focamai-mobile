import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-mist">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, gap: 18 }}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Text className="text-[12px] font-medium uppercase tracking-[2px] text-accent">
            One quick question
          </Text>
          <Text className="mt-2 text-3xl font-semibold text-ink">Help narrow the picks</Text>
          <Text className="mt-3 text-base leading-6 text-slate-600">
            Add what matters, or skip and build the shortlist from your original search.
          </Text>
        </View>

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

        <QuerySuggestionPrompt
          isApplying={isApplyingQuerySuggestion}
          onKeepResults={dismissQuerySuggestion}
          onTrySuggestedSearch={applyQuerySuggestion}
          suggestion={querySuggestion}
        />

        <SearchRefineSection
          canFinalize={canFinalize}
          finalizeFocusedPicks={finalizeAndOpenResults}
          followUpNotes={followUpNotes}
          isFinalizing={isFinalizing}
          refinementPrompt={refinementPrompt}
          setFollowUpNotes={setFollowUpNotes}
        />

        {refinementPrompt ? (
          <Pressable
            disabled={!canFinalize}
            onPress={skipAndOpenResults}
            className="rounded-2xl border border-line bg-white px-4 py-3"
          >
            <Text className="text-center text-sm font-semibold text-slate-800">
              Skip - show results
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
