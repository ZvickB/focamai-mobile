import { Settings } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import {
  AppHeader,
  Button,
  HeaderBackButton,
  IconButton,
  RecoveryPanel,
  ScreenContainer,
} from "../components/MobileUI";
import { FinalizeLoadingState } from "../search/FinalizeLoadingState";
import { SearchFlowProgressCue } from "../search/SearchFlowProgressCue";
import { SearchRefineSection } from "../search/SearchRefineSection";
import { useSearchFlow } from "../search/SearchFlowContext";

function RefineHeader({ onBack, onSettings }) {
  return (
    <AppHeader
      left={<HeaderBackButton label="Search" onPress={onBack} testID="followup.backButton" />}
      right={
        <IconButton
          accessibilityLabel="Open settings"
          onPress={onSettings}
          testID="followup.settingsButton"
        >
          <Settings color="#0F6175" size={21} strokeWidth={2.1} />
        </IconButton>
      }
    />
  );
}

export default function FollowUpScreen({ navigation }) {
  const {
    canFinalize,
    errorMessage,
    finalizeFocusedPicks,
    followUpNotes,
    hasStartedSearch,
    isFinalizing,
    isGeneratingPrompt,
    productQuery,
    refinementPrompt,
    setFollowUpNotes,
  } = useSearchFlow();

  async function finalizeAndOpenResults() {
    const didFinalize = await finalizeFocusedPicks();

    if (didFinalize) {
      navigation.navigate("Results");
    }
  }

  async function skipAndOpenResults() {
    const didFinalize = await finalizeFocusedPicks({ followUpNotesOverride: "" });

    if (didFinalize) {
      navigation.navigate("Results");
    }
  }

  const recoveryTitle = canFinalize
    ? "Focamai could not finish the shortlist"
    : "Focamai could not start this search";
  const recoveryMessage = canFinalize
    ? "Your notes are still here. Try building the shortlist again, or go back and adjust the search phrase."
    : "Go back and check the product phrase, region, or backend connection before trying again.";

  return (
    <ScreenContainer
      testID="followup.screen"
      keyboardShouldPersistTaps="handled"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={{
        gap: 20,
        paddingHorizontal: 24,
        paddingTop: 14,
        paddingBottom: 20,
      }}
      footer={
        isFinalizing ? undefined :
        <View className="w-full max-w-[430px] self-center gap-3 py-1">
          <Button
            testID="followup.showFocusedPicksButton"
            disabled={!canFinalize}
            onPress={finalizeAndOpenResults}
            className="min-h-[56px] bg-accent shadow-sm"
          >
            {isFinalizing ? "Updating picks..." : "Update my picks"}
          </Button>
          <View className="flex-row items-center justify-center gap-3">
            <View className="h-[2px] w-11 rounded-full bg-ember opacity-60" />
            <Pressable
              accessibilityRole="button"
              className="min-h-[44px] items-center justify-center px-4"
              disabled={!canFinalize}
              onPress={skipAndOpenResults}
              testID="followup.skipButton"
            >
              <Text
                className={
                  canFinalize
                    ? "text-base font-semibold text-accent"
                    : "text-base font-semibold text-stone-400"
                }
              >
                Skip for now
              </Text>
            </Pressable>
            <View className="h-[2px] w-11 rounded-full bg-ember opacity-60" />
          </View>
        </View>
      }
    >
      <View className="w-full max-w-[430px] self-center gap-8">
        <RefineHeader
          onBack={() => navigation.navigate("Search")}
          onSettings={() => navigation.navigate("Settings")}
        />

        {hasStartedSearch ? (
          <SearchFlowProgressCue activeStep={isFinalizing ? "picks" : "refine"} />
        ) : null}

        {isFinalizing ? (
          <FinalizeLoadingState />
        ) : (
          <>
            <SearchRefineSection
              followUpNotes={followUpNotes}
              isGeneratingPrompt={isGeneratingPrompt}
              refinementPrompt={refinementPrompt}
              setFollowUpNotes={setFollowUpNotes}
              productQuery={productQuery}
              suggestedRefinements={refinementPrompt?.suggestedRefinements}
            />

            {errorMessage ? (
              <RecoveryPanel
                detail={errorMessage}
                message={recoveryMessage}
                onPrimaryAction={
                  canFinalize ? finalizeAndOpenResults : () => navigation.navigate("Search")
                }
                onSecondaryAction={canFinalize ? () => navigation.navigate("Search") : undefined}
                primaryActionLabel={canFinalize ? "Try shortlist again" : "Back to search"}
                secondaryActionLabel={canFinalize ? "Edit search" : undefined}
                testID="followup.recoveryPanel"
                title={recoveryTitle}
              />
            ) : null}
          </>
        )}
      </View>
    </ScreenContainer>
  );
}
