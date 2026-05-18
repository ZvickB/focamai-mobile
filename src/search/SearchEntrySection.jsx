import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Button, Pill, Surface } from "../components/MobileUI";

const EXAMPLE_QUERIES = [
  "travel stroller",
  "quiet air purifier",
  "beginner espresso machine",
];

export function SearchEntrySection({
  isDiscovering,
  onSettingsPress,
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

  function chooseExample(query) {
    updateQuery(query);
  }

  function submitDraftQuery() {
    startDiscoverySearch(draftQuery);
  }

  return (
    <Surface className="gap-4">
      <View>
        <Text className="text-sm font-semibold text-ink">Start with the product you need</Text>
        <Text className="mt-1 text-sm leading-5 text-stone-600">
          A plain description works best. Add constraints in the next step.
        </Text>
      </View>
      <TextInput
        testID="search.queryInput"
        value={draftQuery}
        onChangeText={updateQuery}
        onSubmitEditing={submitDraftQuery}
        placeholder="Example: compact stroller for city trips"
        placeholderTextColor="#8C8174"
        returnKeyType="search"
        className="min-h-[56px] rounded-lg border border-line bg-cream px-4 py-3 text-base leading-6 text-ink"
      />

      <View>
        <Text className="text-xs font-semibold uppercase tracking-[1px] text-stone-500">
          Examples
        </Text>
        <View className="mt-2 flex-row flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((query) => (
            <Pressable
              key={query}
              accessibilityRole="button"
              accessibilityLabel={`Use example search ${query}`}
              onPress={() => chooseExample(query)}
            >
              <Pill>{query}</Pill>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="gap-3">
        <Button
          testID="search.submitButton"
          disabled={isDiscovering}
          onPress={submitDraftQuery}
          accessibilityLabel="Start product search"
        >
          {isDiscovering ? "Searching..." : "Find focused picks"}
        </Button>
        <Button
          testID="search.settingsButton"
          onPress={onSettingsPress}
          variant="secondary"
          accessibilityLabel="Open settings"
        >
          Settings
        </Button>
      </View>
    </Surface>
  );
}
