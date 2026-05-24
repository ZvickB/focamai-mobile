import { useEffect, useState } from "react";
import { Mic, Search } from "lucide-react-native";
import { Pressable, Text, TextInput, View } from "react-native";
import { Button, cx } from "../components/MobileUI";

export function SearchEntrySection({
  isDiscovering,
  productQuery,
  setProductQuery,
  startDiscoverySearch,
}) {
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
    <View className="gap-4">
      <View
        className="rounded-[22px] border border-line bg-white px-5 py-5 shadow-sm"
        style={{
          elevation: 2,
          shadowColor: "#78573f",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.08,
          shadowRadius: 18,
        }}
      >
        <View className="min-h-[82px] flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-cream">
            <Search color="#0F6175" size={25} strokeWidth={2.2} />
          </View>
          <TextInput
            testID="search.queryInput"
            value={draftQuery}
            onChangeText={updateQuery}
            onSubmitEditing={submitDraftQuery}
            placeholder="What are you shopping for?"
            placeholderTextColor="#B4ADA4"
            returnKeyType="search"
            className="min-h-[62px] flex-1 py-3 text-[18px] leading-7 text-ink"
          />
          <Pressable
            accessibilityLabel="Voice input coming later"
            accessibilityRole="button"
            className="h-12 w-12 items-center justify-center rounded-full bg-cream"
            disabled
            testID="search.voiceButton"
          >
            <Mic color="#0F6175" size={24} strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>

      <Button
        testID="search.submitButton"
        disabled={isDiscovering}
        onPress={submitDraftQuery}
        accessibilityLabel="Start product search"
        className={cx(
          "min-h-[56px] shadow-sm",
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
