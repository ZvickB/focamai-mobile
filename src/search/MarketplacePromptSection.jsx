import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { Button, Surface } from "../components/MobileUI";
import {
  getAmazonMarketplaceLabel,
  MORE_AMAZON_MARKETPLACES,
  PRIMARY_AMAZON_MARKETPLACES,
} from "./amazonMarketplaces";

export function MarketplacePromptSection({
  confirmSelectedAmazonDomain,
  selectedAmazonDomain,
}) {
  const [draftAmazonDomain, setDraftAmazonDomain] = useState(selectedAmazonDomain);
  const [isMoreStoresOpen, setIsMoreStoresOpen] = useState(false);
  const isMoreStoreSelected = MORE_AMAZON_MARKETPLACES.some(
    ({ domain }) => domain === draftAmazonDomain,
  );

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
            <View className="gap-3">
              <View className="flex-row flex-wrap gap-2">
              {PRIMARY_AMAZON_MARKETPLACES.map((marketplace) => {
                const isSelected = draftAmazonDomain === marketplace.domain;

                return (
                  <Pressable
                    key={`${marketplace.countryCode}-${marketplace.domain}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${getAmazonMarketplaceLabel(marketplace.domain)}`}
                    onPress={() => setDraftAmazonDomain(marketplace.domain)}
                    className={`rounded-full border px-3 py-2 ${
                      isSelected ? "border-accent bg-accent" : "border-line bg-white"
                    }`}
                  >
                    <Text className={`text-xs font-semibold ${isSelected ? "text-white" : "text-ink"}`}>
                      {marketplace.label}
                    </Text>
                  </Pressable>
                );
              })}
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isMoreStoreSelected }}
                  onPress={() => setIsMoreStoresOpen((isOpen) => !isOpen)}
                  className={`min-h-[40px] flex-row items-center gap-1.5 rounded-full border px-3 py-2 ${
                    isMoreStoreSelected ? "border-accent bg-accent" : "border-line bg-white"
                  }`}
                  testID="marketplacePrompt.moreStoresButton"
                >
                  <Text className={`text-xs font-semibold ${isMoreStoreSelected ? "text-white" : "text-ink"}`}>
                    More stores
                  </Text>
                  <ChevronDown color={isMoreStoreSelected ? "#ffffff" : "#14222b"} size={15} strokeWidth={2.3} />
                </Pressable>
              </View>

              {isMoreStoresOpen ? (
                <ScrollView
                  className="max-h-48"
                  contentContainerStyle={{ gap: 8, paddingBottom: 2 }}
                  keyboardShouldPersistTaps="handled"
                  testID="marketplacePrompt.moreStoresList"
                >
                  {MORE_AMAZON_MARKETPLACES.map((marketplace) => {
                    const isSelected = draftAmazonDomain === marketplace.domain;

                    return (
                      <Pressable
                        key={`${marketplace.countryCode}-${marketplace.domain}`}
                        accessibilityRole="button"
                        accessibilityLabel={`Select ${getAmazonMarketplaceLabel(marketplace.domain)}`}
                        onPress={() => setDraftAmazonDomain(marketplace.domain)}
                        className={`rounded-[14px] border px-3 py-3 ${
                          isSelected ? "border-accent bg-cream" : "border-line bg-white"
                        }`}
                      >
                        <Text className={`text-sm font-semibold ${isSelected ? "text-accent" : "text-ink"}`}>
                          {marketplace.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : null}
            </View>
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
