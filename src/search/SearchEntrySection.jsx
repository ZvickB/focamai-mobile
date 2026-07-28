import { useEffect, useState } from "react";
import { Search } from "lucide-react-native";
import { Text, TextInput, useWindowDimensions, View } from "react-native";
import { Button, cx } from "../components/MobileUI";
import { useVoiceRecorder } from "./useVoiceRecorder";
import { VoiceMicButton } from "./VoiceMicButton";

export function SearchEntrySection({
  isDiscovering,
  productQuery,
  setProductQuery,
  startDiscoverySearch,
}) {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;
  const [draftQuery, setDraftQuery] = useState(productQuery);
  const [showEmptyQueryMessage, setShowEmptyQueryMessage] = useState(false);

  const { status: voiceStatus, handleMicPress } = useVoiceRecorder({
    onTranscribed: (text) => {
      setDraftQuery(text);
      setProductQuery(text);
    },
  });

  useEffect(() => {
    setDraftQuery(productQuery);
  }, [productQuery]);

  function updateQuery(nextQuery) {
    setDraftQuery(nextQuery);
    setProductQuery(nextQuery);

    if (String(nextQuery).trim()) {
      setShowEmptyQueryMessage(false);
    }
  }

  function submitDraftQuery() {
    if (!String(draftQuery).trim()) {
      setShowEmptyQueryMessage(true);
      return;
    }

    setShowEmptyQueryMessage(false);
    startDiscoverySearch(draftQuery);
  }

  return (
    <View className="gap-3.5">
      <View
        className={cx(
          "rounded-[22px] border border-line bg-white shadow-sm",
          isCompact ? "px-4 py-4" : "px-5 py-4",
        )}
        style={{
          elevation: 3,
          shadowColor: "#78573f",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
        }}
      >
        <View
          className={cx(
            "flex-row items-center",
            isCompact ? "min-h-[78px] gap-2" : "min-h-[92px] gap-3",
          )}
        >
          <View
            className={cx(
              "items-center justify-center rounded-full bg-cream",
              isCompact ? "h-10 w-10" : "h-11 w-11",
            )}
          >
            <Search color="#0F6175" size={isCompact ? 23 : 25} strokeWidth={2.2} />
          </View>
          <TextInput
            testID="search.queryInput"
            value={draftQuery}
            onChangeText={updateQuery}
            onSubmitEditing={submitDraftQuery}
            placeholder="What are you shopping for?"
            placeholderTextColor="#B4ADA4"
            returnKeyType="search"
            className={cx(
              "min-w-0 flex-1 text-ink",
              isCompact
                ? "min-h-[62px] py-2 text-[18px] leading-7"
                : "min-h-[72px] py-3 text-lg leading-7",
            )}
          />
          {isCompact ? null : (
            <VoiceMicButton
              voiceStatus={voiceStatus}
              onPress={handleMicPress}
              className="h-12 w-12"
              iconSize={24}
              testID="search.voiceButton"
            />
          )}
        </View>
      </View>

      {showEmptyQueryMessage ? (
        <Text className="-mt-1 px-1 text-center text-sm leading-5 text-stone-600" testID="search.emptyQueryMessage">
          Add something you’re looking for to get started.
        </Text>
      ) : null}

      <Button
        testID="search.submitButton"
        disabled={isDiscovering}
        onPress={submitDraftQuery}
        accessibilityLabel="Start product search"
        className={cx(
          "mt-1 min-h-[52px]",
          isDiscovering ? "" : "bg-accent",
        )}
      >
        {isDiscovering ? "Searching..." : "Find picks"}
      </Button>
      <View
        className="-mt-2 h-[2px] self-center rounded-full bg-ember opacity-60"
        style={{ width: 44 }}
      />
    </View>
  );
}
