import { Search } from "lucide-react-native";
import { Pressable, Text, TextInput, useWindowDimensions, View } from "react-native";
import { GuidanceText, cx } from "../components/MobileUI";
import { useVoiceRecorder } from "./useVoiceRecorder";
import { VoiceMicButton } from "./VoiceMicButton";

const DEFAULT_REFINEMENT_CHIPS = [
  { label: "Good value" },
  { label: "Easy to use" },
  { label: "Fits my space" },
];
const MAX_REFINEMENT_CHIPS = 3;
export const MAX_FOLLOW_UP_NOTES_LENGTH = 500;
const WIDE_REFINEMENT_CHIP_LABEL_LENGTH = 22;
const THREE_COLUMN_LONG_CHIP_MIN_WIDTH = 480;

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

export function arrangeRefinementChipsForLayout(chips, { canFitLongThreeColumn = false } = {}) {
  if (!Array.isArray(chips) || chips.length !== MAX_REFINEMENT_CHIPS) {
    return chips;
  }

  const longestIndex = chips.reduce((bestIndex, chip, index) => {
    const bestLength = String(chips[bestIndex]?.label ?? "").length;
    const nextLength = String(chip?.label ?? "").length;
    return nextLength > bestLength ? index : bestIndex;
  }, 0);
  const longestChip = chips[longestIndex];

  if (
    canFitLongThreeColumn ||
    String(longestChip?.label ?? "").length <= WIDE_REFINEMENT_CHIP_LABEL_LENGTH
  ) {
    return chips;
  }

  return [
    ...chips.filter((_chip, index) => index !== longestIndex),
    { ...longestChip, isWide: true },
  ];
}

function RefinementChip({ chip, isCompact, onPress, selected }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Add ${chip.label} refinement`}
      className={cx(
        "flex-1 items-center justify-center rounded-full border px-3",
        chip.isWide
          ? isCompact
            ? "min-h-[52px] basis-full"
            : "min-h-[54px] basis-full"
          : isCompact
            ? "min-h-[46px] basis-[47%]"
            : "min-h-[50px] basis-[31%]",
        selected ? "border-secondary bg-cream" : "border-line bg-mist",
      )}
      onPress={onPress}
      testID={`followup.refinementChip.${chip.label}`}
    >
      <Text className="text-center text-sm font-semibold leading-5 text-ink" numberOfLines={2}>
        {chip.label}
      </Text>
    </Pressable>
  );
}

export function SearchRefineSection({
  followUpNotes,
  isGeneratingPrompt,
  notesInputRef,
  onNotesBlur,
  onNotesFocus,
  refinementPrompt,
  setFollowUpNotes,
  productQuery,
  suggestedRefinements = DEFAULT_REFINEMENT_CHIPS,
}) {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;
  const canFitLongThreeColumn = width >= THREE_COLUMN_LONG_CHIP_MIN_WIDTH;
  const { status: voiceStatus, handleMicPress } = useVoiceRecorder({
    onTranscribed: (text) => {
      setFollowUpNotes(clampFollowUpNotes(
        followUpNotes.trim() ? `${followUpNotes.trim()} ${text}` : text
      ));
    },
  });
  const normalizedSuggestedChips = normalizeRefinementChips(suggestedRefinements);
  const visibleChips = normalizedSuggestedChips.length
    ? normalizedSuggestedChips
    : DEFAULT_REFINEMENT_CHIPS;
  const arrangedChips = arrangeRefinementChipsForLayout(visibleChips, { canFitLongThreeColumn });
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
          {arrangedChips.map((chip) => {
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
              ref={notesInputRef}
              value={followUpNotes}
              maxLength={MAX_FOLLOW_UP_NOTES_LENGTH}
              onChangeText={handleNotesChange}
              onBlur={onNotesBlur}
              onFocus={onNotesFocus}
              placeholder="Tell Focamai anything that's important..."
              placeholderTextColor="#B4ADA4"
              multiline
              textAlignVertical="top"
              className="min-h-[54px] flex-1 py-2 text-[16px] leading-6 text-ink"
            />
            <VoiceMicButton
              voiceStatus={voiceStatus}
              onPress={handleMicPress}
              idleLabel="Add notes by voice"
              className="h-11 w-11"
              testID="followup.voiceButton"
            />
          </View>
        </View>

        <Text className="px-4 text-sm leading-5 text-stone-500">
          Example: "Compact size", "Fits a small cafe", "Under $200"
        </Text>
      </View>

    </View>
  );
}
