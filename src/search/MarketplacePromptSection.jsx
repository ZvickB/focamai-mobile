import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
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
    <Modal
      animationType="slide"
      transparent
      visible
      onRequestClose={() => confirmSelectedAmazonDomain(draftAmazonDomain)}
    >
      <View className="flex-1 justify-end bg-ink/30" testID="marketplacePrompt.sheet">
        <View className="px-4 pb-4">
          <Surface variant="default" className="gap-5 rounded-[24px]">
            <View className="h-1.5 w-12 self-center rounded-full bg-line" />
            <View className="gap-2">
              <Text className="text-[12px] font-semibold uppercase tracking-[1.3px] text-secondary">
                Before we search
              </Text>
              <Text className="text-lg font-semibold leading-6 text-ink">
                Where should Focamai check prices?
              </Text>
              <Text className="text-sm leading-5 text-stone-600">
                Choose once so your picks use the right Amazon store. You can change this later in Settings.
              </Text>
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
                      isSelected ? "border-secondary bg-secondary" : "border-line bg-cream"
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
              variant="primary"
            >
              Continue with {getAmazonMarketplaceLabel(draftAmazonDomain)}
            </Button>
            <Text className="text-center text-xs leading-4 text-stone-500">
              Focamai does not request location permission for this choice.
            </Text>
          </Surface>
        </View>
      </View>
    </Modal>
  );
}
