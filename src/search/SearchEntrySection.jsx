import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { AMAZON_MARKETPLACES } from "./amazonMarketplaces";

export function SearchEntrySection({
  isDiscovering,
  onSettingsPress,
  productQuery,
  selectedAmazonDomain,
  setProductQuery,
  setSelectedAmazonDomain,
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
      <View className="mt-4">
        <Text className="text-xs font-semibold uppercase text-slate-500">Amazon store</Text>
        <ScrollView
          horizontal
          className="mt-2"
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={false}
        >
          {AMAZON_MARKETPLACES.map((marketplace) => {
            const isSelected = selectedAmazonDomain === marketplace.domain;

            return (
              <Pressable
                key={`${marketplace.countryCode}-${marketplace.domain}`}
                onPress={() => setSelectedAmazonDomain(marketplace.domain)}
                className={`rounded-full border px-3 py-2 ${
                  isSelected ? "border-accent bg-accent" : "border-line bg-mist"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isSelected ? "text-white" : "text-slate-700"
                  }`}
                >
                  {marketplace.countryCode}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Text className="mt-2 text-xs leading-4 text-slate-500">
          Applies to the next search and is reused for focused picks.
        </Text>
      </View>
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
          onPress={onSettingsPress}
          className="rounded-2xl border border-line bg-white px-4 py-3"
        >
          <Text className="text-sm font-semibold text-slate-800">Settings</Text>
        </Pressable>
      </View>
    </View>
  );
}
