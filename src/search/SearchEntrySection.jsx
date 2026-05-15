import { Pressable, Text, TextInput, View } from "react-native";

export function SearchEntrySection({
  isDiscovering,
  onAboutPress,
  productQuery,
  setProductQuery,
  startDiscoverySearch,
}) {
  return (
    <View className="rounded-2xl border border-line bg-white px-4 py-4">
      <Text className="text-sm font-medium text-slate-800">What are you shopping for?</Text>
      <TextInput
        value={productQuery}
        onChangeText={setProductQuery}
        onSubmitEditing={startDiscoverySearch}
        placeholder="Example: travel stroller"
        returnKeyType="search"
        className="mt-3 rounded-2xl border border-line bg-mist px-4 py-3 text-base text-ink"
      />
      <View className="mt-4 flex-row gap-3">
        <Pressable
          disabled={isDiscovering}
          onPress={startDiscoverySearch}
          className={`flex-1 rounded-2xl px-4 py-3 ${
            isDiscovering ? "bg-slate-300" : "bg-accent"
          }`}
        >
          <Text className="text-center text-sm font-semibold text-white">
            {isDiscovering ? "Searching..." : "Search"}
          </Text>
        </Pressable>
        <Pressable
          onPress={onAboutPress}
          className="rounded-2xl border border-line bg-white px-4 py-3"
        >
          <Text className="text-sm font-semibold text-slate-800">About</Text>
        </Pressable>
      </View>
    </View>
  );
}
