import { Pressable, Text, TextInput, View } from "react-native";

export function SearchRetrySection({
  canRetry,
  finalResults,
  retryCount,
  retryFeedback,
  setRetryFeedback,
  submitRetry,
}) {
  if (finalResults.length === 0) {
    return null;
  }

  return (
    <View className="rounded-2xl border border-line bg-white px-4 py-4">
      <Text className="text-sm font-semibold text-slate-900">Try again</Text>
      <TextInput
        value={retryFeedback}
        onChangeText={setRetryFeedback}
        placeholder="Not quite right? Tell us what to change."
        multiline
        textAlignVertical="top"
        className="mt-3 min-h-[88px] rounded-2xl border border-line bg-mist px-4 py-3 text-base text-ink"
      />
      <Pressable
        disabled={!canRetry}
        onPress={submitRetry}
        className={`mt-3 rounded-2xl px-4 py-3 ${canRetry ? "bg-slate-800" : "bg-slate-300"}`}
      >
        <Text className="text-center text-sm font-semibold text-white">Try again</Text>
      </Pressable>
      {retryCount > 0 ? (
        <Text className="mt-2 text-sm leading-5 text-slate-600">
          {retryCount} of 2 retries used
        </Text>
      ) : null}
    </View>
  );
}
