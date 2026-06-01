import { useEffect, useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { Check } from "lucide-react-native";
import { ScreenContainer, cx } from "../components/MobileUI";
import {
  AMAZON_MARKETPLACES,
  DEFAULT_AMAZON_DOMAIN,
  loadAmazonMarketplacePreference,
  saveAmazonMarketplaceSelection,
} from "../search/amazonMarketplaces";

const COMMON_AMAZON_COUNTRY_CODES = new Set(["US", "CA", "GB"]);

function RegionIntro() {
  return (
    <View className="gap-2">
      <Text className="text-[12px] font-semibold uppercase tracking-[1.2px] text-accent">
        Shopping region
      </Text>
      <Text className="text-[28px] font-semibold leading-[35px] text-ink">
        Choose your default store.
      </Text>
      <Text className="text-[15px] leading-6 text-stone-600">
        Used for future Amazon searches. No location permission needed.
      </Text>
    </View>
  );
}

function RegionSectionHeader({ title }) {
  return (
    <Text className="px-1 text-xs font-semibold uppercase tracking-[1px] text-stone-500">
      {title}
    </Text>
  );
}

function RegionRow({ isLast = false, isSelected, marketplace, onPress }) {
  return (
    <Pressable
      accessibilityLabel={`Select ${marketplace.label}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      className={cx(
        "min-h-[48px] bg-transparent px-1",
        isSelected ? "rounded-[14px] bg-cream" : "",
      )}
      onPress={onPress}
      testID={`region.row.${marketplace.countryCode}`}
    >
      <View
        className={cx(
          "min-h-[48px] flex-row items-center gap-3",
          isLast ? "" : "border-b border-line",
        )}
      >
        <View
          className={cx(
            "h-6 w-6 items-center justify-center rounded-full border",
            isSelected ? "border-accent bg-accent" : "border-line bg-white",
          )}
        >
          {isSelected ? <Check size={13} color="#fff" strokeWidth={2.6} /> : null}
        </View>
        <View className="min-w-0 flex-1">
          <Text
            className={cx(
              "text-sm",
              isSelected ? "font-semibold text-accent" : "font-medium text-ink",
            )}
            numberOfLines={1}
          >
            {marketplace.label}
          </Text>
        </View>
        <Text className="text-xs text-stone-500" numberOfLines={1}>
          {marketplace.domain}
        </Text>
      </View>
    </Pressable>
  );
}

function RegionList({ marketplaces, selectedAmazonDomain, onChoose }) {
  return (
    <View className="border-b border-t border-line">
      {marketplaces.map((marketplace, index) => (
        <RegionRow
          key={`${marketplace.countryCode}-${marketplace.domain}`}
          isLast={index === marketplaces.length - 1}
          isSelected={selectedAmazonDomain === marketplace.domain}
          marketplace={marketplace}
          onPress={() => onChoose(marketplace.domain)}
        />
      ))}
    </View>
  );
}

export default function RegionScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;
  const [selectedAmazonDomain, setSelectedAmazonDomain] = useState(DEFAULT_AMAZON_DOMAIN);
  const commonMarketplaces = AMAZON_MARKETPLACES.filter((marketplace) =>
    COMMON_AMAZON_COUNTRY_CODES.has(marketplace.countryCode),
  );
  const moreMarketplaces = AMAZON_MARKETPLACES.filter(
    (marketplace) => !COMMON_AMAZON_COUNTRY_CODES.has(marketplace.countryCode),
  );

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
        gap: isCompact ? 18 : 22,
        paddingHorizontal: isCompact ? 16 : 24,
        paddingVertical: isCompact ? 20 : 28,
      }}
    >
      <View className="w-full max-w-[430px] self-center">
        <RegionIntro />
      </View>

      <View className={cx("w-full max-w-[430px] self-center", isCompact ? "gap-5" : "gap-6")}>
        <View className="gap-2">
          <RegionSectionHeader title="Common regions" />
          <RegionList
            marketplaces={commonMarketplaces}
            selectedAmazonDomain={selectedAmazonDomain}
            onChoose={chooseMarketplace}
          />
        </View>

        <View className="gap-2">
          <RegionSectionHeader title="More regions" />
          <RegionList
            marketplaces={moreMarketplaces}
            selectedAmazonDomain={selectedAmazonDomain}
            onChoose={chooseMarketplace}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
