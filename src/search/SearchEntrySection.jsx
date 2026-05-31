import { useEffect, useState } from "react";
import { Mic, Search } from "lucide-react-native";
import { Pressable, Text, TextInput, useWindowDimensions, View } from "react-native";
import { Button, cx } from "../components/MobileUI";

export function SearchEntrySection({
  isDiscovering,
  productQuery,
  setProductQuery,
  startDiscoverySearch,
}) {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;
  const [draftQuery, setDraftQuery] = useState(productQuery);

  useEffect(() => {
    setDraftQuery(productQuery);
  }, [productQuery]);

  function updateQuery(nextQuery) {
    setDraftQuery(nextQuery);
    setProductQuery(nextQuery);
  }

  function submitDraftQuery() {
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
            <Pressable
              accessibilityLabel="Voice input coming later"
              accessibilityRole="button"
              className="h-12 w-12 items-center justify-center rounded-full bg-cream"
              disabled
              testID="search.voiceButton"
            >
              <Mic color="#0F6175" size={24} strokeWidth={2.2} />
            </Pressable>
          )}
        </View>
      </View>

      <Text className="px-1 text-center text-sm leading-5 text-stone-600">
        Start with what you need. Focamai will refine it into 6 useful picks.
      </Text>

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
