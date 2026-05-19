import { ChevronLeft, Check, Settings } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { BrandWordmark, Button, ScreenContainer } from "../components/MobileUI";
import { SearchRefineSection } from "../search/SearchRefineSection";
import { useSearchFlow } from "../search/SearchFlowContext";

function RefineHeader({ onBack, onSettings }) {
  return (
    <View className="flex-row items-center justify-between">
      <Pressable
        accessibilityLabel="Back to search"
        accessibilityRole="button"
        className="min-h-[44px] flex-row items-center gap-1 rounded-full pr-3"
        onPress={onBack}
        testID="followup.backButton"
      >
        <ChevronLeft color="#14222b" size={24} strokeWidth={2.3} />
        <Text className="text-base font-semibold text-ink">Search</Text>
      </Pressable>

      <BrandWordmark className="items-center" imageClassName="h-9 w-36" />

      <Pressable
        accessibilityLabel="Open settings"
        accessibilityRole="button"
        className="h-11 w-11 items-center justify-center rounded-full"
        onPress={onSettings}
        testID="followup.settingsButton"
      >
        <Settings color="#0F6175" size={21} strokeWidth={2.1} />
      </Pressable>
    </View>
  );
}

function RefineProgressCue({ hasStartedSearch }) {
  if (!hasStartedSearch) {
    return null;
  }

  const steps = [
    { label: "Search", state: "complete" },
    { label: "Refine", state: "current" },
    { label: "Picks", state: "upcoming" },
  ];

  return (
    <View
      accessibilityLabel="Search progress: refine step"
      className="flex-row items-start justify-center"
    >
      {steps.map((step, index) => {
        const isCurrent = step.state === "current";
        const isComplete = step.state === "complete";
        const isMuted = step.state === "upcoming";

        return (
          <View className="flex-row items-start" key={step.label}>
            <View className="items-center">
              <View
                className={
                  isMuted
                    ? "h-7 w-7 items-center justify-center rounded-full border border-line bg-mist"
                    : isCurrent
                      ? "h-7 w-7 items-center justify-center rounded-full bg-ember"
                      : "h-7 w-7 items-center justify-center rounded-full bg-accent"
                }
              >
                {isComplete ? <Check color="#ffffff" size={15} strokeWidth={2.5} /> : null}
              </View>
              <Text
                className={
                  isMuted
                    ? "mt-2 text-xs font-semibold text-stone-400"
                    : isCurrent
                      ? "mt-2 text-xs font-semibold text-ember"
                      : "mt-2 text-xs font-semibold text-accent"
                }
              >
                {step.label}
              </Text>
            </View>
            {index < steps.length - 1 ? (
              <View
                className={isMuted ? "mt-[13px] h-px w-20 bg-line" : "mt-[13px] h-px w-20 bg-secondary"}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export default function FollowUpScreen({ navigation }) {
  const {
    canFinalize,
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
    await finalizeFocusedPicks();
    navigation.navigate("Results");
  }

  async function skipAndOpenResults() {
    await finalizeFocusedPicks({ followUpNotesOverride: "" });
    navigation.navigate("Results");
  }

  return (
    <ScreenContainer
      testID="followup.screen"
      keyboardShouldPersistTaps="handled"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={{
        gap: 22,
        paddingHorizontal: 28,
        paddingTop: 14,
        paddingBottom: 16,
      }}
      footer={
        <View className="gap-3 py-2">
          <Button
            testID="followup.showFocusedPicksButton"
            disabled={!canFinalize}
            onPress={finalizeAndOpenResults}
            className="min-h-[58px] rounded-[17px] bg-accent shadow-sm"
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

        <RefineProgressCue hasStartedSearch={hasStartedSearch} />

        <SearchRefineSection
          followUpNotes={followUpNotes}
          isGeneratingPrompt={isGeneratingPrompt}
          refinementPrompt={refinementPrompt}
          setFollowUpNotes={setFollowUpNotes}
          productQuery={productQuery}
          suggestedRefinements={refinementPrompt?.suggestedRefinements}
        />
      </View>
    </ScreenContainer>
  );
}
