import { Text, TextInput } from "react-native";
import { Button, Surface } from "../components/MobileUI";

export function SearchRefineSection({
  canFinalize,
  finalizeFocusedPicks,
  followUpNotes,
  isFinalizing,
  isGeneratingPrompt,
  refinementPrompt,
  setFollowUpNotes,
  skipFocusedPicks,
}) {
  if (!refinementPrompt) {
    return (
      <Surface variant="quiet">
        <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-stone-500">
          Optional refinement
        </Text>
        <Text className="mt-2 text-xl font-semibold leading-7 text-ink">
          {isGeneratingPrompt ? "Getting the question ready" : "No extra question came through"}
        </Text>
        <Text className="mt-2 text-sm leading-5 text-stone-600">
          {isGeneratingPrompt
            ? "Focamai is preparing one short follow-up. You can wait a moment, or skip once the early options are ready."
            : "You can still build the shortlist from your original search."}
        </Text>
        <Button
          testID="followup.skipButton"
          disabled={!canFinalize}
          onPress={skipFocusedPicks}
          className="mt-4"
          variant="secondary"
        >
          {isFinalizing ? "Building picks..." : "Skip and show results"}
        </Button>
      </Surface>
    );
  }

  return (
    <Surface className="px-5 py-5">
      <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-accent">
        Focamai asks
      </Text>
      <Text className="mt-3 text-2xl font-semibold leading-[31px] text-ink">
        {refinementPrompt.prompt}
      </Text>
      {refinementPrompt.helperText ? (
        <Text className="mt-3 text-sm leading-5 text-stone-600">
          {refinementPrompt.helperText}
        </Text>
      ) : null}
      <TextInput
        testID="followup.notesInput"
        value={followUpNotes}
        onChangeText={setFollowUpNotes}
        placeholder={refinementPrompt.followUpPlaceholder}
        placeholderTextColor="#8B8175"
        multiline
        textAlignVertical="top"
        className="mt-5 min-h-[124px] rounded-lg border border-line bg-cream px-4 py-4 text-base leading-6 text-ink"
      />
      <Button
        testID="followup.showFocusedPicksButton"
        disabled={!canFinalize}
        onPress={finalizeFocusedPicks}
        className="mt-4"
        variant="dark"
      >
        {isFinalizing ? "Building picks..." : "Get focused picks"}
      </Button>
      <Button
        testID="followup.skipButton"
        disabled={!canFinalize}
        onPress={skipFocusedPicks}
        className="mt-2"
        variant="secondary"
      >
        Skip and show results
      </Button>
    </Surface>
  );
}
