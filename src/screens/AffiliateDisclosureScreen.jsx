import { Text, useWindowDimensions, View } from "react-native";
import { ScreenContainer, ScreenIntro } from "../components/MobileUI";

export default function AffiliateDisclosureScreen() {
  const { width } = useWindowDimensions();
  const isCompact = width < 400;

  return (
    <ScreenContainer
      contentContainerStyle={{
        paddingHorizontal: isCompact ? 16 : 24,
        paddingVertical: isCompact ? 24 : 32,
      }}
    >
      <ScreenIntro
        eyebrow="Affiliate Disclosure"
        title="How affiliate links work in this app."
        description="Focamai participates in the Amazon Associates program. This page explains what that means for you."
      />

      <View className="mt-8 gap-5">
        <Text className="text-base leading-7 text-stone-600">
          Focamai is a participant in the Amazon Services LLC Associates Program, an affiliate
          advertising program designed to provide a means for apps to earn advertising fees by
          advertising and linking to Amazon.com.
        </Text>
        <Text className="text-base leading-7 text-stone-600">
          When you tap a product link in Focamai and make a purchase on Amazon, Focamai may earn a
          small commission at no extra cost to you. This is how the app is supported.
        </Text>
        <Text className="text-base leading-7 text-stone-600">
          Affiliate relationships do not influence which products are recommended. Picks are
          selected by the AI based on your search and refinement input -- not by commission
          potential or advertiser relationships.
        </Text>
        <View className="rounded-[18px] border border-line bg-cream px-4 py-4">
          <Text className="text-sm leading-6 text-stone-700">
            As an Amazon Associate I earn from qualifying purchases.
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
