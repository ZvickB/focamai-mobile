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

export default function SettingsScreen({ navigation }) {
  const [selectedAmazonDomain, setSelectedAmazonDomain] = useState(DEFAULT_AMAZON_DOMAIN);
  const secondaryRoutes = [
    { label: "About Focama", routeName: "About" },
    { label: "Contact", routeName: "Contact" },
    { label: "Privacy", routeName: "Privacy" },
    { label: "Affiliate Disclosure", routeName: "AffiliateDisclosure" },
  ];

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
    <ScreenContainer testID="settings.screen">
      <ScreenIntro
        title="Settings"
        description="Choose the store Focama should use for product searches."
      />

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

        <Surface>
          <Text className="text-sm font-semibold text-slate-900">App info</Text>
          <View className="mt-3 gap-2">
            {secondaryRoutes.map((item) => (
              <Pressable
                key={item.routeName}
                onPress={() => navigation.navigate(item.routeName)}
                className="min-h-[48px] justify-center rounded-lg border border-line bg-cream px-4 py-3"
              >
                <Text className="text-sm font-semibold text-slate-800">{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </Surface>
    </ScreenContainer>
  );
}
