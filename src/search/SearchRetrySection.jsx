import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

const RETRY_CORRECTION_CHIPS = [
  "Wrong brand",
  "Wrong product type",
  "Missing dietary need",
  "Too expensive",
  "Wrong size/count",
  "Not available",
];

const CONSTRAINT_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "asked",
  "brand",
  "for",
  "from",
  "i",
  "keep",
  "need",
  "needs",
  "of",
  "or",
  "show",
  "the",
  "to",
  "want",
  "with",
]);

function normalizeConstraintTag(value) {
  return String(value || "")
    .replace(/\b(i asked for|asked for|needs to be|need to be|needs|need|keep|don't show|do not show)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function addConstraintTag(tags, value) {
  const normalized = normalizeConstraintTag(value);

  if (!normalized || normalized.length < 3) {
    return;
  }

  if (tags.some((tag) => tag.toLowerCase() === normalized.toLowerCase())) {
    return;
  }

  tags.push(normalized);
}

function deriveConstraintTags({ followUpNotes, retryFeedback, suggestedQuery, submittedQuery }) {
  const tags = [];
  const source = String(suggestedQuery || "").trim();

  if (source) {
    const lowerSource = source.toLowerCase();
    const underMatch = source.match(/\bunder\s+\$?\d+[\w\s-]*/i);
    const words = source
      .split(/\s+/)
      .map((word) => word.replace(/[^\w$-]/g, ""))
      .filter(Boolean);

    if (words[0] && !CONSTRAINT_STOP_WORDS.has(words[0].toLowerCase())) {
      addConstraintTag(tags, words[0]);
    }

    if (lowerSource.includes("dairy-free") || lowerSource.includes("dairy free")) {
      addConstraintTag(tags, "dairy-free");
    }

    if (underMatch) {
      addConstraintTag(tags, underMatch[0]);
    }

    if (tags.length === 0 && words.length > 0) {
      addConstraintTag(tags, words.slice(0, Math.min(words.length, 3)).join(" "));
    }
  }

  if (tags.length < 3) {
    [submittedQuery, followUpNotes, retryFeedback]
      .flatMap((value) => String(value || "").split(/[.,;\n]+/))
      .map(normalizeConstraintTag)
      .filter(Boolean)
      .forEach((part) => {
        if (tags.length >= 4) {
          return;
        }

        const meaningfulWords = part
          .split(/\s+/)
          .filter((word) => !CONSTRAINT_STOP_WORDS.has(word.toLowerCase()));

        addConstraintTag(tags, meaningfulWords.length > 0 ? meaningfulWords.join(" ") : part);
      });
  }

  return tags.slice(0, 4);
}

export function SearchRetrySection({
  applyRetrySuggestion,
  canRetry,
  canRequestRetryAdvice,
  finalResults,
  followUpNotes,
  isGeneratingRetryAdvice,
  productQuery,
  requestRetryAdvice,
  retryAdvice,
  retryAdviceError,
  retryCount,
  retryFeedback,
  setRetryFeedback,
  submitRetry,
}) {
  const [selectedChips, setSelectedChips] = useState([]);
  const [isEditingSuggestion, setIsEditingSuggestion] = useState(false);
  const [editableSuggestion, setEditableSuggestion] = useState("");

  if (finalResults.length === 0) {
    return null;
  }

  const hasSelectedChips = selectedChips.length > 0;
  const feedbackPayload = [
    hasSelectedChips ? `Correction type: ${selectedChips.join(", ")}` : "",
    retryFeedback.trim(),
  ]
    .filter(Boolean)
    .join("\n");
  const suggestedQuery = String(retryAdvice?.suggestedQuery || "").trim();
  const canAskForAdvice = Boolean(canRequestRetryAdvice && feedbackPayload);
  const canSearchSuggestion = Boolean(
    isEditingSuggestion ? editableSuggestion.trim() : suggestedQuery,
  );
  const constraintTags = deriveConstraintTags({
    followUpNotes,
    retryFeedback: feedbackPayload,
    suggestedQuery,
    submittedQuery: productQuery,
  });

  function toggleChip(chipLabel) {
    setSelectedChips((currentChips) =>
      currentChips.includes(chipLabel)
        ? currentChips.filter((label) => label !== chipLabel)
        : [...currentChips, chipLabel],
    );
    setRetryFeedback(retryFeedback);
  }

  function handleRequestAdvice() {
    requestRetryAdvice({ rejectionFeedback: feedbackPayload });
  }

  function handleEditFirst() {
    setEditableSuggestion(suggestedQuery);
    setIsEditingSuggestion(true);
  }

  function handleSearchSuggestion() {
    const queryToSearch = isEditingSuggestion ? editableSuggestion : suggestedQuery;
    const didStart = applyRetrySuggestion(queryToSearch);

    if (didStart) {
      setSelectedChips([]);
      setIsEditingSuggestion(false);
      setEditableSuggestion("");
    }
  }

  return (
    <View className="rounded-2xl border border-line bg-white px-4 py-4">
      <Text className="text-sm font-semibold text-slate-900">
        Not seeing what you had in mind?
      </Text>
      <Text className="mt-2 text-sm leading-5 text-slate-600">
        Tell Focamai what to keep or change, and it can suggest a better search direction.
      </Text>

      <View className="mt-4 flex-row flex-wrap gap-2">
        {RETRY_CORRECTION_CHIPS.map((chipLabel) => {
          const isSelected = selectedChips.includes(chipLabel);

          return (
            <Pressable
              key={chipLabel}
              onPress={() => toggleChip(chipLabel)}
              className={`rounded-full border px-3 py-2 ${
                isSelected ? "border-accent bg-accent/10" : "border-line bg-white"
              }`}
            >
              <Text
                className={`text-sm ${isSelected ? "font-semibold text-accent" : "text-slate-600"}`}
              >
                {chipLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        value={retryFeedback}
        onChangeText={setRetryFeedback}
        placeholder="Example: Keep the budget, but avoid bulky options."
        multiline
        textAlignVertical="top"
        className="mt-3 min-h-[88px] rounded-2xl border border-line bg-mist px-4 py-3 text-base text-ink"
      />
      <Pressable
        disabled={!canAskForAdvice}
        onPress={handleRequestAdvice}
        className={`mt-3 rounded-2xl px-4 py-3 ${canAskForAdvice ? "bg-slate-800" : "bg-slate-300"}`}
      >
        <Text className="text-center text-sm font-semibold text-white">
          {isGeneratingRetryAdvice ? "Finding a better search..." : "Suggest a better search"}
        </Text>
      </Pressable>

      {retryAdvice ? (
        <View className="mt-4 rounded-2xl border border-line bg-mist px-4 py-4">
          {retryAdvice.rationale ? (
            <Text className="text-sm leading-5 text-slate-700">{retryAdvice.rationale}</Text>
          ) : null}

          {suggestedQuery ? (
            <View className="mt-3 rounded-2xl border border-line bg-white px-3 py-3">
              <Text className="text-sm font-semibold text-slate-900">
                Try this search instead:
              </Text>
              {isEditingSuggestion ? (
                <TextInput
                  value={editableSuggestion}
                  onChangeText={setEditableSuggestion}
                  multiline
                  textAlignVertical="top"
                  className="mt-2 min-h-[72px] rounded-2xl border border-line bg-white px-3 py-3 text-base text-ink"
                />
              ) : (
                <Text className="mt-2 rounded-2xl bg-mist px-3 py-3 text-base font-semibold leading-6 text-ink">
                  {suggestedQuery}
                </Text>
              )}

              {constraintTags.length > 0 ? (
                <View className="mt-3 flex-row flex-wrap items-center gap-2">
                  <Text className="text-sm text-slate-500">Keeping:</Text>
                  {constraintTags.map((tag) => (
                    <View key={tag} className="rounded-full border border-line bg-white px-2 py-1">
                      <Text className="text-xs text-slate-600">{tag}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <View className="mt-3 flex-row flex-wrap gap-2">
                <Pressable
                  disabled={!canSearchSuggestion}
                  onPress={handleSearchSuggestion}
                  className={`rounded-full px-4 py-3 ${
                    canSearchSuggestion ? "bg-slate-800" : "bg-slate-300"
                  }`}
                >
                  <Text className="text-sm font-semibold text-white">Search this</Text>
                </Pressable>
                <Pressable
                  onPress={handleEditFirst}
                  className="rounded-full border border-line bg-white px-4 py-3"
                >
                  <Text className="text-sm font-semibold text-slate-700">Edit first</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Text className="mt-3 text-sm leading-5 text-slate-600">
              No suggested query came back yet. You can still retry these picks below.
            </Text>
          )}
        </View>
      ) : null}

      {retryAdviceError ? (
        <View className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Text className="text-sm leading-5 text-amber-800">{retryAdviceError}</Text>
          <Text className="mt-1 text-sm leading-5 text-amber-800">
            You can still ask for replacement picks from this search.
          </Text>
        </View>
      ) : null}

      {retryCount > 0 ? (
        <Text className="mt-2 text-sm leading-5 text-slate-600">
          {retryCount} of 2 retries used
        </Text>
      ) : null}

      <Pressable
        disabled={!canRetry}
        onPress={submitRetry}
        className={`mt-3 rounded-2xl border px-4 py-3 ${
          canRetry ? "border-line bg-white" : "border-line bg-slate-100"
        }`}
      >
        <Text className={`text-center text-sm font-semibold ${canRetry ? "text-slate-700" : "text-slate-400"}`}>
          Retry these picks instead
        </Text>
      </Pressable>
    </View>
  );
}
