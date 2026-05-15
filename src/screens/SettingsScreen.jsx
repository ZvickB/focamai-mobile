import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AMAZON_MARKETPLACES,
  DEFAULT_AMAZON_DOMAIN,
  getAmazonMarketplaceLabel,
  loadAmazonMarketplacePreference,
  saveAmazonDomainPreference,
  saveAmazonMarketplacePromptSeen,
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
    await saveAmazonDomainPreference(domain);
    await saveAmazonMarketplacePromptSeen();
    navigation.navigate("Search", { selectedAmazonDomain: domain });
  }

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-mist">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, gap: 18 }}
      >
        <View>
          <Text className="text-3xl font-semibold text-ink">Settings</Text>
          <Text className="mt-3 text-base leading-6 text-slate-600">
            Choose the Amazon store Focama should use for product searches.
          </Text>
        </View>

        <View className="rounded-2xl border border-line bg-white px-4 py-4">
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
                  className={`rounded-2xl border px-4 py-3 ${
                    isSelected ? "border-accent bg-accent" : "border-line bg-mist"
                  }`}
                >
                  <Text className={`text-sm font-semibold ${isSelected ? "text-white" : "text-slate-800"}`}>
                    {marketplace.label} ({marketplace.domain})
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="rounded-2xl border border-line bg-white px-4 py-4">
          <Text className="text-sm font-semibold text-slate-900">App info</Text>
          <View className="mt-3 gap-2">
            {secondaryRoutes.map((item) => (
              <Pressable
                key={item.routeName}
                onPress={() => navigation.navigate(item.routeName)}
                className="rounded-2xl border border-line bg-mist px-4 py-3"
              >
                <Text className="text-sm font-semibold text-slate-800">{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
