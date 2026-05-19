import { Text, View } from "react-native";
import { Button, Surface } from "../components/MobileUI";
import { coerceDisplayText, isSafeQuerySuggestionText } from "./searchApi";

export function QuerySuggestionPrompt({
  isApplying = false,
  onKeepResults,
  onTrySuggestedSearch,
  suggestion,
}) {
  const suggestedQuery = coerceDisplayText(suggestion?.suggestedQuery);

  if (!isSafeQuerySuggestionText(suggestedQuery)) {
    return null;
  }

  const originalQueryCandidate =
    coerceDisplayText(suggestion.originalQuery) ||
    coerceDisplayText(suggestion.query) ||
    "your search";
  const originalQuery = isSafeQuerySuggestionText(originalQueryCandidate)
    ? originalQueryCandidate
    : "your search";
  const reasonCandidate = coerceDisplayText(suggestion.reason);
  const reason = isSafeQuerySuggestionText(reasonCandidate)
    ? reasonCandidate
    : "This may be a clearer way to phrase the search.";

  return (
    <Surface
      accessibilityLiveRegion="polite"
      variant="quiet"
    >
      <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-stone-500">
        Suggested search tweak
      </Text>
      <Text className="mt-2 text-sm font-medium leading-5 text-slate-600">
        We searched for "{originalQuery}".
      </Text>
      <Text className="mt-1 text-base font-semibold leading-6 text-ink">
        Try "{suggestedQuery}" instead?
      </Text>
      {reason ? (
        <Text className="mt-2 text-sm leading-5 text-slate-600">{reason}</Text>
      ) : null}
      <View className="mt-4 gap-2">
        <Button
          accessibilityRole="button"
          disabled={isApplying}
          onPress={onTrySuggestedSearch}
        >
          {isApplying ? "Starting..." : "Try suggested search"}
        </Button>
        <Button
          accessibilityRole="button"
          disabled={isApplying}
          onPress={onKeepResults}
          variant="secondary"
        >
          Keep these results
        </Button>
      </View>
    </Surface>
  );
}
