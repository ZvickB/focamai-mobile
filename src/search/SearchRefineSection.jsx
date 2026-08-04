import { TextInput, Pressable, Text, useWindowDimensions, View } from "react-native";
import { GuidanceText, Surface, cx } from "../components/MobileUI";
import { useVoiceRecorder } from "./useVoiceRecorder";
import { VoiceMicButton } from "./VoiceMicButton";

export const MAX_FOLLOW_UP_NOTES_LENGTH = 500;

function clampFollowUpNotes(value) {
  return String(value ?? "").slice(0, MAX_FOLLOW_UP_NOTES_LENGTH);
}

function RefinementAnswer({ answer, isCompact, onPress, selected }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={answer.label}
      accessibilityState={{ checked: selected }}
      className={cx(
        "min-h-[52px] basis-[47%] items-center justify-center rounded-full border px-3 py-2",
        selected ? "border-secondary bg-cream" : "border-line bg-white",
        isCompact ? "min-h-[50px]" : "min-h-[54px]",
      )}
      onPress={onPress}
      testID={`followup.refinementAnswer.${answer.label}`}
    >
      <Text className="text-center text-sm font-semibold leading-5 text-ink" numberOfLines={2}>
        {answer.label}
      </Text>
    </Pressable>
  );
}

function AnswerPlaceholders({ isCompact }) {
  return (
    <View className="flex-row flex-wrap gap-3" testID="followup.answerPlaceholders">
      {Array.from({ length: 4 }, (_value, index) => (
        <View
          className={cx(
            "basis-[47%] rounded-full border border-line bg-cream",
            isCompact ? "min-h-[50px]" : "min-h-[54px]",
          )}
          key={index}
        />
      ))}
    </View>
  );
}

export function SearchRefineSection({
  activeQuestionKey = "primary",
  followUpNotes,
  isGeneratingPrompt,
  onNotesFocus,
  onSelectAnswer,
  onShowAlternateQuestion,
  refinementPrompt,
  selectedAnswer,
  setFollowUpNotes,
}) {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;
  const { status: voiceStatus, handleMicPress } = useVoiceRecorder({
    onTranscribed: (text) => {
      setFollowUpNotes(clampFollowUpNotes(
        followUpNotes.trim() ? `${followUpNotes.trim()} ${text}` : text,
      ));
    },
  });
  const primaryPrompt = String(refinementPrompt?.prompt ?? "").trim();
  const alternatePrompt = String(refinementPrompt?.alternatePrompt ?? "").trim();
  const primaryAnswers = Array.isArray(refinementPrompt?.answerOptions)
    ? refinementPrompt.answerOptions
    : [];
  const alternateAnswers = Array.isArray(refinementPrompt?.alternateAnswerOptions)
    ? refinementPrompt.alternateAnswerOptions
    : [];
  const canAskDifferentQuestion = Boolean(
    alternatePrompt &&
    primaryPrompt &&
    alternatePrompt.toLowerCase() !== primaryPrompt.toLowerCase() &&
    alternateAnswers.length > 0,
  );
  const isShowingAlternate = activeQuestionKey === "alternate" && canAskDifferentQuestion;
  const displayedPrompt = isShowingAlternate ? alternatePrompt : primaryPrompt;
  const displayedAnswers = isShowingAlternate ? alternateAnswers : primaryAnswers;
  const displayedQuestionKey = isShowingAlternate ? "alternate" : "primary";
  const isPromptStillLoading = isGeneratingPrompt && !refinementPrompt;
  const selectedValue = selectedAnswer?.questionKey === displayedQuestionKey
    ? String(selectedAnswer.value || "")
    : "";

  function handleAnswerPress(answer) {
    const isAlreadySelected = selectedValue === answer.prompt;

    onSelectAnswer?.(
      isAlreadySelected
        ? { questionKey: "", value: "" }
        : { questionKey: displayedQuestionKey, value: answer.prompt },
    );
  }

  function handleNotesChange(nextNotes) {
    setFollowUpNotes(clampFollowUpNotes(nextNotes));
  }

  return (
    <View className={isCompact ? "gap-6" : "gap-8"}>
      <View className="items-center gap-4">
        <Text
          className={
            isCompact
              ? "text-center text-[28px] font-semibold leading-[35px] text-ink"
              : "text-center text-[30px] font-semibold leading-[38px] text-ink"
          }
        >
          One quick question
        </Text>

        {displayedPrompt ? (
          <Surface className="w-full gap-3" variant="quiet">
            <Text className="text-xs font-semibold uppercase tracking-[1.1px] text-stone-500">
              Focamai asks
            </Text>
            <Text className="text-base font-medium leading-7 text-ink">
              {displayedPrompt}
            </Text>
            {canAskDifferentQuestion && !isShowingAlternate && !isGeneratingPrompt ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Get a different question"
                className="min-h-[44px] self-start justify-center"
                onPress={onShowAlternateQuestion}
                testID="followup.differentQuestionButton"
              >
                <Text className="text-sm font-semibold text-accent">
                  Get a different question
                </Text>
              </Pressable>
            ) : null}
          </Surface>
        ) : (
          <GuidanceText className="text-center">
            Finding the most useful thing to ask…
          </GuidanceText>
        )}
      </View>

      <View accessibilityRole="radiogroup" className="gap-3">
        {isPromptStillLoading ? (
          <AnswerPlaceholders isCompact={isCompact} />
        ) : (
          <View className="flex-row flex-wrap gap-3">
            {displayedAnswers.map((answer) => (
              <RefinementAnswer
                answer={answer}
                isCompact={isCompact}
                key={`${displayedQuestionKey}-${answer.label}`}
                onPress={() => handleAnswerPress(answer)}
                selected={selectedValue === answer.prompt}
              />
            ))}
          </View>
        )}
      </View>

      <View className="gap-3">
        <View className="flex-row items-baseline gap-1 px-1">
          <Text className="text-sm font-semibold text-ink">Anything else?</Text>
          <Text className="text-sm text-stone-500">Optional</Text>
        </View>
        <Surface className={isCompact ? "px-4 py-4" : "px-5 py-5"}>
          <View className={cx("flex-row items-start", isCompact ? "gap-2" : "gap-3")}>
            <TextInput
              testID="followup.notesInput"
              value={followUpNotes}
              maxLength={MAX_FOLLOW_UP_NOTES_LENGTH}
              onChangeText={handleNotesChange}
              onFocus={onNotesFocus}
              placeholder={
                refinementPrompt?.followUpPlaceholder ||
                "Budget, size, must-haves, or anything you want to avoid…"
              }
              placeholderTextColor="#B4ADA4"
              multiline
              textAlignVertical="top"
              className="min-h-[82px] flex-1 py-1 text-[16px] leading-6 text-ink"
            />
            <VoiceMicButton
              voiceStatus={voiceStatus}
              onPress={handleMicPress}
              idleLabel="Add notes by voice"
              className="h-11 w-11"
              testID="followup.voiceButton"
            />
          </View>
        </Surface>
      </View>
    </View>
  );
}
