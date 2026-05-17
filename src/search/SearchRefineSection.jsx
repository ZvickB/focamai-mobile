import { Pressable, Text, TextInput, View } from "react-native";

export function SearchRefineSection({
  canFinalize,
  finalizeFocusedPicks,
  followUpNotes,
  isFinalizing,
  refinementPrompt,
  setFollowUpNotes,
}) {
  if (!refinementPrompt) {
    return null;
  }

  return (
    <View className="rounded-2xl border border-line bg-white px-4 py-4">
      <Text className="text-sm font-semibold text-slate-900">Refine</Text>
      <Text className="mt-2 text-sm leading-5 text-slate-800">{refinementPrompt.prompt}</Text>
      {refinementPrompt.helperText ? (
        <Text className="mt-2 text-sm leading-5 text-slate-600">
          {refinementPrompt.helperText}
        </Text>
      ) : null}
      <TextInput
        testID="followup.notesInput"
        value={followUpNotes}
        onChangeText={setFollowUpNotes}
        placeholder={refinementPrompt.followUpPlaceholder}
        multiline
        textAlignVertical="top"
        className="mt-3 min-h-[96px] rounded-2xl border border-line bg-mist px-4 py-3 text-base text-ink"
      />
      <Pressable
        testID="followup.showFocusedPicksButton"
        disabled={!canFinalize}
        onPress={finalizeFocusedPicks}
        className={`mt-3 rounded-2xl px-4 py-3 ${canFinalize ? "bg-slate-800" : "bg-slate-300"}`}
      >
        <Text className="text-center text-sm font-semibold text-white">
          {isFinalizing ? "Finalizing..." : "Show focused picks"}
        </Text>
      </Pressable>
    </View>
  );
}
