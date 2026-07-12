import { useState } from "react";
import { ChevronDown } from "lucide-react-native";
import { Pressable, Text, TextInput, View } from "react-native";
import { Button, Surface } from "../components/MobileUI";

export function SearchRetrySection({
  canRequestRetryAdvice,
  finalResults,
  isGeneratingRetryAdvice,
  onUpdatePicks,
  retryAdviceError,
  retryFeedback,
  setRetryFeedback,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const feedbackPayload = retryFeedback.trim();
  const canAskForAdvice = Boolean(canRequestRetryAdvice && feedbackPayload);

  if (!Array.isArray(finalResults) || finalResults.length === 0) {
    return null;
  }

  function handleRequestAdvice() {
    onUpdatePicks(feedbackPayload);
  }

  function toggleExpanded() {
    setIsExpanded((currentValue) => !currentValue);
  }

  return (
    <Surface>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          isExpanded ? "Hide correction options" : "Show correction options"
        }
        accessibilityState={{ expanded: isExpanded }}
        onPress={toggleExpanded}
        className="flex-row items-center gap-3"
      >
        <View className="flex-1">
          <Text className="text-xl font-semibold leading-7 text-ink">
            Improve these picks
          </Text>
          <Text className="mt-2 text-sm leading-5 text-stone-600">
            Tell us what should change and Focamai will update the search direction.
          </Text>
        </View>
        <View
          className="h-10 w-10 items-center justify-center rounded-full border border-line bg-cream"
          style={{ transform: [{ rotate: isExpanded ? "180deg" : "0deg" }] }}
        >
          <ChevronDown color="#0F6175" size={20} strokeWidth={2.2} />
        </View>
      </Pressable>

      {isExpanded ? (
        <>
          <TextInput
            accessibilityLabel="What should we change?"
            value={retryFeedback}
            onChangeText={setRetryFeedback}
            placeholder="Example: Make it lighter and under $100, but keep one-hand folding."
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
            {isGeneratingRetryAdvice ? "Updating your picks..." : "Update my picks"}
          </Button>
          {isGeneratingRetryAdvice ? (
            <Text className="mt-3 text-sm leading-5 text-stone-600">
              Preparing a better search based on what should change.
            </Text>
          ) : null}
        </>
      ) : null}

      {retryAdviceError ? (
        <View className="mt-4 rounded-[18px] border border-line bg-cream px-4 py-3">
          <Text className="text-sm leading-5 text-stone-700">{retryAdviceError}</Text>
          <Text className="mt-1 text-sm leading-5 text-stone-700">
            Try editing your note and asking for a sharper search again.
          </Text>
        </View>
      ) : null}
    </Surface>
  );
}
