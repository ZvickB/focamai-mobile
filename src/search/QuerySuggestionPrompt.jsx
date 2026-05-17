import { Pressable, Text, View } from "react-native";

export function QuerySuggestionPrompt({
  isApplying,
  onKeepResults,
  onTrySuggestedSearch,
  suggestion,
}) {
  if (!suggestion?.suggestedQuery) {
    return null;
  }

  const originalQuery = suggestion.originalQuery || suggestion.query || "your search";

  return (
    <View
      accessibilityLiveRegion="polite"
      className="rounded-2xl border border-line bg-white px-4 py-4"
    >
      <Text className="text-sm font-medium leading-5 text-slate-600">
        We searched for "{originalQuery}".
      </Text>
      <Text className="mt-1 text-base font-semibold leading-6 text-accent">
        Try "{suggestion.suggestedQuery}" instead?
      </Text>
      {suggestion.reason ? (
        <Text className="mt-2 text-sm leading-5 text-slate-600">{suggestion.reason}</Text>
      ) : null}
      <View className="mt-4 gap-2">
        <Pressable
          accessibilityRole="button"
          disabled={isApplying}
          onPress={onTrySuggestedSearch}
          className={`rounded-2xl px-4 py-3 ${isApplying ? "bg-slate-300" : "bg-accent"}`}
        >
          <Text className="text-center text-sm font-semibold text-white">
            {isApplying ? "Starting..." : "Try suggested search"}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={isApplying}
          onPress={onKeepResults}
          className="rounded-2xl border border-line px-4 py-3"
        >
          <Text className="text-center text-sm font-semibold text-slate-700">
            Keep these results
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
