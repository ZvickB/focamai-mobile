import { Pressable, ScrollView, Text, View } from "react-native";
import { AMAZON_MARKETPLACES, getAmazonMarketplaceLabel } from "./amazonMarketplaces";

export function MarketplacePromptSection({
  confirmSelectedAmazonDomain,
  selectedAmazonDomain,
  setSelectedAmazonDomain,
}) {
  return (
    <View className="rounded-2xl border border-accent bg-white px-4 py-4">
      <Text className="text-sm font-semibold text-slate-900">Choose your Amazon store</Text>
      <Text className="mt-2 text-sm leading-5 text-slate-600">
        Focama uses this to search the right marketplace. You can change it later in Settings.
      </Text>
      <ScrollView
        horizontal
        className="mt-3"
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
              <Text className={`text-xs font-semibold ${isSelected ? "text-white" : "text-slate-700"}`}>
                {marketplace.countryCode}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable
        onPress={confirmSelectedAmazonDomain}
        className="mt-4 rounded-2xl bg-slate-800 px-4 py-3"
      >
        <Text className="text-center text-sm font-semibold text-white">
          Use {getAmazonMarketplaceLabel(selectedAmazonDomain)}
        </Text>
      </Pressable>
    </View>
  );
}
