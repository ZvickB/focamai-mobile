import { Settings } from "lucide-react-native";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  AppHeader,
  Button,
  HeaderBackButton,
  IconButton,
  RecoveryPanel,
  ScreenContainer,
} from "../components/MobileUI";
import { useKeyboardInputScroll } from "../components/useKeyboardInputScroll";
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
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;
  const { handleInputFocus, scrollViewRef } = useKeyboardInputScroll();
  const {
    canFinalize,
    errorMessage,
    finalResults,
    finalizeFocusedPicks,
    followUpNotes,
    hasStartedSearch,
    isFinalizing,
    isGeneratingPrompt,
    productQuery,
    refinementPrompt,
    setFollowUpNotes,
  } = useSearchFlow();
  const currentPickCount = Array.isArray(finalResults) ? finalResults.length : 0;
  const canUseSecondaryAction = currentPickCount > 0 || canFinalize;

  async function finalizeAndOpenResults() {
    const didFinalize = await finalizeFocusedPicks();

    if (didFinalize) {
      navigation.navigate("Results");
    }
  }

  async function skipAndOpenResults() {
    if (currentPickCount > 0) {
      navigation.navigate("Results");
      return;
    }

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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      testID="followup.keyboardAvoidingView"
    >
      <ScreenContainer
        testID="followup.screen"
        keyboardShouldPersistTaps="handled"
        scrollViewRef={scrollViewRef}
        safeAreaEdges={["top", "bottom"]}
        contentContainerStyle={{
          gap: isCompact ? 16 : 20,
          paddingHorizontal: isCompact ? 16 : 24,
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
            Update my picks
          </Button>
          <View className="flex-row items-center justify-center gap-3">
            <View className="h-[2px] w-11 rounded-full bg-ember opacity-60" />
            <Pressable
              accessibilityRole="button"
              className="min-h-[44px] items-center justify-center px-4"
              disabled={!canUseSecondaryAction}
              onPress={skipAndOpenResults}
              testID="followup.skipButton"
            >
              <Text
                className={
                  canUseSecondaryAction
                    ? "text-base font-semibold text-accent"
                    : "text-base font-semibold text-stone-400"
                }
              >
                {currentPickCount > 0 ? "Return to picks" : "Skip for now"}
              </Text>
            </Pressable>
            <View className="h-[2px] w-11 rounded-full bg-ember opacity-60" />
          </View>
          </View>
        }
      >
        <View className={isCompact ? "w-full max-w-[430px] self-center gap-6" : "w-full max-w-[430px] self-center gap-8"}>
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
              onNotesFocus={handleInputFocus}
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
    </KeyboardAvoidingView>
  );
}
