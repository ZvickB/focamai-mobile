import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ScreenContainer, Surface } from "../components/MobileUI";
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
    <ScreenContainer testID="region.screen">
      <Surface>
        <Text className="text-sm font-semibold text-slate-900">
          Current store: {getAmazonMarketplaceLabel(selectedAmazonDomain)}
        </Text>
        <View className="mt-3 gap-2">
          {AMAZON_MARKETPLACES.map((marketplace) => {
            const isSelected = selectedAmazonDomain === marketplace.domain;

            return (
              <Pressable
                key={`${marketplace.countryCode}-${marketplace.domain}`}
                onPress={() => chooseMarketplace(marketplace.domain)}
                className={`min-h-[48px] justify-center rounded-lg border px-4 py-3 ${
                  isSelected ? "border-accent bg-accent" : "border-line bg-cream"
                }`}
              >
                <Text className={`text-sm font-semibold ${isSelected ? "text-white" : "text-slate-800"}`}>
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
