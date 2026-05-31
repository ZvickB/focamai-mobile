import { useEffect, useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { Check } from "lucide-react-native";
import { ScreenContainer, ScreenIntro, Surface } from "../components/MobileUI";
import {
  AMAZON_MARKETPLACES,
  DEFAULT_AMAZON_DOMAIN,
  getAmazonMarketplaceLabel,
  loadAmazonMarketplacePreference,
  saveAmazonMarketplaceSelection,
} from "../search/amazonMarketplaces";

export default function RegionScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;
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
    try {
      const result = await saveAmazonMarketplaceSelection(domain);
      navigation.navigate("Search", { selectedAmazonDomain: result.domain });
    } catch {
      navigation.navigate("Search", { selectedAmazonDomain: domain });
    }
  }

  return (
    <ScreenContainer
      testID="region.screen"
      contentContainerStyle={{
        gap: isCompact ? 24 : 32,
        paddingHorizontal: isCompact ? 16 : 24,
        paddingVertical: isCompact ? 24 : 32,
      }}
    >
      <ScreenIntro
        eyebrow="Shopping region"
        title="Choose your default store."
        description="Focamai uses this for future searches. It does not need location permission."
      />
      <Surface>
        <Text className="text-[12px] font-semibold uppercase tracking-[1.2px] text-stone-400">
          Select your store
        </Text>
        <View className="mt-4 gap-2">
          {AMAZON_MARKETPLACES.map((marketplace) => {
            const isSelected = selectedAmazonDomain === marketplace.domain;

            return (
              <Pressable
                key={`${marketplace.countryCode}-${marketplace.domain}`}
                onPress={() => chooseMarketplace(marketplace.domain)}
                className={`flex-row items-center justify-between rounded-[14px] border px-4 py-3.5 ${
                  isSelected ? "border-accent bg-white" : "border-line bg-white"
                }`}
              >
                <View className="mr-3 flex-1 gap-0.5">
                  <Text className={`text-sm font-semibold ${isSelected ? "text-accent" : "text-ink"}`}>
                    {marketplace.label}
                  </Text>
                  <Text className="text-xs text-stone-500">{marketplace.domain}</Text>
                </View>
                {isSelected ? (
                  <View className="h-5 w-5 items-center justify-center rounded-full bg-accent">
                    <Check size={12} color="#fff" strokeWidth={2.5} />
                  </View>
                ) : (
                  <View className="h-5 w-5 rounded-full border border-line" />
                )}
              </Pressable>
            );
          })}
        </View>
      </Surface>
    </ScreenContainer>
  );
}
