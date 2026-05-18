import { Pressable, ScrollView, Text } from "react-native";
import { Button, Surface } from "../components/MobileUI";
import { AMAZON_MARKETPLACES, getAmazonMarketplaceLabel } from "./amazonMarketplaces";

export function MarketplacePromptSection({
  confirmSelectedAmazonDomain,
  selectedAmazonDomain,
  setSelectedAmazonDomain,
}) {
  return (
    <Surface variant="accent" className="gap-4">
      <Text className="text-sm font-semibold text-slate-900">Set your store once</Text>
      <Text className="mt-2 text-sm leading-5 text-slate-600">
        Focamai uses this for retailer availability and regional pricing. You can change it later
        in Settings.
      </Text>
      <ScrollView
        horizontal
        contentContainerStyle={{ gap: 8, paddingRight: 8 }}
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
      >
        {AMAZON_MARKETPLACES.map((marketplace) => {
          const isSelected = selectedAmazonDomain === marketplace.domain;

          return (
            <Pressable
              key={`${marketplace.countryCode}-${marketplace.domain}`}
              accessibilityRole="button"
              accessibilityLabel={`Use ${getAmazonMarketplaceLabel(marketplace.domain)}`}
              onPress={() => setSelectedAmazonDomain(marketplace.domain)}
              className={`rounded-full border px-3 py-2 ${
                isSelected ? "border-accent bg-accent" : "border-line bg-cream"
              }`}
            >
              <Text className={`text-xs font-semibold ${isSelected ? "text-white" : "text-slate-700"}`}>
                {marketplace.countryCode}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Button
        onPress={confirmSelectedAmazonDomain}
        variant="dark"
      >
        Use {getAmazonMarketplaceLabel(selectedAmazonDomain)}
      </Button>
    </Surface>
  );
}
