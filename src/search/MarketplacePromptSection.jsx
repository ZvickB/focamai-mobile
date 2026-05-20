import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Button, Surface } from "../components/MobileUI";
import { AMAZON_MARKETPLACES, getAmazonMarketplaceLabel } from "./amazonMarketplaces";

export function MarketplacePromptSection({
  confirmSelectedAmazonDomain,
  selectedAmazonDomain,
}) {
  const [draftAmazonDomain, setDraftAmazonDomain] = useState(selectedAmazonDomain);

  useEffect(() => {
    setDraftAmazonDomain(selectedAmazonDomain);
  }, [selectedAmazonDomain]);

  return (
    <Surface variant="quiet" className="gap-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-[12px] font-semibold uppercase tracking-[1.3px] text-secondary">
            Store region
          </Text>
          <Text className="mt-2 text-base font-semibold leading-6 text-ink">
            Choose where prices should come from
          </Text>
          <Text className="mt-1 text-sm leading-5 text-stone-600">
            This is saved for future searches and can be changed later in Settings.
          </Text>
        </View>
        <View className="rounded-full bg-white px-3 py-1.5">
          <Text className="text-[11px] font-semibold uppercase tracking-[1px] text-stone-500">
            First run
          </Text>
        </View>
      </View>
      <ScrollView
        horizontal
        contentContainerStyle={{ gap: 8, paddingRight: 8 }}
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
      >
        {AMAZON_MARKETPLACES.map((marketplace) => {
          const isSelected = draftAmazonDomain === marketplace.domain;

          return (
            <Pressable
              key={`${marketplace.countryCode}-${marketplace.domain}`}
              accessibilityRole="button"
              accessibilityLabel={`Select ${getAmazonMarketplaceLabel(marketplace.domain)}`}
              onPress={() => setDraftAmazonDomain(marketplace.domain)}
              className={`rounded-full border px-3 py-2 ${
                isSelected ? "border-secondary bg-secondary" : "border-line bg-white"
              }`}
            >
              <Text className={`text-xs font-semibold ${isSelected ? "text-white" : "text-stone-700"}`}>
                {marketplace.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Button
        onPress={() => confirmSelectedAmazonDomain(draftAmazonDomain)}
        variant="secondary"
        className="bg-white"
      >
        Use {getAmazonMarketplaceLabel(draftAmazonDomain)}
      </Button>
      <Text className="text-center text-xs leading-4 text-stone-500">
        Focamai does not request location permission for this choice.
      </Text>
    </Surface>
  );
}
