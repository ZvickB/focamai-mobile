import { Mic, Search } from "lucide-react-native";
import { Pressable, Text, TextInput, View } from "react-native";
import { cx } from "../components/MobileUI";

const DEFAULT_REFINEMENT_CHIPS = [
  { label: "Good value" },
  { label: "Easy to use" },
  { label: "Fits my space" },
];
const MAX_REFINEMENT_CHIPS = 3;

function addChipToNotes(currentNotes, chipLabel) {
  const trimmedNotes = String(currentNotes ?? "").trim();

  if (!trimmedNotes) {
    return chipLabel;
  }

  if (trimmedNotes.toLowerCase().includes(chipLabel.toLowerCase())) {
    return currentNotes;
  }

  return `${trimmedNotes}, ${chipLabel}`;
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

function RefinementChip({ chip, onPress, selected }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Add ${chip.label} refinement`}
      className={cx(
        "min-h-[50px] flex-1 basis-[31%] items-center justify-center rounded-full border px-3",
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
  const normalizedSuggestedChips = normalizeRefinementChips(suggestedRefinements);
  const visibleChips = normalizedSuggestedChips.length
    ? normalizedSuggestedChips
    : DEFAULT_REFINEMENT_CHIPS;
  const isPromptStillLoading = isGeneratingPrompt && !refinementPrompt;

  function handleChipPress(chip) {
    if (chip.prompt) {
      setFollowUpNotes(chip.prompt);
    } else {
      setFollowUpNotes(addChipToNotes(followUpNotes, chip.label));
    }
  }

  return (
    <View className="gap-8">
      <View className="items-center gap-4">
        <View className="items-center px-1">
          <Text className="text-center text-[32px] font-semibold leading-[39px] text-ink">
            What should Focamai keep in{"\u00A0"}mind?
          </Text>
          <Text className="mt-4 text-center text-[16px] leading-6 text-stone-600">
            Add any preferences, must-haves, or deal breakers.
          </Text>
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
          className="rounded-[31px] bg-white px-4 py-4 shadow-md"
          style={{
            elevation: 4,
            shadowColor: "#78573f",
            shadowOffset: { width: 0, height: 18 },
            shadowOpacity: 0.12,
            shadowRadius: 28,
          }}
        >
          <View className="min-h-[72px] flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-cream">
              <Search color="#0F6175" size={24} strokeWidth={2.2} />
            </View>
            <TextInput
              testID="followup.notesInput"
              value={followUpNotes}
              onChangeText={setFollowUpNotes}
              placeholder="Tell Focamai anything that's important..."
              placeholderTextColor="#B4ADA4"
              multiline
              textAlignVertical="center"
              className="min-h-[54px] flex-1 py-2 text-[16px] leading-6 text-ink"
            />
            <Pressable
              accessibilityLabel="Voice input coming later"
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center rounded-full bg-cream"
              disabled
              testID="followup.voiceButton"
            >
              <Mic color="#0F6175" size={23} strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>

        <Text className="px-4 text-sm leading-5 text-stone-500">
          Example: "Compact size", "Fits a small cafe", "Under $200"
        </Text>
      </View>

    </View>
  );
}
