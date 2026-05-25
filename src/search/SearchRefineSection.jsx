import { Mic, Search } from "lucide-react-native";
import { Pressable, Text, TextInput, useWindowDimensions, View } from "react-native";
import { GuidanceText, cx } from "../components/MobileUI";

const DEFAULT_REFINEMENT_CHIPS = [
  { label: "Good value" },
  { label: "Easy to use" },
  { label: "Fits my space" },
];
const MAX_REFINEMENT_CHIPS = 3;
export const MAX_FOLLOW_UP_NOTES_LENGTH = 500;

function clampFollowUpNotes(value) {
  return String(value ?? "").slice(0, MAX_FOLLOW_UP_NOTES_LENGTH);
}

function addChipToNotes(currentNotes, chipLabel) {
  const trimmedNotes = String(currentNotes ?? "").trim();

  if (!trimmedNotes) {
    return clampFollowUpNotes(chipLabel);
  }

  if (trimmedNotes.toLowerCase().includes(chipLabel.toLowerCase())) {
    return currentNotes;
  }

  return clampFollowUpNotes(`${trimmedNotes}, ${chipLabel}`);
}

function normalizeRefinementChips(suggestedRefinements) {
  if (!Array.isArray(suggestedRefinements)) {
    return [];
  }

  return suggestedRefinements
    .map((chip) => {
      if (typeof chip === "string") {
        return { label: chip.trim() };
      }

      if (typeof chip?.label === "string") {
        const label = chip.label.trim();
        const prompt = typeof chip.prompt === "string" ? chip.prompt.trim() : undefined;
        return prompt ? { label, prompt } : { label };
      }

      return null;
    })
    .filter((chip) => chip?.label)
    .slice(0, MAX_REFINEMENT_CHIPS);
}

function RefinementChip({ chip, isCompact, onPress, selected }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Add ${chip.label} refinement`}
      className={cx(
        "flex-1 items-center justify-center rounded-full border px-3",
        isCompact ? "min-h-[46px] basis-[47%]" : "min-h-[50px] basis-[31%]",
        selected ? "border-secondary bg-cream" : "border-line bg-mist",
      )}
      onPress={onPress}
      testID={`followup.refinementChip.${chip.label}`}
    >
      <Text className="text-center text-sm font-semibold text-ink">{chip.label}</Text>
    </Pressable>
  );
}

export function SearchRefineSection({
  followUpNotes,
  isGeneratingPrompt,
  refinementPrompt,
  setFollowUpNotes,
  productQuery,
  suggestedRefinements = DEFAULT_REFINEMENT_CHIPS,
}) {
  const { width } = useWindowDimensions();
  const isCompact = width < 400;
  const normalizedSuggestedChips = normalizeRefinementChips(suggestedRefinements);
  const visibleChips = normalizedSuggestedChips.length
    ? normalizedSuggestedChips
    : DEFAULT_REFINEMENT_CHIPS;
  const isPromptStillLoading = isGeneratingPrompt && !refinementPrompt;

  function handleChipPress(chip) {
    if (chip.prompt) {
      setFollowUpNotes(clampFollowUpNotes(chip.prompt));
    } else {
      setFollowUpNotes(addChipToNotes(followUpNotes, chip.label));
    }
  }

  function handleNotesChange(nextNotes) {
    setFollowUpNotes(clampFollowUpNotes(nextNotes));
  }

  return (
    <View className={isCompact ? "gap-6" : "gap-8"}>
      <View className={isCompact ? "items-center gap-3" : "items-center gap-4"}>
        <View className="items-center px-1">
          <Text
            className={
              isCompact
                ? "text-center text-[28px] font-semibold leading-[35px] text-ink"
                : "text-center text-[32px] font-semibold leading-[39px] text-ink"
            }
          >
            What should Focamai keep in{"\u00A0"}mind?
          </Text>
          <GuidanceText className="mt-4 text-center">
            Add any preferences, must-haves, or deal breakers.
          </GuidanceText>
        </View>

        {isPromptStillLoading ? (
          <Text className="text-center text-sm leading-5 text-stone-500">
            Getting a few ideas ready. You can still refine in your own words.
          </Text>
        ) : null}
      </View>

      <View className="gap-3">
        <Text className="text-sm font-semibold text-stone-500">A few starting points</Text>
        <View className="flex-row flex-wrap gap-3">
          {visibleChips.map((chip) => {
            const selected = String(followUpNotes ?? "")
              .toLowerCase()
              .includes(chip.label.toLowerCase());

            return (
              <RefinementChip
                chip={chip}
                isCompact={isCompact}
                key={chip.label}
                onPress={() => handleChipPress(chip)}
                selected={selected}
              />
            );
          })}
        </View>
      </View>

      <View className="gap-3">
        <View
          className={cx(
            "rounded-[22px] border border-line bg-white shadow-sm",
            isCompact ? "px-4 py-4" : "px-5 py-5",
          )}
          style={{
            elevation: 2,
            shadowColor: "#78573f",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.08,
            shadowRadius: 18,
          }}
        >
          <View className={cx("flex-row items-center", isCompact ? "min-h-[68px] gap-2" : "min-h-[72px] gap-3")}>
            <View className={cx("items-center justify-center rounded-full bg-cream", isCompact ? "h-10 w-10" : "h-11 w-11")}>
              <Search color="#0F6175" size={isCompact ? 22 : 24} strokeWidth={2.2} />
            </View>
            <TextInput
              testID="followup.notesInput"
              value={followUpNotes}
              maxLength={MAX_FOLLOW_UP_NOTES_LENGTH}
              onChangeText={handleNotesChange}
              placeholder="Tell Focamai anything that's important..."
              placeholderTextColor="#B4ADA4"
              multiline
              textAlignVertical="top"
              className="min-h-[54px] flex-1 py-2 text-[16px] leading-6 text-ink"
            />
            {isCompact ? null : (
              <Pressable
                accessibilityLabel="Voice input coming later"
                accessibilityRole="button"
                className="h-11 w-11 items-center justify-center rounded-full bg-cream"
                disabled
                testID="followup.voiceButton"
              >
                <Mic color="#0F6175" size={23} strokeWidth={2.2} />
              </Pressable>
            )}
          </View>
        </View>

        <Text className="px-4 text-sm leading-5 text-stone-500">
          Example: "Compact size", "Fits a small cafe", "Under $200"
        </Text>
      </View>

    </View>
  );
}
