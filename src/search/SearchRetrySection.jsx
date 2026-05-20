import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Button, Pill, QuietStatusPanel, Surface } from "../components/MobileUI";

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
    <Surface>
      <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-accent">
        Recovery
      </Text>
      <Text className="mt-2 text-xl font-semibold leading-7 text-ink">
        Want to correct the direction?
      </Text>
      <Text className="mt-2 text-sm leading-5 text-stone-600">
        Say what felt off. Focamai can suggest a sharper next search, or fall back to replacement
        picks from this search.
      </Text>

      <View className="mt-4 flex-row flex-wrap gap-2">
        {RETRY_CORRECTION_CHIPS.map((chipLabel) => {
          const isSelected = selectedChips.includes(chipLabel);

          return (
            <Pressable
              key={chipLabel}
              onPress={() => toggleChip(chipLabel)}
              className={`rounded-full border px-3 py-1.5 ${
                isSelected ? "border-accent bg-cream" : "border-line bg-white"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${isSelected ? "text-accent" : "text-stone-600"}`}
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
        placeholderTextColor="#8B8175"
        multiline
        textAlignVertical="top"
        className="mt-4 min-h-[104px] rounded-[18px] border border-line bg-cream px-4 py-4 text-base leading-6 text-ink"
      />
      <Button
        disabled={!canAskForAdvice}
        onPress={handleRequestAdvice}
        className="mt-4"
        variant="primary"
      >
        {isGeneratingRetryAdvice ? "Finding a better search..." : "Suggest a better search"}
      </Button>

      {retryAdvice ? (
        <QuietStatusPanel className="mt-4 bg-white">
          <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-stone-500">
            Suggested next search
          </Text>
          {retryAdvice.rationale ? (
            <Text className="mt-2 text-sm leading-5 text-stone-600">{retryAdvice.rationale}</Text>
          ) : null}

          {suggestedQuery ? (
          <View className="mt-3 rounded-[18px] border border-line bg-cream px-4 py-4">
              {isEditingSuggestion ? (
                <TextInput
                  value={editableSuggestion}
                  onChangeText={setEditableSuggestion}
                  placeholder="Edit the suggested search"
                  placeholderTextColor="#8B8175"
                  multiline
                  textAlignVertical="top"
                  className="mt-2 min-h-[72px] rounded-[18px] border border-line bg-white px-4 py-3 text-base text-ink"
                />
              ) : (
                <Text className="text-base font-semibold leading-6 text-ink">
                  {suggestedQuery}
                </Text>
              )}

              {constraintTags.length > 0 ? (
                <View className="mt-3 flex-row flex-wrap items-center gap-2">
                  <Text className="text-xs font-semibold uppercase tracking-[1px] text-stone-500">
                    Keeping
                  </Text>
                  {constraintTags.map((tag) => (
                    <Pill key={tag}>{tag}</Pill>
                  ))}
                </View>
              ) : null}

              <View className="mt-4 gap-2">
                <Button
                  disabled={!canSearchSuggestion}
                  onPress={handleSearchSuggestion}
                  variant="primary"
                >
                  Search this suggestion
                </Button>
                <Button
                  onPress={handleEditFirst}
                  variant="secondary"
                >
                  Edit first
                </Button>
              </View>
            </View>
          ) : (
            <Text className="mt-3 text-sm leading-5 text-slate-600">
              No suggested query came back yet. You can still retry these picks below.
            </Text>
          )}
        </QuietStatusPanel>
      ) : null}

      {retryAdviceError ? (
        <View className="mt-4 rounded-[18px] border border-line bg-cream px-4 py-3">
          <Text className="text-sm leading-5 text-stone-700">{retryAdviceError}</Text>
          <Text className="mt-1 text-sm leading-5 text-stone-700">
            You can still ask for replacement picks from this search.
          </Text>
        </View>
      ) : null}

      <QuietStatusPanel className="mt-4">
        <Text className="text-sm font-semibold text-ink">
          Need replacements from this search?
        </Text>
        <Text className="mt-1 text-sm leading-5 text-stone-600">
          This keeps the current candidate pool and asks for a different shortlist. Add a note
          above so the retry has direction.
        </Text>
        {retryCount > 0 ? (
          <Text className="mt-2 text-sm leading-5 text-stone-600">
            {retryCount} of 2 retries used
          </Text>
        ) : null}
        <Button
          disabled={!canRetry}
          onPress={submitRetry}
          className="mt-3"
          variant="secondary"
        >
          Retry these picks instead
        </Button>
      </QuietStatusPanel>
    </Surface>
  );
}
