import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ScreenContainer, ScreenIntro, Surface } from "../components/MobileUI";
import {
  AMAZON_MARKETPLACES,
  DEFAULT_AMAZON_DOMAIN,
  getAmazonMarketplaceLabel,
  loadAmazonMarketplacePreference,
  saveAmazonMarketplaceSelection,
} from "../search/amazonMarketplaces";

export default function RegionScreen({ navigation }) {
  const [selectedAmazonDomain, setSelectedAmazonDomain] = useState(DEFAULT_AMAZON_DOMAIN);

  useEffect(() => {
    let isMounted = true;

    loadAmazonMarketplacePreference().then((preference) => {
      if (isMounted) {
        setSelectedAmazonDomain(preference.domain);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function chooseMarketplace(domain) {
    setSelectedAmazonDomain(domain);
    const result = await saveAmazonMarketplaceSelection(domain);
    navigation.navigate("Search", { selectedAmazonDomain: result.domain });
  }

  return (
    <ScreenContainer
      testID="region.screen"
      contentContainerStyle={{ gap: 32, paddingHorizontal: 24, paddingVertical: 32 }}
    >
      <ScreenIntro
        eyebrow="Shopping region"
        title="Choose your default store."
        description="Focamai uses this for future searches. It does not need location permission."
      />
      <Surface>
        <Text className="text-sm font-semibold text-ink">
          Current store: {getAmazonMarketplaceLabel(selectedAmazonDomain)}
        </Text>
        <View className="mt-5 gap-3">
          {AMAZON_MARKETPLACES.map((marketplace) => {
            const isSelected = selectedAmazonDomain === marketplace.domain;

            return (
              <Pressable
                key={`${marketplace.countryCode}-${marketplace.domain}`}
                onPress={() => chooseMarketplace(marketplace.domain)}
                className={`min-h-[52px] justify-center rounded-[18px] border px-4 py-3 ${
                  isSelected ? "border-accent bg-accent" : "border-line bg-cream"
                }`}
              >
                <Text className={`text-sm font-semibold ${isSelected ? "text-white" : "text-ink"}`}>
                  {marketplace.label} ({marketplace.domain})
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Surface>
    </ScreenContainer>
  );
}
